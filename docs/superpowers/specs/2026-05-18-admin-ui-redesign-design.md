# Admin UI Redesign Design

## Goal

Redesign khu admin theo hướng giao diện sáng, gọn, hiện đại và dễ scan, dựa trên tinh thần của `design.md` nhưng hòa vào visual language hiện tại của website thay vì bê nguyên dark enterprise style. Phase đầu chỉ tập trung vào `AdminLayout` và `AdminDashboard` để tạo nền visual chung cho các màn admin về sau.

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

## Design Direction

Hướng thiết kế được chốt là một hybrid giữa hệ thiết kế trong `design.md` và frontend hiện tại:

- giữ nền sáng, sạch, dễ đọc của website hiện tại
- mượn bố cục mạnh tay hơn từ `design.md`
- dùng xanh teal và xanh lá làm màu nhấn có kiểm soát
- tránh dark dashboard toàn phần
- ưu tiên scan nhanh, thao tác nhanh và cảm giác control center vừa phải

Từ khóa thẩm mỹ:

- sáng
- nổi khối vừa phải
- premium nhẹ
- điều hướng rõ
- nhiều khoảng thở
- quản trị nhưng không nặng nề

## Information Architecture

Phase đầu chốt hai quyết định chính:

- `AdminLayout` dùng `topbar + dropdown navigation`
- `AdminDashboard` ưu tiên `nhiều KPI + quick actions`

Điều này có nghĩa khu admin sẽ không chuyển sang sidebar trái ở desktop trong phase này. Điều hướng chính vẫn nằm trên topbar để giữ cảm giác thoáng và gần với cách dùng hiện tại, nhưng được thiết kế lại để rõ cấu trúc hơn.

## AdminLayout

### Structure

`AdminLayout` sẽ dùng một topbar sticky, nổi bật hơn hiện tại nhưng vẫn nhẹ mắt:

- bên trái là brand admin và ngữ cảnh khu vực
- ở giữa là một `navigation switcher` dạng dropdown lớn
- bên phải là cụm account, trạng thái và thao tác nhanh

`navigation switcher` là thành phần điều hướng trung tâm. Nó hiển thị module hiện tại và khi mở ra sẽ chia menu thành các nhóm rõ ràng, ví dụ:

- Quản trị
- Vận hành chủ sân
- Người dùng

Mỗi nhóm có tiêu đề rõ, item active nổi bật, khoảng cách thoáng và visual đồng nhất với phần còn lại của admin shell.

### Behavior

- topbar sticky khi cuộn
- dropdown mở gọn, có phân nhóm và active state rõ
- mobile vẫn dùng cùng pattern topbar, chỉ thu gọn cách hiển thị menu và account để không vỡ layout
- account area giữ được khả năng mở panel cá nhân hoặc thao tác như đăng xuất

### Visual Rules

- nền topbar sáng, hơi trong nhẹ, có blur nhẹ
- border mảnh
- bo góc lớn cho dropdown panel
- active state dùng teal/green accent
- tránh inline style rời rạc, gom thành class có hệ thống

## AdminDashboard

### Layout Priority

Dashboard sẽ đi theo thứ tự ưu tiên:

1. hero summary ngắn
2. KPI grid 4 ô
3. quick actions là khối chính
4. thông báo hệ thống là khối phụ

Trọng tâm không phải analytics sâu mà là bảng điều phối nhanh cho admin.

### Hero Summary

Hero không nên quá cao hoặc quá nặng. Nó chỉ cần:

- tạo cảm giác control center
- nhắc ngữ cảnh điều hành
- đưa ra 1 đến 2 CTA chính

CTA nên ưu tiên các luồng quản trị quan trọng như:

- xử lý khiếu nại
- duyệt sân

### KPI Grid

KPI grid gồm 4 ô lớn:

- Tài khoản
- Khu sân
- Sân lẻ
- Chờ duyệt

Mỗi KPI card có:

- icon block
- nhãn ngắn
- số liệu lớn
- mô tả phụ ngắn

Mục tiêu là để admin nhìn vào là nắm ngay tình trạng hệ thống mà không cần đọc nhiều.

