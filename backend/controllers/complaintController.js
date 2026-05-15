const { Op } = require('sequelize');
const db = require('../models');
const { logAdminActivity } = require('../utils/adminActivityLogger');
const { createNotification: createNotificationRecord } = require('../utils/notificationHelper');

const VALID_STATUSES = ['pending', 'investigating', 'resolved', 'rejected'];
const VALID_RESOLUTIONS = ['refund_user', 'penalize_owner', 'no_action'];
const BLOCKING_COMPLAINT_STATUSES = ['pending', 'investigating'];

const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null,
});

const toPlain = (instance) => (instance ? instance.get({ plain: true }) : null);

const normalizeEvidence = (evidenceUrls) => {
  if (!evidenceUrls) return [];
  if (Array.isArray(evidenceUrls)) return evidenceUrls.filter(Boolean);
  if (typeof evidenceUrls === 'string') {
    return evidenceUrls
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const createNotification = async (userIdOrPayload, content, transaction = null) => {
  if (typeof userIdOrPayload === 'object' && userIdOrPayload !== null) {
    return createNotificationRecord(userIdOrPayload, transaction ? { transaction } : undefined);
  }

  return createNotificationRecord(
    {
      userId: userIdOrPayload,
      content,
    },
    transaction ? { transaction } : undefined
  );
};

const getComplaintInclude = () => [
  { model: db.User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
  { model: db.User, as: 'assignedAdmin', attributes: ['id', 'name', 'email'] },
  {
    model: db.Booking,
    as: 'booking',
    include: [
      { model: db.Field, as: 'field', attributes: ['id', 'name', 'type'] },
      { model: db.Stadium, as: 'stadium', attributes: ['id', 'name', 'owner_id'] },
    ],
  },
  { model: db.Stadium, as: 'stadium', attributes: ['id', 'name', 'owner_id'] },
  { model: db.Field, as: 'field', attributes: ['id', 'name', 'type'] },
  {
    model: db.ComplaintAction,
    as: 'actions',
    include: [{ model: db.User, as: 'admin', attributes: ['id', 'name', 'email'] }],
  },
];

exports.createComplaint = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { booking_id, stadium_id, field_id, reason, evidence_urls } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap lai.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Vui long nhap noi dung khieu nai.' });
    }

    if (!booking_id && !stadium_id && !field_id) {
      return res.status(400).json({
        success: false,
        message: 'Can cung cap booking hoac doi tuong lien quan de tao khieu nai.',
      });
    }

    let booking = null;
    let finalStadiumId = stadium_id || null;
    let finalFieldId = field_id || null;

    if (booking_id) {
      booking = await db.Booking.findByPk(booking_id, {
        include: [{ model: db.Field, as: 'field' }],
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Khong tim thay don dat san.' });
      }

      if (Number(booking.user_id) !== Number(userId)) {
        return res.status(403).json({ success: false, message: 'Ban khong the khieu nai don cua nguoi khac.' });
      }

      if (!['paid', 'partially_paid'].includes(booking.payment_status) && booking.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Don dat san chua du dieu kien de gui khieu nai.',
        });
      }

      finalStadiumId = booking.stadium_id || booking.field?.stadium_id || finalStadiumId;
      finalFieldId = booking.field_id || finalFieldId;

      const existingComplaint = await db.Complaint.findOne({
        where: {
          booking_id,
          status: BLOCKING_COMPLAINT_STATUSES,
        },
      });

      if (existingComplaint) {
        return res.status(409).json({
          success: false,
          message: 'Don dat san nay da co khieu nai dang duoc xu ly.',
        });
      }
    }

    const complaint = await db.Complaint.create({
      user_id: userId,
      booking_id: booking_id || null,
      stadium_id: finalStadiumId,
      field_id: finalFieldId,
      reason: reason.trim(),
      evidence_urls: normalizeEvidence(evidence_urls),
      status: 'pending',
    });

    await db.ComplaintAction.create({
      complaint_id: complaint.id,
      action: 'COMPLAINT_CREATED',
      note: 'User created complaint',
      after_data: toPlain(complaint),
    });

    await logAdminActivity({
      adminId: userId,
      action: 'USER_CREATE_COMPLAINT',
      targetType: 'complaint',
      targetId: complaint.id,
      afterData: {
        booking_id: complaint.booking_id,
        stadium_id: complaint.stadium_id,
        field_id: complaint.field_id,
        status: complaint.status,
        reason: complaint.reason,
        evidence_urls: complaint.evidence_urls,
      },
      ...getRequestMeta(req),
    });

    res.status(201).json({
      success: true,
      message: 'Da gui khieu nai. Admin se kiem tra va phan hoi.',
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const userId = req.user?.id;
    const complaints = await db.Complaint.findAll({
      where: { user_id: userId },
      include: getComplaintInclude(),
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      resolution_type,
      booking_id,
      user_id,
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;
    const where = {};

    if (status) where.status = status;
    if (resolution_type) where.resolution_type = resolution_type;
    if (booking_id) where.booking_id = booking_id;
    if (user_id) where.user_id = user_id;

    const { count, rows } = await db.Complaint.findAndCountAll({
      where,
      include: getComplaintInclude(),
      order: [['createdAt', 'DESC']],
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.max(Math.ceil(count / parsedLimit), 1),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminComplaintById = async (req, res) => {
  try {
    const complaint = await db.Complaint.findByPk(req.params.id, {
      include: getComplaintInclude(),
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Khong tim thay khieu nai.' });
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { status, note } = req.body;
    const adminId = req.user?.id;

    if (!VALID_STATUSES.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Trang thai khong hop le.' });
    }

    const complaint = await db.Complaint.findByPk(req.params.id, { transaction });
    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Khong tim thay khieu nai.' });
    }

    const before = toPlain(complaint);
    await complaint.update(
      {
        status,
        assigned_admin_id: status === 'investigating' ? adminId : complaint.assigned_admin_id,
      },
      { transaction }
    );

    await db.ComplaintAction.create(
      {
        complaint_id: complaint.id,
        admin_id: adminId,
        action: 'COMPLAINT_STATUS_UPDATE',
        note,
        before_data: { status: before.status, assigned_admin_id: before.assigned_admin_id },
        after_data: { status: complaint.status, assigned_admin_id: complaint.assigned_admin_id },
      },
      { transaction }
    );

    await transaction.commit();

    await logAdminActivity({
      adminId,
      action: 'COMPLAINT_STATUS_UPDATE',
      targetType: 'complaint',
      targetId: complaint.id,
      beforeData: { status: before.status, assigned_admin_id: before.assigned_admin_id },
      afterData: { status: complaint.status, assigned_admin_id: complaint.assigned_admin_id },
      ...getRequestMeta(req),
    });

    await createNotification({
      userId: complaint.user_id,
      content: `Khieu nai #${complaint.id} da duoc cap nhat trang thai: ${status}`,
      type: 'complaint_status_updated',
      targetType: 'complaint',
      targetId: complaint.id,
      targetRoute: '/complaints',
    });

    res.json({ success: true, message: 'Da cap nhat trang thai khieu nai.', data: complaint });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const adminId = req.user?.id;
    const { resolution_type, resolution_note, penalty_amount } = req.body;

    if (!VALID_RESOLUTIONS.includes(resolution_type)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Huong xu ly khong hop le.' });
    }

    const complaint = await db.Complaint.findByPk(req.params.id, {
      include: [
        {
          model: db.Booking,
          as: 'booking',
          include: [
            { model: db.Field, as: 'field' },
            { model: db.Stadium, as: 'stadium' },
          ],
        },
        { model: db.Stadium, as: 'stadium' },
      ],
      transaction,
    });

    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Khong tim thay khieu nai.' });
    }

    const before = toPlain(complaint);
    let bookingBefore = null;
    let bookingAfter = null;

    if (resolution_type === 'refund_user' && complaint.booking) {
      bookingBefore = toPlain(complaint.booking);
      await complaint.booking.update(
        {
          status: 'refunded',
          refund_reason: resolution_note || 'Admin hoan tien sau khi xu ly khieu nai.',
          refunded_at: new Date(),
        },
        { transaction }
      );
      bookingAfter = toPlain(complaint.booking);
    }

    const nextStatus = resolution_type === 'no_action' ? 'rejected' : 'resolved';
    await complaint.update(
      {
        status: nextStatus,
        assigned_admin_id: complaint.assigned_admin_id || adminId,
        resolution_type,
        resolution_note,
        penalty_amount: resolution_type === 'penalize_owner' ? penalty_amount || null : null,
        resolved_at: new Date(),
      },
      { transaction }
    );

    await db.ComplaintAction.create(
      {
        complaint_id: complaint.id,
        admin_id: adminId,
        action: 'COMPLAINT_RESOLVED',
        note: resolution_note,
        before_data: {
          complaint: before,
          booking: bookingBefore,
        },
        after_data: {
          complaint: toPlain(complaint),
          booking: bookingAfter,
        },
      },
      { transaction }
    );

    await transaction.commit();

    await logAdminActivity({
      adminId,
      action: 'COMPLAINT_RESOLVED',
      targetType: 'complaint',
      targetId: complaint.id,
      beforeData: {
        complaint: before,
        booking: bookingBefore,
      },
      afterData: {
        complaint: toPlain(complaint),
        booking: bookingAfter,
      },
      ...getRequestMeta(req),
    });

    if (resolution_type === 'refund_user') {
      await createNotification({
        userId: complaint.user_id,
        content: `Khieu nai #${complaint.id} da duoc chap nhan va hoan tien.`,
        type: 'complaint_refund_approved',
        targetType: 'complaint',
        targetId: complaint.id,
        targetRoute: '/complaints',
      });
    } else if (resolution_type === 'penalize_owner') {
      await createNotification({
        userId: complaint.user_id,
        content: `Khieu nai #${complaint.id} da duoc xu ly. Chu san se bi xu phat theo ghi chu admin.`,
        type: 'complaint_owner_penalized',
        targetType: 'complaint',
        targetId: complaint.id,
        targetRoute: '/complaints',
      });
      const ownerId = complaint.booking?.stadium?.owner_id || complaint.stadium?.owner_id;
      await createNotification({
        userId: ownerId,
        content: `Admin da xu ly khieu nai #${complaint.id}. Vui long xem ghi chu xu phat.`,
        type: 'complaint_penalty_notice',
        targetType: 'complaint',
        targetId: complaint.id,
        targetRoute: '/history',
      });
    } else {
      await createNotification({
        userId: complaint.user_id,
        content: `Khieu nai #${complaint.id} da duoc xem xet va tu choi.`,
        type: 'complaint_rejected',
        targetType: 'complaint',
        targetId: complaint.id,
        targetRoute: '/complaints',
      });
    }

    res.json({ success: true, message: 'Da xu ly khieu nai.', data: complaint });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getComplaintActivityContext = async (req, res) => {
  try {
    const complaint = await db.Complaint.findByPk(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Khong tim thay khieu nai.' });
    }

    const targets = [{ target_type: 'complaint', target_id: String(complaint.id) }];
    if (complaint.booking_id) targets.push({ target_type: 'booking', target_id: String(complaint.booking_id) });
    if (complaint.stadium_id) targets.push({ target_type: 'stadium', target_id: String(complaint.stadium_id) });
    if (complaint.field_id) targets.push({ target_type: 'field', target_id: String(complaint.field_id) });

    const logs = await db.AdminActivityLog.findAll({
      where: {
        [Op.or]: targets,
      },
      include: [{ model: db.User, as: 'admin', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
