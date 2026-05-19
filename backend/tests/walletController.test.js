const test = require('node:test');
const assert = require('node:assert/strict');

function createResponseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

async function withWalletControllerMocks(mockDb, runAssertion) {
  const modelsPath = require.resolve('../models');
  const controllerPath = require.resolve('../controllers/walletController');

  const originalModels = require.cache[modelsPath];
  const originalController = require.cache[controllerPath];

  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: mockDb,
  };
  delete require.cache[controllerPath];

  try {
    const controller = require('../controllers/walletController');
    await runAssertion(controller);
  } finally {
    if (originalModels) {
      require.cache[modelsPath] = originalModels;
    } else {
      delete require.cache[modelsPath];
    }

    if (originalController) {
      require.cache[controllerPath] = originalController;
    } else {
      delete require.cache[controllerPath];
    }
  }
}

test('getWalletSummary returns current balance and latest transactions', async () => {
  await withWalletControllerMocks(
    {
      Wallet: {
        findOne: async () => ({ id: 1, user_id: 7, balance: 125000 }),
        create: async () => ({ id: 1, user_id: 7, balance: 0 }),
      },
      WalletTransaction: {
        findAll: async () => [{ id: 10, type: 'TOP_UP', amount: 50000 }],
      },
      sequelize: {
        transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.getWalletSummary({ user: { id: 7 } }, response);

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.data.balance, 125000);
      assert.equal(response.payload.data.transactions.length, 1);
    }
  );
});

test('withdraw rejects when requested amount is larger than wallet balance', async () => {
  await withWalletControllerMocks(
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
      sequelize: {
        transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.withdraw(
        {
          user: { id: 7 },
          body: {
            amount: 500000,
            bank_name: 'VCB',
            bank_account: '123456789',
            account_holder: 'Nguyen Van A',
          },
        },
        response
      );

      assert.equal(response.statusCode, 400);
      assert.match(response.payload.message, /So du vi khong du/i);
    }
  );
});
