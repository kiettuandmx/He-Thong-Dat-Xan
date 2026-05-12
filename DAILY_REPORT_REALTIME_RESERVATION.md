# DAILY REPORT: REALTIME TEMPORARY RESERVATION

## Tổng quan
Chức năng **Giữ chỗ tạm thời (Realtime Temporary Reservation)** đã được phát triển hoàn tất. Chức năng này giải quyết triệt để vấn đề "Race Condition" (nhiều người cùng đặt một sân cùng lúc) bằng cách áp dụng cơ chế khóa (lock) 5 phút kết hợp đồng bộ giao diện qua Socket.io.

## Các giải pháp đã triển khai

### 1. Cơ chế giữ chỗ tạm thời (Locking)
- Thêm cột `hold_until` vào bảng `bookings` để lưu trữ mốc thời gian giữ chỗ.
- Khi người dùng bấm "XÁC NHẬN ĐẶT SÂN", hệ thống tạo một booking mới với trạng thái `pending` và `hold_until` là thời điểm hiện tại cộng thêm 5 phút.
- **Ngăn chặn Race Condition**: Trong quá trình đặt, backend dùng `transaction.LOCK.UPDATE` để kiểm tra có ai đang khóa khung giờ đó hay không. Nếu có (chưa hết 5 phút), hệ thống sẽ trả về lỗi: *"Sân hiện đang được đặt, vui lòng thử lại sau!"*

### 2. Giao diện đếm ngược & Tự động huỷ
- **PaymentPage.jsx**: Bổ sung đồng hồ đếm ngược trực quan. Tính toán thời gian còn lại dựa vào `hold_until`. Nếu bộ đếm về 0, hệ thống tự báo lỗi và điều hướng về trang lịch sử.
- **Auto Release (Backend)**: Bổ sung 1 job `setInterval` chạy ngầm mỗi 1 phút trên Nodejs (`server.js`). Nếu có booking nào hết thời gian giữ chỗ (`hold_until < NOW()`) mà chưa thanh toán, hệ thống tự động đổi trạng thái thành `expired`.

### 3. Đồng bộ giao diện Realtime (Socket.io)
Trang `FieldDetail.jsx` nay đã kết nối trực tiếp với máy chủ qua `socket.io-client`:
- Bắt sự kiện `slotLocked`: Tự động ghi nhận sân đang bị giữ và mờ khung giờ đi. Nếu người dùng hiện tại đang lỡ chọn đúng khung giờ đó, một cảnh báo sẽ hiện lên.
- Bắt sự kiện `slotReleased`: Khi một sân bị nhả lock do quá giờ hoặc khách bỏ ngang, khung giờ đó sẽ sáng lại ngay lập tức cho những người khác chọn.
- Bắt sự kiện `slotConfirmed`: Gọi lại API để làm mới toàn bộ lịch sân sau khi có ai đó thanh toán thành công.

## Hướng dẫn Test Race Condition
1. **Chạy Migration**:
   ```bash
   cd backend
   npx sequelize-cli db:migrate
   ```
2. Mở 2 tab trình duyệt ẩn danh (đăng nhập 2 tài khoản khác nhau).
3. Vào trang chi tiết của **cùng 1 sân**, chọn **cùng 1 ngày**.
4. Chọn cùng 1 khung giờ. Sau đó ở tài khoản 1, nhấn "Xác nhận đặt sân".
5. Ngay lập tức ở tài khoản 2, khung giờ đó bị vô hiệu hóa (Nhờ Socket).
6. Nếu ở tài khoản 2 bạn có thủ thuật lách nút bấm để gửi request tạo booking lúc đó, API sẽ trả về thông báo lỗi: *"Sân hiện đang được đặt..."*.
7. Để tab tài khoản 1 ở trang thanh toán đợi 5 phút -> Đồng hồ về 0 -> Tự văng ra -> Sân ở tab 2 sáng lại bình thường.

## Lưu ý
- Server cần chạy liên tục để bộ xả lock `setInterval` hoạt động. Trong thực tế môi trường production, có thể thay thế bằng CRON Job chuyên dụng hoặc Redis TTL cho các hệ thống lớn hơn. 
- Sau khi chạy migration, hãy restart lại server Backend và Frontend để kết nối Socket có thể nhận tín hiệu tốt nhất.
