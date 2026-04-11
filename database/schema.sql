-- ========================================
-- Hệ Thống Đặt Sân - Database Schema
-- Created: 2026-04-10
-- Database: sport_booking
-- ========================================

-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS sport_booking;
USE sport_booking;

-- ========================================
-- 1. BẢNG ROLES (Quyền hạn người dùng)
-- ========================================
CREATE TABLE IF NOT EXISTS Roles (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID quyền hạn',
  role_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên quyền hạn (USER, OWNER, ADMIN)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng quyền hạn: USER (khách hàng), OWNER (chủ sân), ADMIN (quản trị)';

-- ========================================
-- 2. BẢNG USERS (Thông tin người dùng)
-- ========================================
CREATE TABLE IF NOT EXISTS Users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID người dùng',
  name VARCHAR(255) NOT NULL COMMENT 'Họ tên',
  email VARCHAR(255) UNIQUE COMMENT 'Email',
  password VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã mã hoá',
  phone VARCHAR(20) COMMENT 'Số điện thoại',
  role_id INT NOT NULL COMMENT 'ID quyền hạn',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES Roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng người dùng hệ thống';

-- ========================================
-- 3. BẢNG LOCATIONS (Vị trí sân bóng)
-- ========================================
CREATE TABLE IF NOT EXISTS Locations (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID vị trí',
  address VARCHAR(255) NOT NULL COMMENT 'Địa chỉ cụ thể',
  district VARCHAR(100) COMMENT 'Quận/Huyện',
  city VARCHAR(100) COMMENT 'Thành phố',
  latitude DECIMAL(10, 8) COMMENT 'Vĩ độ',
  longitude DECIMAL(11, 8) COMMENT 'Kinh độ',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_city_district (city, district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng vị trí địa lý của các khu sân bóng';

-- ========================================
-- 4. BẢNG STADIUMS (Khu liên hợp sân bóng)
-- ========================================
CREATE TABLE IF NOT EXISTS Stadiums (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID khu sân',
  name VARCHAR(255) NOT NULL COMMENT 'Tên khu sân',
  description TEXT COMMENT 'Mô tả chi tiết',
  owner_id INT NOT NULL COMMENT 'ID chủ sân (tham chiếu Users)',
  location_id INT COMMENT 'ID vị trí (tham chiếu Locations)',
  status VARCHAR(50) DEFAULT 'active' COMMENT 'Trạng thái (active, inactive)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES Locations(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_owner_id (owner_id),
  INDEX idx_location_id (location_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng khu liên hợp sân bóng (có thể chứa nhiều sân nhỏ)';

-- ========================================
-- 5. BẢNG FIELDS (Danh sách sân nhỏ)
-- ========================================
CREATE TABLE IF NOT EXISTS Fields (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID sân nhỏ',
  stadium_id INT NOT NULL COMMENT 'ID khu sân chứa (tham chiếu Stadiums)',
  name VARCHAR(255) NOT NULL COMMENT 'Tên sân',
  type VARCHAR(100) COMMENT 'Loại sân (5x5, 7x7, ...)',
  price_per_hour DECIMAL(12, 2) NOT NULL COMMENT 'Giá tiền theo giờ (VND)',
  status VARCHAR(50) DEFAULT 'available' COMMENT 'Trạng thái (available, maintenance, closed)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stadium_id) REFERENCES Stadiums(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_stadium_id (stadium_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng các sân nhỏ bên trong mỗi khu sân';

-- ========================================
-- 6. BẢNG FIELD_IMAGES (Hình ảnh sân)
-- ========================================
CREATE TABLE IF NOT EXISTS FieldImages (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID hình ảnh',
  field_id INT NOT NULL COMMENT 'ID sân (tham chiếu Fields)',
  image_url VARCHAR(500) NOT NULL COMMENT 'URL hình ảnh',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES Fields(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_field_id (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng hình ảnh của các sân';

-- ========================================
-- 7. BẢNG SCHEDULES (Lịch trống/bận)
-- ========================================
CREATE TABLE IF NOT EXISTS Schedules (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID lịch',
  field_id INT NOT NULL COMMENT 'ID sân (tham chiếu Fields)',
  date DATE NOT NULL COMMENT 'Ngày',
  start_time TIME NOT NULL COMMENT 'Giờ bắt đầu',
  end_time TIME NOT NULL COMMENT 'Giờ kết thúc',
  is_available BOOLEAN DEFAULT TRUE COMMENT 'Sân có trống không',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES Fields(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY unique_schedule (field_id, date, start_time),
  INDEX idx_field_id (field_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lịch trình các khung giờ trống/bận của sân';

-- ========================================
-- 8. BẢNG BOOKINGS (Đơn đặt sân)
-- ========================================
CREATE TABLE IF NOT EXISTS Bookings (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID đơn đặt',
  user_id INT NOT NULL COMMENT 'ID người đặt (tham chiếu Users)',
  field_id INT NOT NULL COMMENT 'ID sân (tham chiếu Fields)',
  booking_date DATE NOT NULL COMMENT 'Ngày đặt sân',
  start_time TIME NOT NULL COMMENT 'Giờ bắt đầu',
  end_time TIME NOT NULL COMMENT 'Giờ kết thúc',
  total_price DECIMAL(12, 2) NOT NULL COMMENT 'Tổng giá tiền (VND)',
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'Trạng thái (pending, confirmed, completed, cancelled)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES Fields(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_field_id (field_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng đơn đặt sân từ khách hàng';

-- ========================================
-- 9. BẢNG PAYMENTS (Thanh toán)
-- ========================================
CREATE TABLE IF NOT EXISTS Payments (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID thanh toán',
  booking_id INT NOT NULL COMMENT 'ID đơn đặt (tham chiếu Bookings)',
  amount DECIMAL(12, 2) NOT NULL COMMENT 'Số tiền thanh toán (VND)',
  payment_method VARCHAR(100) COMMENT 'Phương thức thanh toán (Banking, Cash, ...)',
  payment_status VARCHAR(50) DEFAULT 'pending' COMMENT 'Trạng thái (pending, paid, failed)',
  transaction_id VARCHAR(100) UNIQUE COMMENT 'Mã giao dịch',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_booking_id (booking_id),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng thanh toán cho các đơn đặt sân';

-- ========================================
-- 10. BẢNG REVIEWS (Đánh giá)
-- ========================================
CREATE TABLE IF NOT EXISTS Reviews (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID đánh giá',
  booking_id INT NOT NULL COMMENT 'ID đơn đặt (tham chiếu Bookings)',
  user_id INT NOT NULL COMMENT 'ID người đánh giá (tham chiếu Users)',
  stadium_id INT NOT NULL COMMENT 'ID sân được đánh giá (tham chiếu Stadiums)',
  rating INT CHECK (rating >= 1 AND rating <= 5) COMMENT 'Điểm đánh giá (1-5 sao)',
  comment TEXT COMMENT 'Bình luận',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (stadium_id) REFERENCES Stadiums(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_stadium_id (stadium_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng đánh giá và nhận xét từ khách hàng';

-- ========================================
-- 11. BẢNG NOTIFICATIONS (Thông báo)
-- ========================================
CREATE TABLE IF NOT EXISTS Notifications (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID thông báo',
  user_id INT NOT NULL COMMENT 'ID người nhận (tham chiếu Users)',
  content TEXT NOT NULL COMMENT 'Nội dung thông báo',
  is_read BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng thông báo cho người dùng';

-- ========================================
-- Thống kê: Các bảng chính
-- ========================================
-- 1. Roles: Quyền hạn (USER, OWNER, ADMIN)
-- 2. Users: Người dùng (khách hàng, chủ sân, admin)
-- 3. Locations: Vị trí địa lý
-- 4. Stadiums: Khu liên hợp sân bóng
-- 5. Fields: Các sân nhỏ trong khu sân
-- 6. FieldImages: Hình ảnh sân
-- 7. Schedules: Lịch trị trống/bận
-- 8. Bookings: Đơn đặt sân ★ (Bảng chính)
-- 9. Payments: Thanh toán
-- 10. Reviews: Đánh giá
-- 11. Notifications: Thông báo

-- ========================================
-- Khóa chính và ràng buộc
-- ========================================
-- ✓ Primary Keys: Tất cả bảng có ID là khóa chính
-- ✓ Foreign Keys: Tất cả tham chiếu đến bảng khác đều có ràng buộc
-- ✓ Cascade Delete: Xóa bản ghi cha sẽ xóa bản ghi con
-- ✓ Cascade Update: Cập nhật khóa sẽ cập nhật các tham chiếu
