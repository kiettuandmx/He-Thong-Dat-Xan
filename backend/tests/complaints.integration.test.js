const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'development';
process.env.SKIP_AUTO_SYNC = 'true';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('../models');
const { createApp } = require('../app');
const socket = require('../socket');

const createdIds = {
  locations: [],
  users: [],
  stadiums: [],
  fields: [],
  bookings: [],
  complaints: [],
};

let server;
let baseUrl;
let userToken;
let adminToken;
let bookingId;
let complaintId;
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

test.before(async () => {
  await db.sequelize.authenticate();

  await db.Role.findOrCreate({ where: { id: 1 }, defaults: { id: 1, role_name: 'user' } });
  await db.Role.findOrCreate({ where: { id: 2 }, defaults: { id: 2, role_name: 'owner' } });
  await db.Role.findOrCreate({ where: { id: 3 }, defaults: { id: 3, role_name: 'admin' } });

  const suffix = Date.now();

  const location = await db.Location.create({
    address: `Integration Test Address ${suffix}`,
    district: 'District 1',
    city: 'HCMC',
  });
  createdIds.locations.push(location.id);

  const owner = await db.User.create({
    name: `Owner ${suffix}`,
    email: `owner-${suffix}@example.com`,
    password: 'secret',
    phone: '0900000001',
    role_id: 2,
  });
  createdIds.users.push(owner.id);

  playerUser = await db.User.create({
    name: `Player ${suffix}`,
    email: `player-${suffix}@example.com`,
    password: 'secret',
    phone: '0900000002',
    role_id: 1,
  });
  createdIds.users.push(playerUser.id);

  adminUser = await db.User.create({
    name: `Admin ${suffix}`,
    email: `admin-${suffix}@example.com`,
    password: 'secret',
    phone: '0900000003',
    role_id: 3,
  });
  createdIds.users.push(adminUser.id);

  const stadium = await db.Stadium.create({
    name: `Integration Stadium ${suffix}`,
    description: 'Created by test',
    owner_id: owner.id,
    location_id: location.id,
    status: 'active',
  });
  createdIds.stadiums.push(stadium.id);

  const field = await db.Field.create({
    stadium_id: stadium.id,
    name: `Field ${suffix}`,
    type: 'Football',
    price_per_hour: 250000,
    status: 'available',
  });
  createdIds.fields.push(field.id);

  const booking = await db.Booking.create({
    user_id: playerUser.id,
    field_id: field.id,
    stadium_id: stadium.id,
    booking_date: '2026-05-12',
    start_time: '08:00:00',
    end_time: '09:00:00',
    total_price: 250000,
    amount_paid: 250000,
    payment_type: 'full',
    payment_status: 'paid',
    payment_method: 'Online',
    status: 'pending',
  });
  createdIds.bookings.push(booking.id);
  bookingId = booking.id;

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

  if (createdIds.complaints.length) {
    await db.ComplaintAction.destroy({ where: { complaint_id: createdIds.complaints } });
    await db.AdminActivityLog.destroy({
      where: {
        target_type: 'complaint',
        target_id: createdIds.complaints.map(String),
      },
    });
    await db.Complaint.destroy({ where: { id: createdIds.complaints } });
  }

  if (createdIds.bookings.length) {
    await db.AdminActivityLog.destroy({
      where: {
        target_type: 'booking',
        target_id: createdIds.bookings.map(String),
      },
    });
    await db.Booking.destroy({ where: { id: createdIds.bookings } });
  }

  if (createdIds.users.length) {
    await db.WalletTransaction.destroy({ where: { user_id: createdIds.users } });
    await db.Wallet.destroy({ where: { user_id: createdIds.users } });
  }

  if (createdIds.fields.length) {
    await db.Field.destroy({ where: { id: createdIds.fields } });
  }

  if (createdIds.stadiums.length) {
    await db.AdminActivityLog.destroy({
      where: {
        target_type: 'stadium',
        target_id: createdIds.stadiums.map(String),
      },
    });
    await db.Stadium.destroy({ where: { id: createdIds.stadiums } });
  }

  if (createdIds.locations.length) {
    await db.Location.destroy({ where: { id: createdIds.locations } });
  }

  if (createdIds.users.length) {
    await db.Notification.destroy({ where: { user_id: createdIds.users } });
    await db.AdminActivityLog.destroy({ where: { admin_id: createdIds.users } });
    await db.User.destroy({ where: { id: createdIds.users } });
  }

  await db.sequelize.close();
});

test('user can create a complaint for own paid booking', async () => {
  const response = await api('/api/complaints', {
    method: 'POST',
    headers: authHeader(userToken),
    body: JSON.stringify({
      booking_id: bookingId,
      reason: 'San khong dung mo ta',
      evidence_urls: ['https://example.com/evidence-1.jpg'],
    }),
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.booking_id, bookingId);
  assert.equal(response.body.data.status, 'pending');

  complaintId = response.body.data.id;
  createdIds.complaints.push(complaintId);

  const complaintAction = await db.ComplaintAction.findOne({
    where: { complaint_id: complaintId, action: 'COMPLAINT_CREATED' },
  });
  assert.ok(complaintAction);

  const activityLog = await db.AdminActivityLog.findOne({
    where: { action: 'USER_CREATE_COMPLAINT', target_type: 'complaint', target_id: String(complaintId) },
  });
  assert.ok(activityLog);
});

test('duplicate open complaint for the same booking is rejected', async () => {
  const response = await api('/api/complaints', {
    method: 'POST',
    headers: authHeader(userToken),
    body: JSON.stringify({
      booking_id: bookingId,
      reason: 'Tao trung khieu nai',
    }),
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
});

test('non-admin cannot access admin complaint list', async () => {
  const response = await api('/api/complaints/admin/all', {
    method: 'GET',
    headers: authHeader(userToken),
  });

  assert.equal(response.status, 403);
});

test('admin can read complaint list and see the created complaint', async () => {
  const response = await api('/api/complaints/admin/all', {
    method: 'GET',
    headers: authHeader(adminToken),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.some((item) => item.id === complaintId));
});

test('admin refunding a complaint credits the customer wallet', async () => {
  const response = await api(`/api/complaints/admin/${complaintId}/resolve`, {
    method: 'POST',
    headers: authHeader(adminToken),
    body: JSON.stringify({
      resolution_type: 'refund_user',
      resolution_note: 'Admin test refund from complaint',
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  const updatedBooking = await db.Booking.findByPk(bookingId);
  assert.equal(updatedBooking.status, 'refunded');

  const wallet = await db.Wallet.findOne({ where: { user_id: playerUser.id } });
  assert.ok(wallet);
  assert.equal(Number(wallet.balance), 250000);

  const walletTransaction = await db.WalletTransaction.findOne({
    where: {
      user_id: playerUser.id,
      booking_id: bookingId,
      reference_type: 'complaint_refund',
      reference_id: complaintId,
    },
  });
  assert.ok(walletTransaction);
  assert.equal(walletTransaction.type, 'BOOKING_REFUND');
  assert.equal(Number(walletTransaction.amount), 250000);
});
