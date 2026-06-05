# Weekly Recurring Booking With Per-Occurrence Exceptions Design

## Mục tiêu

Nâng cấp chức năng đặt sân định kỳ theo hướng:

- user đặt lặp theo `thứ trong tuần`
- user chọn được `lặp lại mỗi N tuần`
- user tạo nhiều tuần trong cùng một khung giờ
- sau khi sinh danh sách các tuần, user có bước `review`
- ở bước review, user được chỉnh riêng từng tuần:
  - đổi ngày trong tuần đó
  - đổi giờ trong tuần đó
  - bỏ qua tuần đó
- các tuần bị chỉnh riêng vẫn thuộc `cùng một chuỗi đặt sân`, chỉ là `ngoại lệ`

## Phạm vi

Trong phạm vi thay đổi:
- hỗ trợ recurring type `weekly`
- thêm trường `repeat_interval_weeks`
- thêm bước review các occurrence trước khi tạo chuỗi
- cho phép chỉnh sửa riêng từng occurrence ngay trong lúc review
- lưu occurrence bị đổi riêng dưới dạng `exception`

Ngoài phạm vi:
- chưa làm `sửa từ tuần này trở đi`
- chưa làm `monthly with exceptions`
- chưa làm editor hậu kỳ cho chuỗi đã tạo xong
- chưa hỗ trợ đổi sang sân khác cho từng occurrence

## Bối cảnh hiện tại

Project đã có sẵn nền recurring booking:

- backend có:
  - `RecurringBookingSeries`
  - `RecurringBookingItem`
  - `previewRecurringBooking`
  - `createRecurringBooking`
- frontend có:
  - [RecurringBookingPage.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/pages/RecurringBookingPage.jsx:1)

Luồng hiện tại đã có:
- chọn ngày bắt đầu
- chọn số lần hoặc ngày kết thúc
- chọn một khung giờ
- preview chuỗi

Nhưng hiện tại còn thiếu:
- chọn `mỗi bao nhiêu tuần`
- review và sửa riêng từng occurrence
- lưu rõ item nào là `ngoại lệ`

## Thiết kế nghiệp vụ

### Quy tắc chính

Một recurring booking series sẽ có:
- một `quy tắc gốc`
- nhiều `occurrence`

Quy tắc gốc trả lời câu hỏi:
- đặt sân vào `thứ mấy`
- lúc `mấy giờ`
- `lặp mỗi bao nhiêu tuần`

Occurrence trả lời câu hỏi:
- tuần cụ thể đó đặt ngày nào
- giờ nào
- có bị bỏ qua không
- có còn bám đúng quy tắc gốc hay đã trở thành ngoại lệ

### Hành vi mong muốn

Ví dụ:
- user chọn `thứ 3`
- khung giờ `18:00 - 19:00`
- lặp `mỗi 2 tuần`
- số lần `6`

Hệ thống sinh ra 6 occurrence.

Ở bước review:
- tuần 1 giữ nguyên
- tuần 2 đổi sang `thứ 4`
- tuần 3 đổi giờ sang `19:00 - 20:00`
- tuần 4 bỏ qua

Kết quả:
- tất cả vẫn thuộc cùng một `series`
- tuần 2 và tuần 3 là `exception`
- tuần 4 là `skipped`

## Mô hình dữ liệu

### RecurringBookingSeries

Giữ lại vai trò chuỗi gốc, và bổ sung:

- `repeat_interval_weeks`
  - số tuần lặp lại
  - mặc định `1`
- `weekday`
  - thứ trong tuần theo rule gốc

Giữ các trường đã có:
- `field_id`
- `user_id`
- `recurrence_type`
- `start_date`
- `end_date`
- `occurrence_count`
- `start_time`
- `end_time`
- `deposit_amount`
- `payment_method`
- `approval_status`

### RecurringBookingItem

Mỗi item đại diện cho một lần phát sinh trong chuỗi.

Cần có rõ:
- `scheduled_date`
- `start_time`
- `end_time`
- `status`
- `is_exception`
- `is_skipped`
- `sequence_number`

Ý nghĩa:
- `is_exception = true`
  - ngày hoặc giờ của item này đã khác rule gốc
- `is_skipped = true`
  - tuần này nằm trong series nhưng user chủ động bỏ qua
- `sequence_number`
  - giúp biết đây là lần thứ mấy trong chuỗi

Nếu repo hiện chưa có:
- `is_exception`
- `is_skipped`
- `sequence_number`

thì cần thêm migration cho các cột này.

## Luồng tạo recurring booking

### Bước 1: nhập quy tắc gốc

User chọn:
- sân
- `thứ trong tuần`
- `giờ bắt đầu`
- `giờ kết thúc`
- `lặp mỗi bao nhiêu tuần`
- `số lần lặp`
  hoặc
- `ngày kết thúc`

Rule:
- `repeat_interval_weeks` phải >= 1
- chỉ hỗ trợ recurring type `weekly` ở vòng này

### Bước 2: preview chuỗi

Backend sinh danh sách occurrence theo rule gốc.

Ví dụ:
- start date = 2026-06-10
- weekday = thứ 4
- repeat interval = 2

thì các occurrence sẽ cách nhau 14 ngày.

Preview trả về:
- thông tin series gốc
- danh sách occurrence
- trạng thái xung đột nếu có
- danh sách slot thay thế nếu project hiện đã hỗ trợ

### Bước 3: review và chỉnh riêng từng tuần

Frontend hiển thị danh sách từng occurrence.

Mỗi dòng có thể:
- giữ nguyên
- đổi ngày
- đổi giờ bắt đầu/kết thúc
- bỏ qua tuần đó

