const assert = require("assert");
const {
  normalizeCouponCode,
  calculateDiscountAmount,
} = require("../utils/couponUtils");

assert.strictEqual(normalizeCouponCode(" khachmoi "), "KHACHMOI");
assert.strictEqual(normalizeCouponCode(""), "");
assert.strictEqual(normalizeCouponCode(null), "");

assert.strictEqual(
  calculateDiscountAmount(
    { discount_type: "percentage", discount_value: 20 },
    300000
  ),
  60000
);

assert.strictEqual(
  calculateDiscountAmount(
    { discount_type: "fixed", discount_value: 50000 },
    300000
  ),
  50000
);

assert.strictEqual(
  calculateDiscountAmount(
    { discount_type: "fixed", discount_value: 500000 },
    300000
  ),
  300000
);

console.log("couponUtils smoke test passed.");
