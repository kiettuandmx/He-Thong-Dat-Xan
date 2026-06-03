# Owner Shared Menu Plan

## Mục tiêu triển khai

Chuyển chức năng menu đồ ăn và nước uống từ `menu theo từng sân` sang `menu chung theo owner`, đồng thời hoàn thiện thao tác quản lý menu:
- thêm món
- sửa món
- xóa món
- bật/tắt còn bán

Luồng order món hiện có phải tiếp tục hoạt động, nhưng nguồn menu phải được resolve theo `owner` của sân/booking thay vì `field_id`.

## Nguyên tắc triển khai

- giữ luồng `FoodOrder` gắn với `booking` và `field`
- thay đổi theo hướng tương thích dữ liệu cũ trước, không phá đột ngột schema hiện tại
- ưu tiên migration an toàn và kiểm thử rõ cho cả backend lẫn frontend

## Bước 1. Cập nhật schema và migration dữ liệu

### Backend schema

- thêm `owner_id` vào model `MenuItem`
- bổ sung association giữa `User` và `MenuItem` nếu cần

### Migration

- tạo migration thêm cột `owner_id` vào bảng `menu_items`
- backfill `owner_id` từ:
  - `menu_items.field_id`
  - `fields.stadium_id`
  - `stadiums.owner_id`
- thêm index phù hợp cho `owner_id`

### Kết quả mong muốn

- mọi menu item cũ đều có `owner_id` hợp lệ
- chưa cần xóa `field_id` ở bước này

## Bước 2. Chuyển logic backend sang menu theo owner

### Service layer

Cập nhật [foodOrderService.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/utils/foodOrderService.js:1):

- `createMenuItem(...)`
  - không còn tạo theo `fieldId`
  - tạo theo `ownerId`

- `listFieldMenu(...)`
  - đổi logic thành:
    1. nhận `fieldId`
    2. resolve `owner_id` của sân đó
    3. lấy menu theo `owner_id`

- `resolveBookingAndMenuItems(...)`
  - khi tạo food order, resolve `owner_id` từ booking -> field -> stadium
  - chỉ lấy `MenuItem` thuộc `owner_id` đó
  - vẫn chỉ chấp nhận món `is_available = true`

### Controller layer

Cập nhật [menuController.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/controllers/menuController.js:1):

- route lấy menu theo `fieldId` vẫn có thể giữ nguyên cho frontend hiện tại
- nhưng bên trong sẽ resolve sang menu theo owner
- thêm endpoint:
  - cập nhật món
  - xóa món
  - cập nhật trạng thái `is_available`

### Kết quả mong muốn

- API hiện tại không vỡ contract không cần thiết
- menu trả về cho user đã là menu chung của owner

## Bước 3. Hoàn thiện quyền truy cập backend

### Quyền owner

- owner chỉ được tạo/sửa/xóa menu item thuộc chính mình
- nếu cố truy cập menu owner khác, trả `403`

### Quyền admin

- nếu project hiện tại cho admin override thì giữ tương thích

### Quyền user

- user chỉ được thấy menu của owner thuộc sân họ đang đặt
- user không thể order món đã tắt bán

## Bước 4. Nâng cấp giao diện owner menu

### Mục tiêu UI

Cập nhật [OwnerFieldMenuPage.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/pages/OwnerFieldMenuPage.jsx:1) để phản ánh đây là `menu chung`.

### Thay đổi cần làm

- đổi copy/text để thể hiện `menu chung toàn bộ sân`
- hiển thị danh sách món dạng card rõ ràng
- thêm thao tác:
  - `Sửa`
  - `Xóa`
  - `Đang bán / Hết món`
- form thêm/sửa hỗ trợ:
  - tên món
  - giá
  - ảnh món

### Kết quả mong muốn

- owner không cần vào từng sân để thêm menu riêng nữa
- thao tác menu tập trung và nhất quán hơn

## Bước 5. Giữ tương thích luồng user order món

### User-facing flow

Kiểm tra [FoodOrderPicker.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/components/FoodOrderPicker.jsx:1) và các service liên quan:

- user vẫn chọn món bình thường
- chỉ thấy món `is_available = true`
- subtotal vẫn tính đúng

### Order creation

Kiểm tra và cập nhật nơi gọi `createFoodOrder` để đảm bảo:
- booking của sân nào thì resolve owner của sân đó
- menu dùng chung nhưng order vẫn ghi đúng `field_id`

## Bước 6. Bổ sung test backend

### Cần thêm/sửa test cho:

- menu item cũ được resolve đúng theo `owner_id`
- lấy menu từ `fieldId` trả về menu chung của owner
- owner chỉ quản được menu của mình
- update/xóa/toggle món hoạt động đúng
- create food order dùng menu owner thay vì menu riêng từng sân
- món đã tắt bán không order được

Các file test liên quan khả năng sẽ gồm:
- [foodOrderController.test.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/tests/foodOrderController.test.js:1)
- [foodOrderService.test.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/tests/foodOrderService.test.js:1)

## Bước 7. Bổ sung test frontend

### Cần thêm/sửa test cho:

- owner page hiển thị menu chung
- thêm món mới thành công
- sửa món hiển thị đúng
- xóa món khỏi danh sách
- đổi trạng thái `đang bán / hết món` cập nhật đúng

Các file test liên quan:
- [owner-field-menu-page.test.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/test/owner-field-menu-page.test.jsx:1)
- [food-order-picker.test.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/test/food-order-picker.test.jsx:1)

## Bước 8. Verification

### Backend

Chạy:
- test backend liên quan menu và food order

### Frontend

Chạy:
- test page/menu picker liên quan
- `npm run build`

### Kiểm tra thủ công

- owner mở trang menu và thêm món
- owner sửa món, tắt bán, bật lại
- user vào đặt sân ở một sân bất kỳ của owner và thấy menu chung
- user không thấy món đã tắt bán
- order món vẫn tạo đúng theo booking/sân

## Rủi ro cần chú ý

- dữ liệu cũ có thể có nhiều menu item trùng tên giữa các sân của cùng owner
- trong giai đoạn chuyển tiếp, nếu cả `field_id` và `owner_id` cùng tồn tại, cần đảm bảo logic chỉ dùng một nguồn chuẩn
- phải tránh làm vỡ route hiện tại mà frontend đang gọi

## Thứ tự triển khai khuyên dùng

1. Migration + model `owner_id`
2. Service/backend logic
3. API update/delete/toggle
4. UI owner menu
5. Test backend/frontend
6. Build + verify thủ công
