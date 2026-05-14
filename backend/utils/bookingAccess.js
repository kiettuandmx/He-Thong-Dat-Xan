function isAdminUser(req) {
  return Number(req?.user?.role) === 3;
}

function resolveBookingCreatorId(req, body = {}) {
  return req?.user?.id ?? body.user_id ?? null;
}

function canAccessBookingDetail(req, booking) {
  if (isAdminUser(req)) {
    return true;
  }

  return Number(booking?.user_id) === Number(req?.user?.id);
}

module.exports = {
  canAccessBookingDetail,
  isAdminUser,
  resolveBookingCreatorId,
};
