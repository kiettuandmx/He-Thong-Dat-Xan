'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('Coupons', [
      {
        code: 'KHACHMOI',
        discount_type: 'percentage',
        discount_value: 15,
        usage_limit: 1,
        used_count: 0,
        expires_at: null, // Không có thời hạn
        is_active: true,
        description: 'Mã giảm giá cho khách hàng mới - mỗi tài khoản chỉ được dùng 1 lần',
        user_id: null,
        createdAt: now,
        updatedAt: now
      },
      {
        code: 'THANGMOI',
        discount_type: 'percentage',
        discount_value: 20,
        usage_limit: null, // Không giới hạn số lần cấp, nhưng xác thực mỗi tháng 1 lần
        used_count: 0,
        expires_at: null, // Không có thời hạn
        is_active: true,
        description: 'Mã giảm giá hằng tháng - mỗi tài khoản được dùng 1 lần mỗi tháng',
        user_id: null,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Coupons', {
      code: ['KHACHMOI', 'THANGMOI']
    });
  }
};
