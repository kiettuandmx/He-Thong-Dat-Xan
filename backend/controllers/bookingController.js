const db = require("../models");
const Booking = db.Booking;
const Field = db.Field;
const Stadium = db.Stadium;
const User = db.User;
const { Op, fn, col, literal } = require("sequelize");
const { getIO, userSockets } = require("../socket");
const {
  buildPaymentHistoryTransactions,
  filterTransactionsByDateRange,
  paginateTransactions,
  resolveHistoryFilters,
  toNumber,
} = require("../utils/paymentHistory");

function calculatePaymentHistorySummary(transactions) {
  const totalPayment = transactions
    .filter((transaction) => transaction.type === "payment")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const totalRefund = transactions
    .filter((transaction) => transaction.type === "refund")
    .reduce((sum, transaction) => sum + toNumber(transaction.refundAmount), 0);

  return {
    totalPayment,
    totalRefund,
    netRevenue: totalPayment - totalRefund,
  };
}

function normalizePositiveInteger(value, fallback) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function isPaymentHistoryFilterError(error) {
  return error instanceof Error && error.message.startsWith("Invalid ");
}

function shouldPreserveProcessedBookingStatus(status) {
  return ["confirmed", "refunded", "rejected", "cancelled"].includes(status);
}

const createNotification = async (user_id, content) => {
  const noti = await db.Notification.create({
    user_id,
    content,
    is_read: false,
  });

  // realtime
  const io = getIO();
  const socketId = userSockets[user_id];

  if (socketId) {
    io.to(socketId).emit("newNotification", noti);
  }

  return noti;
};

