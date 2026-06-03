# Stadium Shared Menu And In-Session Orders Plan

## Mục tiêu triển khai

Triển khai mô hình:
- mỗi `khu sân` có một `menu chung`
- owner quản menu ngay từ màn quản lý khu sân
- user chọn món trong bước checkout trước khi thanh toán booking
- user được gọi thêm món trong lúc đang chơi
- món phát sinh thanh toán bằng `ví` hoặc `chuyển khoản`

## Nguyên tắc triển khai

- dùng `stadium_id` làm nguồn chuẩn cho menu
- giữ `FoodOrder` gắn với `booking` và `field`
- không phá luồng booking/payment hiện tại
- tách rõ payment reference giữa booking và food order phát sinh

## Bước 1. Chuyển schema menu sang cấp khu sân

### Model

Đổi `MenuItem`:
- từ gắn `field_id`
- sang gắn `stadium_id`

### Migration

- thêm `stadium_id` vào `menu_items`
- backfill từ:
  - `menu_items.field_id`
  - `fields.stadium_id`
- thêm index cho `stadium_id`
- chuyển logic app sang `stadium_id`
- chỉ cân nhắc dọn `field_id` sau khi mọi thứ ổn

## Bước 2. Cập nhật backend menu service/controller

### Service

Cập nhật [foodOrderService.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/utils/foodOrderService.js:1):

- resolve menu theo `stadium_id`
- owner chỉ quản lý menu của khu sân mình sở hữu
- thêm đủ thao tác:
  - thêm món
  - sửa món
  - xóa món
  - bật/tắt còn bán

### Controller/Routes

Cập nhật menu controller và routes để:
- lấy menu theo `stadium`
- quản lý món theo `stadium`

Mục tiêu là frontend owner có thể gọi trực tiếp vào menu của khu sân.

## Bước 3. Thêm nút quản lý menu ở màn khu sân

### UI owner stadium list

Trong trang quản lý khu sân:
- mỗi card `khu sân` có thêm nút `Quản lý menu`

Nút này dẫn tới một trang menu theo `stadiumId`.

### Kết quả mong muốn

Owner quản menu theo đúng khu sân, không còn phải đi đường vòng qua sân con.

## Bước 4. Nâng cấp trang menu khu sân

Trang quản lý menu khu sân cần:
- hiển thị danh sách món
- thêm món
- sửa món
- xóa món
- bật/tắt còn bán
- ảnh món

Copy/UI phải thể hiện rõ đây là menu chung của `khu sân`.

## Bước 5. Tích hợp chọn món vào bước checkout đặt sân

### Mục tiêu

Khi user chọn sân + khung giờ và đi tới bước thanh toán booking:
- hiển thị thêm block `Đồ ăn và nước uống`

### Logic

- resolve `field_id -> stadium_id`
- lấy menu đang bán của khu sân
- cho user chọn món
- cộng tiền món vào tổng thanh toán booking

### Payment

Nếu thanh toán booking bằng:
- `ví`: xử lý toàn bộ cùng lúc
- `chuyển khoản`: tổng chuyển khoản bao gồm tiền sân + tiền món

## Bước 6. Tạo food order ngay trong luồng checkout

Khi user xác nhận booking có món:
- tạo booking
- tạo food order đính kèm booking
- lưu chi tiết món đã chọn
- đảm bảo `payment_status` của food order phù hợp theo payment method của booking

Mục tiêu:
- món chọn trước checkout không bị mất
- user không phải tạo lại sau khi booking thành công

## Bước 7. Cho gọi thêm món trong khi đang chơi

### Điều kiện hiển thị

Trong `BookingDetailPage` hoặc trang lịch sử booking:
- chỉ hiện block `Gọi thêm món` nếu:
  - booking thuộc user hiện tại
  - thời gian hiện tại nằm trong `start_time -> end_time`

### Logic

- resolve menu theo `stadium`
- chỉ hiển thị món `is_available = true`
- user chọn món phát sinh

## Bước 8. Thanh toán món phát sinh bằng ví hoặc chuyển khoản

### Ví

- tạo order món
- trừ ví ngay
- `payment_status = paid`

### Chuyển khoản

- tạo food order pending payment
- sinh `payment_reference` riêng cho food order
- hiển thị QR/chuyển khoản
- khi webhook xác nhận đúng giao dịch:
  - cập nhật `payment_status = paid`

### Quy tắc reference

Không dùng chung mã với booking.

Ví dụ:
- booking: `BK123`
- food order phát sinh: `FO123-1`

## Bước 9. Cập nhật UI chi tiết booking / lịch sử booking

### Trước giờ chơi

- không hiện block gọi thêm món

### Trong giờ chơi

- hiện block gọi thêm món
- có chọn payment method:
  - `Ví`
  - `Chuyển khoản`

### Sau giờ chơi

- ẩn block gọi thêm món

## Bước 10. Test backend

### Cần test

- menu resolve theo `stadium_id`
- owner chỉ quản menu khu sân của mình
- checkout có món tạo đúng booking + food order
- tổng booking payment bao gồm món
- in-session order chỉ cho phép trong giờ chơi
- ví trả cho order món phát sinh hoạt động đúng
- chuyển khoản cho order món phát sinh sinh đúng reference

## Bước 11. Test frontend

### Cần test

- nút `Quản lý menu` xuất hiện ở card khu sân
- trang menu khu sân thao tác đúng
- checkout hiển thị block chọn món
- booking detail/history hiển thị gọi thêm món đúng điều kiện thời gian
- chọn `ví` và `chuyển khoản` cho món phát sinh hiển thị đúng UI

## Bước 12. Verification thủ công

### Owner flow

- vào khu sân
- bấm `Quản lý menu`
- thêm/sửa/xóa/tắt bán món

### User booking flow

- chọn sân và khung giờ
- thấy block đồ ăn / nước uống
- chọn món
- thanh toán booking thành công

### In-session flow

- mở booking đang trong giờ chơi
- gọi thêm món
- test thanh toán bằng ví
- test thanh toán bằng chuyển khoản

## Rủi ro cần chú ý

- chuyển từ `field_id` sang `stadium_id` phải migration dữ liệu cẩn thận
- cần tránh trùng/nhầm payment reference giữa booking và food order
- nếu booking payment và food order payment cùng là chuyển khoản, UI phải phân biệt thật rõ

## Thứ tự triển khai khuyên dùng

1. migration + model `stadium_id`
2. backend menu logic theo khu sân
3. nút `Quản lý menu` ở màn khu sân
4. owner menu page
5. tích hợp menu vào checkout booking
6. in-session extra order
7. payment for extra order
8. test + verify
