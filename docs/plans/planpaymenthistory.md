# 📋 Kế Hoạch Triển Khai - Lịch Sử Thanh Toán

**Ngày tạo:** 2026-05-13  
**Người tạo:** Fullstack Developer  
**Trạng thái:** Đã triển khai

---

## 📌 Yêu Cầu Chung

### Chức Năng Cho User
- Xem lịch sử thanh toán của chính mình
- Hiển thị: Mã đơn, Tên sân, Số tiền thanh toán, Số tiền hoàn (nếu có), Ngày giao dịch, Trạng thái, Loại giao dịch (Thanh toán / Hoàn tiền)

### Chức Năng Cho Owner
- Xem lịch sử thanh toán và hoàn tiền của tất cả đơn đặt sân thuộc sân của mình
- Hiển thị thêm: Tên người đặt, Số điện thoại, Phương thức thanh toán, Trạng thái đơn, Doanh thu thực nhận sau khi trừ hoàn tiền

### Yêu Cầu Kỹ Thuật
- Tận dụng bảng `Payment` và `Booking` đã có
- Hỗ trợ phân trang và lọc theo thời gian
- Code sạch, comment tiếng Việt rõ ràng

---

## 🎯 Quyết Định Thiết Kế (Sau Trao Đổi)

### 1. Hiển Thị Giao Dịch
**Lựa chọn:** Option A - Kết hợp  
**Mô tả:** Thanh toán và Hoàn tiền được hiển thị trong **một danh sách chung** theo thời gian (mới nhất trước), không tách riêng tab.  
**Ví dụ:**
```
- 2026-05-10: Thanh toán +500.000đ
- 2026-05-12: Hoàn tiền -200.000đ
- 2026-05-13: Thanh toán +300.000đ
```

### 2. Lọc Theo Thời Gian
**Lựa chọn:** Option C - Cả hai  
**Mô tả:** Hỗ trợ cả:
- **Khoảng ngày chi tiết:** Chọn từ ngày → đến ngày (YYYY-MM-DD)
- **Lọc tháng/năm:** Lọc nhanh theo tháng/năm

**Mặc định:** Tháng hiện tại  
**Tính năng:** Người dùng có thể tùy chỉnh để xem các ngày cũ hơn

### 3. Phân Trang
**Lựa chọn:** Option B - Cuộn vô tận  
**Mô tả:** Load more button / Infinite scroll
- Mặc định load 10 bản ghi/lần
- Button "Tải thêm" hoặc tự động load khi scroll xuống

### 4. Dữ Liệu Cho Owner
**Thêm đầy đủ:** Số điện thoại + Phương thức thanh toán + Trạng thái đơn

---

## 🔧 Chi Tiết Kỹ Thuật

### Backend API - Hai Endpoint

#### **A. GET `/booking/payment-history` - Cho User**

**Query Parameters:**
```
- startDate (YYYY-MM-DD) - Tùy chọn
- endDate (YYYY-MM-DD) - Tùy chọn
- month (MM) - Lọc theo tháng
- year (YYYY) - Lọc theo năm
- limit (number) - Mặc định: 10
- page (number) - Mặc định: 1
```

**Response Success (200):**
```json
{
  "success": true,
  "transactions": [
    {
      "bookingId": 123,
      "stadiumName": "Sân Bóng ABC",
      "amount": 500000,
      "refundAmount": 0,
      "transactionDate": "2026-05-10",
      "status": "paid",
      "type": "payment",
      "paymentMethod": "cash"
    },
    {
      "bookingId": 123,
      "stadiumName": "Sân Bóng ABC",
      "amount": 200000,
      "refundAmount": 200000,
      "transactionDate": "2026-05-12",
      "status": "refunded",
      "type": "refund",
      "paymentMethod": "cash",
      "refundReason": "Khách hủy đơn"
    }
  ],
  "total": 45,
  "hasMore": true,
  "currentPage": 1,
  "limit": 10
}
```

**Logic Xử Lý:**
- Lấy tất cả Booking của user, nhưng chỉ hiển thị booking có phát sinh giao dịch tài chính thật sự
- Với mỗi booking:
  - Tạo 1 transaction "payment" nếu `amount_paid > 0` và có bằng chứng đã thanh toán
  - Tạo 1 transaction "refund" nếu `refunded_at != null`
- Kết hợp dữ liệu từ Booking + Field → Stadium
- Sắp xếp theo `payment_recorded_at/refunded_at` giảm dần, có fallback về dữ liệu cũ
- Áp dụng filter theo khoảng ngày hoặc tháng/năm

---

#### **B. GET `/booking/owner/payment-history` - Cho Owner**

**Query Parameters:** Giống endpoint User

**Response Success (200):**
```json
{
  "success": true,
  "transactions": [
    {
      "bookingId": 123,
      "stadiumName": "Sân Bóng ABC",
      "userName": "Nguyễn Văn A",
      "userPhone": "0912345678",
      "amount": 500000,
      "refundAmount": 0,
      "actualRevenue": 500000,
      "transactionDate": "2026-05-10",
      "status": "paid",
      "type": "payment",
      "paymentMethod": "cash",
      "bookingStatus": "confirmed"
    },
    {
      "bookingId": 124,
      "stadiumName": "Sân Bóng ABC",
      "userName": "Trần Thị B",
      "userPhone": "0987654321",
      "amount": 300000,
      "refundAmount": 300000,
      "actualRevenue": 0,
      "transactionDate": "2026-05-11",
      "status": "refunded",
      "type": "refund",
      "paymentMethod": "transfer",
      "bookingStatus": "cancelled",
      "refundReason": "Lỗi kỹ thuật"
    }
  ],
  "total": 120,
  "hasMore": true,
  "currentPage": 1,
  "limit": 10,
  "summary": {
    "totalPayment": 50000000,
    "totalRefund": 5000000,
    "netRevenue": 45000000
  }
}
```

