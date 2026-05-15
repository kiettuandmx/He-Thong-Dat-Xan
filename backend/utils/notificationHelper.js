const db = require('../models');
const { getIO, userSockets } = require('../socket');

const buildNotificationPayload = ({
  userId,
  title = null,
  content,
  type = null,
  targetType = null,
  targetId = null,
  targetRoute = null,
}) => ({
  user_id: userId,
  title,
  content,
  type,
  target_type: targetType,
  target_id: targetId != null ? String(targetId) : null,
  target_route: targetRoute,
  is_read: false,
});

const emitNotification = (notification) => {
  const userId = notification?.user_id;
  if (!userId) return;

  const socketId = userSockets[userId];
  if (!socketId) return;

  const io = getIO();
  io.to(socketId).emit('newNotification', notification);
};

const createNotification = async (payload, options = {}) => {
  if (!payload?.userId || !payload?.content) return null;

  const notification = await db.Notification.create(
    buildNotificationPayload(payload),
    options.transaction ? { transaction: options.transaction } : undefined
  );

  emitNotification(notification);
  return notification;
};

const createNotificationsForUsers = async (payloads, options = {}) => {
  const validPayloads = (payloads || []).filter((payload) => payload?.userId && payload?.content);
  if (validPayloads.length === 0) return [];

  const notifications = await db.Notification.bulkCreate(
    validPayloads.map(buildNotificationPayload),
    options.transaction ? { transaction: options.transaction } : undefined
  );

  notifications.forEach(emitNotification);
  return notifications;
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
};
