# Admin UI Redesign Design

## Goal

Redesign khu admin để đồng bộ hơn với phần user và owner về màu sắc, card, button và spacing, nhưng vẫn giữ cấu trúc điều hướng và bố cục riêng của admin. Mục tiêu là để toàn bộ frontend nhìn như cùng một sản phẩm, thay vì admin mang một visual language tách biệt.

## Scope

Trong phase này, chỉ thay đổi presentation layer của:

- `frontend/src/pages/AdminLayout.jsx`
- `frontend/src/pages/AdminDashboard.jsx`
- CSS dùng chung liên quan trong `frontend/src/App.css`

Không thay đổi:

- route
- API
- logic lấy dữ liệu
- flow gửi thông báo hệ thống
- quyền hạn và hành vi nghiệp vụ hiện tại

Các màn admin khác như `AdminUsers`, `AdminStadiums`, `AdminComplaints`, `AdminActivityLogs` chưa redesign trong phase này, nhưng sẽ là đối tượng kế tiếp bám theo cùng visual system.

## Updated Design Direction

Hướng thiết kế mới được chốt là:

- giữ cấu trúc admin đã làm: `topbar + dropdown navigation`
- giữ bố cục dashboard: `hero ngắn + KPI grid + quick actions + broadcast panel`
- bỏ visual nghiêng enterprise teal
- kéo toàn bộ ngôn ngữ thị giác của admin về gần hệ user/owner hơn

Admin sẽ đồng bộ với user/owner ở các tầng sau:

- màu sắc
- card surface
- button treatment
- border softness
- shadow softness
- radius
- spacing

Admin sẽ **không** bê nguyên bố cục user/owner, mà chỉ dùng chung visual language.

## Color System

### Primary Accent

Màu nhấn chính của admin sẽ là **cam**, cùng họ với user/owner.

### Secondary Accent

Màu xanh chỉ được giữ ở vai trò phụ:

- trạng thái hệ thống ổn định
- trạng thái tích cực
- tín hiệu hỗ trợ

Nó không còn là màu dẫn dắt toàn giao diện admin.

### Surface and Text

Admin sẽ dùng lại hệ sáng của frontend hiện tại:

- nền sáng
- surface trắng
- text xanh đậm
- border mềm
- shadow nhẹ

Nguyên tắc:

- cam là màu nhấn chính cho CTA, active state và visual focus
- xanh là tín hiệu trạng thái phụ
- tránh dark gradient lớn
- tránh làm admin trông như một sản phẩm tách rời

## Information Architecture

Phase đầu vẫn giữ hai quyết định đã chốt:

- `AdminLayout` dùng `topbar + dropdown navigation`
- `AdminDashboard` ưu tiên `nhiều KPI + quick actions`

Điều thay đổi là visual treatment, không phải structure.

## AdminLayout

### Structure

`AdminLayout` vẫn dùng:

- topbar sticky
- brand admin bên trái
- navigation switcher dạng dropdown ở giữa
- cụm account/actions bên phải

Đây tiếp tục là shell chính cho admin vì phù hợp với nhu cầu điều hướng, nhưng phần nhìn sẽ được kéo gần về `MainLayout` và các panel/account shell của user/owner.

### Visual Behavior

Topbar mới cần:

- sáng
- blur nhẹ
- border mảnh
- khoảng thở thoáng
- typography cùng hệ

`navigation switcher` cần nhìn như một control nằm cùng họ với:

- account trigger
- filter panel
- secondary button

Dropdown menu cần:

- là card trắng bo lớn
- shadow mềm
- phân nhóm rõ
- item active dùng nền cam nhạt và chữ cam đậm

Account drawer cần:

- cùng tinh thần với account drawer/page shell của user/owner
- section title rõ
- item spacing thoáng
- action row mềm, sáng, đồng nhất

### Desired Feel

`AdminLayout` phải cho cảm giác:

- vẫn là khu quản trị
- nhưng là khu quản trị của cùng một website
- không phải một dashboard tách thương hiệu

## AdminDashboard

