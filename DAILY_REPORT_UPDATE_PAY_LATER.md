# DAILY REPORT: CẬP NHẬT NÚT "THANH TOÁN SAU"

## Tổng quan
Cập nhật hành vi của nút "Thanh toán sau" trong luồng đặt sân để tăng cường trải nghiệm người dùng và nhắc nhở về quy định thanh toán.

## Các thay đổi đã thực hiện

### 1. Hiển thị thông báo nhắc nhở
Khi người dùng nhấn nút **"Thanh toán sau"**, hệ thống sẽ hiển thị một cửa sổ thông báo (SweetAlert2) với nội dung:
> "Bạn cần thanh toán trước hoặc 50% để hoàn tất đặt sân này!"

### 2. Điều hướng quay lại trang chi tiết sân
Thay vì quay lại trang lịch sử như trước, sau khi người dùng nhấn "Đồng ý" trên thông báo, hệ thống sẽ tự động điều hướng quay lại trang **Chi tiết sân (FieldDetail)** nơi người dùng vừa mới chọn giờ chơi. 
- Việc này giúp người dùng dễ dàng thực hiện lại thao tác hoặc thay đổi lựa chọn mà không cần phải tìm lại sân từ đầu.
- Hệ thống lấy thông tin `field_id` từ đơn hàng hiện tại để đảm bảo điều hướng đúng trang.

### 3. Đồng bộ trên các phương thức thanh toán
Thay đổi này đã được áp dụng đồng nhất trên cả hai trang thanh toán:
- **VNPay** (`PaymentPage.jsx`)
- **MoMo** (`PaymentMoMo.jsx`)

## Những file đã chỉnh sửa
1. `frontend/src/pages/PaymentPage.jsx`: Thêm hàm `handlePayLater` và tích hợp `Swal`.
2. `frontend/src/pages/PaymentMoMo.jsx`: Thêm hàm `handlePayLater`, tích hợp `Swal` và bổ sung logic lấy thông tin sân để điều hướng.

## Cách test
1. Chọn một sân bất kỳ và nhấn "Xác nhận đặt sân".
2. Tại trang quét mã QR, nhấn nút **"Thanh toán sau"**.
3. Xác nhận thông báo hiện lên.
4. Kiểm tra xem trình duyệt có quay lại đúng trang chi tiết của sân vừa chọn hay không.
