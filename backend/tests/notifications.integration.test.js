const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'development';
process.env.SKIP_AUTO_SYNC = 'true';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('../models');
const { createApp } = require('../app');
const socket = require('../socket');

const createdIds = {
  users: [],
  notifications: [],
};

let server;
let baseUrl;
let userToken;
let adminToken;
let playerUser;
let adminUser;

const api = async (pathname, options = {}) => {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = text;
  }

  return { status: response.status, body };
};

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const ensureNotificationColumns = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('notifications');

  const optionalColumns = [
    ['title', { type: db.Sequelize.STRING(255), allowNull: true }],
    ['type', { type: db.Sequelize.STRING(100), allowNull: true }],
    ['target_type', { type: db.Sequelize.STRING(100), allowNull: true }],
    ['target_id', { type: db.Sequelize.STRING(100), allowNull: true }],
    ['target_route', { type: db.Sequelize.STRING(255), allowNull: true }],
  ];

  for (const [columnName, definition] of optionalColumns) {
    if (!table[columnName]) {
      await queryInterface.addColumn('notifications', columnName, definition);
    }
  }
};

test.before(async () => {
  await db.sequelize.authenticate();
  await ensureNotificationColumns();

  await db.Role.findOrCreate({ where: { id: 1 }, defaults: { id: 1, role_name: 'user' } });
  await db.Role.findOrCreate({ where: { id: 3 }, defaults: { id: 3, role_name: 'admin' } });

  const suffix = Date.now();

  playerUser = await db.User.create({
    name: `Notification User ${suffix}`,
    email: `notification-user-${suffix}@example.com`,
    password: 'secret',
    phone: '0900000101',
    role_id: 1,
  });
  createdIds.users.push(playerUser.id);

  adminUser = await db.User.create({
    name: `Notification Admin ${suffix}`,
    email: `notification-admin-${suffix}@example.com`,
    password: 'secret',
    phone: '0900000102',
    role_id: 3,
  });
  createdIds.users.push(adminUser.id);

  userToken = jwt.sign(
    { id: playerUser.id, role: playerUser.role_id },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '1d' }
  );

  adminToken = jwt.sign(
    { id: adminUser.id, role: adminUser.role_id },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '1d' }
  );

  const app = createApp();
  server = http.createServer(app);
  socket.init(server);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  if (createdIds.notifications.length) {
    await db.Notification.destroy({ where: { id: createdIds.notifications } });
  }

  if (createdIds.users.length) {
    await db.Notification.destroy({ where: { user_id: createdIds.users } });
    await db.AdminActivityLog.destroy({ where: { admin_id: createdIds.users } });
    await db.User.destroy({ where: { id: createdIds.users } });
  }

  await db.sequelize.close();
});

test('notification api returns routing metadata for personalized notifications', async () => {
  const notification = await db.Notification.create({
    user_id: playerUser.id,
    content: 'Thong bao dat san',
    is_read: false,
    type: 'booking_pending',
    target_type: 'booking',
    target_id: '101',
    target_route: '/history',
  });
  createdIds.notifications.push(notification.id);

  const response = await api('/api/bookings/notifications', {
    method: 'GET',
    headers: authHeader(userToken),
  });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.equal(typeof response.body.unreadCount, 'number');

  const notificationFromApi = response.body.items.find((item) => item.id === notification.id);
  assert.ok(notificationFromApi);
  assert.equal(notificationFromApi.target_route, '/history');
  assert.equal(notificationFromApi.target_type, 'booking');
  assert.equal(notificationFromApi.target_id, '101');
  assert.equal(notificationFromApi.type, 'booking_pending');
});

test('notification api limits visible items and reports unread count separately', async () => {
  const suffix = Date.now();

  const freshUser = await db.User.create({
    name: `Notification Limit User ${suffix}`,
    email: `notification-limit-${suffix}@example.com`,
    password: 'secret',
    phone: '0900000103',
    role_id: 1,
  });
  createdIds.users.push(freshUser.id);

  const freshToken = jwt.sign(
    { id: freshUser.id, role: freshUser.role_id },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '1d' }
  );

  const createdNotifications = [];
  for (let index = 0; index < 25; index += 1) {
    const notification = await db.Notification.create({
      user_id: freshUser.id,
      content: `Thong bao ${index}`,
      is_read: index >= 7,
      type: 'booking_pending',
      target_type: 'booking',
      target_id: String(index),
      createdAt: new Date(Date.now() + index * 1000),
      updatedAt: new Date(Date.now() + index * 1000),
    });
    createdNotifications.push(notification.id);
  }
  createdIds.notifications.push(...createdNotifications);

  const response = await api('/api/bookings/notifications?limit=20', {
    method: 'GET',
    headers: authHeader(freshToken),
  });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.equal(response.body.items.length, 20);
  assert.equal(response.body.unreadCount, 7);
});

test('admin global notification creates user-specific notification records', async () => {
  const response = await api('/api/admin/send-global-notification', {
    method: 'POST',
    headers: authHeader(adminToken),
    body: JSON.stringify({
      content: 'Bao tri he thong luc 23h',
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  const createdNotifications = await db.Notification.findAll({
    where: { content: 'Bao tri he thong luc 23h' },
    order: [['id', 'ASC']],
  });

  createdIds.notifications.push(...createdNotifications.map((item) => item.id));

  assert.ok(createdNotifications.length >= 2);
  assert.ok(createdNotifications.every((item) => item.user_id != null));
  assert.ok(createdNotifications.some((item) => item.user_id === playerUser.id));
  assert.ok(createdNotifications.some((item) => item.user_id === adminUser.id));
});

test('login does not create notification records anymore', async () => {
  const suffix = Date.now();
  const password = 'secret123';
  const passwordHash = bcrypt.hashSync(password, 10);

  const loginUser = await db.User.create({
    name: `No Login Notification ${suffix}`,
    email: `no-login-notification-${suffix}@example.com`,
    password: passwordHash,
    phone: '0900000104',
    role_id: 1,
  });
  createdIds.users.push(loginUser.id);

  const beforeCount = await db.Notification.count({ where: { user_id: loginUser.id } });

  const response = await api('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: loginUser.email,
      password,
    }),
  });

  assert.equal(response.status, 200);

  const afterCount = await db.Notification.count({ where: { user_id: loginUser.id } });
  assert.equal(afterCount, beforeCount);
});
