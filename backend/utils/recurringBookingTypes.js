const RECURRING_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

const SERIES_APPROVAL_STATUS = {
  PENDING_OWNER_REVIEW: 'pending_owner_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

const RECURRING_ITEM_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

module.exports = {
  RECURRING_TYPES,
  SERIES_APPROVAL_STATUS,
  RECURRING_ITEM_STATUS,
};
