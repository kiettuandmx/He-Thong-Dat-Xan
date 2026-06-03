const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildFoodOrderTotal,
  assertBookingOrderWindow,
  advanceFoodOrderStatus,
  createMenuItem,
  listStadiumMenu,
  updateMenuItemByOwner,
  deleteMenuItemByOwner,
  setMenuItemAvailabilityByOwner,
} = require('../utils/foodOrderService');

test('buildFoodOrderTotal snapshots menu prices into line totals', () => {
  const result = buildFoodOrderTotal([
    { id: 1, price: 15000, quantity: 2 },
    { id: 2, price: 25000, quantity: 1 },
  ]);

  assert.equal(result.totalAmount, 55000);
  assert.equal(result.items[0].lineTotal, 30000);
  assert.equal(result.items[1].lineTotal, 25000);
});

test('assertBookingOrderWindow rejects ordering after booking end time has passed', () => {
  assert.throws(
    () =>
      assertBookingOrderWindow({
        bookingDate: '2026-05-20',
        endTime: '19:00:00',
        now: new Date('2026-05-20T19:30:00'),
      }),
    /FOOD_ORDER_WINDOW_CLOSED/
  );
});

test('assertBookingOrderWindow allows ordering before the booking start time as long as the end time has not passed', () => {
  assert.doesNotThrow(() =>
    assertBookingOrderWindow({
      bookingDate: '2026-05-20',
      endTime: '19:00:00',
      now: new Date('2026-05-20T14:30:00'),
    })
  );
});

test('advanceFoodOrderStatus allows pending to preparing then delivered', () => {
  assert.equal(advanceFoodOrderStatus('pending', 'preparing'), 'preparing');
  assert.equal(advanceFoodOrderStatus('preparing', 'delivered'), 'delivered');
});

test('listStadiumMenu returns shared stadium menu for the selected stadium', async () => {
  const stadium = {
    id: 21,
    owner_id: 8,
  };
  const rows = [{ id: 11, stadium_id: 21, name: 'Pepsi', price: 15000 }];
  const db = {
    Stadium: {
      findByPk: async () => stadium,
    },
    MenuItem: {
      findAll: async ({ where }) => {
        assert.equal(where.stadium_id, 21);
        return rows;
      },
    },
  };

  const result = await listStadiumMenu(db, 21);
  assert.deepEqual(result, rows);
});

test('createMenuItem stores stadium_id for shared stadium menu', async () => {
  const created = [];
  const db = {
    Stadium: {
      findByPk: async () => ({
        id: 21,
        owner_id: 8,
      }),
    },
    MenuItem: {
      create: async (payload) => {
        created.push(payload);
        return { id: 99, ...payload };
      },
    },
  };

  await createMenuItem(db, {
    stadiumId: 21,
    ownerId: 8,
    role: 2,
    name: '7 Up',
    price: 12000,
    image: 'https://cdn.example.com/7up.png',
    isAvailable: true,
  });

  assert.equal(created[0].stadium_id, 21);
  assert.equal(created[0].name, '7 Up');
});

test('updateMenuItemByOwner updates shared menu item fields', async () => {
  const menuItem = {
    id: 15,
    owner_id: 8,
    name: 'Pepsi',
    price: 15000,
    image: null,
    is_available: true,
    async update(payload) {
      Object.assign(this, payload);
      return this;
    },
  };
  const db = {
    MenuItem: {
      findByPk: async () => menuItem,
    },
  };

  const result = await updateMenuItemByOwner(db, {
    menuItemId: 15,
    ownerId: 8,
    role: 2,
    name: 'Pepsi Lon',
    price: 18000,
    image: 'https://cdn.example.com/pepsi.png',
  });

  assert.equal(result.name, 'Pepsi Lon');
  assert.equal(result.price, 18000);
  assert.equal(result.image, 'https://cdn.example.com/pepsi.png');
});

test('setMenuItemAvailabilityByOwner toggles shared menu availability', async () => {
  const menuItem = {
    id: 15,
    owner_id: 8,
    is_available: true,
    async update(payload) {
      Object.assign(this, payload);
      return this;
    },
  };
  const db = {
    MenuItem: {
      findByPk: async () => menuItem,
    },
  };

  const result = await setMenuItemAvailabilityByOwner(db, {
    menuItemId: 15,
    ownerId: 8,
    role: 2,
    isAvailable: false,
  });

  assert.equal(result.is_available, false);
});

test('deleteMenuItemByOwner removes shared menu item', async () => {
  let destroyed = false;
  const menuItem = {
    id: 15,
    owner_id: 8,
    async destroy() {
      destroyed = true;
    },
  };
  const db = {
    MenuItem: {
      findByPk: async () => menuItem,
    },
  };

  const result = await deleteMenuItemByOwner(db, {
    menuItemId: 15,
    ownerId: 8,
    role: 2,
  });

  assert.equal(result.id, 15);
  assert.equal(destroyed, true);
});
