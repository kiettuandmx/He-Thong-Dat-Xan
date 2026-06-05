export const TRANSACTION_DIRECTIONS = {
  CREDIT: 'credit',
  DEBIT: 'debit',
};

export const getPaymentHistoryDirection = (transactionType, { ownerMode = false } = {}) => {
  const isRefund = transactionType === 'refund';

  if (ownerMode) {
    return isRefund ? TRANSACTION_DIRECTIONS.DEBIT : TRANSACTION_DIRECTIONS.CREDIT;
  }

  return isRefund ? TRANSACTION_DIRECTIONS.CREDIT : TRANSACTION_DIRECTIONS.DEBIT;
};

export const getWalletTransactionDirection = (transactionType) =>
  ['WITHDRAW', 'BOOKING_PAYMENT'].includes(transactionType)
    ? TRANSACTION_DIRECTIONS.DEBIT
    : TRANSACTION_DIRECTIONS.CREDIT;

export const formatSignedCurrency = (value, direction) => {
  const prefix = direction === TRANSACTION_DIRECTIONS.DEBIT ? '-' : '+';
  return `${prefix}${Number(value || 0).toLocaleString('vi-VN')}đ`;
};
