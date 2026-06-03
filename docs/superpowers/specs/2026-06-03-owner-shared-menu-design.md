# Owner Shared Menu Design

## Mục tiêu

Chuyển chức năng đồ ăn và nước uống từ `menu theo từng sân` sang `một menu dùng chung cho toàn bộ các sân của owner`.

Mục tiêu nghiệp vụ:
- owner chỉ quản lý một danh sách món duy nhất
- mọi sân thuộc owner đó đều dùng chung danh sách món này
- user chỉ thấy các món đang bán
- đơn món vẫn phải gắn với `booking` và `field` cụ thể để biết giao ở sân nào

## Phạm vi

Trong phạm vi thay đổi này:
- đổi nguồn dữ liệu menu từ cấp `field` sang cấp `owner`
- hoàn thiện thao tác quản lý menu cho owner:
  - thêm món
  - sửa món
  - xóa món
  - bật/tắt còn bán
- giữ luồng order món gắn với booking hiện tại

Ngoài phạm vi:
- không thêm thanh toán online riêng cho đồ uống
- không thêm menu khác nhau theo từng sân
- không thay đổi luồng giao đơn món ngoài các trạng thái hiện có

## Thiết kế dữ liệu

### Hiện trạng

Hiện tại `MenuItem` đang gắn với `field_id`, nên mỗi sân có một menu riêng.

### Thiết kế mới

`MenuItem` sẽ gắn với `owner_id` thay vì `field_id`.

Ý nghĩa:
- một owner có một menu master
- mọi sân của owner cùng dùng menu đó

Các trường chính của `MenuItem` vẫn giữ:
- `name`
- `price`
- `image`
- `is_available`

Thay đổi chính:
- bỏ phụ thuộc truy vấn theo `field_id`
- chuyển sang truy vấn theo `owner_id`

`FoodOrder` và `FoodOrderItem` vẫn giữ cách gắn với:
- `booking_id`
- `field_id`
- `user_id`

Điều này giúp:
- biết đơn món phát sinh ở sân nào
- không mất khả năng vận hành theo từng sân

## Luồng hiển thị

### Owner

Owner có một trang quản lý menu chung.

Trang này hiển thị:
- danh sách món hiện có
- ảnh món nếu có
- giá
- trạng thái `đang bán / hết món`

Owner thao tác trực tiếp trên từng món:
- thêm món mới
- sửa tên / giá / ảnh
- bật/tắt còn bán
- xóa món

### User

Khi user đặt sân hoặc gọi món ở bất kỳ sân nào thuộc owner:
- hệ thống lấy menu theo `owner` của sân
- chỉ hiển thị món `is_available = true`

User không cần biết menu đó là menu chung hay menu riêng. Trải nghiệm vẫn là:
- chọn món
- tạo order
- order gắn đúng booking và sân đang chơi

## Quyền truy cập

### Owner

Owner chỉ được quản lý menu của chính mình.

Rule:
- owner A không được xem/sửa/xóa menu của owner B
- admin vẫn có thể đi qua luồng quản trị nếu hệ thống hiện tại đã cho phép

### User

User chỉ được:
- xem menu công khai của owner ứng với sân mình đang đặt
- tạo order món cho booking hợp lệ của mình

## API và logic backend

### Truy vấn menu

Các API lấy menu sẽ đổi từ:
- `menu theo field`

sang:
- `menu theo owner của field`

Backend sẽ:
1. nhận `fieldId` hoặc `bookingId`
2. resolve ra `owner_id`
3. lấy `MenuItem` theo `owner_id`

### Quản lý menu

API owner menu cần hỗ trợ đầy đủ:
- tạo món
- sửa món
- xóa món
- cập nhật trạng thái `is_available`

Validation cơ bản:
- tên món không rỗng
- giá > 0
- ảnh là optional

### Tạo order món

Khi tạo food order:
1. resolve booking
2. resolve field của booking
3. resolve owner của field
4. lấy menu item theo `owner_id`
5. chỉ chấp nhận các món đang bán

Nếu món không thuộc owner của sân đó hoặc đã tắt bán:
- từ chối order

## Giao diện owner

Trang `OwnerFieldMenuPage` sẽ được chuyển từ tư duy `menu theo sân` sang `menu chung`.

Điểm thay đổi UI:
- tiêu đề và copy phải thể hiện đây là menu chung của owner
- danh sách món có action rõ ràng:
  - `Sửa`
  - `Xóa`
  - `Đang bán / Hết món`
- form thêm/sửa hỗ trợ:
  - tên món
  - giá
  - ảnh món

Nếu owner không có món nào:
- hiển thị empty state rõ ràng

## Xử lý tương thích dữ liệu cũ

Vì hệ thống hiện có đang lưu menu theo `field_id`, cần một bước migration dữ liệu.

Hướng migration:
1. thêm `owner_id` vào `MenuItem`
2. backfill `owner_id` từ `field -> stadium -> owner`
3. đổi logic đọc/ghi sang `owner_id`
4. sau khi ổn định mới cân nhắc bỏ `field_id` nếu không còn dùng

Để giảm rủi ro, nên giữ migration theo hướng tương thích:
- không xóa dữ liệu cũ ngay
- chuyển logic ứng dụng trước
- dọn schema sau khi xác nhận ổn

## Kiểm thử

### Backend

Cần test:
- owner chỉ xem được menu của mình
- tạo món theo owner thành công
- sửa / xóa / bật tắt món đúng quyền
- user đặt sân ở field A nhưng vẫn thấy menu chung của owner
- món đã tắt bán không order được
- order vẫn gắn đúng `booking` và `field`

### Frontend

Cần test:
- owner thấy danh sách menu chung
- thêm món mới cập nhật ngay trên UI
- sửa món và đổi trạng thái hiển thị đúng
- xóa món khỏi danh sách
- user chỉ thấy món đang bán

## Rủi ro và quyết định

### Rủi ro

- dữ liệu cũ đang theo `field_id`, nên migration phải cẩn thận
- nếu một owner trước đây tạo menu khác nhau cho từng sân, khi chuyển sang menu chung có thể xuất hiện món trùng

### Quyết định hiện tại

- ưu tiên đơn giản hóa vận hành
- chấp nhận `1 owner = 1 menu chung`
- không hỗ trợ menu khác nhau theo từng sân trong vòng này

## Kết quả mong muốn

Sau khi hoàn thành:
- owner chỉ cần quản lý một menu duy nhất
- mọi sân của owner dùng chung menu đó
- user thấy menu nhất quán ở mọi sân của owner
- đơn món vẫn theo dõi chính xác theo từng booking và từng sân
