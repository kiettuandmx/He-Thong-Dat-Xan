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

async function withRecurringControllerMocks(serviceExports, runAssertion) {
  const servicePath = require.resolve('../utils/recurringBookingService');
  const controllerPath = require.resolve('../controllers/recurringBookingController');
  const originalService = require.cache[servicePath];
  const originalController = require.cache[controllerPath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: serviceExports,
  };
  delete require.cache[controllerPath];

  try {
    const controller = require('../controllers/recurringBookingController');
    await runAssertion(controller);
  } finally {
    if (originalService) {
      require.cache[servicePath] = originalService;
    } else {
      delete require.cache[servicePath];
    }

    if (originalController) {
      require.cache[controllerPath] = originalController;
    } else {
      delete require.cache[controllerPath];
    }
  }
}

test('previewRecurringBooking responds with preview payload from service', async () => {
  await withRecurringControllerMocks(
    {
      previewRecurringBooking: async () => ({
        hasConflicts: true,
        conflicts: [{ requestedSlot: { scheduledDate: '2026-05-20' }, suggestions: [] }],
      }),
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.previewRecurringBooking(
        {
          body: { field_id: 3 },
          user: { id: 7, role: 1 },
        },
        response
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.data.hasConflicts, true);
    }
  );
});

test('createRecurringBooking returns 201 with created series payload', async () => {
  await withRecurringControllerMocks(
    {
      createRecurringBookingSeries: async () => ({
        id: 55,
        approval_status: 'approved',
      }),
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.createRecurringBooking(
        {
          body: { field_id: 3 },
          user: { id: 7, role: 1 },
        },
        response
      );

      assert.equal(response.statusCode, 201);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.data.id, 55);
    }
  );
});

test('approveRecurringBooking maps FORBIDDEN_OWNER_REVIEW to 403', async () => {
  await withRecurringControllerMocks(
    {
      approveRecurringBookingSeries: async () => {
        throw new Error('FORBIDDEN_OWNER_REVIEW');
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.approveRecurringBooking(
        {
          params: { id: '55' },
          user: { id: 9, role: 2 },
        },
        response
      );

      assert.equal(response.statusCode, 403);
      assert.equal(response.payload.success, false);
    }
  );
});
