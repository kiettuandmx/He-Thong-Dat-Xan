'use strict';

/**
 * ========================================
 * DATABASE SEEDER - Dữ Liệu Mẫu Ban Đầu
 * ========================================
 * Tạo dữ liệu mẫu cho hệ thống đặt sân:
 * - 2 Roles: USER, ADMIN
 * - 2 Users: 1 admin, 1 user
 * - 1 Location: Vị trí
 * - 1 Stadium: Khu sân
 * - 3 Fields: 3 sân nhỏ
 * - 2 Bookings: 2 lượt đặt sân
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ========================================
    // 1. SEED ROLES (2 quyền hạn)
    // ========================================
    await queryInterface.bulkInsert('Roles', [
      {
        role_name: 'USER',
        createdAt: now,
        updatedAt: now
      },
      {
        role_name: 'ADMIN',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 2. SEED USERS (2 người dùng)
    // ========================================
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Nguyễn Văn A',
        email: 'admin@sportbooking.com',
        password: 'hashed_password_admin', // Trong thực tế phải mã hoá password
        phone: '0901234567',
        role_id: 2, // ADMIN
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Trần Thị B',
        email: 'user01@sportbooking.com',
        password: 'hashed_password_user', // Trong thực tế phải mã hoá password
        phone: '0911234567',
        role_id: 1, // USER
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 3. SEED LOCATIONS (1 vị trí)
    // ========================================
    await queryInterface.bulkInsert('Locations', [
      {
        address: '123 Đường Lý Thường Kiệt',
        district: 'Quận 10',
        city: 'Thành phố Hồ Chí Minh',
        latitude: 10.7700,
        longitude: 106.6600,
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 4. SEED STADIUMS (1 khu sân)
    // ========================================
    await queryInterface.bulkInsert('Stadiums', [
      {
        name: 'Sân Bóng Công Viên Tây',
        description: 'Khu sân bóng chuyên nghiệp với cobs cỏ nhân tạo chuẩn, nhiều tiện ích',
        owner_id: 2, // Admin là chủ sân
        location_id: 1,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 5. SEED FIELDS (3 sân nhỏ)
    // ========================================
    await queryInterface.bulkInsert('Fields', [
      {
        stadium_id: 1,
        name: 'Sân Số 1 - Sân 5x5',
        type: '5x5',
        price_per_hour: 200000, // 200,000 VND/giờ
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        stadium_id: 1,
        name: 'Sân Số 2 - Sân 7x7',
        type: '7x7',
        price_per_hour: 350000, // 350,000 VND/giờ
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        stadium_id: 1,
        name: 'Sân Số 3 - Sân 11x11',
        type: '11x11',
        price_per_hour: 600000, // 600,000 VND/giờ
        status: 'available',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 6. SEED FIELD IMAGES (Hình ảnh sân)
    // ========================================
    await queryInterface.bulkInsert('FieldImages', [
      {
        field_id: 1,
        image_url: 'https://example.com/field1.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 2,
        image_url: 'https://example.com/field2.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 3,
        image_url: 'https://example.com/field3.jpg',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 7. SEED SCHEDULES (Lịch trống)
    // ========================================
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ngày mai
    const dateString = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    await queryInterface.bulkInsert('Schedules', [
      {
        field_id: 1,
        date: dateString,
        start_time: '17:00:00',
        end_time: '18:00:00',
        is_available: true,
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 1,
        date: dateString,
        start_time: '18:00:00',
        end_time: '19:00:00',
        is_available: true,
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 2,
        date: dateString,
        start_time: '19:00:00',
        end_time: '20:00:00',
        is_available: true,
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 8. SEED BOOKINGS (2 lượt đặt sân)
    // ========================================
    await queryInterface.bulkInsert('Bookings', [
      {
        user_id: 2, // User (Trần Thị B) đặt sân
        field_id: 1, // Sân 5x5
        booking_date: dateString,
        start_time: '17:00:00',
        end_time: '18:00:00',
        total_price: 200000, // 200,000 VND (1 giờ x 200,000/giờ)
        status: 'confirmed',
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 2, // User (Trần Thị B) đặt sân
        field_id: 2, // Sân 7x7
        booking_date: dateString,
        start_time: '19:00:00',
        end_time: '20:00:00',
        total_price: 350000, // 350,000 VND (1 giờ x 350,000/giờ)
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 9. SEED PAYMENTS (Thanh toán)
    // ========================================
    await queryInterface.bulkInsert('Payments', [
      {
        booking_id: 1,
        amount: 200000,
        payment_method: 'Banking',
        payment_status: 'paid',
        transaction_id: 'TXN_20260410_001',
        createdAt: now,
        updatedAt: now
      },
      {
        booking_id: 2,
        amount: 350000,
        payment_method: 'Cash',
        payment_status: 'pending',
        transaction_id: null,
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 10. SEED REVIEWS (Đánh giá)
    // ========================================
    await queryInterface.bulkInsert('Reviews', [
      {
        booking_id: 1,
        user_id: 2,
        stadium_id: 1,
        rating: 5,
        comment: 'Sân rất sạch, bóng tốt, nhân viên thân thiện!',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 11. SEED NOTIFICATIONS (Thông báo)
    // ========================================
    await queryInterface.bulkInsert('Notifications', [
      {
        user_id: 2,
        content: 'Xác nhận đặt sân thành công! Booking ID: #1 - Sân 1 ngày mai 17:00-18:00',
        is_read: false,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 1,
        content: 'Có khách hàng mới đặt sân. Vui lòng xác nhận.',
        is_read: false,
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Xóa dữ liệu theo thứ tự ngược lại (từ con đến cha)
     * để tránh lỗi Foreign Key Constraint Violation
     */
    const tables = [
      'Notifications',
      'Reviews',
      'Payments',
      'Bookings',
      'Schedules',
      'FieldImages',
      'Fields',
      'Stadiums',
      'Locations',
      'Users',
      'Roles'
    ];

    for (const table of tables) {
      try {
        await queryInterface.bulkDelete(table, null, {});
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
      }
    }
  }
};