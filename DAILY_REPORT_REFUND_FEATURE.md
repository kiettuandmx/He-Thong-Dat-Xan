# DAILY REPORT: REFUND FEATURE IMPLEMENTATION

## Tổng quan
Chức năng "Hoàn tiền đơn đặt sân" đã được triển khai thành công cho Owner. Chức năng này cho phép chủ sân hoàn tiền cho các đơn đã được duyệt (confirmed), cập nhật trạng thái đơn hàng, và tự động trừ số tiền đó ra khỏi doanh thu hiển thị trên Dashboard.

## Các file đã thay đổi/tạo mới

### Backend
1.  **[NEW]** `backend/migrations/20260508000001-add-refund-fields-to-bookings.js`: Migration thêm trường `refund_reason` và `refunded_at`.
2.  **[MODIFY]** `backend/models/booking.js`: Cập nhật model để nhận các trường mới.
3.  **[MODIFY]** `backend/controllers/bookingController.js`: Thêm hàm `refundBooking` xử lý logic hoàn tiền, transaction và thông báo.
4.  **[MODIFY]** `backend/routes/bookingRoutes.js`: Thêm route `PUT /api/bookings/refund/:id`.

### Frontend
1.  **[MODIFY]** `frontend/src/pages/BookingHistory.jsx`:
    -   Thêm hàm `handleRefund` gọi API hoàn tiền.
    -   Thêm nút **"Hoàn tiền"** cho Owner khi đơn ở trạng thái "Đã duyệt".
    -   Cập nhật hiển thị trạng thái "Đã hoàn tiền" (màu xanh cyan/info).

## Logic hoàn tiền và cập nhật doanh thu
-   **Trạng thái**: Khi hoàn tiền, trạng thái đơn chuyển từ `confirmed` sang `refunded`.
-   **Doanh thu**: Vì Dashboard và Analytics tính doanh thu bằng cách `SUM` các đơn có trạng thái `confirmed`, nên khi chuyển sang `refunded`, số tiền của đơn đó sẽ tự động không còn nằm trong tổng doanh thu (tương đương với việc bị trừ đi).
-   **An toàn dữ liệu**: Sử dụng `Sequelize Transaction` để đảm bảo việc cập nhật đơn hàng và tạo thông báo cho người dùng luôn đi kèm với nhau.

## Cách test chức năng
1.  **Chạy migration**: Bạn cần chạy lệnh sau ở thư mục `backend`:
    ```bash
    npx sequelize-cli db:migrate
    ```
2.  **Duyệt đơn**: Dùng quyền Owner duyệt một đơn đang chờ (pending) sang trạng thái "Đã duyệt".
3.  **Hoàn tiền**: Tại trang quản lý đơn của Owner, nhấn nút **"Hoàn tiền"** trên đơn vừa duyệt, nhập lý do.
4.  **Kiểm tra**:
    -   Trạng thái đơn đổi thành "Đã hoàn tiền".
    -   Doanh thu trong Dashboard giảm đi tương ứng.
    -   Người dùng nhận được thông báo về việc hoàn tiền.

## Lưu ý quan trọng
-   Chỉ các đơn đã được **Duyệt** mới có thể hoàn tiền.
-   Việc hoàn tiền trên hệ thống này mang tính chất cập nhật dữ liệu và thông báo, Owner cần thực hiện chuyển khoản thực tế cho khách hàng bên ngoài (nếu thanh toán qua ngân hàng) hoặc qua cổng thanh toán tích hợp.
