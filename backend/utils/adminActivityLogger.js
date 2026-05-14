const { AdminActivityLog } = require('../models');

const toSafeJson = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return { _note: 'Unable to serialize payload' };
  }
};

const logAdminActivity = async ({
  adminId,
  action,
  targetType = null,
  targetId = null,
  beforeData = null,
  afterData = null,
  ipAddress = null,
  userAgent = null,
}) => {
  if (!adminId || !action) return;

  await AdminActivityLog.create({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId ? String(targetId) : null,
    before_data: toSafeJson(beforeData),
    after_data: toSafeJson(afterData),
    ip_address: ipAddress,
    user_agent: userAgent,
  });
};

module.exports = { logAdminActivity };

