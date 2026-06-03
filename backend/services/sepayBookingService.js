const { Op } = require('sequelize');

const MATCHED_STATUSES = {
  MATCHED: 'matched',
  MISMATCHED: 'mismatched',
  UNMATCHED: 'unmatched',
  DUPLICATE: 'duplicate',
  INELIGIBLE: 'ineligible',
  IGNORED: 'ignored',
};

const ELIGIBLE_BOOKING_STATUSES = new Set(['pending']);
const INCOMING_TRANSFER_TYPES = new Set(['in', 'incoming', 'credit']);
const OUTGOING_TRANSFER_TYPES = new Set(['out', 'outgoing', 'debit']);
const PAYMENT_REFERENCE_PATTERN = /\b(?:BK\d+|FO\d+(?:-\d+)?)\b/gi;

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeReferenceToken(value) {
  return normalizeString(value).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function getPayloadField(payload, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = payload?.[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function normalizeTransferType(payload) {
  const value = normalizeString(
    getPayloadField(payload, ['transferType', 'transfer_type', 'type'])
  ).toLowerCase();

  if (!value) return null;
  if (INCOMING_TRANSFER_TYPES.has(value)) return 'incoming';
  if (OUTGOING_TRANSFER_TYPES.has(value)) return 'outgoing';
  return value;
}

function normalizeTransactionId(payload) {
  const rawId = getPayloadField(payload, [
    'id',
    'transactionId',
    'transaction_id',
    'reference',
    'reference_id',
  ]);

  return normalizeString(rawId);
}

function normalizeTransferAmount(payload) {
  const rawAmount = getPayloadField(payload, [
    'transferAmount',
    'transfer_amount',
    'amount',
    'transferValue',
  ]);

  return Math.round(toNumber(rawAmount));
}

function normalizeTransferContent(payload) {
  return normalizeString(
    getPayloadField(payload, [
      'transferContent',
      'transfer_content',
      'content',
      'description',
    ])
  );
}

function normalizeTransactionDate(payload, now = new Date()) {
  const rawDate = getPayloadField(payload, ['transactionDate', 'transaction_date', 'createdAt']);
  if (!rawDate) return now;

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? now : parsed;
}

function extractPaymentReference(payload) {
  const candidates = [
    getPayloadField(payload, ['code', 'paymentCode', 'payment_code', 'reference_code']),
    normalizeTransferContent(payload),
  ];

  for (const candidate of candidates) {
    const text = normalizeString(candidate);
    if (!text) continue;

    const matches = [...text.matchAll(PAYMENT_REFERENCE_PATTERN)].map((match) => match[0].toUpperCase());
    if (matches.length === 0) {
      continue;
    }

    const foodOrderReference = matches.find((match) => /^FO\d+-\d+$/i.test(match));
    if (foodOrderReference) {
      return foodOrderReference;
    }

    return matches[0];
  }

  return null;
}

function buildReceiptPayload({
  providerTransactionId,
  bookingId = null,
  foodOrderId = null,
  paymentReference = null,
  transferAmount,
  transferContent,
  matchedStatus,
  matchedReason = null,
  payload,
  receivedAt,
}) {
  return {
    provider: 'sepay',
    provider_transaction_id: providerTransactionId,
    booking_id: bookingId,
    food_order_id: foodOrderId,
    payment_reference: paymentReference,
    transfer_amount: transferAmount,
    transfer_content: transferContent,
    matched_status: matchedStatus,
    matched_reason: matchedReason,
    raw_payload: JSON.stringify(payload),
    received_at: receivedAt,
  };
}

function isBookingReference(reference) {
  return /^BK\d+$/i.test(normalizeString(reference));
}

function isFoodOrderReference(reference) {
  return /^FO\d+(?:-\d+)?$/i.test(normalizeString(reference));
}

async function findFoodOrderByReference(db, paymentReference, transaction) {
  if (!paymentReference || !isFoodOrderReference(paymentReference)) {
    return null;
  }

  const exactMatch = await db.FoodOrder.findOne({
    where: { payment_reference: paymentReference },
    include: [
      {
        model: db.Booking,
        as: 'booking',
        include: [
          {
            model: db.Field,
            as: 'field',
            include: [
              {
                model: db.Stadium,
                as: 'stadium',
              },
            ],
          },
        ],
      },
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedReference = normalizeReferenceToken(paymentReference);
  const candidates = await db.FoodOrder.findAll({
    where: {
      payment_status: 'unpaid',
      payment_reference: {
        [Op.like]: 'FO%',
      },
    },
    include: [
      {
        model: db.Booking,
        as: 'booking',
        include: [
          {
            model: db.Field,
            as: 'field',
            include: [
              {
                model: db.Stadium,
                as: 'stadium',
              },
            ],
          },
        ],
      },
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  return (
    candidates.find(
      (candidate) => normalizeReferenceToken(candidate.payment_reference) === normalizedReference
    ) || null
  );
}

function isEligibleBooking(booking, now = new Date()) {
  if (!booking) {
    return { eligible: false, reason: 'booking_not_found' };
  }

  if (!ELIGIBLE_BOOKING_STATUSES.has(booking.status)) {
    return { eligible: false, reason: `booking_status_${booking.status}` };
  }

  if (booking.payment_status !== 'unpaid') {
    return { eligible: false, reason: `booking_payment_status_${booking.payment_status}` };
  }

  if (booking.hold_until && new Date(booking.hold_until).getTime() < now.getTime()) {
    return { eligible: false, reason: 'booking_hold_expired' };
  }

  return { eligible: true, reason: null };
}

async function saveReceipt(db, receiptPayload, transaction) {
  return db.BookingPaymentReceipt.create(
    receiptPayload,
    transaction ? { transaction } : undefined
  );
}

async function reconcileSePayBookingTransfer({
  db,
  payload,
  notify = async () => {},
  emitSlotConfirmed = () => {},
  now = new Date(),
}) {
  const providerTransactionId =
    normalizeTransactionId(payload) ||
    `sepay-${normalizeTransferAmount(payload)}-${extractPaymentReference(payload) || 'unknown'}-${now.getTime()}`;
  const transferAmount = normalizeTransferAmount(payload);
  const transferContent = normalizeTransferContent(payload);
  const paymentReference = extractPaymentReference(payload);
  const receivedAt = normalizeTransactionDate(payload, now);
  const normalizedTransferType = normalizeTransferType(payload);

  const duplicatedReceipt = await db.BookingPaymentReceipt.findOne({
    where: {
      provider: 'sepay',
      provider_transaction_id: providerTransactionId,
    },
  });

  if (duplicatedReceipt) {
    return { status: 'duplicate', receipt: duplicatedReceipt };
  }

  if (normalizedTransferType === 'outgoing') {
    const receipt = await saveReceipt(
      db,
      buildReceiptPayload({
        providerTransactionId,
        paymentReference,
        transferAmount,
        transferContent,
        matchedStatus: MATCHED_STATUSES.IGNORED,
        matchedReason: 'outgoing_transfer',
        payload,
        receivedAt,
      })
    );

    return { status: 'ignored', receipt };
  }

  return db.sequelize.transaction(async (transaction) => {
    let booking = null;
    let foodOrder = null;

    if (paymentReference && isBookingReference(paymentReference)) {
      booking = await db.Booking.findOne({
        where: { payment_reference: paymentReference },
        include: [
          {
            model: db.Field,
            as: 'field',
            include: [
              {
                model: db.Stadium,
                as: 'stadium',
              },
            ],
          },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
    }

    if (paymentReference && isFoodOrderReference(paymentReference)) {
      foodOrder = await findFoodOrderByReference(db, paymentReference, transaction);
    }

    if (!booking && !foodOrder) {
      const receipt = await saveReceipt(
        db,
        buildReceiptPayload({
          providerTransactionId,
          paymentReference,
          transferAmount,
          transferContent,
          matchedStatus: MATCHED_STATUSES.UNMATCHED,
          matchedReason: paymentReference ? 'booking_not_found' : 'payment_reference_missing',
          payload,
          receivedAt,
        }),
        transaction
      );

      return { status: 'unmatched', receipt };
    }

    if (foodOrder) {
      if (foodOrder.payment_status !== 'unpaid') {
        const receipt = await saveReceipt(
          db,
          buildReceiptPayload({
            providerTransactionId,
            foodOrderId: foodOrder.id,
            paymentReference,
            transferAmount,
            transferContent,
            matchedStatus: MATCHED_STATUSES.INELIGIBLE,
            matchedReason: `food_order_payment_status_${foodOrder.payment_status}`,
            payload,
            receivedAt,
          }),
          transaction
        );

        return { status: 'ineligible', receipt, foodOrder };
      }

      const expectedAmount = Math.round(toNumber(foodOrder.total_amount));
      if (transferAmount !== expectedAmount) {
        const receipt = await saveReceipt(
          db,
          buildReceiptPayload({
            providerTransactionId,
            foodOrderId: foodOrder.id,
            paymentReference,
            transferAmount,
            transferContent,
            matchedStatus: MATCHED_STATUSES.MISMATCHED,
            matchedReason: `expected_${expectedAmount}_received_${transferAmount}`,
            payload,
            receivedAt,
          }),
          transaction
        );

        return { status: 'mismatched', receipt, foodOrder };
      }

      foodOrder.payment_status = 'paid';
      foodOrder.payment_method = 'sepay';
      foodOrder.payment_recorded_at = receivedAt;
      await foodOrder.save({ transaction });

      const receipt = await saveReceipt(
        db,
        buildReceiptPayload({
          providerTransactionId,
          bookingId: foodOrder.booking_id,
          foodOrderId: foodOrder.id,
          paymentReference,
          transferAmount,
          transferContent,
          matchedStatus: MATCHED_STATUSES.MATCHED,
          matchedReason: null,
          payload,
          receivedAt,
        }),
        transaction
      );

      await notify({
        userId: foodOrder.user_id,
        content: `He thong da xac nhan thanh toan cho order mon #${foodOrder.id}.`,
        type: 'food_order_payment_confirmed',
        targetType: 'food_order',
        targetId: foodOrder.id,
        targetRoute: `/history/${foodOrder.booking_id}`,
      });

      const ownerId = foodOrder.booking?.field?.stadium?.owner_id;
      if (ownerId) {
        await notify({
          userId: ownerId,
          content: `Order mon #${foodOrder.id} da duoc he thong xac nhan thanh toan SePay.`,
          type: 'food_order_paid',
          targetType: 'food_order',
          targetId: foodOrder.id,
          targetRoute: `/owner/fields/${foodOrder.field_id}/food-orders`,
        });
      }

      return { status: 'confirmed', receipt, foodOrder };
    }

    const eligibility = isEligibleBooking(booking, now);
    if (!eligibility.eligible) {
      const receipt = await saveReceipt(
        db,
        buildReceiptPayload({
          providerTransactionId,
          bookingId: booking.id,
          paymentReference,
          transferAmount,
          transferContent,
          matchedStatus: MATCHED_STATUSES.INELIGIBLE,
          matchedReason: eligibility.reason,
          payload,
          receivedAt,
        }),
        transaction
      );

      return { status: 'ineligible', receipt, booking };
    }

    const expectedAmount = Math.round(toNumber(booking.amount_paid));
    if (transferAmount !== expectedAmount) {
      const receipt = await saveReceipt(
        db,
        buildReceiptPayload({
          providerTransactionId,
          bookingId: booking.id,
          paymentReference,
          transferAmount,
          transferContent,
          matchedStatus: MATCHED_STATUSES.MISMATCHED,
          matchedReason: `expected_${expectedAmount}_received_${transferAmount}`,
          payload,
          receivedAt,
        }),
        transaction
      );

      return { status: 'mismatched', receipt, booking };
    }

    booking.payment_status = booking.payment_type === 'deposit' ? 'partially_paid' : 'paid';
    booking.status = 'confirmed';
    booking.payment_method = 'sepay';
    booking.payment_recorded_at = receivedAt;
    booking.hold_until = null;

    await booking.save({ transaction });

    await db.FoodOrder.update(
      {
        payment_status: 'paid',
        payment_method: 'sepay',
        payment_recorded_at: receivedAt,
      },
      {
        where: {
          booking_id: booking.id,
          order_source: 'booking_checkout',
          payment_status: 'unpaid',
        },
        transaction,
      }
    );

    const receipt = await saveReceipt(
      db,
      buildReceiptPayload({
        providerTransactionId,
        bookingId: booking.id,
        paymentReference,
        transferAmount,
        transferContent,
        matchedStatus: MATCHED_STATUSES.MATCHED,
        matchedReason: null,
        payload,
        receivedAt,
      }),
      transaction
    );

    await notify({
      userId: booking.user_id,
      content:
        booking.payment_status === 'partially_paid'
          ? 'He thong da xac nhan coc 50% qua SePay va tu dong xac nhan don dat san.'
          : 'He thong da xac nhan thanh toan qua SePay va tu dong xac nhan don dat san.',
      type: 'booking_payment_confirmed',
      targetType: 'booking',
      targetId: booking.id,
      targetRoute: '/history',
    });

    const ownerId = booking.field?.stadium?.owner_id;
    if (ownerId) {
      await notify({
        userId: ownerId,
        content: `Don dat san #${booking.id} da duoc he thong tu dong xac nhan thanh toan SePay.`,
        type: 'booking_auto_confirmed',
        targetType: 'booking',
        targetId: booking.id,
        targetRoute: '/owner/bookings',
      });
    }

    emitSlotConfirmed({
      field_id: booking.field_id,
      date: booking.booking_date,
      start_time: booking.start_time,
    });

    return { status: 'confirmed', receipt, booking };
  });
}

module.exports = {
  MATCHED_STATUSES,
  extractPaymentReference,
  findFoodOrderByReference,
  reconcileSePayBookingTransfer,
};
