const FIELD_DELETION_BLOCKED_MESSAGE =
  'Không thể xóa sân này vì sân đã có lịch sử đặt sân hoặc đang có đơn đặt sân. Chỉ có thể khóa sân hoặc ngừng hoạt động.';

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
