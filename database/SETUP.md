# 🎯 Hười Dẫn Setup Database - Hệ Thống Đặt Sân

## 📋 Tóm Tắt 3 Nhiệm Vụ Đã Hoàn Thành

### ✅ Nhiệm Vụ 1: Database Schema
- **File**: `database/schema.sql`
- **Nội Dung**: 11 bảng chính với Primary Key, Foreign Key, Index, và Comment đầy đủ
- **Các Bảng**:
  1. `Roles` - Quyền hạn người dùng
  2. `Users` - Người dùng hệ thống
  3. `Locations` - Vị trí địa lý
  4. `Stadiums` - Khu liên hợp sân bóng
  5. `Fields` - Danh sách sân nhỏ
  6. `FieldImages` - Hình ảnh sân
  7. `Schedules` - Lịch trống/bận
  8. `Bookings` - Đơn đặt sân ⭐
  9. `Payments` - Thanh toán
  10. `Reviews` - Đánh giá
  11. `Notifications` - Thông báo

### ✅ Nhiệm Vụ 2: Dữ Liệu Mẫu (Seeder)
- **File**: `backend/seeders/20260410-initial-data.js`
- **Dữ Liệu Mẫu**:
  - 2 Roles: `USER`, `ADMIN`
  - 2 Users: 1 Admin, 1 User
  - 1 Location: TP.HCM
  - 1 Stadium: Sân Bóng Công Viên Tây
  - 3 Fields: Sân 5x5, 7x7, 11x11 với giá khác nhau
  - 2 Bookings: Gồm confirmed và pending states

### ✅ Nhiệm Vụ 3: Database Connection Config
- **File**: `backend/config/db.js`
- **Tính Năng**:
  - ✓ Kết nối MySQL sử dụng Sequelize ORM
  - ✓ Đọc tất cả config từ environment variables
  - ✓ Connection pooling để tối ưu performance
  - ✓ Validation biến environment bắt buộc
  - ✓ Test connection khi khởi động

---

## 🚀 Hướng Dẫn Setup & Chạy Migrations

### Bước 1: Chuẩn Bị
```bash
# Vào folder backend
cd backend

# Cài đặt dependencies (nếu chưa cài)
npm install
```

### Bước 2: Cấu Hình Environment Variables
```bash
# Copy file mẫu và tạo file thực tế
cp .env.example .env

# Chỉnh sửa .env với thông tin MySQL của bạn
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=sport_booking
# DB_USER=root
# DB_PASS=123456
```

### Bước 3: Tạo Database (Nếu chưa tồn tại)
```sql
-- Mở MySQL Client hoặc MySQL Workbench
CREATE DATABASE IF NOT EXISTS sport_booking 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Bước 4: Chạy Migrations (Tạo các bảng)
```bash
# Chạy tất cả migrations
npx sequelize-cli db:migrate

# Kết quả mong đợi:
# ✓ Migrations run successfully
# ✓ Tất cả 11 bảng được tạo
```

### Bước 5: Chạy Seeders (Thêm Dữ Liệu Mẫu)
```bash
# Chạy seeders
npx sequelize-cli db:seed:all

# Hoặc chạy seeder cụ thể:
npx sequelize-cli db:seed --seed 20260410-initial-data.js
```

### Bước 6: Verify Dữ Liệu
```bash
# Kết nối MySQL và kiểm tra
mysql -u root -p sport_booking

# Các lệnh kiểm tra:
SELECT * FROM Roles;           -- Xem các quyền hạn
SELECT * FROM Users;           -- Xem người dùng
SELECT * FROM Fields;          -- Xem danh sách sân
SELECT * FROM Bookings;        -- Xem đơn đặt sân
```

---

## 📝 Lệnh Sequelize CLI Thường Dùng

```bash
# ========== MIGRATIONS ==========
# Chạy tất cả migrations chưa chạy
npx sequelize-cli db:migrate

# Chạy lại migration cuối cùng (rollback 1 bước)
npx sequelize-cli db:migrate:undo

# Rollback tất cả
npx sequelize-cli db:migrate:undo:all

# Tạo migration mới
npx sequelize-cli migration:generate --name create-<table-name>

# ========== SEEDERS ==========
# Chạy tất cả seeders
npx sequelize-cli db:seed:all

# Chạy seeder cụ thể
npx sequelize-cli db:seed --seed <seeder-name>

# Rollback seeder cuối
npx sequelize-cli db:seed:undo

# Rollback tất cả seeders
npx sequelize-cli db:seed:undo:all

# Tạo seeder mới
npx sequelize-cli seed:generate --name <seeder-name>
```

---

## 🔐 Bảo Mật - Các Điểm Quan Trọng

### ✓ Environment Variables
Tất cả thông tin kết nối DB đều đọc từ `.env`:
```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME,   // Từ .env
  process.env.DB_USER,   // Từ .env
  process.env.DB_PASS,   // Từ .env
  { host: process.env.DB_HOST } // Từ .env
);
```

### ✓ .gitignore
File `.env` được thêm vào `.gitignore` - **không commit vào Git**:
```
.env
.env.local
```

### ✓ Password Hashing
⚠️ **TODO**: Khi implement authentication, phải hash password!
```javascript
// ❌ KHÔNG LÀM:
password: '123456' // Plain password (KHÔNG BẢO MẬT)

