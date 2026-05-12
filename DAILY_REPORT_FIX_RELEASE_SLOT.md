# DAILY REPORT: SỬA LỖI GIẢI PHÓNG KHUNG GIỜ KHI "THANH TOÁN SAU"

## Tổng quan
Sửa lỗi khung giờ vẫn bị khóa (hiển thị mờ) sau khi người dùng nhấn "Thanh toán sau" và quay lại trang chi tiết sân. 

## Nguyên nhân gây ra lỗi
Khi người dùng chuyển đến trang thanh toán, hệ thống đã tạo một đơn đặt sân tạm thời (pending) để giữ chỗ trong 5 phút. 
Ở phiên bản trước, khi nhấn **"Thanh toán sau"**, hệ thống chỉ điều hướng quay lại trang cũ mà không thông báo cho Backend hủy đơn hàng tạm thời này. Do đó, khung giờ vẫn bị coi là "đang được giữ" cho đến khi hết hạn 5 phút, khiến người dùng thấy nó bị mờ đi.

## Các giải pháp đã triển khai

### 1. Backend: Cập nhật hàm hủy đơn (`cancelBooking`)
- Bổ sung logic xóa `hold_until` (thời gian giữ chỗ).
- Tích hợp **Socket.io** để phát tín hiệu `slotReleased` ngay lập tức khi đơn hàng bị hủy. Việc này giúp tất cả người dùng (bao gồm chính người vừa hủy) thấy khung giờ sáng lại ngay lập tức mà không cần tải lại trang.

### 2. Frontend: Đồng bộ luồng hủy và điều hướng
- Cập nhật hàm `handlePayLater` trong `PaymentPage.jsx` và `PaymentMoMo.jsx`.
- Khi người dùng nhấn "Đồng ý" trên thông báo, hệ thống sẽ gọi API `PUT /api/bookings/cancel/:id` để hủy đơn hàng hiện tại trước khi thực hiện điều hướng quay lại trang Chi tiết sân.
- Sử dụng `async/await` để đảm bảo đơn hàng đã được hủy thành công ở phía máy chủ trước khi người dùng nhìn thấy trang cũ.

## Những file đã chỉnh sửa
1. `backend/controllers/bookingController.js`: Cập nhật logic `cancelBooking` và thêm Socket emit.
2. `frontend/src/pages/PaymentPage.jsx`: Cập nhật `handlePayLater` để gọi API hủy đơn.
3. `frontend/src/pages/PaymentMoMo.jsx`: Cập nhật `handlePayLater` để gọi API hủy đơn.

## Cách test
1. Chọn một sân, chọn giờ và nhấn "Xác nhận đặt sân".
2. Tại trang thanh toán, nhấn **"Thanh toán sau"**.
3. Nhấn "Đồng ý" trên popup.
4. Sau khi quay lại trang chi tiết sân, kiểm tra xem khung giờ vừa rồi đã **sáng lại bình thường** và có thể chọn lại được ngay lập tức hay chưa.
