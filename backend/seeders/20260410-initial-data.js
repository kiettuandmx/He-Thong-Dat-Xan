'use strict';

/**
 * ========================================
 * DATABASE SEEDER - Dữ Liệu Mẫu Ban Đầu
 * ========================================
 * Tạo dữ liệu mẫu cho hệ thống đặt sân:
 * - 3 Roles: USER, OWNER, ADMIN
 * - 6 Users: 2 ADMIN, 2 OWNER, 2 USER
 * - 2 Locations: 2 vị trí
 * - 3 Stadiums: 3 khu sân khác nhau
 * - 7 Fields: 7 sân nhỏ tổng cộng
 * - 8+ Bookings: Nhiều lượt đặt sân
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ========================================
    // 1. SEED ROLES (3 quyền hạn)
    // ========================================
    await queryInterface.bulkInsert('Roles', [
      {
        role_name: 'USER',
        createdAt: now,
        updatedAt: now
      },
      {
        role_name: 'OWNER',
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
    // 2. SEED USERS (6 người dùng)
    // ========================================
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Kiet Admin',
        email: 'kiet@sportbooking.com',
        password: '$2b$10$YourHashedPasswordHere1', // Admin 1
        phone: '0901234567',
        role_id: 3, // ADMIN
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Lam Admin',
        email: 'lam@sportbooking.com',
        password: '$2b$10$YourHashedPasswordHere2', // Admin 2
        phone: '0902234567',
        role_id: 3, // ADMIN
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Anh Owner',
        email: 'anh@owner.com',
        password: '$2b$10$2 vị trí)
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
      },
      {
        address: '456 Đường Nguyễn Huệ',
        district: 'Quận 1',
        city: 'Thành phố 3 khu sân)
    // ========================================
    await queryInterface.bulkInsert('Stadiums', [
      {
        name: 'Sân Bóng Công Viên Tây',
        description: 'Khu sân bóng chuyên nghiệp với cỏ nhân tạo chuẩn, nhiều tiện ích. Có loa, bàn ghế, bóng miễn phí.',
        owner_id: 3, // Anh Owner
        location_id: 1,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Sân Bóng BK Arena',
        description: 'Sân bóng kỹ thuật cao, ánh sáng LED hiện đại, phòng locker, quán bar.',
        owner_id: 4, // Thanh Owner
        location_id: 2,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Sân Bóng Thiên Hương',
        description: 'Sân bóng vừa và nhỏ, phù hợp cho đội tập và match giao hữu, có bán hangouts.',
        owner_id: 3, // Anh Owner
        location_id: 3Đường Cách Mạng Tháng Tám',
        district: 'Quận 3',
        city: 'Thành phố Hồ Chí Minh',
        latitude: 10.7900,
        longitude: 106.68er.com',
        password: '$2b$10$YourHashedPasswordHere4', // Owner 2
        phone: '0904234567',
        role_id: 2, // OWNER
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Trần User',
        email: 'tran@user.com',
        password: '$2b$10$YourHashedPasswordHere5', // User 1
        phone: '0911234567',
        role_id: 1, // USER
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Hoàng User',
        email: 'hoang@user.com',
        password: '$2b$10$YourHashedPasswordHere6', // User 2
        phone: '0912234567',
        role_id: 1, // USER
        createdAt: now,7 sân nhỏ - tổng công ty 3 stadiums)
    // ========================================
    await queryInterface.bulkInsert('Fields', [
      // Sân Bóng Công Viên Tây (Stadium 1): 3 sân
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
        status: 'maintenance',
        createdAt: now,
        updatedAt: now
      },
      // Sân Bóng BK Arena (Stadium 2): 2 sân
      {
        stadium_id: 2,
        name: 'Sân Premium A - Sân 7x7',
        type: '7x7',
        price_per_hour: 400000,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        stadium_id: 2,
        name: 'Sân Premium B - Sân 11x11',
        type: '11x11',
        price_per_hour: 700000,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      // Sân Bóng Thiên Hương (Stadium 3): 2 sân
      {
        stadium_id: 3,
        name: 'Sân Cỏ A - Sân 5x5',
        type: '5x5',
        price_per_hour: 150000,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        stadium_id: 3,
        name: 'Sân Cỏ B - Sân 7x7',
        type: '7x7',
        price_per_hour: 300000,
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
    // 6. SEED FIELD IMAGES (Hình ảnh sân - 7 ảnh cho 7 sân)
    // ========================================
    await queryInterface.bulkInsert('FieldImages', [
      {
        field_id: 1,
        image_url: 'https://example.com/stadiums/tay/field1-5x5.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 2,
        image_url: 'https://example.com/stadiums/tay/field2-7x7.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 3,
        image_url: 'https://example.com/stadiums/tay/field3-11x11.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 4,
        image_url: 'https://example.com/stadiums/bkarena/premium-a.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 5,
        image_url: 'https://example.com/stadiums/bkarena/premium-b.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 6,
        image_url: 'https://example.com/stadiums/thienhương/coa.jpg',
        createdAt: now,
        updatedAt: now
      },
      {
        field_id: 7,
        image_url: 'https://example.com/stadiums/thienhương/cob.jpg',
        createdAt: now,
        updatedAt: now
      }
    ], { individualHooks: true });

    // ========================================
    // 7. SEED SCHEDULES (Lịch trống cho 7 sân)
    // ========================================
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

    const schedules = [];
    
    // Tạo lịch cho các sân
    for (let fieldId = 1; fieldId <= 7; fieldId++) {
      for (let hour = 17; hour <= 20; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`;
        
        schedules.push({
          field_id: fieldId,
          date: tomorrowStr,
          start_time: startTime,
          end_time: endTime,
          is_available: hour !== 19 || fieldId !== 1, // Field 1, 19h bị chiếm
          createdAt: now,
          updatedAt: now
        });
      }
    }
    
    await queryInterface.bulkInsert('Schedules', schedules, { individualHooks: true });

    // ========================================
    // 8. SEED BOOKINGS (2 lượt đặt sân)
    // ========================================
    await queryInterface.bulkInsert('Bookings', [
      {
        user_id: 2, // User (Trần Thị B) đặt sân
        field_id: 1, // Sân 5x5
        booking_date: dat8+ lượt đặt sân từ các users)
    // ========================================
    await queryInterface.bulkInsert('Bookings', [
      // User 1 (Trần) đặt sân
      {
        user_id: 5, // Trần User
        field_id: 1, // Sân 5x5 - Công Viên Tây
        booking_date: tomorrowStr,
        start_time: '17:00:00',
        end_time: '18:00:00',
        total_price: 200000,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 5, // Trần User
        field_id: 2, // Sân 7x7 - Công Viên Tây
        booking_date: tomorrowStr,
        start_time: '18:00:00',
        end_time: '19:00:00',
        total_price: 350000,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      },
      // User 2 (Hoàng) đặt sân
      {
        user_id: 6, // Hoàng User cho các booking)
    // ========================================
    await queryInterface.bulkInsert('Payments', [
      {
        booking_id: 1,
        amount: 200000,
        payment_method: 'Banking',
        payment_status: 'paid',
        createdAt: now,
        updatedAt: now
      },
      {
        booking_id: 2,
        amount: 350000,
        payment_method: 'Cash',
        payment_status: 'pending',
        createdAt: now,
        updatedAt: now
      }, từ users)
    // ========================================
    await queryInterface.bulkInsert('Reviews', [
      {
        booking_id: 1,
        user_id: 5, // Trần User
        stadium_id: 1, // Sân Bóng Công Viên Tây
        rating: 5,
        comment: 'Sân rất sạch, cỏ mới, nhân viên phục vụ tốt!',
        createdAt: now,
        updatedAt: now
      },
      {
        booking_id: 3,
        user_id: 6, // Hoàng User
        stadium_id: 2, // Sân Bóng BK Arena
        rating: 5,
        comment: 'Ánh sáng LED rất tốt, sân bóng khôn lồn quá!',
        createdAt: now,
        updatedAt: now
      },
      {
        booking_id: 4,
        user_id: 6, // Hoàng User
        stadium_id: 3, // Sân Bóng Thiên Hương
        rating: 4,
        comment: 'Sân ổn, giá rẻ, gần nhà. Sẽ quay lại
      {
        booking_id: 4,
        amount: 150000,
        payment_method: 'Wallet',
        payment_status: 'paid',
        createdAt: now,
        updatedAt: now
      },
      {
        booking_id: 5,
        amount: 300000,
        payment_method: 'Banking',
        payment_status: 'paid',
        createdAt: now,
        updatedAt: now
      },
      {
        booking_id: 6,
        amount: 700000,
        payment_method: 'Cash',
        payment_status: 'pending'
        createdAt: now,
        updatedAt: now
      },
      // User 1 đặt thêm
      {
        user_id: 5, // Trần User
        field_id: 7, // Sân Cỏ B - Thiên Hương
        booking_date: dayAfterTomorrowStr,
        start_time: '20:00:00',
        end_time: '21:00:00',
        total_price: 300000,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now
      },
      // User 2 đặt thêm
      {
        user_id: 6, // Hoàng User
        field_id: 5, // Sân Premium B - BK Arena
        booking_d5, // Trần User
        content: 'Xác nhận đặt sân thành công! Booking #1 - Sân 5x5 Công Viên Tây ngày mai 17:00-18:00',
        is_read: false,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 3, // Anh Owner
        content: 'Có khách mới đặt sân. Booking #1 cần xác nhận.',
        is_read: false,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 6, // Hoàng User
        content: 'Xác nhận đặt sân thành công! Booking #3 - Sân Premium A BK Arena ngày mai 19:00-20:00',
        is_read: true,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 4, // Thanh Owner
        content: 'Có khách mới đặt sân. Booking #3 từ user Hoàng.',
        is_read: false,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 1, // Kiet Admin
        content: '[ADMIN] Hệ thống có 6 booking mới. Vui lòng monitor
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