### Layout Priority

Dashboard vẫn theo thứ tự:

1. hero ngắn
2. KPI grid 4 ô
3. quick actions là khối chính
4. broadcast panel là khối phụ

Không bổ sung analytics sâu hay chart phức tạp trong phase này.

### Hero

Hero đầu trang sẽ chuyển sang tinh thần gần owner workspace hơn:

- ngắn
- sạch
- nền sáng
- có thể dùng gradient rất nhẹ
- không dùng panel tối làm điểm nhấn chính

Hero chỉ cần:

- nhắc ngữ cảnh điều hành
- tạo visual hierarchy đầu trang
- đưa 1 đến 2 CTA quan trọng

### KPI Cards

KPI cards sẽ bám gần hệ owner/user hơn:

- card trắng
- icon block màu nhạt
- số lớn dễ scan
- hint ngắn
- điểm nhấn cam vừa phải

Mục tiêu là nhìn vào thấy quen với design system toàn site, không bị “lệch admin”.

### Quick Actions

Quick actions được chốt theo hướng:

- giống owner panel hơn
- gọn
- chuyên nghiệp
- ít phô diễn

Nó không nên giống field card của user. Đây là action panel dành cho thao tác quản trị, nên cần:

- icon nền mềm
- title ngắn
- mô tả súc tích
- hover nhẹ
- card rõ nhưng không quá nhiều hiệu ứng

### Broadcast Panel

Khối thông báo hệ thống vẫn là công cụ phụ trợ, nhưng visual sẽ đổi sang cùng hệ card sáng như các panel khác.

Nó không nên dùng dark gradient riêng vì điều đó phá tính thống nhất với:

- owner workspace
- account pages
- listing/detail pages

## Component Alignment With User/Owner

Admin không sao chép từng component từ user/owner, nhưng phải cùng rule hệ thống:

- button primary cùng ngôn ngữ với primary action của site
- button secondary cùng logic với surface button hiện có
- card cùng border radius và shadow family
- spacing cùng nhịp
- section shell cùng tinh thần với owner panel/account card

Mức đồng bộ được chốt là:

- giống màu
- giống button
- giống card
- giống khoảng thở

Nhưng không bắt buộc giống toàn bộ look & feel.

## Responsive Strategy

Responsive vẫn theo logic cũ:

- topbar giữ vai trò chính trên mobile
- dropdown và account area thu gọn hợp lý
- KPI grid co từ nhiều cột về ít cột
- quick actions co theo lưới nhỏ hơn
- hero giữ ngắn để không chiếm quá nhiều chiều cao

Điểm cần chú ý là khi đổi sang visual cùng hệ user/owner, mobile admin vẫn phải rõ là khu quản trị chứ không bị “quá giống” màn người dùng phổ thông.

## Implementation Boundaries

Khi cập nhật implementation, chỉ nên:

- giữ structure admin hiện tại
- thay visual tokens/class styling để đồng bộ với user/owner
- bỏ những phần còn mang chất teal enterprise
- chỉnh microcopy nếu cần để phù hợp layout mới

Không nên:

- đổi lại điều hướng admin sang sidebar
- đổi flow dashboard
- mở rộng sang các màn admin khác
- thay logic backend

## Testing and Verification Expectations

Sau khi cập nhật code theo hướng mới, cần kiểm tra:

- admin shell vẫn hoạt động đúng
- dropdown navigation vẫn mở/đóng và highlight đúng
- dashboard vẫn lấy dữ liệu đúng
- broadcast form vẫn giữ nguyên behavior
- visual mới không làm vỡ responsive
- test admin hiện có vẫn phản ánh đúng intent

## Success Criteria

Phase này được coi là thành công khi:

- admin nhìn thống nhất hơn rõ rệt với user/owner
- toàn site có cùng một design language
- admin vẫn giữ được cấu trúc điều hướng và tính chất quản trị riêng
- không còn cảm giác admin là một giao diện thuộc “hệ khác”
- code presentation vẫn gọn và dễ mở rộng cho các màn admin tiếp theo
