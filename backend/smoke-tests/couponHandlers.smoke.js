const assert = require("assert");
const couponController = require("../controllers/couponController");

const requiredHandlers = [
  "createCoupon",
  "getCoupons",
  "updateCoupon",
  "deleteCoupon",
  "getCouponByCode",
  "validateCoupon",
  "assignMonthlyCoupon",
];

for (const handlerName of requiredHandlers) {
  assert.strictEqual(
    typeof couponController[handlerName],
    "function",
    `Expected couponController.${handlerName} to be a function`
  );
}

console.log("couponController exports all required route handlers.");
