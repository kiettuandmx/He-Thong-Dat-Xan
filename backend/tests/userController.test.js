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

async function withUserControllerMocks(mockModels, runAssertion) {
  const modelsPath = require.resolve('../models');
  const controllerPath = require.resolve('../controllers/userController');
  const originalModels = require.cache[modelsPath];
  const originalController = require.cache[controllerPath];

  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: mockModels,
  };
  delete require.cache[controllerPath];

  try {
    const controller = require('../controllers/userController');
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

test('updateProfile persists owner bank account details', async () => {
  const user = {
    id: 7,
    name: 'Owner A',
    email: 'owner@example.com',
    phone: '0900000000',
    bank_name: 'MB',
    bank_account: '0123456789',
    role_id: 2,
    async save() {
      return this;
    },
  };

  await withUserControllerMocks(
    {
      User: {
        findByPk: async () => user,
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.updateProfile(
        {
          params: { id: '7' },
          body: {
            full_name: 'Owner B',
            phone: '0911222333',
            bank_name: 'VCB',
            bank_account: '9988776655',
          },
          user: { id: 7, role: 2 },
        },
        response
      );

      assert.equal(response.statusCode, 200);
      assert.equal(user.name, 'Owner B');
      assert.equal(user.phone, '0911222333');
      assert.equal(user.bank_name, 'VCB');
      assert.equal(user.bank_account, '9988776655');
      assert.equal(response.payload.user.bank_name, 'VCB');
      assert.equal(response.payload.user.bank_account, '9988776655');
    }
  );
});
