const { Op } = require('sequelize');

const {
  FOOD_ORDER_STATUS,
  FOOD_ORDER_PAYMENT_STATUS,
} = require('./foodOrderTypes');
const { createNotification } = require('./notificationHelper');
const { applyWalletTransaction } = require('./walletService');
const { WALLET_TRANSACTION_TYPES } = require('./walletTypes');

const toAmount = (value) => Number(value || 0);
const FOOD_ORDER_SOURCE = {
  BOOKING_CHECKOUT: 'booking_checkout',
  POST_BOOKING: 'post_booking',
};
const FOOD_ORDER_FULFILLMENT = {
  PICKUP_AT_FIELD: 'pickup_at_field',
};

const normalizeTimeValue = (value) => {
  if (!value) return '00:00:00';
  return String(value).length === 5 ? `${value}:00` : String(value);
};

const buildFoodOrderTotal = (rows) => {
  const items = rows.map((row) => {
    const unitPrice = toAmount(row.price);
    const quantity = Number(row.quantity || 0);

    return {
      menuItemId: row.id,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

  return {
    items,
    totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
};

const assertBookingOrderWindow = ({ bookingDate, endTime, now = new Date() }) => {
  const boundary = new Date(`${bookingDate}T${normalizeTimeValue(endTime)}`);
  if (now > boundary) {
    throw new Error('FOOD_ORDER_WINDOW_CLOSED');
  }
};

const TRANSITION_MAP = {
  [FOOD_ORDER_STATUS.PENDING]: [FOOD_ORDER_STATUS.PREPARING],
  [FOOD_ORDER_STATUS.PREPARING]: [FOOD_ORDER_STATUS.DELIVERED],
  [FOOD_ORDER_STATUS.DELIVERED]: [],
};

const advanceFoodOrderStatus = (currentStatus, nextStatus) => {
  if (!TRANSITION_MAP[currentStatus]?.includes(nextStatus)) {
    throw new Error('INVALID_FOOD_ORDER_STATUS_TRANSITION');
  }

  return nextStatus;
};

const normalizeMenuItems = (menuItems, requestedItems) => {
  const requestedById = new Map(
    requestedItems.map((item) => [Number(item.menu_item_id || item.menuItemId), Number(item.quantity || 0)])
  );

  return menuItems.map((menuItem) => ({
    id: menuItem.id,
    price: menuItem.price,
    quantity: requestedById.get(Number(menuItem.id)) || 0,
  }));
};

const resolveFoodOrderPaymentStatus = (paymentMethod) => {
  const normalized = String(paymentMethod || '').trim().toLowerCase();
  if (['wallet', 'vnpay', 'momo'].includes(normalized)) {
    return FOOD_ORDER_PAYMENT_STATUS.PAID;
  }
  return FOOD_ORDER_PAYMENT_STATUS.UNPAID;
};

async function resolveBookingAndMenuItems(db, { bookingId, userId, role, items, transaction }) {
  const booking = await db.Booking.findByPk(bookingId, {
    include: {
      model: db.Field,
      as: 'field',
      include: { model: db.Stadium, as: 'stadium' },
    },
    transaction,
  });
  ensureBookingOwnership(booking, userId, role);
  assertBookingOrderWindow({
    bookingDate: booking.booking_date,
    endTime: booking.end_time,
  });

  const menuItems = await db.MenuItem.findAll({
    where: {
      field_id: booking.field_id,
      id: { [Op.in]: items.map((item) => Number(item.menu_item_id || item.menuItemId)) },
      is_available: true,
    },
    transaction,
  });

  if (menuItems.length !== items.length) {
    throw new Error('MENU_ITEM_UNAVAILABLE');
  }

  return { booking, menuItems };
}

const ensureBookingOwnership = (booking, userId, role) => {
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  if (Number(role) === 3) return;
  if (Number(booking.user_id) !== Number(userId)) {
    throw new Error('FORBIDDEN_FOOD_ORDER_ACCESS');
  }
};

const ensureFieldOwnerAccess = (field, ownerId, role) => {
  if (!field) throw new Error('FIELD_NOT_FOUND');
  if (Number(role) === 3) return;
  if (Number(field.stadium?.owner_id) !== Number(ownerId)) {
    throw new Error('FORBIDDEN_FOOD_ORDER_ACCESS');
  }
};

async function createMenuItem(db, { fieldId, ownerId, role, name, price, image, isAvailable }) {
  const field = await db.Field.findByPk(fieldId, {
    include: { model: db.Stadium, as: 'stadium' },
  });
  ensureFieldOwnerAccess(field, ownerId, role);

  return db.MenuItem.create({
    field_id: fieldId,
    name,
    price,
    image: image || null,
    is_available: isAvailable !== false,
  });
}

async function listFieldMenu(db, fieldId) {
  return db.MenuItem.findAll({
    where: { field_id: fieldId },
    order: [['createdAt', 'DESC']],
  });
}

async function createFoodOrderForBooking(db, { bookingId, userId, role, items, paymentMethod }) {
  const transaction = await db.sequelize.transaction();

  try {
    const { booking, menuItems } = await resolveBookingAndMenuItems(db, {
      bookingId,
      userId,
      role,
      items,
      transaction,
    });

    const totals = buildFoodOrderTotal(normalizeMenuItems(menuItems, items));
    const normalizedPaymentMethod = 'counter';

    const foodOrder = await db.FoodOrder.create(
      {
        booking_id: booking.id,
        user_id: booking.user_id,
        field_id: booking.field_id,
        status: FOOD_ORDER_STATUS.PENDING,
        total_amount: totals.totalAmount,
        payment_method: normalizedPaymentMethod,
        payment_status: FOOD_ORDER_PAYMENT_STATUS.UNPAID,
        order_source: FOOD_ORDER_SOURCE.POST_BOOKING,
        fulfillment_method: FOOD_ORDER_FULFILLMENT.PICKUP_AT_FIELD,
        ordered_at: new Date(),
      },
      { transaction }
    );

    for (const item of totals.items) {
      // eslint-disable-next-line no-await-in-loop
      await db.FoodOrderItem.create(
        {
          food_order_id: foodOrder.id,
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
        },
        { transaction }
      );
    }

    if (booking.field?.stadium?.owner_id) {
      await createNotification(
        {
          userId: booking.field.stadium.owner_id,
          content: 'Ban co order do an moi tai san',
          type: 'food_order_created',
          targetType: 'food_order',
          targetId: foodOrder.id,
          targetRoute: `/owner/fields/${booking.field_id}/food-orders`,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return foodOrder;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

async function createCheckoutFoodOrder(db, { bookingId, userId, role, items, paymentMethod, transaction }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const { booking, menuItems } = await resolveBookingAndMenuItems(db, {
    bookingId,
    userId,
    role,
    items,
    transaction,
  });

  const totals = buildFoodOrderTotal(normalizeMenuItems(menuItems, items));
  const normalizedPaymentMethod = String(paymentMethod || '').trim().toLowerCase() || 'vnpay';
  const paymentStatus = resolveFoodOrderPaymentStatus(normalizedPaymentMethod);

  const foodOrder = await db.FoodOrder.create(
    {
      booking_id: booking.id,
      user_id: booking.user_id,
      field_id: booking.field_id,
      status: FOOD_ORDER_STATUS.PENDING,
      total_amount: totals.totalAmount,
      payment_method: normalizedPaymentMethod,
      payment_status: paymentStatus,
      order_source: FOOD_ORDER_SOURCE.BOOKING_CHECKOUT,
      fulfillment_method: FOOD_ORDER_FULFILLMENT.PICKUP_AT_FIELD,
      ordered_at: new Date(),
    },
    { transaction }
  );

  for (const item of totals.items) {
    // eslint-disable-next-line no-await-in-loop
    await db.FoodOrderItem.create(
      {
        food_order_id: foodOrder.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      },
      { transaction }
    );
  }

  return { foodOrder, totalAmount: totals.totalAmount };
}

async function listFoodOrdersForBooking(db, { bookingId, userId, role }) {
  const booking = await db.Booking.findByPk(bookingId);
  ensureBookingOwnership(booking, userId, role);

  return db.FoodOrder.findAll({
    where: { booking_id: bookingId },
    include: [
      {
        model: db.FoodOrderItem,
        as: 'items',
        include: [{ model: db.MenuItem, as: 'menuItem' }],
      },
    ],
    order: [['ordered_at', 'DESC']],
  });
}

async function updateFoodOrderStatusByOwner(db, { foodOrderId, ownerId, role, status }) {
  const foodOrder = await db.FoodOrder.findByPk(foodOrderId, {
    include: [
      {
        model: db.Field,
        as: 'field',
        include: { model: db.Stadium, as: 'stadium' },
      },
    ],
  });

  if (!foodOrder) {
    throw new Error('FOOD_ORDER_NOT_FOUND');
  }

  ensureFieldOwnerAccess(foodOrder.field, ownerId, role);

  const nextStatus = advanceFoodOrderStatus(foodOrder.status, status);
  await foodOrder.update({ status: nextStatus });

  if (foodOrder.user_id) {
    await createNotification({
      userId: foodOrder.user_id,
      content: `Order mon #${foodOrder.id} da chuyen sang trang thai ${nextStatus}.`,
      type: 'food_order_status_updated',
      targetType: 'food_order',
      targetId: foodOrder.id,
      targetRoute: '/history',
    });
  }

  return foodOrder;
}

module.exports = {
  FOOD_ORDER_SOURCE,
  FOOD_ORDER_FULFILLMENT,
  buildFoodOrderTotal,
  assertBookingOrderWindow,
  advanceFoodOrderStatus,
  createMenuItem,
  listFieldMenu,
  createCheckoutFoodOrder,
  createFoodOrderForBooking,
  listFoodOrdersForBooking,
  updateFoodOrderStatusByOwner,
};
