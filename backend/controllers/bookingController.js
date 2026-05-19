const db = require('../models');
const Booking = db.Booking;
const Field = db.Field;
const Stadium = db.Stadium;
const User = db.User;
const { Op, fn, col, literal } = require('sequelize');
const { getIO, userSockets } = require('../socket');
const { logAdminActivity } = require('../utils/adminActivityLogger');
const { createNotification: createNotificationRecord } = require('../utils/notificationHelper');
const {
    canAccessBookingDetail,
    isAdminUser,
    resolveBookingCreatorId,
} = require('../utils/bookingAccess');
const {
    buildPaymentHistoryTransactions,
    filterTransactionsByDateRange,
    paginateTransactions,
    resolveHistoryFilters,
    toNumber,
} = require('../utils/paymentHistory');
const {
    normalizeCouponCode,
    assertCouponUsageAllowed,
} = require('../utils/couponUsage');
const {
    applyWalletTransaction,
} = require('../utils/walletService');
const {
    WALLET_TRANSACTION_TYPES,
} = require('../utils/walletTypes');

const getRequestMeta = (req) => ({
    ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
    userAgent: req.headers['user-agent'] || null,
});

const toPlain = (instance) => (instance ? instance.get({ plain: true }) : null);

const calculatePaymentHistorySummary = (transactions) => {
    const totalPayment = transactions
        .filter((transaction) => transaction.type === 'payment')
        .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
    const totalRefund = transactions
        .filter((transaction) => transaction.type === 'refund')
        .reduce((sum, transaction) => sum + toNumber(transaction.refundAmount), 0);

    return {
        totalPayment,
        totalRefund,
        netRevenue: totalPayment - totalRefund,
    };
};

const normalizePositiveInteger = (value, fallback) => {
    const numericValue = Number(value);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
};

const isPaymentHistoryFilterError = (error) =>
    error instanceof Error && error.message.startsWith('Invalid ');

const normalizePaymentMethod = (value) => String(value || '').trim().toLowerCase();

const shouldPreserveProcessedBookingStatus = (status) =>
    ['confirmed', 'refunded', 'rejected', 'cancelled'].includes(status);

const createNotification = async (userIdOrPayload, content) => {
    if (typeof userIdOrPayload === 'object' && userIdOrPayload !== null) {
        return createNotificationRecord(userIdOrPayload);
    }

    return createNotificationRecord({
        userId: userIdOrPayload,
        content,
    });
};

