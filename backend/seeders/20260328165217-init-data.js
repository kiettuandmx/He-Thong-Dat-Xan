"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. ROLES
    await queryInterface.bulkInsert("Roles", [
      { id: 1, role_name: "USER", createdAt: now, updatedAt: now },  // ID: 1
      { id: 2, role_name: "OWNER", createdAt: now, updatedAt: now }, // ID: 2
      { id: 3, role_name: "ADMIN", createdAt: now, updatedAt: now }, // ID: 3
    ]);

    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("123", salt);

    // 2. USERS
    await queryInterface.bulkInsert("Users", [
      { id: 1, name: "Kiet Admin", email: "kiet@gmail.com", password: hashedPassword, phone: "0901234567", bank_name: "MB", bank_account: "0901234567", role_id: 3, createdAt: now, updatedAt: now },
      { id: 2, name: "Lam Owner", email: "lam@gmail.com", password: hashedPassword, phone: "0902880075", bank_name: "MB", bank_account: "0902880075", role_id: 2, createdAt: now, updatedAt: now },
      { id: 3, name: "Chanh User", email: "chanh@gmail.com", password: hashedPassword, phone: "0903451127", bank_name: "ICB", bank_account: "0903451127", role_id: 1, createdAt: now, updatedAt: now },
    ]);

    // 3. LOCATIONS
    await queryInterface.bulkInsert("Locations", [
      { id: 1, address: "Số 1 Lý Thường Kiệt", district: "Quận 10", city: "TP.HCM", latitude: 10.77, longitude: 106.66, createdAt: now, updatedAt: now },
      { id: 2, address: "Bạch Đằng", district: "Bình Thạnh", city: "TP.HCM", latitude: 10.79, longitude: 106.68, createdAt: now, updatedAt: now },
    ]);

    // 4. STADIUMS (Chủ là Lam - ID: 2)
    await queryInterface.bulkInsert("Stadiums", [
      { id: 1, name: "Quận 10", description: "Sân chất lượng cao", owner_id: 2, location_id: 1, status: "active", createdAt: now, updatedAt: now },
      { id: 2, name: "Bình Thạnh", description: "Sân chất lượng cao", owner_id: 2, location_id: 2, status: "active", createdAt: now, updatedAt: now },
    ]);

    // 5. FIELDS
    await queryInterface.bulkInsert("Fields", [
      { id: 1, stadium_id: 1, name: "Sân Bóng Đá 5A", type: "Football", price_per_hour: 400000, status: "active", createdAt: now, updatedAt: now },
      { id: 2, stadium_id: 2, name: "Sân Bóng Đá 6A", type: "Football", price_per_hour: 400000, status: "active", createdAt: now, updatedAt: now },
      { id: 3, stadium_id: 1, name: "Sân Cầu Lông Pro", type: "Badminton", price_per_hour: 80000, status: "active", createdAt: now, updatedAt: now },
      { id: 4, stadium_id: 2, name: "Sân Pickleball Hot", type: "Pickleball", price_per_hour: 150000, status: "active", createdAt: now, updatedAt: now },
    ]);

    // 6. FIELD IMAGES
    await queryInterface.bulkInsert("FieldImages", [
      {
        id: 1,
        field_id: 1,
        image_url:
          "https://images2.thanhnien.vn/528068263637045248/2023/2/6/anh-1-2-1675664707602401842253.jpg",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        field_id: 2,
        image_url:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        field_id: 3,
        image_url:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ22KR3kS8MiMSQJe_FI11vXPo_hL7f8_uLtw&s",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        field_id: 4,
        image_url:
          "https://thethaovanhoa.mediacdn.vn/372676912336973824/2025/7/29/pickleball-la-gi-vi-sao-dan-kien-truc-lai-me-pickleball-1-1753772807239492681845.png",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    // 7. SCHEDULES (Lịch trống để khách có cái mà chọn)
    await queryInterface.bulkInsert("Schedules", [
      {
        id: 1,
        field_id: 1,
        date: "2026-04-22", // Để ngày hiện tại hoặc tương lai
        start_time: "17:00:00",
        end_time: "18:00:00",
        is_available: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        field_id: 1,
        date: "2026-04-22",
        start_time: "18:00:00",
        end_time: "19:00:00",
        is_available: false, // Giả sử giờ này đã có người đặt (khớp với đơn hàng mẫu)
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        field_id: 2,
        date: "2026-04-22",
        start_time: "19:00:00",
        end_time: "20:00:00",
        is_available: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        field_id: 3,
        date: "2026-04-22",
        start_time: "08:00:00",
        end_time: "09:00:00",
        is_available: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 5,
        field_id: 4,
        date: "2026-04-22",
        start_time: "10:00:00",
        end_time: "11:00:00",
        is_available: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    // 8. BOOKINGS 
    await queryInterface.bulkInsert("Bookings", [
      {
        id: 1,
        user_id: 3, // Anh User đặt
        field_id: 1,
        booking_date: now, // Đặt cho hôm nay để test "Đơn hàng hôm nay"
        start_time: "18:00:00",
        end_time: "19:00:00",
        total_price: 400000,
        amount_paid: 200000, // Cọc 50%
        payment_type: "deposit",
        status: "confirmed", // Đã duyệt thì mới tính vào doanh thu
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        user_id: 3,
        field_id: 2,
        booking_date: now,
        start_time: "20:00:00",
        end_time: "21:00:00",
        total_price: 400000,
        amount_paid: 400000, // Trả hết
        payment_type: "full",
        status: "pending", // Đang chờ duyệt
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // 9. PAYMENTS (Biên lai thu tiền)
    await queryInterface.bulkInsert("Payments", [
      {
        id: 1,
        booking_id: 1,       // Khớp với đơn 18:00 - 19:00 (Cọc 200k)
        amount: 200000,
        payment_method: "Banking",
        payment_status: "paid",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        booking_id: 2,       // Khớp với đơn 20:00 - 21:00 (Trả hết 400k)
        amount: 400000,
        payment_method: "Banking",
        payment_status: "paid",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    // 10. REVIEWS
    await queryInterface.bulkInsert("Reviews", [
      {
        id: 1,
        booking_id: 1,
        user_id: 3,
        stadium_id: 1,
        field_id: 1,
        rating: 5,
        comment: "Sân của Lam đá rất tốt!",
        createdAt: now,
        updatedAt: now,
      },
    ]);



    // 11. COUPONS
    await queryInterface.bulkInsert("Coupons", [
      {
        id: 1,
        code: "KHACHMOI",
        discount_type: "percentage",
        discount_value: 20,
        usage_limit: null,
        used_count: 0,
        expires_at: null,
        is_active: true,
        description: "Giam 20% cho tai khoan dung lan dau",
        user_id: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        code: "THANGMOI",
        discount_type: "percentage",
        discount_value: 20,
        usage_limit: null,
        used_count: 0,
        expires_at: null,
        is_active: true,
        description: "Giam 20% moi thang, moi tai khoan dung 1 lan",
        user_id: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 12. NOTIFICATIONS

    await queryInterface.bulkInsert("Notifications", [
      {
        user_id: 3,
        content: "Admin đã phê duyệt yêu cầu của bạn",
        is_read: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Xóa theo thứ tự ngược lại để tránh lỗi ràng buộc (Foreign Key Constraint)
    const tables = [
      "Notifications",
      "Coupons",
      "Reviews",
      "Payments",
      "Bookings",
      "Schedules",
      "FieldImages",
      "Fields",
      "Stadiums",
      "Locations",
      "Users",
      "Roles",
    ];
    for (const table of tables) {
      await queryInterface.bulkDelete(table, null, {});
    }
  },
};