### Quick Actions

Quick actions là vùng chính của dashboard. Các card hành động nhanh sẽ dẫn tới những luồng quản trị cốt lõi:

- quản lý tài khoản
- duyệt khu/sân
- xử lý khiếu nại
- nhật ký hoạt động

Mỗi quick action card nên có:

- icon nổi bật nhưng gọn
- tiêu đề ngắn
- mô tả một dòng
- hover nhấc nhẹ

### System Broadcast

Khối gửi thông báo hệ thống vẫn được giữ nhưng là thành phần phụ trợ. Nó phải:

- dễ thấy
- rõ là công cụ tác vụ
- không chiếm spotlight hơn KPI và quick actions

Form giữ logic hiện tại, chỉ thay lớp trình bày.

## Visual System

### Color

Hệ màu dự kiến:

- nền tổng thể: trắng ngà, xanh xám rất nhạt
- card: trắng
- text chính: xanh than đậm hoặc slate đậm
- text phụ: xám xanh
- nhấn chính: teal
- nhấn tích cực/CTA: xanh lá sáng theo tinh thần `design.md`

Nguyên tắc dùng màu:

- không dùng xanh neon trên diện rộng
- màu nhấn chỉ xuất hiện ở CTA chính, active state, trạng thái tích cực và một số icon block
- dark surface chỉ dùng tiết chế ở panel phụ hoặc điểm neo thị giác, không dùng làm nền toàn màn

### Typography

Typography nên thống nhất với frontend hiện tại để tránh lệch thương hiệu, nhưng phần admin sẽ có:

- heading đậm hơn
- phân cấp mạnh hơn giữa title, label, meta text
- ưu tiên khả năng scan thay vì phong cách trang trí

### Components

Các component/pattern cần chuẩn hóa trong phase này:

- admin topbar
- navigation switcher
- dropdown panel
- admin hero
- KPI card
- quick action card
- panel/card chuẩn cho khối phụ
- button chính và button phụ

Rule chung:

- bo góc lớn
- shadow mềm
- border mảnh
- spacing thoáng
- hover tinh tế khoảng 150ms đến 200ms

## Responsive Strategy

Responsive không đổi cấu trúc thông tin chính, chỉ co giãn hiển thị:

- topbar giữ nguyên vai trò trên mobile
- dropdown và account controls thu gọn hợp lý
- KPI grid có thể từ 4 cột xuống 2 cột rồi 1 cột
- quick actions co thành lưới nhỏ hơn trên tablet/mobile
- hero giữ ngắn và không chiếm quá nhiều chiều cao

Mục tiêu là không vỡ bố cục và không khiến admin mobile bị quá tải.

## Implementation Boundaries

Khi vào implementation, nhóm thay đổi chỉ nên:

- thay JSX structure và CSS classes của `AdminLayout`
- thay JSX structure và CSS classes của `AdminDashboard`
- chuyển inline styling rời rạc sang hệ class có tổ chức
- chuẩn hóa text tiếng Việt admin nếu đang chưa đồng đều

Không nên:

- mở rộng phạm vi sang các màn admin khác
- đổi dữ liệu backend
- đổi API contract
- đưa thêm biểu đồ hoặc analytics sâu ngoài phạm vi đã chốt

## Testing and Verification Expectations

Phase implementation sau đó nên kiểm tra:

- render ổn ở desktop và mobile
- dropdown điều hướng hoạt động đúng
- trạng thái active hiển thị đúng
- dashboard vẫn lấy và hiển thị đúng dữ liệu hiện tại
- form thông báo hệ thống vẫn hoạt động như cũ
- không phát sinh regression về route hoặc auth flow admin

## Success Criteria

Phase này được coi là thành công khi:

- admin nhìn khác biệt rõ so với hiện trạng nhưng vẫn cùng hệ với website
- `AdminLayout` và `AdminDashboard` có visual system thống nhất
- dashboard scan nhanh hơn và thao tác nhanh hơn
- code presentation gọn hơn, ít inline style hơn
- tạo được nền đủ rõ để redesign tiếp các màn admin còn lại
