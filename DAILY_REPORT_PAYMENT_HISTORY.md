# Daily Report: Payment History

## Hoàn thành
- Thêm 2 endpoint lịch sử thanh toán cho user và owner.
- Thêm helper xử lý transaction history từ dữ liệu booking.
- Thêm route backend cho `payment-history`.
- Thêm service frontend gọi API lịch sử thanh toán.
- Thêm trang `PaymentHistory.jsx` dùng chung cho user và owner.
- Thêm route frontend `/payment-history` và `/owner/payment-history`.

## Logic đã chốt
- Một booking chỉ xuất hiện trong lịch sử khi có giao dịch tài chính thật sự.
- Payment transaction cần có `amount_paid > 0` và bằng chứng thanh toán thành công.
- Refund transaction xuất hiện khi có `refunded_at`.
- Booking `cancelled` vẫn được hiển thị nếu có thanh toán hoặc hoàn tiền.
- Mặc định lọc theo tháng hiện tại.
- Lọc ngày/tháng dùng boundary cố định theo giờ Việt Nam `UTC+07:00`.
- Pagination đang chạy theo `page` và `limit`.

## Bổ sung kỹ thuật
- Bổ sung cột `payment_recorded_at` trong `Booking` để lưu thời điểm ghi nhận thanh toán.
- Loại bỏ việc trả raw `booking` object trong payload transaction.
- Siết `updatePaymentStatus` để tránh:
  - tự nâng booking sang paid khi thiếu tín hiệu thanh toán
  - mở lại booking đã xử lý
  - giải phóng hold khi booking vẫn unpaid

## Xác minh
- `backend`: `npm.cmd test` pass với 28 tests.
- `frontend`: `npm.cmd run build` pass.

## Ghi chú
- Vẫn còn một log debug nhỏ trong `cancelBooking` dùng `req.params.bookingId` thay vì `req.params.id`; không ảnh hưởng logic nhưng nên dọn ở lần polish tiếp theo.