Khi user chỉnh riêng:
- frontend đánh dấu item đó là `exception`
- payload gửi lên backend chứa danh sách override

### Bước 4: tạo chuỗi

Backend lưu:
- một `RecurringBookingSeries`
- nhiều `RecurringBookingItem`

Item nào bị đổi riêng:
- lưu ngày/giờ đã chỉnh
- `is_exception = true`

Item nào bị bỏ qua:
- `is_skipped = true`
- `status = cancelled` hoặc `skipped` tùy theo enum hiện tại

## Payload đề xuất

### Preview request

Request preview cần thêm:

- `weekday`
- `repeat_interval_weeks`
- `occurrence_overrides`

`occurrence_overrides` có dạng:

```json
[
  {
    "sequence_number": 2,
    "scheduled_date": "2026-06-24",
    "start_time": "18:00:00",
    "end_time": "19:00:00",
    "is_skipped": false
  },
  {
    "sequence_number": 4,
    "is_skipped": true
  }
]
```

### Create request

Luồng create dùng cùng cấu trúc như preview, để frontend không phải giữ hai kiểu dữ liệu khác nhau.

## Quy tắc validate

### Validate rule gốc

- `recurrence_type` phải là `weekly`
- `repeat_interval_weeks >= 1`
- `weekday` phải nằm trong `1..7` hoặc format chuẩn frontend/backend đang dùng
- `start_time < end_time`
- phải có `occurrence_count` hoặc `end_date`

### Validate override

Với từng override:
- ngày override không được rỗng nếu không phải `skip`
- giờ mới phải hợp lệ
- nếu đổi ngày thì ngày đó vẫn phải thuộc tương lai hoặc theo rule hợp lệ của hệ thống
- nếu đổi giờ thì vẫn phải kiểm tra xung đột với booking thường và recurring khác

### Validate xung đột

Nếu một occurrence bị xung đột:
- preview phải báo rõ dòng nào xung đột
- frontend cho user sửa đúng dòng đó

Không nên fail cả chuỗi ngay từ đầu nếu vẫn còn cơ hội sửa bằng review.

## Giao diện đề xuất

### Form chính

Trên [RecurringBookingPage.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/pages/RecurringBookingPage.jsx:1), thêm:

- chọn `Thứ trong tuần`
- input `Lặp lại mỗi ... tuần`

### Khu review

Sau khi preview:
- render danh sách occurrence theo card hoặc table
- mỗi dòng hiển thị:
  - lần thứ mấy
  - ngày
  - thứ
  - giờ
  - trạng thái

Mỗi dòng có action:
- `Đổi ngày`
- `Đổi giờ`
- `Bỏ qua tuần`
- `Khôi phục mặc định`

### Hiển thị ngoại lệ

Occurrence là ngoại lệ cần có badge rõ:
- `Ngoại lệ`

Occurrence bị bỏ qua cần có badge:
- `Bỏ qua`

## Quy tắc approve và payment

Không đổi rule approve/deposit hiện có ở vòng này.

Nghĩa là:
- nếu deposit đủ ngưỡng auto approve thì chuỗi vẫn auto approve
- nếu không đủ thì vẫn chờ owner review

Điểm cần giữ:
- approve áp dụng cho `series`
- nhưng từng `item` vẫn mang ngày/giờ cuối cùng sau override

## Tác động backend

Các phần cần sửa:
- [recurringBookingTypes.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/utils/recurringBookingTypes.js:1)
- [recurringBookingService.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/utils/recurringBookingService.js:1)
- [recurringBookingController.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/backend/controllers/recurringBookingController.js:1)
- model/migration của:
  - `RecurringBookingSeries`
  - `RecurringBookingItem`

Các hàm chính cần nâng cấp:
- builder weekly occurrences
- preview recurring booking
- create recurring booking
- conflict detection theo từng occurrence sau override

## Tác động frontend

Các phần cần sửa:
- [RecurringBookingPage.jsx](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/pages/RecurringBookingPage.jsx:1)
- [recurringBookingService.js](/c:/workspace/DoAnCoSo/He-Thong-Dat-Xan-develop/frontend/src/services/recurringBookingService.js:1)

Frontend cần:
- mở rộng form
- thêm state cho `repeat_interval_weeks`
- thêm state cho `occurrence_overrides`
- render UI review từng tuần

## Test cần có

### Backend

- sinh occurrence weekly với `repeat_interval_weeks = 1`
- sinh occurrence weekly với `repeat_interval_weeks = 2`
- override đổi ngày của một occurrence
- override đổi giờ của một occurrence
- skip một occurrence
- preview báo xung đột đúng ở một occurrence cụ thể
- create lưu đúng `is_exception`
- create lưu đúng `is_skipped`

### Frontend

- form gửi đúng `weekday`
- form gửi đúng `repeat_interval_weeks`
- review hiển thị danh sách occurrence
- sửa một occurrence cập nhật đúng payload
- skip một occurrence cập nhật đúng payload

## Khuyến nghị triển khai

Nên triển khai theo 2 lớp:

1. `nâng cấp backend preview/create + data model`
2. `nâng cấp frontend review UI`

Lý do:
- backend phải trở thành nguồn sự thật cho occurrence và exception
- frontend chỉ nên là nơi chỉnh payload một cách rõ ràng

## Kết luận

Thiết kế này giữ đúng ý bạn:

- đặt theo `thứ trong tuần`
- lặp `mỗi N tuần`
- có nút/ô cho user chọn số tuần lặp
- có bước review
- user được sửa riêng từng tuần theo nhu cầu
- các tuần bị sửa riêng vẫn là `ngoại lệ của cùng một chuỗi đặt sân`, không tách thành booking độc lập
