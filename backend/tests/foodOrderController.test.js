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

async function withFoodOrderControllerMocks(serviceExports, runAssertion) {
  const servicePath = require.resolve('../utils/foodOrderService');
  const controllerPath = require.resolve('../controllers/foodOrderController');
  const modelsPath = require.resolve('../models');
  const originalService = require.cache[servicePath];
  const originalController = require.cache[controllerPath];
  const originalModels = require.cache[modelsPath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: serviceExports,
  };
  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: {},
  };
  delete require.cache[controllerPath];

  try {
    const controller = require('../controllers/foodOrderController');
    await runAssertion(controller);
  } finally {
    if (originalService) {
      require.cache[servicePath] = originalService;
    } else {
      delete require.cache[servicePath];
    }

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

test('createFoodOrder returns 201 when booking is active and menu items are available', async () => {
  await withFoodOrderControllerMocks(
    {
      createFoodOrderForBooking: async () => ({ id: 15, total_amount: 55000 }),
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.createFoodOrder(
        {
          params: { bookingId: '15' },
          body: { items: [{ menu_item_id: 1, quantity: 2 }], payment_method: 'wallet' },
          user: { id: 7, role: 1 },
        },
        response
      );

      assert.equal(response.statusCode, 201);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.data.id, 15);
    }
  );
});

test('updateFoodOrderStatus maps invalid status transition to 400', async () => {
  await withFoodOrderControllerMocks(
    {
      updateFoodOrderStatusByOwner: async () => {
        throw new Error('INVALID_FOOD_ORDER_STATUS_TRANSITION');
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.updateFoodOrderStatus(
        {
          params: { id: '22' },
          body: { status: 'delivered' },
          user: { id: 9, role: 2 },
        },
        response
      );

      assert.equal(response.statusCode, 400);
      assert.equal(response.payload.success, false);
    }
  );
});
