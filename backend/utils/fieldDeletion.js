const FIELD_DELETION_BLOCKED_MESSAGE =
  'Khong the xoa san nay vi san da co lich su dat san hoac dang co don dat san. Chi co the khoa san hoac ngung hoat dong.';

function getFieldDeletionGuard({ bookingCount }) {
  if (Number(bookingCount) > 0) {
    return {
      canDelete: false,
      statusCode: 409,
      error: FIELD_DELETION_BLOCKED_MESSAGE,
    };
  }

  return {
    canDelete: true,
    statusCode: null,
    error: null,
  };
}

module.exports = {
  FIELD_DELETION_BLOCKED_MESSAGE,
  getFieldDeletionGuard,
};