// 1. Khách hàng đặt sân
exports.createBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      field_id,
      stadium_id,
      user_id,
      booking_date,
      start_time,
      end_time,
      total_price,
      amount_paid,
      payment_type,
    } = req.body;

    // Chuẩn hóa giờ (thêm :00 nếu chỉ có HH:mm)
    const normalizedStartTime =
      start_time.length === 5 ? `${start_time}:00` : start_time;

    console.log(
      `Checking booking: Field ${field_id}, Date ${booking_date}, Time ${normalizedStartTime}`,
    );

    const existingBooking = await Booking.findOne({
      where: {
        field_id,
        booking_date,
        start_time: normalizedStartTime,
        status: {
          [db.Sequelize.Op.notIn]: ["cancelled", "expired", "refunded"],
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingBooking) {
      // Nếu đơn đang pending (chưa thanh toán) và đã quá thời gian giữ chỗ
      if (
        existingBooking.status === "pending" &&
        existingBooking.payment_status === "unpaid" &&
        existingBooking.hold_until &&
        new Date() > new Date(existingBooking.hold_until)
      ) {
        await existingBooking.update({ status: "expired" }, { transaction });
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Sân hiện đang được đặt, vui lòng thử lại sau!",
        });
      }
    }

    const holdUntilTime = new Date();
    holdUntilTime.setMinutes(holdUntilTime.getMinutes() + 5); // Lock 5 phút

    const newBooking = await Booking.create(
      {
        field_id,
        stadium_id,
        user_id,
        booking_date,
        start_time,
        end_time,
        total_price,
        status: "pending",
        amount_paid: amount_paid,
        payment_type: payment_type,
        payment_method: "Online",
        payment_status: "unpaid",
        hold_until: holdUntilTime,
      },
      { transaction },
    );

    await transaction.commit();

    // Broadcast sự kiện giữ chỗ cho tất cả client
    const io = getIO();
    io.emit("slotLocked", {
      field_id,
      date: booking_date,
      start_time: normalizedStartTime,
      locked_by_user: user_id,
    });

    // 🔔 notify owner
    const field = await db.Field.findByPk(field_id, {
      include: {
        model: db.Stadium,
        as: "stadium",
      },
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
        "Bạn có đơn đặt sân mới",
      );
      console.log("✅ Đã gửi thông báo cho owner:", field.stadium.owner_id);
    }

    res.status(201).json({
      success: true,
      message: "Gửi yêu cầu đặt sân thành công!",
      data: newBooking,
    });
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
          as: "field",
          include: [
            {
              model: db.Stadium,
              as: "stadium",
              include: [
                {
                  model: db.User,
                  as: "owner",
                  attributes: ["name", "bank_name", "bank_account", "phone"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy lịch sử đặt sân của một User (Khách hàng)

exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại!",
      });
    }

    const bookings = await db.Booking.findAll({
      where: { user_id: userId }, // Đảm bảo cột trong DB là user_id
      include: [
        {
          model: db.Field,
          as: "field",
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (error) {
    console.error("Lỗi History:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lấy danh sách đơn hàng cho Chủ sân (Owner)
exports.getOwnerBookings = async (req, res) => {
  try {
    // Lấy ID từ token thay vì params để đảm bảo chính xác người đang đăng nhập
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Không xác định được chủ sân!" });
    }

    // Bước 1: Tìm tất cả Stadium của ông chủ này
    const myStadiums = await db.Stadium.findAll({
      where: { owner_id: ownerId },
      attributes: ["id"],
    });

    const stadiumIds = myStadiums.map((s) => s.id);

    if (stadiumIds.length === 0) {
      return res.json([]); // Nếu ông này chưa tạo sân nào thì trả về mảng rỗng
    }

    // Bước 2: Tìm các đơn hàng
    const bookings = await db.Booking.findAll({
      where: {
        stadium_id: stadiumIds,
        // Lam chú ý: Nếu muốn chủ sân vẫn thấy đơn đã hủy để quản lý thì bỏ dòng dưới
        // Còn nếu muốn "sạch" luôn thì thêm:
        status: { [db.Sequelize.Op.ne]: "cancelled" },
      },
      attributes: [
        "id",
        "field_id",
        "stadium_id",
        "user_id",
        "booking_date",
        "start_time",
        "end_time",
        "total_price",
        "reject_reason",
        "amount_paid",
        "payment_type",
        "payment_status",
        "status",
      ],
      include: [
        {
          model: db.Field,
          as: "field",
          attributes: ["name"],
        },
        {
          model: db.User,
          as: "user",
          attributes: ["name", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Khong xac dinh duoc nguoi dung.",
      });
    }

    const filters = resolveHistoryFilters(req.query);
    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Field,
          as: "field",
          attributes: ["name"],
          include: [
            {
              model: Stadium,
              as: "stadium",
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filteredTransactions = filterTransactionsByDateRange(
      buildPaymentHistoryTransactions(bookings),
      filters.startDate,
      filters.endDate,
    );
    const safeLimit = normalizePositiveInteger(req.query.limit, 10);
    const currentPage = normalizePositiveInteger(req.query.page, 1);
    const transactions = paginateTransactions(filteredTransactions, currentPage, safeLimit);
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
        message: "Khong xac dinh duoc chu san.",
      });
    }

    const filters = resolveHistoryFilters(req.query);
    const stadiums = await Stadium.findAll({
      where: { owner_id: ownerId },
      attributes: ["id"],
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
          as: "field",
          attributes: ["name"],
          include: [
            {
              model: Stadium,
              as: "stadium",
              attributes: ["name"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filteredTransactions = filterTransactionsByDateRange(
      buildPaymentHistoryTransactions(bookings),
      filters.startDate,
      filters.endDate,
    );
    const transactions = paginateTransactions(filteredTransactions, currentPage, safeLimit);
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
// 4. Hàm duyệt đơn: Cập nhật status thành 'confirmed'
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm đơn hàng
    const booking = await db.Booking.findByPk(id, {
      include: [
        { model: db.Field, as: "field" },
        { model: db.User, as: "user" },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt sân!" });
    }

    // 2. Cập nhật trạng thái
    booking.status = "confirmed";
    await booking.save();

    // 3. Tạo thông báo trong Database
    const notiContent = `Đơn đặt sân ${booking.field.name} của bạn vào ngày ${booking.booking_date} đã được duyệt!`;
    const newNoti = await db.Notification.create({
      user_id: booking.user_id,
      content: notiContent,
      is_read: false,
    });

    // 4. Đẩy thông báo Real-time
    // Dùng getIO() để lấy instance đã khởi tạo từ server.js
    const io = getIO();
    const socketId = userSockets[booking.user_id];

    console.log(
      `DEBUG: Đang gửi thông báo cho User ${booking.user_id}, SocketID: ${socketId}`,
    );

    if (socketId) {
      io.to(socketId).emit("newNotification", newNoti);
      console.log("✅ Đã gửi thông báo thành công!");
    } else {
      console.log(
        "⚠️ Không tìm thấy socketId cho User này, thông báo chưa được đẩy real-time.",
      );
    }

    // 5. Trả về kết quả
    res.json({
      success: true,
      message: "Đã duyệt đơn thành công!",
      data: booking,
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
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn!" });
    }

    // Cập nhật trạng thái và cột reject_reason trong DB
    await booking.update({
      status: "rejected",
      reject_reason: ly_do,
    });

    return res.status(200).json({
      success: true,
      message: "Từ chối thành công!",
    });
  } catch (error) {
    // Log lỗi ra Terminal để kiểm tra xem có phải lỗi DB không
    console.error("--- LỖI TẠI CONTROLLER ---");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Lỗi Server: " + error.message,
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
      return res
        .status(401)
        .json({ success: false, message: "Không xác định được chủ sân!" });
    }

    // Tìm đơn hàng và kiểm tra quyền sở hữu
    const booking = await db.Booking.findByPk(id, {
      include: [
        {
          model: db.Field,
          as: "field",
          include: { model: db.Stadium, as: "stadium" },
        },
        { model: db.User, as: "user" },
      ],
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt sân!" });
    }

    if (booking.field.stadium.owner_id !== ownerId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thao tác trên đơn này!",
      });
    }

    // Chỉ cho hoàn tiền khi đơn đã được duyệt (confirmed)
    if (booking.status !== "confirmed") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hoàn tiền cho các đơn đã được duyệt!",
      });
    }

    // Cập nhật trạng thái đơn hàng
    await booking.update(
      {
        status: "refunded",
        refund_reason: refund_reason || "Chủ sân hoàn tiền đơn này.",
        refunded_at: new Date(),
      },
      { transaction },
    );

    // Tạo thông báo cho khách hàng
    const notiContent = `Đơn đặt sân ${booking.field.name} của bạn vào ngày ${booking.booking_date} đã được hoàn tiền. Lý do: ${refund_reason || "Liên hệ chủ sân để biết thêm chi tiết"}`;
    const newNoti = await db.Notification.create(
      {
        user_id: booking.user_id,
        content: notiContent,
        is_read: false,
      },
      { transaction },
    );

    await transaction.commit();

    // Gửi thông báo real-time
    const io = getIO();
    const socketId = userSockets[booking.user_id];
    if (socketId) {
      io.to(socketId).emit("newNotification", newNoti);
    }

    return res.status(200).json({
      success: true,
      message: "Hoàn tiền thành công!",
      data: booking,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi hoàn tiền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi hoàn tiền: " + error.message,
    });
  }
};
//Hủy đặt sân
exports.cancelBooking = async (req, res) => {
  console.log(
    "===> Đã chạm vào API Update Payment với ID:",
    req.params.bookingId,
  );
  try {
    const { id } = req.params;

    // 1. Kiểm tra xem ID người dùng có tồn tại trong Token không
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!" });
    }

    // 2. Tìm đơn hàng
    const booking = await db.Booking.findByPk(id);

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn đặt sân này!" });
    }

    // 3. Kiểm tra quyền sở hữu (Chủ đơn mới được hủy)
    // Lưu ý: Dùng dấu != thay vì !== nếu một bên là string, một bên là number
    if (booking.user_id != userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền hủy đơn của người khác!" });
    }

    // 4. Chỉ cho hủy khi đơn vẫn đang ở trạng thái 'pending'
    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Đơn này đã được duyệt hoặc đã hủy, không thể thao tác!",
      });
    }

    // 5. Thực hiện hủy
    booking.status = "cancelled";
    booking.hold_until = null;
    await booking.save();

    // Broadcast sự kiện giải phóng sân
    const { getIO } = require("../socket");
    try {
      const io = getIO();
      io.emit("slotReleased", {
        field_id: booking.field_id,
        date: booking.booking_date,
        start_time: booking.start_time,
      });
    } catch (e) {
      console.log("Socket emit error on cancel:", e.message);
    }

    res.json({
      success: true,
      message: "Đã hủy đơn đặt sân thành công!",
      booking,
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

    const booking = await db.Booking.findByPk(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng!" });
    }

    // Cập nhật các thông tin thanh toán
    const nextPaymentStatus = payment_status || booking.payment_status || "unpaid";

    booking.payment_status = nextPaymentStatus;
    booking.payment_method = payment_method || booking.payment_method || "Online";
    if (
      nextPaymentStatus !== "unpaid" &&
      booking.payment_recorded_at == null
    ) {
      booking.payment_recorded_at = booking.payment_completed_at || new Date();
    }
    if (nextPaymentStatus !== "unpaid") {
      booking.hold_until = null;
    }

    // Sau khi thanh toán xong, giữ status là 'pending' để chủ sân duyệt
    if (!shouldPreserveProcessedBookingStatus(booking.status)) {
      booking.status = "pending";
    }

    await booking.save();

    // Broadcast sự kiện xác nhận đặt sân thành công
    if (nextPaymentStatus !== "unpaid") {
      const io = getIO();
      io.emit("slotConfirmed", {
        field_id: booking.field_id,
        date: booking.booking_date,
        start_time: booking.start_time,
      });
    }

    res.json({
      success: true,
      message:
        "Cập nhật trạng thái thanh toán thành công! Vui lòng chờ chủ sân duyệt.",
      data: booking,
    });
  } catch (error) {
    console.error("Lỗi updatePaymentStatus:", error);
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
        [col("field.name"), "fieldName"],
        [fn("COUNT", col("Booking.id")), "totalBookings"],
      ],
      include: [
        {
          model: db.Field,
          as: "field",
          where: { stadium_id: stadiumId },
          attributes: [],
        },
      ],
      where: { status: "confirmed" }, // Lưu ý: Dùng 'confirmed' hoặc 'approved' tùy DB của Lâm
      group: ["field.name"],
      raw: true,
    });

    // 2. Thống kê khung giờ được đặt nhiều nhất
    const peakTimes = await db.Booking.findAll({
      attributes: [
        "start_time",
        [fn("COUNT", col("Booking.id")), "usageCount"],
      ],
      include: [
        {
          model: db.Field,
          as: "field",
          where: { stadium_id: stadiumId },
          attributes: [],
        },
      ],
      where: { status: "confirmed" },
      group: ["start_time"],
      order: [[literal("usageCount"), "DESC"]],
      limit: 5,
      raw: true,
    });

    // 3. Doanh thu và số đơn hôm nay
    const todayStats = await db.Booking.findOne({
      attributes: [
        [fn("COUNT", col("Booking.id")), "count"],
        [fn("SUM", col("total_price")), "revenue"],
      ],
      include: [
        {
          model: db.Field,
          as: "field",
          where: { stadium_id: stadiumId },
          attributes: [],
        },
      ],
      where: {
        status: "confirmed",
        booking_date: { [Op.gte]: todayStart },
      },
      raw: true,
    });

    // 4. Doanh thu tháng này
    const monthlyStats = await db.Booking.findOne({
      attributes: [[fn("SUM", col("total_price")), "revenue"]],
      include: [
        {
          model: db.Field,
          as: "field",
          where: { stadium_id: stadiumId },
          attributes: [],
        },
      ],
      where: {
        status: "confirmed",
        booking_date: { [Op.gte]: monthStart },
      },
      raw: true,
    });

    // Trả về Object đúng cấu trúc Frontend đang chờ
    res.status(200).json({
      todayBookings: todayStats?.count || 0,
      monthlyRevenue: monthlyStats?.revenue || 0,
      fieldUsage,
      peakTimes,
      summary: {
        topField: fieldUsage[0]?.fieldName || "N/A",
        peakHour: peakTimes[0]?.start_time || "N/A",
      },
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
      order: [["createdAt", "DESC"]],
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
      { where: { user_id: req.user.id } },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Lấy danh sách lịch sử hoàn tiền (Dành cho Owner)
exports.getRefundHistory = async (req, res) => {
  try {
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res
        .status(401)
        .json({ success: false, message: "Không xác định được người dùng!" });
    }

    // Bước 1: Tìm tất cả Stadium thuộc sở hữu của user này
    const myStadiums = await db.Stadium.findAll({
      where: { owner_id: ownerId },
      attributes: ["id"],
    });

    const stadiumIds = myStadiums.map((s) => s.id);

    // Bước 2: Truy vấn đơn hàng có trạng thái 'refunded' thuộc các sân trên
    const refundHistory = await db.Booking.findAll({
      where: {
        status: "refunded",
        stadium_id: stadiumIds, // Lọc trực tiếp đơn thuộc sân của mình
      },
      include: [
        { model: db.Field, as: "field", attributes: ["name"] },
        { model: db.User, as: "user", attributes: ["name", "phone"] },
      ],
      order: [["refunded_at", "DESC"]],
    });

    // Trả về đúng cấu trúc mà Frontend của Anh đang chờ (res.data.data)
    res.json({ success: true, data: refundHistory });
  } catch (error) {
    console.error("Lỗi lấy lịch sử hoàn tiền:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// 12. Lấy danh sách lịch sử hoàn tiền cho ADMIN
exports.getAdminRefundHistory = async (req, res) => {
  try {
    // Admin không cần lọc stadium_id, lấy tất cả đơn status = refunded
    const refundHistory = await db.Booking.findAll({
      where: { status: "refunded" },
      include: [
        {
          model: db.Field,
          as: "field",
          attributes: ["name"],
          include: [{ model: db.Stadium, as: "stadium", attributes: ["name"] }],
        },
        { model: db.User, as: "user", attributes: ["name", "phone"] },
      ],
      order: [["refunded_at", "DESC"]],
    });

    res.json({ success: true, data: refundHistory });
  } catch (error) {
    console.error("Lỗi lấy lịch sử hoàn tiền Admin:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
