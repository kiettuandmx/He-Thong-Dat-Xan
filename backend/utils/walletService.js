const {
  WALLET_TRANSACTION_STATUS,
  WALLET_TRANSACTION_TYPES,
} = require('./walletTypes');

const toAmount = (value) => Number(value || 0);

const isDebitTransaction = (type) =>
  [WALLET_TRANSACTION_TYPES.WITHDRAW, WALLET_TRANSACTION_TYPES.BOOKING_PAYMENT].includes(type);

async function getOrCreateWallet(db, userId, transaction) {
  const queryOptions = {
    where: { user_id: userId },
  };

  if (transaction) {
    queryOptions.transaction = transaction;
    queryOptions.lock = transaction.LOCK.UPDATE;
  }

  const existingWallet = await db.Wallet.findOne(queryOptions);
  if (existingWallet) {
    return existingWallet;
  }

  return db.Wallet.create(
    {
      user_id: userId,
      balance: 0,
    },
    transaction ? { transaction } : undefined
  );
}

async function applyWalletTransaction(db, payload, transaction) {
  const wallet = await getOrCreateWallet(db, payload.userId, transaction);
  const amount = toAmount(payload.amount);
  const beforeBalance = toAmount(wallet.balance);

  if (isDebitTransaction(payload.type) && beforeBalance < amount) {
    throw new Error('INSUFFICIENT_WALLET_BALANCE');
  }

  const afterBalance = isDebitTransaction(payload.type)
    ? beforeBalance - amount
    : beforeBalance + amount;

  wallet.balance = afterBalance;
  await wallet.save(transaction ? { transaction } : undefined);

  const transactionPayload = {
    wallet_id: wallet.id,
    user_id: payload.userId,
    booking_id: payload.bookingId || null,
    type: payload.type,
    status: WALLET_TRANSACTION_STATUS.SUCCESS,
    amount,
    balance_before: beforeBalance,
    balance_after: afterBalance,
    description: payload.description,
    reference_type: payload.referenceType || null,
    reference_id: payload.referenceId || null,
    metadata: payload.metadata || null,
  };

  await db.WalletTransaction.create(
    transactionPayload,
    transaction ? { transaction } : undefined
  );

  return {
    walletId: wallet.id,
    balance: afterBalance,
  };
}

module.exports = {
  getOrCreateWallet,
  applyWalletTransaction,
};
