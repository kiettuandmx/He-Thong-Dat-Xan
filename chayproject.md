# Hướng dẫn chạy dự án He-Thong-Dat-Xan

Tài liệu này hướng dẫn cách khởi động toàn bộ hệ thống bao gồm Backend, Database và Frontend.

---

## 1. Khởi động Backend (Server API)
Mở một terminal mới và di chuyển vào thư mục `backend`:
```bash
cd backend
npm run dev
```
- **Địa chỉ API:** `http://localhost:5000`
- **Công cụ sử dụng:** Nodemon (tự động restart khi sửa code).

---

## 2. Khởi động Frontend (Giao diện)
Mở một terminal khác và di chuyển vào thư mục `frontend`:
```bash
cd frontend
npm run dev
```
- **Địa chỉ truy cập:** `http://localhost:5173`
- **Công cụ sử dụng:** Vite.

---

## 3. Cấu hình & Reset Database (Khi cần làm mới dữ liệu)
Nếu bạn muốn xóa sạch dữ liệu cũ và cài đặt lại Database từ đầu với dữ liệu mẫu mới nhất, hãy chạy lệnh sau trong thư mục `backend`:

```bash
# Xóa, tạo lại, chạy migration và nạp dữ liệu mẫu
npx sequelize-cli db:drop ; npx sequelize-cli db:create ; npx sequelize-cli db:migrate ; npx sequelize-cli db:seed:all
```

**Lưu ý:**
- Đảm bảo bạn đã bật **Laragon** (MySQL) trước khi chạy lệnh này.
- **Sửa lỗi Laragon (Schema directory already exists):** Nếu bạn gặp lỗi không thể tạo lại database do thư mục cũ vẫn còn trong Laragon, giải pháp nhanh nhất là đổi tên `DB_NAME` trong file `backend/.env` (ví dụ: đổi từ `sport_booking` thành `htds_booking`) và chạy lại lệnh trên.
- Thông tin tài khoản đăng nhập mẫu:
  - **Admin:** `kiet@gmail.com` / Mật khẩu: `123`
  - **Owner (Chủ sân):** `lam@gmail.com` / Mật khẩu: `123`
  - **User (Khách):** `chanh@gmail.com` / Mật khẩu: `123`

---

## 4. Cách đẩy code lên GitHub (Branch: develop)
Khi có thay đổi mới và muốn lưu lên GitHub:
```bash
# Quay về thư mục gốc
cd ..

# Thêm tất cả thay đổi
git add .

# Lưu thay đổi (Commit)
git commit -m "Mô tả nội dung thay đổi của bạn"

# Đẩy lên GitHub
git push origin develop
```
