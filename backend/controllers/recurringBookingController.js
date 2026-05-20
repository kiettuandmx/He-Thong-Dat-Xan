const db = require('../models');
const {
  previewRecurringBooking,
  createRecurringBookingSeries,
  listRecurringBookingsForUser,
  listRecurringBookingsForOwner,
  approveRecurringBookingSeries,
  rejectRecurringBookingSeries,
} = require('../utils/recurringBookingService');
const { SERIES_APPROVAL_STATUS } = require('../utils/recurringBookingTypes');

const mapRequestPayload = (req) => ({
  userId: req.user?.id,
  fieldId: Number(req.body.field_id),
  recurrenceType: req.body.recurrence_type,
  startDate: req.body.start_date,
  endDate: req.body.end_date || null,
  occurrenceCount: req.body.occurrence_count ? Number(req.body.occurrence_count) : null,
  startTime: req.body.start_time,
  endTime: req.body.end_time,
  depositAmount: Number(req.body.deposit_amount),
  paymentMethod: req.body.payment_method || 'wallet',
  replacementSelections: Array.isArray(req.body.replacement_selections)
    ? req.body.replacement_selections
    : [],
});

const mapRecurringError = (error) => {
  switch (error.message) {
    case 'FIELD_NOT_FOUND':
      return { status: 404, message: 'Khong tim thay san.' };
    case 'INVALID_RECURRING_REQUEST':
    case 'INVALID_RECURRING_OCCURRENCES':
      return { status: 400, message: 'Thong tin dat san dinh ky khong hop le.' };
    case 'INVALID_RECURRING_DEPOSIT':
      return { status: 400, message: 'Tien coc phai tu 25% den 100% tong gia tri chuoi.' };
    case 'FORBIDDEN_OWNER_REVIEW':
      return { status: 403, message: 'Ban khong co quyen duyet chuoi dat san nay.' };
    case 'RECURRING_CONFLICTS_FOUND':
      return { status: 409, message: 'Co lich bi trung. Vui long chon khung thay the hoac huy.' };
    default:
      return null;
  }
};

exports.previewRecurringBooking = async (req, res) => {
  try {
    const preview = await previewRecurringBooking(db, mapRequestPayload(req));
    res.json({ success: true, data: preview });
  } catch (error) {
    const mapped = mapRecurringError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRecurringBooking = async (req, res) => {
  try {
    const created = await createRecurringBookingSeries(db, mapRequestPayload(req));
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    const mapped = mapRecurringError(error);
    if (mapped) {
      return res.status(mapped.status).json({
        success: false,
        message: mapped.message,
        data: error.preview || null,
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyRecurringBookings = async (req, res) => {
  try {
    const rows = await listRecurringBookingsForUser(db, req.user.id);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOwnerRecurringBookings = async (req, res) => {
  try {
    const status =
      req.query.status && Object.values(SERIES_APPROVAL_STATUS).includes(req.query.status)
        ? req.query.status
        : SERIES_APPROVAL_STATUS.PENDING_OWNER_REVIEW;
    const rows = await listRecurringBookingsForOwner(db, req.user.id, status);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveRecurringBooking = async (req, res) => {
  try {
    const series = await approveRecurringBookingSeries(db, {
      seriesId: Number(req.params.id),
      ownerId: req.user.id,
    });
    return res.json({ success: true, data: series });
  } catch (error) {
    const mapped = mapRecurringError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectRecurringBooking = async (req, res) => {
  try {
    const series = await rejectRecurringBookingSeries(db, {
      seriesId: Number(req.params.id),
      ownerId: req.user.id,
    });
    return res.json({ success: true, data: series });
  } catch (error) {
    const mapped = mapRecurringError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
