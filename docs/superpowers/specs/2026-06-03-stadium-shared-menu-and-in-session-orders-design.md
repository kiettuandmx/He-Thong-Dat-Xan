# Stadium Shared Menu And In-Session Orders Design

## Mục tiêu

Thiết kế lại chức năng đồ ăn và nước uống theo mô hình:

- mỗi `owner` có nhiều `khu sân`
- mỗi `khu sân` có `một menu chung`
- owner quản lý menu trong chính trang quản lý `khu sân`
- user được chọn đồ ăn / thức uống ngay trong bước đặt sân trước khi thanh toán
- sau khi booking đã tạo, nếu người chơi đang còn trong khung giờ chơi thật của booking đó thì vẫn có thể gọi thêm món
- món phát sinh trong lúc chơi được thanh toán bằng `ví` hoặc `chuyển khoản`

## Phạm vi

Trong phạm vi thay đổi:
- đổi nguồn menu từ `field` sang `stadium/khu sân`
- thêm nút quản lý menu vào trang quản lý khu sân của owner
- cho phép chọn món trong checkout đặt sân
- cho phép gọi thêm món trong chi tiết/lịch sử booking nếu đang trong giờ chơi
- hỗ trợ thanh toán món bằng `ví` hoặc `chuyển khoản`

Ngoài phạm vi:
- không tách thành một hệ thống POS độc lập
- không hỗ trợ menu khác nhau theo từng sân con trong cùng khu
- không hỗ trợ gọi món sau khi khung giờ chơi đã kết thúc

## Mô hình dữ liệu

### Quy tắc chính

Menu sẽ gắn với `khu sân` (`stadium`) thay vì `field` hoặc `owner`.

Ý nghĩa:
- một khu sân có nhiều sân con
- các sân con trong cùng khu dùng chung một menu
- owner có thể có nhiều khu sân và mỗi khu sân có menu riêng

### MenuItem

`MenuItem` cần gắn với:
- `stadium_id`

Giữ các trường chính:
- `name`
- `price`
- `image`
- `is_available`

Không dùng `field_id` để xác định menu chuẩn nữa.

### FoodOrder

`FoodOrder` vẫn giữ gắn với:
- `booking_id`
- `field_id`
- `user_id`

Điều này giúp:
- biết đơn món thuộc booking nào
- biết giao ở sân con nào
- vẫn truy được khu sân thông qua `field -> stadium`

## Luồng owner quản lý menu

### Vị trí quản lý

Trong trang quản lý `khu sân` của owner, mỗi card khu sân sẽ có thêm nút:
- `Quản lý menu`

Owner bấm vào sẽ đi tới trang menu của `khu sân` đó.

### Chức năng trên trang menu khu sân

Owner được:
- thêm món
- sửa món
- xóa món
- bật/tắt còn bán

Các trường của món:
- tên món
- giá
- ảnh món
- trạng thái còn bán

## Luồng user chọn món trước thanh toán đặt sân

### Thời điểm hiển thị

Ngay sau khi user chọn:
- sân
- ngày
- khung giờ

và đi vào bước checkout trước thanh toán, hệ thống hiển thị thêm block:
- `Đồ ăn và nước uống`

### Nguồn dữ liệu menu

Hệ thống resolve:
- `field_id`
- tìm ra `stadium_id`
- lấy menu chung của `khu sân` đó

### Cách tính tiền

Tổng checkout sẽ gồm:
- tiền sân
- tiền món được chọn trước

Nếu user chọn `ví`:
- trừ ví cho toàn bộ phần cần trả

Nếu user chọn `chuyển khoản`:
- nội dung thanh toán vẫn gắn với booking
- phần tổng tiền phải bao gồm cả tiền món trong checkout

## Luồng user gọi thêm món trong lúc đang chơi

### Điều kiện được gọi thêm

User chỉ được gọi thêm món khi:
- booking thuộc về chính họ
- thời gian hiện tại đang nằm trong khoảng:
  - `start_time <= now <= end_time`

Nếu chưa tới giờ chơi:
- không cho gọi thêm trong lịch sử/chi tiết booking

Nếu đã quá giờ chơi:
- không cho gọi thêm nữa

### Vị trí hiển thị

Trong `chi tiết booking` hoặc `lịch sử booking` của chính đơn đó sẽ có thêm block:
- `Gọi thêm món`

