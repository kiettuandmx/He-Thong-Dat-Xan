const { Op } = require('sequelize');

const {
  RECURRING_TYPES,
  SERIES_APPROVAL_STATUS,
  RECURRING_ITEM_STATUS,
} = require('./recurringBookingTypes');
const { createNotification } = require('./notificationHelper');

const MINIMUM_DEPOSIT_PERCENT = 25;
const AUTO_APPROVE_DEPOSIT_PERCENT = 50;
const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'completed'];
const DEFAULT_SLOT_WINDOWS = [
  { start: '05:00', end: '06:00' },
  { start: '06:00', end: '07:00' },
  { start: '07:00', end: '08:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
  { start: '20:00', end: '21:00' },
  { start: '21:00', end: '22:00' },
];

const toAmount = (value) => Number(value || 0);

const parseDateOnly = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
};

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date, months) => {
  const source = new Date(date);
  const targetDay = source.getDate();
  const next = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(targetDay, lastDay));
  return next;
};

const normalizeWeekday = (date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const normalizeTimeValue = (value) => {
  if (!value) return null;
  return String(value).length === 5 ? `${value}:00` : String(value);
};

const normalizeTimeLabel = (value) => String(normalizeTimeValue(value) || '').slice(0, 5);

const buildOccurrenceRow = (date, startTime, endTime, recurrenceType) => ({
  recurrenceType,
  scheduledDate: formatDateOnly(date),
  startTime: normalizeTimeValue(startTime),
  endTime: normalizeTimeValue(endTime),
});

function validateDepositAmount({ totalEstimatedAmount, depositAmount }) {
  const total = toAmount(totalEstimatedAmount);
  const deposit = toAmount(depositAmount);

  if (total <= 0 || deposit <= 0) {
    throw new Error('INVALID_RECURRING_DEPOSIT');
  }

  const depositPercent = (deposit / total) * 100;
  if (depositPercent < MINIMUM_DEPOSIT_PERCENT || deposit > total) {
    throw new Error('INVALID_RECURRING_DEPOSIT');
  }

  return {
    totalEstimatedAmount: total,
    depositAmount: deposit,
    depositPercent,
  };
}

function resolveApprovalStatus({ totalEstimatedAmount, depositAmount }) {
  const { depositPercent } = validateDepositAmount({ totalEstimatedAmount, depositAmount });

  return depositPercent >= AUTO_APPROVE_DEPOSIT_PERCENT
    ? SERIES_APPROVAL_STATUS.APPROVED
    : SERIES_APPROVAL_STATUS.PENDING_OWNER_REVIEW;
}

function buildWeeklyOccurrences({ startDate, endDate, occurrenceCount, weekday, startTime, endTime }) {
  const results = [];
  let cursor = parseDateOnly(startDate);
  const targetWeekday = Number(weekday || normalizeWeekday(cursor));
  const endBoundary = endDate ? parseDateOnly(endDate) : null;

  while (normalizeWeekday(cursor) !== targetWeekday) {
    cursor = addDays(cursor, 1);
  }

  while (true) {
    if (endBoundary && cursor > endBoundary) break;

    results.push(buildOccurrenceRow(cursor, startTime, endTime, RECURRING_TYPES.WEEKLY));
    if (occurrenceCount && results.length >= Number(occurrenceCount)) break;

    cursor = addDays(cursor, 7);
  }

  return results;
}

function buildMonthlyOccurrences({ startDate, endDate, occurrenceCount, startTime, endTime }) {
  const results = [];
  let cursor = parseDateOnly(startDate);
  const endBoundary = endDate ? parseDateOnly(endDate) : null;

  while (true) {
    if (endBoundary && cursor > endBoundary) break;

    results.push(buildOccurrenceRow(cursor, startTime, endTime, RECURRING_TYPES.MONTHLY));
    if (occurrenceCount && results.length >= Number(occurrenceCount)) break;

    cursor = addMonths(cursor, 1);
  }

  return results;
}

const buildOccurrences = ({
  recurrenceType,
  startDate,
  endDate,
  occurrenceCount,
  startTime,
  endTime,
}) => {
  if (recurrenceType === RECURRING_TYPES.MONTHLY) {
    return buildMonthlyOccurrences({
      startDate,
      endDate,
      occurrenceCount,
      startTime,
      endTime,
    });
  }

  return buildWeeklyOccurrences({
    startDate,
    endDate,
    occurrenceCount,
    weekday: normalizeWeekday(parseDateOnly(startDate)),
    startTime,
    endTime,
  });
};

const getWeekBounds = (scheduledDate) => {
  const date = parseDateOnly(scheduledDate);
  const currentWeekday = normalizeWeekday(date);
  const weekStart = addDays(date, 1 - currentWeekday);
  const weekEnd = addDays(weekStart, 6);
  return {
    weekStart,
    weekEnd,
  };
};

const getPaymentStatus = ({ amountPaid, totalPrice }) => {
  const paid = toAmount(amountPaid);
  const total = toAmount(totalPrice);

  if (paid >= total) return 'paid';
  if (paid > 0) return 'partially_paid';
  return 'unpaid';
};

const getPaymentStatusSummary = ({ depositAmount, totalEstimatedAmount }) => {
  const paid = toAmount(depositAmount);
  const total = toAmount(totalEstimatedAmount);

  if (paid >= total) return 'paid';
  if (paid > 0) return 'partially_paid';
  return 'unpaid';
};

const allocateDepositAcrossOccurrences = (occurrences, depositAmount, unitPrice) => {
  let remainingDeposit = toAmount(depositAmount);
  const allocations = [];

  occurrences.forEach((occurrence, index) => {
    if (remainingDeposit <= 0) {
      allocations.push({ ...occurrence, amountPaid: 0, remainingAmount: unitPrice });
      return;
    }

    const remainingCount = occurrences.length - index;
    const proportionalShare = Math.floor(remainingDeposit / remainingCount);
    const applied = Math.min(
      index === occurrences.length - 1 ? remainingDeposit : Math.max(proportionalShare, 0),
      unitPrice
    );

    remainingDeposit -= applied;
    allocations.push({
      ...occurrence,
      amountPaid: applied,
      remainingAmount: Math.max(unitPrice - applied, 0),
    });
  });

  return allocations;
};

const mapReplacementSelections = (replacementSelections = []) =>
  new Map(
    replacementSelections
      .filter((selection) => selection?.originalScheduledDate)
      .map((selection) => [selection.originalScheduledDate, selection])
  );

const applyReplacementSelections = (occurrences, replacementSelections = []) => {
  const replacements = mapReplacementSelections(replacementSelections);

  return occurrences.map((occurrence) => {
    const replacement = replacements.get(occurrence.scheduledDate);
    if (!replacement) {
      return {
        ...occurrence,
        wasRescheduled: false,
        originalDateTime: null,
      };
    }

    return {
      ...occurrence,
      scheduledDate: replacement.scheduledDate,
      startTime: normalizeTimeValue(replacement.startTime),
      endTime: normalizeTimeValue(replacement.endTime),
      wasRescheduled: true,
      originalDateTime: `${occurrence.scheduledDate} ${normalizeTimeLabel(
        occurrence.startTime
      )}-${normalizeTimeLabel(occurrence.endTime)}`,
    };
  });
};

const findBookingConflict = async (db, { fieldId, scheduledDate, startTime }, transaction) =>
  db.Booking.findOne({
    where: {
      field_id: fieldId,
      booking_date: scheduledDate,
      start_time: normalizeTimeValue(startTime),
      status: {
        [Op.in]: ACTIVE_BOOKING_STATUSES,
      },
    },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

const findScheduleConflict = async (db, { fieldId, scheduledDate, startTime }, transaction) => {
  if (!db.Schedule) return null;

  return db.Schedule.findOne({
    where: {
      field_id: fieldId,
      date: {
        [Op.gte]: new Date(`${scheduledDate}T00:00:00`),
        [Op.lt]: new Date(`${scheduledDate}T23:59:59`),
      },
      start_time: normalizeTimeValue(startTime),
      is_available: false,
    },
    transaction,
  });
};

const findOccurrenceConflict = async (db, occurrence, fieldId, transaction) => {
  const booking = await findBookingConflict(
    db,
    {
      fieldId,
      scheduledDate: occurrence.scheduledDate,
      startTime: occurrence.startTime,
    },
    transaction
  );
  if (booking) {
    return {
      type: 'booking',
      id: booking.id,
    };
  }

  const schedule = await findScheduleConflict(
    db,
    {
      fieldId,
      scheduledDate: occurrence.scheduledDate,
      startTime: occurrence.startTime,
    },
    transaction
  );
  if (schedule) {
    return {
      type: 'schedule',
      id: schedule.id,
    };
  }

  return null;
};

const buildAlternativeCandidateDates = (scheduledDate) => {
  const { weekStart } = getWeekBounds(scheduledDate);

  return Array.from({ length: 7 }, (_, index) => formatDateOnly(addDays(weekStart, index)));
};

async function suggestAlternativesForWeek(db, { fieldId, occurrence }, transaction) {
  const candidateDates = buildAlternativeCandidateDates(occurrence.scheduledDate);
  const suggestions = [];

  for (const date of candidateDates) {
    for (const slot of DEFAULT_SLOT_WINDOWS) {
      const isOriginalSlot =
        date === occurrence.scheduledDate &&
        normalizeTimeLabel(slot.start) === normalizeTimeLabel(occurrence.startTime);

      if (isOriginalSlot) continue;

      const candidate = {
        scheduledDate: date,
        startTime: normalizeTimeValue(slot.start),
        endTime: normalizeTimeValue(slot.end),
      };

      // eslint-disable-next-line no-await-in-loop
      const conflict = await findOccurrenceConflict(db, candidate, fieldId, transaction);
      if (!conflict) {
        suggestions.push(candidate);
      }

      if (suggestions.length >= 3) {
        return suggestions;
      }
    }
  }

  return suggestions;
}

const loadFieldOrThrow = async (db, fieldId, transaction) => {
  const field = await db.Field.findByPk(fieldId, {
    include: {
      model: db.Stadium,
      as: 'stadium',
    },
    transaction,
  });

  if (!field) {
    throw new Error('FIELD_NOT_FOUND');
  }

  return field;
};

const validateSeriesRequestPayload = (payload) => {
  if (!payload.fieldId || !payload.startDate || !payload.startTime || !payload.endTime) {
    throw new Error('INVALID_RECURRING_REQUEST');
  }

  if (!payload.endDate && !payload.occurrenceCount) {
    throw new Error('INVALID_RECURRING_REQUEST');
  }

  if (![RECURRING_TYPES.WEEKLY, RECURRING_TYPES.MONTHLY].includes(payload.recurrenceType)) {
    throw new Error('INVALID_RECURRING_REQUEST');
  }
};

const computeSeriesSummary = ({ occurrences, depositAmount, unitPrice }) => {
  const totalEstimatedAmount = occurrences.length * toAmount(unitPrice);
  const depositValidation = validateDepositAmount({
    totalEstimatedAmount,
    depositAmount,
  });

  return {
    occurrenceCount: occurrences.length,
    totalEstimatedAmount,
    depositAmount: depositValidation.depositAmount,
    depositPercent: depositValidation.depositPercent,
    approvalStatus: resolveApprovalStatus({
      totalEstimatedAmount,
      depositAmount: depositValidation.depositAmount,
    }),
  };
};

async function previewRecurringBooking(db, payload, transaction) {
  validateSeriesRequestPayload(payload);
  const field = await loadFieldOrThrow(db, payload.fieldId, transaction);

  const baseOccurrences = buildOccurrences({
    recurrenceType: payload.recurrenceType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    occurrenceCount: payload.occurrenceCount,
    startTime: payload.startTime,
    endTime: payload.endTime,
  });
  const occurrences = applyReplacementSelections(baseOccurrences, payload.replacementSelections);

  if (occurrences.length === 0) {
    throw new Error('INVALID_RECURRING_OCCURRENCES');
  }

  const conflicts = [];
  for (const occurrence of occurrences) {
    // eslint-disable-next-line no-await-in-loop
    const conflict = await findOccurrenceConflict(db, occurrence, payload.fieldId, transaction);
    if (conflict) {
      // eslint-disable-next-line no-await-in-loop
      const suggestions = await suggestAlternativesForWeek(
        db,
        { fieldId: payload.fieldId, occurrence },
        transaction
      );
      conflicts.push({
        requestedSlot: occurrence,
        conflictType: conflict.type,
        suggestions,
      });
    }
  }

  const seriesSummary = computeSeriesSummary({
    occurrences,
    depositAmount: payload.depositAmount,
    unitPrice: field.price_per_hour,
  });

  return {
    field: {
      id: field.id,
      name: field.name,
      stadium_id: field.stadium_id,
      stadium_name: field.stadium?.name || null,
      owner_id: field.stadium?.owner_id || null,
      price_per_hour: Number(field.price_per_hour || 0),
    },
    hasConflicts: conflicts.length > 0,
    conflicts,
    occurrences,
    ...seriesSummary,
  };
}

const buildSeriesRowPayload = ({ payload, userId, field, preview }) => ({
  user_id: userId,
  field_id: field.id,
  stadium_id: field.stadium_id,
  recurrence_type: payload.recurrenceType,
  start_date: payload.startDate,
  end_date: payload.endDate || null,
  occurrence_count: payload.occurrenceCount || preview.occurrenceCount,
  preferred_day_of_week: normalizeWeekday(parseDateOnly(payload.startDate)),
  preferred_start_time: normalizeTimeValue(payload.startTime),
  preferred_end_time: normalizeTimeValue(payload.endTime),
  total_estimated_amount: preview.totalEstimatedAmount,
  deposit_amount: preview.depositAmount,
  deposit_percent: Number(preview.depositPercent.toFixed(2)),
  approval_status: preview.approvalStatus,
  payment_status_summary: getPaymentStatusSummary(preview),
  created_by: userId,
});

const buildBookingPayload = ({ occurrence, field, userId, seriesId, approvalStatus, paymentMethod }) => ({
  user_id: userId,
  field_id: field.id,
  stadium_id: field.stadium_id,
  booking_date: occurrence.scheduledDate,
  start_time: normalizeTimeValue(occurrence.startTime),
  end_time: normalizeTimeValue(occurrence.endTime),
  total_price: Number(field.price_per_hour || 0),
  amount_paid: occurrence.amountPaid,
  payment_type: occurrence.remainingAmount > 0 ? 'deposit' : 'full',
  payment_status: getPaymentStatus({
    amountPaid: occurrence.amountPaid,
    totalPrice: field.price_per_hour,
  }),
  payment_method: paymentMethod || 'recurring_deposit',
  payment_recorded_at: occurrence.amountPaid > 0 ? new Date() : null,
  status:
    approvalStatus === SERIES_APPROVAL_STATUS.APPROVED ? 'confirmed' : 'pending',
  hold_until: null,
  recurring_series_id: seriesId,
  remaining_amount: occurrence.remainingAmount,
  payment_due_date: formatDateOnly(addDays(parseDateOnly(occurrence.scheduledDate), -5)),
});

async function createRecurringBookingSeries(db, payload) {
  validateSeriesRequestPayload(payload);
  const transaction = await db.sequelize.transaction();

  try {
    const field = await loadFieldOrThrow(db, payload.fieldId, transaction);
    const preview = await previewRecurringBooking(db, payload, transaction);

    if (preview.hasConflicts) {
      const error = new Error('RECURRING_CONFLICTS_FOUND');
      error.preview = preview;
      throw error;
    }

    const series = await db.RecurringBookingSeries.create(
      buildSeriesRowPayload({
        payload,
        userId: payload.userId,
        field,
        preview,
      }),
      { transaction }
    );

    const allocatedOccurrences = allocateDepositAcrossOccurrences(
      preview.occurrences,
      preview.depositAmount,
      Number(field.price_per_hour || 0)
    );

    const createdItems = [];
    for (const occurrence of allocatedOccurrences) {
      // eslint-disable-next-line no-await-in-loop
      const booking = await db.Booking.create(
        buildBookingPayload({
          occurrence,
          field,
          userId: payload.userId,
          seriesId: series.id,
          approvalStatus: preview.approvalStatus,
          paymentMethod: payload.paymentMethod,
        }),
        { transaction }
      );

      // eslint-disable-next-line no-await-in-loop
      const item = await db.RecurringBookingItem.create(
        {
          series_id: series.id,
          booking_id: booking.id,
          scheduled_date: occurrence.scheduledDate,
          start_time: normalizeTimeValue(occurrence.startTime),
          end_time: normalizeTimeValue(occurrence.endTime),
          base_price: Number(field.price_per_hour || 0),
          amount_paid: occurrence.amountPaid,
          remaining_amount: occurrence.remainingAmount,
          payment_due_date: booking.payment_due_date,
          item_status:
            preview.approvalStatus === SERIES_APPROVAL_STATUS.APPROVED
              ? RECURRING_ITEM_STATUS.CONFIRMED
              : RECURRING_ITEM_STATUS.PENDING,
          was_rescheduled: Boolean(occurrence.wasRescheduled),
          original_date_time: occurrence.originalDateTime,
        },
        { transaction }
      );

      createdItems.push({
        id: item.id,
        booking_id: booking.id,
        scheduled_date: item.scheduled_date,
        remaining_amount: item.remaining_amount,
        payment_due_date: item.payment_due_date,
        item_status: item.item_status,
      });
    }

    if (field?.stadium?.owner_id) {
      await createNotification(
        {
          userId: field.stadium.owner_id,
          content:
            preview.approvalStatus === SERIES_APPROVAL_STATUS.APPROVED
              ? 'Co chuoi dat san dinh ky moi da duoc tu dong duyet'
              : 'Co yeu cau dat san dinh ky moi can duyet',
          type:
            preview.approvalStatus === SERIES_APPROVAL_STATUS.APPROVED
              ? 'recurring_booking_auto_approved'
              : 'recurring_booking_review_required',
          targetType: 'recurring_series',
          targetId: series.id,
          targetRoute: '/owner/recurring-requests',
        },
        { transaction }
      );
    }

    await createNotification(
      {
        userId: payload.userId,
        content:
          preview.approvalStatus === SERIES_APPROVAL_STATUS.APPROVED
            ? 'Chuoi dat san dinh ky cua ban da duoc tao thanh cong'
            : 'Yeu cau dat san dinh ky cua ban dang cho chu san duyet',
        type: 'recurring_booking_created',
        targetType: 'recurring_series',
        targetId: series.id,
        targetRoute: '/recurring-bookings',
      },
      { transaction }
    );

    await transaction.commit();

    return {
      id: series.id,
      approval_status: series.approval_status,
      payment_status_summary: series.payment_status_summary,
      total_estimated_amount: Number(series.total_estimated_amount || 0),
      deposit_amount: Number(series.deposit_amount || 0),
      items: createdItems,
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

const assertOwnerCanReviewSeries = (series, ownerId) => {
  if (!series || Number(series.stadium?.owner_id) !== Number(ownerId)) {
    throw new Error('FORBIDDEN_OWNER_REVIEW');
  }
};

async function listRecurringBookingsForUser(db, userId) {
  return db.RecurringBookingSeries.findAll({
    where: { user_id: userId },
    include: [
      { model: db.Field, as: 'field', attributes: ['id', 'name'] },
      { model: db.Stadium, as: 'stadium', attributes: ['id', 'name', 'owner_id'] },
      {
        model: db.RecurringBookingItem,
        as: 'items',
        attributes: ['id', 'scheduled_date', 'remaining_amount', 'payment_due_date', 'item_status'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function listRecurringBookingsForOwner(db, ownerId, approvalStatus) {
  const where = approvalStatus ? { approval_status: approvalStatus } : undefined;

  return db.RecurringBookingSeries.findAll({
    where,
    include: [
      { model: db.User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
      {
        model: db.Stadium,
        as: 'stadium',
        attributes: ['id', 'name', 'owner_id'],
        where: { owner_id: ownerId },
      },
      { model: db.Field, as: 'field', attributes: ['id', 'name'] },
      {
        model: db.RecurringBookingItem,
        as: 'items',
        attributes: ['id', 'scheduled_date', 'remaining_amount', 'payment_due_date', 'item_status'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

const updateSeriesChildrenStatus = async (series, status, itemStatus, transaction) => {
  const bookingIds = (series.items || []).map((item) => item.booking_id);

  if (bookingIds.length > 0) {
    await series.sequelize.models.Booking.update(
      { status },
      {
        where: { id: bookingIds },
        transaction,
      }
    );
  }

  await series.sequelize.models.RecurringBookingItem.update(
    { item_status: itemStatus },
    {
      where: { series_id: series.id },
      transaction,
    }
  );
};

async function loadSeriesForReview(db, seriesId, transaction) {
  return db.RecurringBookingSeries.findByPk(seriesId, {
    include: [
      { model: db.Stadium, as: 'stadium', attributes: ['id', 'name', 'owner_id'] },
      { model: db.User, as: 'user', attributes: ['id', 'name'] },
      { model: db.RecurringBookingItem, as: 'items', attributes: ['id', 'booking_id'] },
    ],
    transaction,
  });
}

async function approveRecurringBookingSeries(db, { seriesId, ownerId }) {
  const transaction = await db.sequelize.transaction();

  try {
    const series = await loadSeriesForReview(db, seriesId, transaction);
    assertOwnerCanReviewSeries(series, ownerId);

    await series.update(
      { approval_status: SERIES_APPROVAL_STATUS.APPROVED },
      { transaction }
    );

    await db.Booking.update(
      { status: 'confirmed' },
      {
        where: {
          recurring_series_id: series.id,
        },
        transaction,
      }
    );

    await db.RecurringBookingItem.update(
      { item_status: RECURRING_ITEM_STATUS.CONFIRMED },
      {
        where: { series_id: series.id },
        transaction,
      }
    );

    await createNotification(
      {
        userId: series.user_id,
        content: 'Chuoi dat san dinh ky cua ban da duoc chu san duyet',
        type: 'recurring_booking_approved',
        targetType: 'recurring_series',
        targetId: series.id,
        targetRoute: '/recurring-bookings',
      },
      { transaction }
    );

    await transaction.commit();
    return series;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

async function rejectRecurringBookingSeries(db, { seriesId, ownerId }) {
  const transaction = await db.sequelize.transaction();

  try {
    const series = await loadSeriesForReview(db, seriesId, transaction);
    assertOwnerCanReviewSeries(series, ownerId);

    await series.update(
      { approval_status: SERIES_APPROVAL_STATUS.REJECTED },
      { transaction }
    );

    await db.Booking.update(
      { status: 'rejected' },
      {
        where: {
          recurring_series_id: series.id,
        },
        transaction,
      }
    );

    await db.RecurringBookingItem.update(
      { item_status: RECURRING_ITEM_STATUS.REJECTED },
      {
        where: { series_id: series.id },
        transaction,
      }
    );

    await createNotification(
      {
        userId: series.user_id,
        content: 'Yeu cau dat san dinh ky cua ban da bi tu choi',
        type: 'recurring_booking_rejected',
        targetType: 'recurring_series',
        targetId: series.id,
        targetRoute: '/recurring-bookings',
      },
      { transaction }
    );

    await transaction.commit();
    return series;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

const buildReminderWindow = (today) => {
  const date = today ? new Date(today) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
};

async function processRecurringPaymentReminders(db, today = new Date()) {
  const { start, end } = buildReminderWindow(today);
  const scheduledDate = formatDateOnly(start);

  const dueItems = await db.RecurringBookingItem.findAll({
    where: {
      payment_due_date: scheduledDate,
      remaining_amount: { [Op.gt]: 0 },
      item_status: {
        [Op.notIn]: [RECURRING_ITEM_STATUS.REJECTED, RECURRING_ITEM_STATUS.CANCELLED],
      },
    },
    include: [
      {
        model: db.RecurringBookingSeries,
        as: 'series',
        include: [{ model: db.Stadium, as: 'stadium', attributes: ['owner_id'] }],
      },
    ],
  });

  let sent = 0;
  for (const item of dueItems) {
    const existingReminder = await db.Notification.findOne({
      where: {
        type: 'recurring_payment_reminder',
        target_type: 'recurring_booking_item',
        target_id: String(item.id),
        createdAt: {
          [Op.between]: [start, end],
        },
      },
    });

    if (existingReminder) {
      continue;
    }

    const ownerId = item.series?.stadium?.owner_id;
    const userId = item.series?.user_id;
    const content = `Sap den han thanh toan cho buoi dinh ky ngay ${item.scheduled_date}.`;

    if (userId) {
      await createNotification({
        userId,
        content,
        type: 'recurring_payment_reminder',
        targetType: 'recurring_booking_item',
        targetId: item.id,
        targetRoute: '/recurring-bookings',
      });
      sent += 1;
    }

    if (ownerId) {
      await createNotification({
        userId: ownerId,
        content,
        type: 'recurring_payment_reminder',
        targetType: 'recurring_booking_item',
        targetId: item.id,
        targetRoute: '/owner/recurring-requests',
      });
      sent += 1;
    }
  }

  return sent;
}

module.exports = {
  AUTO_APPROVE_DEPOSIT_PERCENT,
  MINIMUM_DEPOSIT_PERCENT,
  validateDepositAmount,
  resolveApprovalStatus,
  buildWeeklyOccurrences,
  buildMonthlyOccurrences,
  previewRecurringBooking,
  createRecurringBookingSeries,
  listRecurringBookingsForUser,
  listRecurringBookingsForOwner,
  approveRecurringBookingSeries,
  rejectRecurringBookingSeries,
  suggestAlternativesForWeek,
  processRecurringPaymentReminders,
};