**Logic Xử Lý:**
- Lấy tất cả Stadium của owner
- Lấy tất cả Booking của các sân đó, kể cả `cancelled` nếu booking có phát sinh thanh toán hoặc hoàn tiền
- Kết hợp dữ liệu từ Booking + User + Field → Stadium
- Tính `actualRevenue`:
  - Nếu type="payment": actualRevenue = amount
  - Nếu type="refund": actualRevenue = 0 (hoàn tiền là âm)
- Tính tổng hợp: tổng thanh toán, tổng hoàn tiền, doanh thu ròng
- Áp dụng filter + phân trang

---

### Frontend Component - `PaymentHistory.jsx`

**Location:** `frontend/src/pages/PaymentHistory.jsx`

**UI Structure:**

1. **Header Section:**
   - Tiêu đề: "Lịch Sử Thanh Toán"
   - Quick filter buttons: "Tháng này" | "Tùy chỉnh"
   - DatePicker: Từ ngày → Đến ngày (ẩn khi không chọn "Tùy chỉnh")
   - Buttons: "Lọc" + "Reset"

2. **Summary Section (Card):**
   - **User:**
     - Tổng thanh toán trong khoảng
     - Tổng hoàn tiền trong khoảng
   - **Owner (thêm):**
     - Tổng thanh toán
     - Tổng hoàn tiền
     - **Doanh thu thực (Tổng - Hoàn)**

3. **Transaction List:**
   - Table hoặc Card list
   - Mỗi dòng hiển thị:
     - Mã đơn, Tên sân, Người đặt (Owner only), Số tiền
     - Trạng thái, Loại giao dịch, Ngày, Phương thức
   - Icon để phân biệt Thanh toán (↑ xanh) vs Hoàn tiền (↓ đỏ)

4. **Pagination:**
   - Button "Tải thêm" cuối danh sách
   - Hoặc infinite scroll tự động load

---

### Routes & Controllers

**Backend Routes (`bookingRoutes.js`):**
```javascript
// Thêm hai route
router.get("/payment-history", verifyToken, bookingController.getUserPaymentHistory);
router.get("/owner/payment-history", verifyToken, bookingController.getOwnerPaymentHistory);
```

**Controllers (`bookingController.js`):**
- `getUserPaymentHistory(req, res)` - Xử lý logic lấy lịch sử cho user
- `getOwnerPaymentHistory(req, res)` - Xử lý logic lấy lịch sử cho owner

---

### Models
- Sử dụng Booking model hiện có
- Đã bổ sung `payment_recorded_at` để lưu mốc ghi nhận thanh toán thực tế
- Payment model hiện tại chưa được sử dụng, có thể nâng cấp sau

---

## 📁 Files Sẽ Tạo/Sửa

### Backend
- [x] `backend/controllers/bookingController.js` - Thêm 2 method
- [x] `backend/routes/bookingRoutes.js` - Thêm 2 routes

### Frontend
- [x] `frontend/src/pages/PaymentHistory.jsx` - Component chính
- [x] `frontend/src/services/paymentHistoryService.js` - API service

### Documentation
- [x] `DAILY_REPORT_PAYMENT_HISTORY.md` - Report cuối cùng

---

## ✅ Checklist Triển Khai

- [x] Tạo method `getUserPaymentHistory()` trong bookingController
- [x] Tạo method `getOwnerPaymentHistory()` trong bookingController
- [x] Thêm routes vào bookingRoutes.js
- [x] Tạo PaymentHistory.jsx component
- [x] Tạo paymentHistoryService.js
- [x] Add route `/payment-history` trong frontend router
- [x] Test endpoint User
- [x] Test endpoint Owner
- [x] Test filter theo ngày/tháng
- [x] Test load more / pagination
- [x] Tạo DAILY_REPORT_PAYMENT_HISTORY.md

---

## 🎓 Ghi Chú Quan Trọng

1. **Payment vs Refund:** Mỗi booking có thể tạo 2 transaction (payment + refund)
2. **Kết hợp dữ liệu:** Cần join Booking → Field → Stadium để lấy tên sân
3. **Owner filter:** Chỉ show booking của sân của owner đó
4. **Mặc định ngày:** Mặc định hiển thị dữ liệu của tháng hiện tại
5. **Doanh thu thực:** Owner = amount - refundAmount (chỉ tính khi refunded)
6. **Bằng chứng thanh toán:** Không hiển thị payment transaction nếu booking chưa có bằng chứng thanh toán thành công
7. **Mốc thanh toán:** Dùng `payment_recorded_at` để tránh lệch lịch sử theo tháng/ngày

## Cập Nhật Triển Khai Thực Tế

- Owner dùng route `/owner/payment-history` để xem toàn bộ lịch sử thanh toán và hoàn tiền của các sân thuộc mình.
- User dùng route `/payment-history` để xem lịch sử thanh toán và hoàn tiền của chính mình.
- Sidebar tài khoản có link truy cập nhanh tới màn lịch sử thanh toán.
- Admin vẫn giữ màn `refund-history` riêng, không mở rộng trong phạm vi lần này.

---

## ✅ Kết Quả Triển Khai

- Backend đã có 2 endpoint lịch sử thanh toán cho user và owner.
- Frontend đã có màn `PaymentHistory` dùng chung cho user và owner.
- Build frontend và test backend đều pass.