### Menu hiển thị

Vẫn dùng menu chung của `khu sân` mà sân đó thuộc về.

Chỉ hiển thị món:
- `is_available = true`

### Thanh toán cho món phát sinh

Chỉ hỗ trợ:
- `ví`
- `chuyển khoản`

Không dùng `tiền mặt` trong phạm vi này.

## Luồng thanh toán món phát sinh

### Ví

Nếu user chọn `ví`:
- hệ thống tạo food order
- trừ ví ngay
- `payment_status = paid`

### Chuyển khoản

Nếu user chọn `chuyển khoản`:
- hệ thống tạo food order ở trạng thái chờ thanh toán
- sinh mã tham chiếu riêng cho food order hoặc mã gắn từ booking + suffix
- hiển thị QR/thông tin chuyển khoản
- khi ngân hàng xác nhận đúng giao dịch:
  - `payment_status = paid`
  - order món được xác nhận

### Ghi chú về reference

Vì booking và order món phát sinh là hai giao dịch khác nhau, cần tách reference để tránh nhầm webhook.

Ví dụ:
- booking: `BK123`
- food order phát sinh: `FO123-1`

Thiết kế cuối cùng của mã tham chiếu có thể tinh chỉnh ở plan/implementation, nhưng phải đảm bảo:
- match được chính xác
- không trùng với booking payment

## Quyền và giới hạn

### Owner

Owner chỉ được quản lý menu của các `khu sân` mình sở hữu.

### User

User chỉ được:
- chọn món ở bước checkout của booking mình đang tạo
- gọi thêm món cho booking của chính mình
- gọi thêm món khi đang còn trong khung giờ chơi

## API và backend logic

### Menu

Các API menu sẽ chuyển sang logic:
- lấy menu theo `stadium_id`

### Checkout booking

Luồng tạo booking cần nhận thêm dữ liệu món được chọn trước thanh toán.

Booking checkout sẽ:
1. tạo booking
2. tính tổng tiền sân
3. tạo food order nếu có món
4. cộng tiền món vào tổng phải thanh toán

### In-session food order

Tạo order món phát sinh sẽ:
1. kiểm tra booking tồn tại
2. kiểm tra quyền user
3. kiểm tra `now` có nằm trong giờ chơi
4. resolve menu theo `stadium`
5. tạo order món
6. xử lý payment theo `ví` hoặc `chuyển khoản`

## Giao diện

### Owner stadium list

Trong trang quản lý khu sân:
- thêm nút `Quản lý menu`

### Owner menu page

Trang menu khu sân có:
- danh sách món
- thêm món
- sửa món
- xóa món
- bật/tắt còn bán

### Booking checkout

Bổ sung section:
- `Đồ ăn và nước uống`

User chọn món ngay tại đây trước khi thanh toán.

### Booking detail/history

Nếu đang trong giờ chơi:
- hiển thị section `Gọi thêm món`

Nếu không còn trong giờ chơi:
- ẩn section này

## Kiểm thử

### Backend

Cần test:
- menu resolve theo `stadium`
- owner chỉ quản lý được menu khu sân của mình
- checkout tạo booking + food order đúng
- tổng thanh toán gồm cả tiền món
- in-session order chỉ cho phép trong giờ chơi
- thanh toán ví cho món phát sinh hoạt động đúng
- thanh toán chuyển khoản cho món phát sinh sinh đúng reference và chờ xác nhận đúng

### Frontend

Cần test:
- nút `Quản lý menu` xuất hiện ở card khu sân
- owner menu page thao tác thêm/sửa/xóa/toggle đúng
- checkout có section chọn món
- booking detail/history chỉ hiện gọi thêm món khi đang trong giờ chơi

## Rủi ro

- dữ liệu hiện tại đang gắn menu theo `field`, cần migration sang `stadium`
- cần phân biệt rõ payment reference giữa booking và food order phát sinh
- nếu thiết kế UI không rõ, user có thể nhầm giữa món chọn trước và món gọi thêm

## Kết quả mong muốn

Sau khi hoàn tất:
- mỗi khu sân có một menu chung riêng
- owner quản menu ngay từ màn quản lý khu sân
- user chọn món trước khi thanh toán đặt sân
- user có thể gọi thêm món trong lúc đang chơi
- món phát sinh thanh toán bằng ví hoặc chuyển khoản
