const test = require('node:test');
const assert = require('node:assert/strict');

const {
  WALLET_TRANSACTION_TYPES,
} = require('../utils/walletTypes');
const {
  applyWalletTransaction,
} = require('../utils/walletService');

test('applyWalletTransaction adds top-up amount to balance and records history', async () => {
  const fakeWallet = {
    id: 1,
    user_id: 7,
    balance: 100000,
    async save() {},
  };
  const createdRows = [];

  const result = await applyWalletTransaction(
    {
      Wallet: {
        findOne: async () => fakeWallet,
        create: async () => fakeWallet,
      },
      WalletTransaction: {
        create: async (payload) => {
          createdRows.push(payload);
          return payload;
        },
      },
    },
    {
      userId: 7,
      amount: 50000,
      type: WALLET_TRANSACTION_TYPES.TOP_UP,
      description: 'Nap tien qua VnPay',
    }
  );

  assert.equal(result.balance, 150000);
  assert.equal(createdRows[0].type, WALLET_TRANSACTION_TYPES.TOP_UP);
  assert.equal(createdRows[0].balance_before, 100000);
  assert.equal(createdRows[0].balance_after, 150000);
});

test('applyWalletTransaction throws when booking payment exceeds current balance', async () => {
  await assert.rejects(
    () =>
      applyWalletTransaction(
        {
          Wallet: {
            findOne: async () => ({
              id: 1,
              user_id: 7,
              balance: 20000,
              async save() {},
            }),
          },
          WalletTransaction: { create: async () => ({}) },
        },
        {
          userId: 7,
          amount: 50000,
          type: WALLET_TRANSACTION_TYPES.BOOKING_PAYMENT,
          description: 'Thanh toan san bang vi',
        }
      ),
    /INSUFFICIENT_WALLET_BALANCE/
  );
});