// ✅ PHẢI LÀM:
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('123456', 10);
```

---

## 📊 Database Schema Rõ Ràng

### Ràng Buộc Khóa (Foreign Keys)
```
Users
  ├─> role_id (References: Roles.id)
  └─> (Referenced by: Stadiums.owner_id, Bookings.user_id, Reviews.user_id)

Stadiums
  ├─> owner_id (References: Users.id)
  ├─> location_id (References: Locations.id)
  └─> (Referenced by: Fields.stadium_id, Reviews.stadium_id)

Fields
  ├─> stadium_id (References: Stadiums.id) [CASCADE]
  └─> (Referenced by: FieldImages.field_id, Schedules.field_id, Bookings.field_id)

Bookings ⭐ (Bảng Trung Tâm)
  ├─> user_id (References: Users.id) [CASCADE]
  ├─> field_id (References: Fields.id) [CASCADE]
  └─> (Referenced by: Payments.booking_id, Reviews.booking_id)
```

### Cascade Delete
- Xóa `User` → Xóa tất cả `Bookings` của user đó
- Xóa `Field` → Xóa tất cả `Schedules` của sân đó
- Xóa `Booking` → Xóa `Payments` và có thể xóa `Reviews`

---

## ✨ Dữ Liệu Mẫu Ban Đầu

### Roles
| ID | Role Name |
|----|-----------|
| 1  | USER      |
| 2  | ADMIN     |

### Users
| ID | Name           | Email                      | Role   |
|----|---|---|---|
| 1  | Nguyễn Văn A   | admin@sportbooking.com    | ADMIN  |
| 2  | Trần Thị B     | user01@sportbooking.com   | USER   |

### Fields
| ID | Name             | Type    | Price/Hour | Status    |
|----|---|---|---|---|
| 1  | Sân Số 1 - 5x5   | 5x5     | 200,000    | available |
| 2  | Sân Số 2 - 7x7   | 7x7     | 350,000    | available |
| 3  | Sân Số 3 - 11x11 | 11x11   | 600,000    | available |

### Bookings
| ID | User | Field | Date       | Time        | Total Price | Status    |
|----|---|---|---|---|---|---|
| 1  | 2    | 1     | 2026-04-11 | 17:00-18:00 | 200,000     | confirmed |
| 2  | 2    | 2     | 2026-04-11 | 19:00-20:00 | 350,000     | pending   |

---

## 🐛 Troubleshooting

### Lỗi: "ER_BAD_DB_ERROR: Unknown database"
**Nguyên nhân**: Database chưa tồn tại
**Giải Pháp**:
```sql
CREATE DATABASE sport_booking;
```

### Lỗi: "ER_ACCESS_DENIED_FOR_USER"
**Nguyên nhân**: Username/Password sai
**Giải Pháp**:
```bash
# Kiểm tra .env file
cat .env
# Đảm bảo DB_USER và DB_PASS đúng với MySQL
```

### Lỗi: "Foreign key constraint fails"
**Nguyên nhân**: Chạy seeder khi migrations chưa chạy
**Giải Pháp**:
```bash
# Đảm bảo chạy migrations trước
npx sequelize-cli db:migrate
# Sau đó chạy seeder
npx sequelize-cli db:seed:all
```

---

## 📚 Tài Liệu Liên Quan

- **Schema SQL**: `database/schema.sql` - SQL raw queries
- **Migrations**: `backend/migrations/` - Sequelize migrations
- **Seeders**: `backend/seeders/` - Dữ liệu mẫu
- **Config**: `backend/config/db.js` - Database connection
- **Environment**: `backend/.env` - Biến môi trường (LOCAL)
- **Environment Template**: `backend/.env.example` - Mẫu biến môi trường

---

## ✅ Checklist Day 1

- [x] Tạo schema với 11 bảng
- [x] Tạo seeder với dữ liệu mẫu
- [x] Cấu hình kết nối database
- [x] Protect environment variables (.env)
- [x] Tạo .gitignore
- [x] Viết hướng dẫn setup
- [ ] **TIẾP THEO**: Tạo Models Sequelize
- [ ] **TIẾP THEO**: Tạo Routes API
- [ ] **TIẾP THEO**: Tạo Controllers ngation logic

---

## 👨‍💼 Liên Hệ & Hỗ Trợ

Nếu có vấn đề, lưu ý:
1. Kiểm tra MySQL đang chạy không
2. Kiểm tra .env file cấu hình đúng không
3. Kiểm tra database đã tồn tại không
4. Xem lại migrations và seeders order

---

**Date**: 2026-04-10  
**Status**: ✅ Day 1 - Setup Database Hoàn Thành