// 1. Khách hàng đặt sân
exports.createBooking = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { field_id, stadium_id, booking_date, start_time, end_time, total_price, amount_paid, payment_type } = req.body;
        const user_id = resolveBookingCreatorId(req, req.body);

        // Chuẩn hóa giờ (thêm :00 nếu chỉ có HH:mm)
        const normalizedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;

        console.log(`Checking booking: Field ${field_id}, Date ${booking_date}, Time ${normalizedStartTime}`);

        const existingBooking = await Booking.findOne({
            where: {
                field_id,
                booking_date,
                start_time: normalizedStartTime,
                status: { [db.Sequelize.Op.notIn]: ['cancelled', 'expired', 'refunded'] }
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (existingBooking) {
            // Nếu đơn đang pending (chưa thanh toán) và đã quá thời gian giữ chỗ
            if (existingBooking.status === 'pending' && existingBooking.payment_status === 'unpaid' && existingBooking.hold_until && new Date() > new Date(existingBooking.hold_until)) {
                await existingBooking.update({ status: 'expired' }, { transaction });
            } else {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "Sân hiện đang được đặt, vui lòng thử lại sau!" });
            }
        }

        const holdUntilTime = new Date();
        holdUntilTime.setMinutes(holdUntilTime.getMinutes() + 5); // Lock 5 phút

        const newBooking = await Booking.create({
            field_id,
            stadium_id,
            user_id,
            booking_date,
            start_time,
            end_time,
            total_price,
            status: 'pending',
            amount_paid: amount_paid,
            payment_type: payment_type,
            payment_method: 'Online',
            payment_status: 'unpaid',
            hold_until: holdUntilTime
        }, { transaction });

        await transaction.commit();

        await logAdminActivity({
            adminId: user_id,
            action: 'USER_CREATE_BOOKING',
            targetType: 'booking',
            targetId: newBooking.id,
            afterData: {
                field_id: newBooking.field_id,
                stadium_id: newBooking.stadium_id,
                booking_date: newBooking.booking_date,
                start_time: newBooking.start_time,
                end_time: newBooking.end_time,
                total_price: newBooking.total_price,
                payment_status: newBooking.payment_status,
                status: newBooking.status,
            },
            ...getRequestMeta(req),
        });

        // Broadcast sự kiện giữ chỗ cho tất cả client
        const io = getIO();
        io.emit('slotLocked', { 
            field_id, 
            date: booking_date, 
            start_time: normalizedStartTime,
            locked_by_user: user_id
        });

        // 🔔 notify owner
        const field = await db.Field.findByPk(field_id, {
            include: {
                model: db.Stadium,
                as: 'stadium'
            }
        });

        // DEBUG
        console.log("FIELD:", field?.id);
        console.log("STADIUM:", field?.stadium);
        console.log("OWNER_ID:", field?.stadium?.owner_id);

        // CHECK NULL
        if (!field || !field.stadium || !field.stadium.owner_id) {
            console.log("❌ Không tìm thấy owner_id → KHÔNG gửi thông báo");
        } else {
            await createNotification(
                field.stadium.owner_id,
                "Bạn có đơn đặt sân mới"
            );
            console.log("✅ Đã gửi thông báo cho owner:", field.stadium.owner_id);
        }

        res.status(201).json({ success: true, message: "Gửi yêu cầu đặt sân thành công!", data: newBooking });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 1.1 Lấy chi tiết đơn đặt sân (để quét mã QR)
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await db.Booking.findByPk(id, {
            include: [
                {
                    model: db.Field,
                    as: 'field',
                    include: [
                        {
                            model: db.Stadium,
                            as: 'stadium',
                            include: [
                                {
                                    model: db.User,
                                    as: 'owner',
                                    attributes: ['name', 'bank_name', 'bank_account', 'phone']
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }

        if (!canAccessBookingDetail(req, booking)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn đặt sân này!" });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy lịch sử đặt sân của một User (Khách hàng)

exports.getUserHistory = async (req, res) => {
    try {
        const userId = isAdminUser(req) && req.query.user_id ? req.query.user_id : req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại!"
            });
        }

        const bookings = await db.Booking.findAll({
            where: { user_id: userId }, // Đảm bảo cột trong DB là user_id
            include: [
                {
                    model: db.Field,
                    as: 'field',
                    attributes: ['name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);
    } catch (error) {
        console.error("Lỗi History:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Lấy danh sách đơn hàng cho Chủ sân (Owner)
exports.getUserPaymentHistory = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được người dùng.',
            });
        }

        const filters = resolveHistoryFilters(req.query);
        const bookings = await Booking.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Field,
                    as: 'field',
                    attributes: ['name'],
                    include: [
                        {
                            model: Stadium,
                            as: 'stadium',
                            attributes: ['name'],
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const filteredTransactions = filterTransactionsByDateRange(
            buildPaymentHistoryTransactions(bookings),
            filters.startDate,
            filters.endDate,
        );
        const safeLimit = normalizePositiveInteger(req.query.limit, 10);
        const currentPage = normalizePositiveInteger(req.query.page, 1);
        const transactions = paginateTransactions(
            filteredTransactions,
            currentPage,
            safeLimit,
        );
        const summary = calculatePaymentHistorySummary(filteredTransactions);

        return res.status(200).json({
            success: true,
            transactions,
            total: filteredTransactions.length,
            hasMore: currentPage * safeLimit < filteredTransactions.length,
            currentPage,
            limit: safeLimit,
            summary: {
                totalPayment: summary.totalPayment,
                totalRefund: summary.totalRefund,
            },
        });
    } catch (error) {
        if (isPaymentHistoryFilterError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getOwnerPaymentHistory = async (req, res) => {
    try {
        const ownerId = req.user?.id;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được chủ sân.',
            });
        }

        const filters = resolveHistoryFilters(req.query);
        const stadiums = await Stadium.findAll({
            where: { owner_id: ownerId },
            attributes: ['id'],
        });
        const stadiumIds = stadiums.map((stadium) => stadium.id);
        const safeLimit = normalizePositiveInteger(req.query.limit, 10);
        const currentPage = normalizePositiveInteger(req.query.page, 1);

        if (stadiumIds.length === 0) {
            return res.status(200).json({
                success: true,
                transactions: [],
                total: 0,
                hasMore: false,
                currentPage,
                limit: safeLimit,
                summary: {
                    totalPayment: 0,
                    totalRefund: 0,
                    netRevenue: 0,
                },
            });
        }

        const bookings = await Booking.findAll({
            where: { stadium_id: stadiumIds },
            include: [
                {
                    model: Field,
                    as: 'field',
                    attributes: ['name'],
                    include: [
                        {
                            model: Stadium,
                            as: 'stadium',
                            attributes: ['name'],
                        },
                    ],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'phone'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const filteredTransactions = filterTransactionsByDateRange(
            buildPaymentHistoryTransactions(bookings),
            filters.startDate,
            filters.endDate,
        );
        const transactions = paginateTransactions(
            filteredTransactions,
            currentPage,
            safeLimit,
        );
        const summary = calculatePaymentHistorySummary(filteredTransactions);

        return res.status(200).json({
            success: true,
            transactions,
            total: filteredTransactions.length,
            hasMore: currentPage * safeLimit < filteredTransactions.length,
            currentPage,
            limit: safeLimit,
            summary,
        });
    } catch (error) {
        if (isPaymentHistoryFilterError(error)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getOwnerBookings = async (req, res) => {
    try {
        // Lấy ID từ token thay vì params để đảm bảo chính xác người đang đăng nhập
        const ownerId = isAdminUser(req) && req.params.ownerId ? req.params.ownerId : req.user?.id;

        if (!ownerId) {
            return res.status(401).json({ message: "Không xác định được chủ sân!" });
        }

        // Bước 1: Tìm tất cả Stadium của ông chủ này
        const myStadiums = await db.Stadium.findAll({
            where: { owner_id: ownerId },
            attributes: ['id']
        });

        const stadiumIds = myStadiums.map(s => s.id);

        if (stadiumIds.length === 0) {
            return res.json([]); // Nếu ông này chưa tạo sân nào thì trả về mảng rỗng
        }

        // Bước 2: Tìm các đơn hàng
        const bookings = await db.Booking.findAll({
            where: {
                stadium_id: stadiumIds,
                // Lam chú ý: Nếu muốn chủ sân vẫn thấy đơn đã hủy để quản lý thì bỏ dòng dưới
                // Còn nếu muốn "sạch" luôn thì thêm:
                status: { [db.Sequelize.Op.ne]: 'cancelled' }
            },
            attributes: [
                'id', 'field_id', 'stadium_id', 'user_id',
                'booking_date', 'start_time', 'end_time',
                'total_price', 'reject_reason', 'amount_paid', 'payment_type', 'payment_status', 'status'
            ],
            include: [
                {
                    model: db.Field,
                    as: 'field',
                    attributes: ['name']
                },
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['name', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// 4. Hàm duyệt đơn: Cập nhật status thành 'confirmed'
exports.approveBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Tìm đơn hàng
        const booking = await db.Booking.findByPk(id, {
            include: [
                { model: db.Field, as: 'field' },
                { model: db.User, as: 'user' }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn đặt sân!" });
        }

        // 2. Cập nhật trạng thái
        const bookingStadium = await db.Stadium.findByPk(booking.stadium_id);
        if (!isAdminUser(req) && Number(bookingStadium?.owner_id) !== Number(req.user?.id)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền duyệt đơn này!" });
        }

        const before = toPlain(booking);
        booking.status = 'confirmed';
        await booking.save();

        await logAdminActivity({
            adminId: req.user?.id,
            action: 'OWNER_APPROVE_BOOKING',
            targetType: 'booking',
            targetId: booking.id,
            beforeData: { status: before.status, payment_status: before.payment_status },
            afterData: { status: booking.status, payment_status: booking.payment_status },
            ...getRequestMeta(req),
        });

        // 3. Tạo thông báo trong Database
        const notiContent = `Đơn đặt sân ${booking.field.name} của bạn vào ngày ${booking.booking_date} đã được duyệt!`;
        const newNoti = await db.Notification.create({
            user_id: booking.user_id,
            content: notiContent,
            is_read: false
        });

        // 4. Đẩy thông báo Real-time
        const io = getIO();
        const socketId = userSockets[booking.user_id];

        console.log(`DEBUG: Đang gửi thông báo cho User ${booking.user_id}, SocketID: ${socketId}`);

        if (socketId) {
            io.to(socketId).emit('newNotification', newNoti);
            console.log("✅ Đã gửi thông báo thành công!");
        } else {
            console.log("⚠️ Không tìm thấy socketId cho User này, thông báo chưa được đẩy real-time.");
        }

        // 5. Trả về kết quả
        res.json({
            success: true,
            message: "Đã duyệt đơn thành công!",
            data: booking
        });

    } catch (error) {
        console.error("Lỗi duyệt đơn:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm từ chối đơn đặt sân
exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        // Lấy lý do từ body, nếu không có thì gán mặc định ngay tại đây
        const ly_do = req.body.reject_reason || "Chủ sân từ chối đơn này.";

        const booking = await db.Booking.findByPk(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn!" });
        }

        // Cập nhật trạng thái và cột reject_reason trong DB
        const bookingField = await db.Field.findByPk(booking.field_id, {
            include: [{ model: db.Stadium, as: 'stadium' }]
        });

        if (!isAdminUser(req) && Number(bookingField?.stadium?.owner_id) !== Number(req.user?.id)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền từ chối đơn này!" });
        }

        const before = toPlain(booking);
        await booking.update({
            status: 'rejected',
            reject_reason: ly_do
        });

        await logAdminActivity({
            adminId: req.user?.id,
            action: 'OWNER_REJECT_BOOKING',
            targetType: 'booking',
            targetId: booking.id,
            beforeData: { status: before.status, reject_reason: before.reject_reason },
            afterData: { status: booking.status, reject_reason: booking.reject_reason },
            ...getRequestMeta(req),
        });

        return res.status(200).json({
            success: true,
            message: "Từ chối thành công!"
        });

    } catch (error) {
        // Log lỗi ra Terminal để kiểm tra xem có phải lỗi DB không
        console.error("--- LỖI TẠI CONTROLLER ---");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Lỗi Server: " + error.message
        });
    }
};

// 6. Hàm hoàn tiền đơn đặt sân (Owner)
exports.refundBooking = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { refund_reason } = req.body;
        const ownerId = req.user?.id;

        if (!ownerId) {
            return res.status(401).json({ success: false, message: "Không xác định được chủ sân!" });
        }

        // Tìm đơn hàng và kiểm tra quyền sở hữu
        const booking = await db.Booking.findByPk(id, {
            include: [
                {
                    model: db.Field,
                    as: 'field',
                    include: { model: db.Stadium, as: 'stadium' }
                },
                { model: db.User, as: 'user' }
            ],
            transaction
        });

        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt sân!" });
        }

        if (!isAdminUser(req) && booking.field.stadium.owner_id !== ownerId) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: "Bạn không có quyền thao tác trên đơn này!" });
        }

        // Chỉ cho hoàn tiền khi đơn đã được duyệt (confirmed)
        if (booking.status !== 'confirmed') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: "Chỉ có thể hoàn tiền cho các đơn đã được duyệt!" });
        }

        const refundAmount = Number(booking.amount_paid || 0);

        // Cập nhật trạng thái đơn hàng
        await booking.update({
            status: 'refunded',
            refund_reason: refund_reason || "Chủ sân hoàn tiền đơn này.",
            refunded_at: new Date()
        }, { transaction });

        if (refundAmount > 0) {
            await applyWalletTransaction(
                db,
                {
                    userId: booking.user_id,
                    amount: refundAmount,
                    type: WALLET_TRANSACTION_TYPES.BOOKING_REFUND,
                    bookingId: booking.id,
                    description: `Hoan tien huy san cho don #${booking.id}`,
                    referenceType: 'booking_refund',
                    referenceId: booking.id,
                },
                transaction
            );
        }

        // Tạo thông báo cho khách hàng
        const notiContent = `Đơn đặt sân ${booking.field.name} của bạn vào ngày ${booking.booking_date} đã được hoàn tiền. Lý do: ${refund_reason || "Liên hệ chủ sân để biết thêm chi tiết"}`;
        const newNoti = await db.Notification.create({
            user_id: booking.user_id,
            content: notiContent,
            is_read: false
        }, { transaction });

        await transaction.commit();

        // Gửi thông báo real-time
        const io = getIO();
        const socketId = userSockets[booking.user_id];
        if (socketId) {
            io.to(socketId).emit('newNotification', newNoti);
        }

        await logAdminActivity({
            adminId: ownerId,
            action: 'OWNER_REFUND_BOOKING',
            targetType: 'booking',
            targetId: booking.id,
            beforeData: { status: 'confirmed' },
            afterData: {
                status: booking.status,
                refund_reason: booking.refund_reason,
                refunded_at: booking.refunded_at,
            },
            ...getRequestMeta(req),
        });

        return res.status(200).json({
            success: true,
            message: "Hoàn tiền thành công!",
            data: booking
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Lỗi hoàn tiền:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi hoàn tiền: " + error.message
        });
    }
};
//Hủy đặt sân
exports.cancelBooking = async (req, res) => {
    console.log("===> Đã chạm vào API Update Payment với ID:", req.params.bookingId);
    try {
        const { id } = req.params;

        // 1. Kiểm tra xem ID người dùng có tồn tại trong Token không
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!" });
        }

        // 2. Tìm đơn hàng
        const booking = await db.Booking.findByPk(id);

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn đặt sân này!" });
        }

        // 3. Kiểm tra quyền sở hữu (Chủ đơn mới được hủy)
        // Lưu ý: Dùng dấu != thay vì !== nếu một bên là string, một bên là number
        if (!isAdminUser(req) && booking.user_id != userId) {
            return res.status(403).json({ message: "Bạn không có quyền hủy đơn của người khác!" });
        }

        // 4. Chỉ cho hủy khi đơn vẫn đang ở trạng thái 'pending'
        if (booking.status !== 'pending') {
            return res.status(400).json({ message: "Đơn này đã được duyệt hoặc đã hủy, không thể thao tác!" });
        }

        // 5. Thực hiện hủy
        const before = toPlain(booking);
        booking.status = 'cancelled';
        booking.hold_until = null; // Xóa thời gian giữ chỗ
        await booking.save();

        await logAdminActivity({
            adminId: userId,
            action: 'USER_CANCEL_BOOKING',
            targetType: 'booking',
            targetId: booking.id,
            beforeData: {
                status: before.status,
                hold_until: before.hold_until,
            },
            afterData: {
                status: booking.status,
                hold_until: booking.hold_until,
            },
            ...getRequestMeta(req),
        });

        // Broadcast sự kiện giải phóng sân
        const { getIO } = require('../socket');
        try {
            const io = getIO();
            io.emit('slotReleased', { 
                field_id: booking.field_id, 
                date: booking.booking_date, 
                start_time: booking.start_time 
            });
        } catch (e) {
            console.log("Socket emit error on cancel:", e.message);
        }

        res.json({
            success: true,
            message: "Đã hủy đơn đặt sân thành công!",
            booking
        });

    } catch (err) {
        console.error("Lỗi Cancel Booking:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
//Thanh toán
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { payment_status, payment_method } = req.body;

        const booking = await db.Booking.findByPk(bookingId, {
            include: {
                model: db.Field,
                as: 'field',
                include: {
                    model: db.Stadium,
                    as: 'stadium'
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }

        const before = toPlain(booking);

        // Cập nhật các thông tin thanh toán
        if (!isAdminUser(req) && Number(booking.user_id) !== Number(req.user?.id)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật thanh toán đơn này!" });
        }

        booking.payment_status = payment_status || 'paid';
        booking.payment_method = payment_method || 'Online';
        booking.hold_until = null; // Xóa giữ chỗ vì đã thanh toán

        // Sau khi thanh toán xong, giữ status là 'pending' để chủ sân duyệt
        booking.status = 'pending';

        await booking.save();

        await logAdminActivity({
            adminId: req.user?.id || booking.user_id,
            action: 'USER_UPDATE_BOOKING_PAYMENT',
            targetType: 'booking',
            targetId: booking.id,
            beforeData: {
                payment_status: before.payment_status,
                payment_method: before.payment_method,
                status: before.status,
                hold_until: before.hold_until,
            },
            afterData: {
                payment_status: booking.payment_status,
                payment_method: booking.payment_method,
                status: booking.status,
                hold_until: booking.hold_until,
            },
            ...getRequestMeta(req),
        });

        // 🔔 Gửi thông báo cho owner khi thanh toán thành công
        if (booking.field && booking.field.stadium && booking.field.stadium.owner_id) {
            await createNotification(
                booking.field.stadium.owner_id,
                "Khách hàng đã xác nhận thanh toán. Vui lòng duyệt đơn đặt sân."
            );
            console.log("✅ Đã gửi thông báo cho owner:", booking.field.stadium.owner_id);
        }

        // Broadcast sự kiện xác nhận đặt sân thành công
        const io = getIO();
        io.emit('slotConfirmed', { 
            field_id: booking.field_id, 
            date: booking.booking_date, 
            start_time: booking.start_time 
        });

        res.json({
            success: true,
            message: "Cập nhật trạng thái thanh toán thành công! Vui lòng chờ chủ sân duyệt.",
            data: booking
        });
    } catch (error) {
        console.error("Lỗi updatePaymentStatus:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBooking = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { field_id, stadium_id, booking_date, start_time, end_time, payment_type, coupon_code } = req.body;
        const user_id = resolveBookingCreatorId(req, req.body);
        const normalizedCouponCode = normalizeCouponCode(coupon_code) || null;
        const normalizedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
        const paymentMethod = normalizePaymentMethod(req.body.payment_method || 'vnpay');
        const isWalletPayment = paymentMethod === 'wallet';

        const field = await Field.findByPk(field_id, {
            include: {
                model: db.Stadium,
                as: 'stadium',
            },
            transaction,
        });

        if (!field) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
        }

        const existingBooking = await Booking.findOne({
            where: {
                field_id,
                booking_date,
                start_time: normalizedStartTime,
                status: { [db.Sequelize.Op.notIn]: ['cancelled', 'expired', 'refunded'] },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (existingBooking) {
            const canExpirePendingBooking =
                existingBooking.status === 'pending' &&
                existingBooking.payment_status === 'unpaid' &&
                existingBooking.hold_until &&
                new Date() > new Date(existingBooking.hold_until);

            if (canExpirePendingBooking) {
                await existingBooking.update({ status: 'expired' }, { transaction });
            } else {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Sân hiện đang được đặt, vui lòng thử lại sau!',
                });
            }
        }

        const basePrice = Number(field.price_per_hour || 0);
        let discountAmount = 0;

        if (normalizedCouponCode) {
            const coupon = await db.Coupon.findOne({
                where: {
                    code: normalizedCouponCode,
                    is_active: true,
                    [Op.or]: [{ user_id: null }, { user_id }],
                },
                transaction,
            });

            if (!coupon) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ' });
            }

            try {
                await assertCouponUsageAllowed({
                    Booking,
                    userId: user_id,
                    code: normalizedCouponCode,
                    transaction,
                });
            } catch (usageError) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: usageError.message });
            }

            if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
            }

            if (coupon.discount_type === 'percentage') {
                discountAmount = (basePrice * Number(coupon.discount_value)) / 100;
            } else {
                discountAmount = Number(coupon.discount_value);
            }

            discountAmount = Math.min(discountAmount, basePrice);
        }

        const totalPrice = Math.max(basePrice - discountAmount, 0);
        const isDeposit = payment_type === 'deposit';
        const amountPaid = isDeposit ? totalPrice * 0.5 : totalPrice;
        const holdUntilTime = new Date();

        holdUntilTime.setMinutes(holdUntilTime.getMinutes() + 5);

        const newBooking = await Booking.create({
            field_id,
            stadium_id,
            user_id,
            booking_date,
            start_time,
            end_time,
            total_price: totalPrice,
            amount_paid: amountPaid,
            payment_type,
            payment_method: isWalletPayment ? 'wallet' : paymentMethod,
            payment_status: isWalletPayment ? 'paid' : 'unpaid',
            payment_recorded_at: isWalletPayment ? new Date() : null,
            status: isWalletPayment ? 'confirmed' : 'pending',
            hold_until: isWalletPayment ? null : holdUntilTime,
            coupon_code: normalizedCouponCode,
            discount_amount: discountAmount,
        }, { transaction });

        if (isWalletPayment) {
            await applyWalletTransaction(
                db,
                {
                    userId: user_id,
                    amount: amountPaid,
                    type: WALLET_TRANSACTION_TYPES.BOOKING_PAYMENT,
                    bookingId: newBooking.id,
                    description: `Thanh toan don dat san #${newBooking.id} bang vi`,
                    referenceType: 'booking',
                    referenceId: newBooking.id,
                },
                transaction
            );
        }

        await transaction.commit();

        await logAdminActivity({
            adminId: user_id,
            action: 'USER_CREATE_BOOKING',
            targetType: 'booking',
            targetId: newBooking.id,
            afterData: {
                field_id: newBooking.field_id,
                stadium_id: newBooking.stadium_id,
                booking_date: newBooking.booking_date,
                start_time: newBooking.start_time,
                end_time: newBooking.end_time,
                total_price: newBooking.total_price,
                discount_amount: newBooking.discount_amount,
                coupon_code: newBooking.coupon_code,
                payment_status: newBooking.payment_status,
                status: newBooking.status,
            },
            ...getRequestMeta(req),
        });

        const io = getIO();
        io.emit('slotLocked', {
            field_id,
            date: booking_date,
            start_time: normalizedStartTime,
            locked_by_user: user_id,
        });

        if (isWalletPayment) {
            io.emit('slotConfirmed', {
                field_id,
                date: booking_date,
                start_time: normalizedStartTime,
            });
        }

        if (field?.stadium?.owner_id) {
            await createNotification({
                userId: field.stadium.owner_id,
                content: isWalletPayment
                    ? 'Ban co don dat san moi da thanh toan bang vi'
                    : 'Ban co don dat san moi',
                type: isWalletPayment ? 'booking_paid' : 'booking_created',
                targetType: 'booking',
                targetId: newBooking.id,
                targetRoute: '/history',
            });
        }

        res.status(201).json({
            success: true,
            message: isWalletPayment
                ? 'Dat san va thanh toan bang vi thanh cong!'
                : 'Gui yeu cau dat san thanh cong!',
            data: newBooking,
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        if (error.message === 'INSUFFICIENT_WALLET_BALANCE') {
            return res.status(400).json({
                success: false,
                message: 'So du vi khong du de thanh toan dat san.',
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};
//Thong ke so lương đặt sân
exports.getStadiumAnalytics = async (req, res) => {
    try {
        const { stadiumId } = req.params;
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Thống kê số lượt đặt theo từng sân nhỏ
        const fieldUsage = await db.Booking.findAll({
            attributes: [
                [col('field.name'), 'fieldName'],
                [fn('COUNT', col('Booking.id')), 'totalBookings']
            ],
            include: [{
                model: db.Field,
                as: 'field',
                where: { stadium_id: stadiumId },
                attributes: []
            }],
            where: { status: 'confirmed' }, // Lưu ý: Dùng 'confirmed' hoặc 'approved' tùy DB của Lâm
            group: ['field.name'],
            raw: true
        });

        // 2. Thống kê khung giờ được đặt nhiều nhất
        const peakTimes = await db.Booking.findAll({
            attributes: [
                'start_time',
                [fn('COUNT', col('Booking.id')), 'usageCount']
            ],
            include: [{
                model: db.Field,
                as: 'field',
                where: { stadium_id: stadiumId },
                attributes: []
            }],
            where: { status: 'confirmed' },
            group: ['start_time'],
            order: [[literal('usageCount'), 'DESC']],
            limit: 5,
            raw: true
        });

        // 3. Doanh thu và số đơn hôm nay
        const todayStats = await db.Booking.findOne({
            attributes: [
                [fn('COUNT', col('Booking.id')), 'count'],
                [fn('SUM', col('total_price')), 'revenue']
            ],
            include: [{
                model: db.Field,
                as: 'field',
                where: { stadium_id: stadiumId },
                attributes: []
            }],
            where: {
                status: 'confirmed',
                booking_date: { [Op.gte]: todayStart }
            },
            raw: true
        });

        // 4. Doanh thu tháng này
        const monthlyStats = await db.Booking.findOne({
            attributes: [
                [fn('SUM', col('total_price')), 'revenue']
            ],
            include: [{
                model: db.Field,
                as: 'field',
                where: { stadium_id: stadiumId },
                attributes: []
            }],
            where: {
                status: 'confirmed',
                booking_date: { [Op.gte]: monthStart }
            },
            raw: true
        });

        // Trả về Object đúng cấu trúc Frontend đang chờ
        res.status(200).json({
            todayBookings: todayStats?.count || 0,
            monthlyRevenue: monthlyStats?.revenue || 0,
            fieldUsage,
            peakTimes,
            summary: {
                topField: fieldUsage[0]?.fieldName || "N/A",
                peakHour: peakTimes[0]?.start_time || "N/A"
            }
        });

    } catch (error) {
        console.error("Lỗi Analytics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
//Hàm thông báo
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await db.Notification.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json(notifications);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await db.Notification.update(
            { is_read: true },
            { where: { user_id: req.user.id } }
        );

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markSingleNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await db.Notification.update(
            { is_read: true },
            { where: { id: notificationId, user_id: req.user.id } }
        );

        res.json({ success: true, message: "Đã đánh dấu thông báo là đã đọc" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRefundHistory = async (req, res) => {
    try {
        const ownerId = req.user?.id;

        if (!ownerId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được người dùng!',
            });
        }

        const myStadiums = await db.Stadium.findAll({
            where: { owner_id: ownerId },
            attributes: ['id'],
        });

        const stadiumIds = myStadiums.map((stadium) => stadium.id);

        const refundHistory = await db.Booking.findAll({
            where: {
                status: 'refunded',
                stadium_id: stadiumIds,
            },
            include: [
                {
                    model: db.Field,
                    as: 'field',
                    attributes: ['name'],
                },
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['name', 'phone'],
                },
            ],
            order: [['refunded_at', 'DESC']],
        });

        return res.json({ success: true, data: refundHistory });
    } catch (error) {
        console.error('Loi lay lich su hoan tien owner:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminRefundHistory = async (req, res) => {
    try {
        const refundHistory = await db.Booking.findAll({
            where: { status: 'refunded' },
            include: [
                {
                    model: db.Field,
                    as: 'field',
                    attributes: ['name'],
                    include: [
                        {
                            model: db.Stadium,
                            as: 'stadium',
                            attributes: ['name'],
                        },
                    ],
                },
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['name', 'phone'],
                },
            ],
            order: [['refunded_at', 'DESC']],
        });

        return res.json({ success: true, data: refundHistory });
    } catch (error) {
        console.error('Loi lay lich su hoan tien admin:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { payment_status, payment_method } = req.body;

        const booking = await db.Booking.findByPk(bookingId, {
            include: {
                model: db.Field,
                as: 'field',
                include: {
                    model: db.Stadium,
                    as: 'stadium'
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng!" });
        }

        const before = toPlain(booking);

        if (!isAdminUser(req) && Number(booking.user_id) !== Number(req.user?.id)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật thanh toán đơn này!" });
        }

        const nextPaymentStatus = payment_status || booking.payment_status || 'unpaid';

        booking.payment_status = nextPaymentStatus;
        booking.payment_method = payment_method || booking.payment_method || 'Online';
        if (nextPaymentStatus !== 'unpaid' && booking.payment_recorded_at == null) {
            booking.payment_recorded_at = booking.payment_completed_at || new Date();
        }
        if (nextPaymentStatus !== 'unpaid') {
            booking.hold_until = null;
        }

        if (!shouldPreserveProcessedBookingStatus(booking.status)) {
            booking.status = 'pending';
        }

        await booking.save();

        await logAdminActivity({
            adminId: req.user?.id || booking.user_id,
            action: 'USER_UPDATE_BOOKING_PAYMENT',
            targetType: 'booking',
            targetId: booking.id,
            beforeData: {
                payment_status: before.payment_status,
                payment_method: before.payment_method,
                status: before.status,
                hold_until: before.hold_until,
            },
            afterData: {
                payment_status: booking.payment_status,
                payment_method: booking.payment_method,
                status: booking.status,
                hold_until: booking.hold_until,
            },
            ...getRequestMeta(req),
        });

        if (booking.field && booking.field.stadium && booking.field.stadium.owner_id) {
            await createNotification(
                booking.field.stadium.owner_id,
                "KhÃ¡ch hÃ ng Ä‘Ã£ xÃ¡c nháº­n thanh toÃ¡n. Vui lÃ²ng duyá»‡t Ä‘Æ¡n Ä‘áº·t sÃ¢n."
            );
            console.log("âœ… ÄÃ£ gá»­i thÃ´ng bÃ¡o cho owner:", booking.field.stadium.owner_id);
        }

        if (nextPaymentStatus !== 'unpaid') {
            const io = getIO();
            io.emit('slotConfirmed', {
                field_id: booking.field_id,
                date: booking.booking_date,
                start_time: booking.start_time
            });
        }

        res.json({
            success: true,
            message: "Cáº­p nháº­t tráº¡ng thÃ¡i thanh toÃ¡n thÃ nh cÃ´ng! Vui lÃ²ng chá» chá»§ sÃ¢n duyá»‡t.",
            data: booking
        });
    } catch (error) {
        console.error("Lá»—i updatePaymentStatus:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

