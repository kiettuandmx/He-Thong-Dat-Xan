'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. ROLES (Quyền hạn)
    await queryInterface.bulkInsert('Roles', [
      { role_name: 'USER', createdAt: now, updatedAt: now },   // ID: 1
      { role_name: 'OWNER', createdAt: now, updatedAt: now },  // ID: 2
      { role_name: 'ADMIN', createdAt: now, updatedAt: now }   // ID: 3
    ]);

    // 2. USERS (Thành viên nhóm)
    await queryInterface.bulkInsert('Users', [
      { name: 'Kiet Admin', email: 'kiet@gmail.com', password: '123', phone: '0901', role_id: 3, createdAt: now, updatedAt: now },
      { name: 'Lam Owner', email: 'lam@gmail.com', password: '123', phone: '0902', role_id: 2, createdAt: now, updatedAt: now },
      { name: 'Anh User', email: 'anh@gmail.com', password: '123', phone: '0903', role_id: 1, createdAt: now, updatedAt: now }
    ]);

    // 3. LOCATIONS (Vị trí sân bóng)
    await queryInterface.bulkInsert('Locations', [
      { address: 'Số 1 Lý Thường Kiệt', district: 'Quận 10', city: 'TP.HCM', latitude: 10.77, longitude: 106.66, createdAt: now, updatedAt: now }
    ]);

    // 4. STADIUMS (Khu liên hợp sân bóng - Chủ là Lam)
    await queryInterface.bulkInsert('Stadiums', [
      { name: 'Sân bóng Lam Master', description: 'Sân cỏ chuẩn, có nước uống miễn phí', owner_id: 2, location_id: 1, status: 'active', createdAt: now, updatedAt: now }
    ]);

    // 5. FIELDS (Các sân nhỏ bên trong)
    await queryInterface.bulkInsert('Fields', [
      { stadium_id: 1, name: 'Sân Hutech', type: '5x5', price_per_hour: 300000, status: 'available', createdAt: now, updatedAt: now },
      { stadium_id: 1, name: 'Sân 7B', type: '7x7', price_per_hour: 500000, status: 'available', createdAt: now, updatedAt: now }
    ]);

    // 6. FIELD IMAGES
    await queryInterface.bulkInsert('FieldImages', [
      { field_id: 1, image_url: 'https://www.hutech.edu.vn/phongctsv/tin-tuc/sinh-vien/14608470-ngam-san-bong-da-dep-cua-sinh-vien-hutech', createdAt: now, updatedAt: now }
    ]);

    // 7. SCHEDULES (Lịch trống)
    await queryInterface.bulkInsert('Schedules', [
      { field_id: 1, date: '2026-04-01', start_time: '18:00:00', end_time: '19:00:00', is_available: true, createdAt: now, updatedAt: now },
      { field_id: 1, date: '2026-04-01', start_time: '19:00:00', end_time: '20:00:00', is_available: false, createdAt: now, updatedAt: now }
    ]);

    // 8. BOOKINGS (Anh đặt sân của Lam)
    await queryInterface.bulkInsert('Bookings', [
      { user_id: 3, field_id: 1, booking_date: '2026-04-01', start_time: '19:00:00', end_time: '20:00:00', total_price: 300000, status: 'confirmed', createdAt: now, updatedAt: now }
    ]);

    // 9. PAYMENTS
    await queryInterface.bulkInsert('Payments', [
      { booking_id: 1, amount: 300000, payment_method: 'Banking', payment_status: 'paid', createdAt: now, updatedAt: now }
    ]);

    // 10. REVIEWS
    await queryInterface.bulkInsert('Reviews', [
      { booking_id: 1, user_id: 3, stadium_id: 1, rating: 5, comment: 'Sân của Lam đá rất tốt!', createdAt: now, updatedAt: now }
    ]);

    // 11. NOTIFICATIONS
    await queryInterface.bulkInsert('Notifications', [
      { user_id: 3, content: 'Kiet Admin đã phê duyệt yêu cầu của bạn', is_read: false, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Xóa theo thứ tự ngược lại để tránh lỗi ràng buộc (Foreign Key Constraint)
    const tables = ['Notifications', 'Reviews', 'Payments', 'Bookings', 'Schedules', 'FieldImages', 'Fields', 'Stadiums', 'Locations', 'Users', 'Roles'];
    for (const table of tables) {
      await queryInterface.bulkDelete(table, null, {});
    }
  }
};