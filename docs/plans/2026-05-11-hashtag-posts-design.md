# Thiết kế: Quản lý Hashtag & Bài viết / Tin tức

**Ngày:** 2026-05-11  
**Dự án:** He-Thong-Dat-Xan (S-Book)  
**Trạng thái:** Approved ✅

---

## 1. Tổng quan

Thêm 2 tính năng mới vào hệ thống đặt sân thể thao:

1. **Quản lý Hashtag** — Admin CRUD hashtag, gán vào sân (Stadium) và bài viết
2. **Quản lý Bài viết / Tin tức** — Admin và Owner tạo bài, Admin duyệt trước khi public

---

## 2. Database Schema (Hướng A — Relational)

### Bảng `Hashtags`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AI | |
| `name` | VARCHAR(50) | Tên hashtag, VD: `Quan12` |
| `slug` | VARCHAR(50) UNIQUE | Dạng chuẩn hóa: `quan12` |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

### Bảng `Posts`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AI | |
| `title` | VARCHAR(255) | Tiêu đề bài |
| `content` | TEXT | Nội dung plain text |
| `author_id` | INT FK → Users | Admin hoặc Owner đăng |
| `status` | ENUM(`pending`,`published`,`rejected`) | Trạng thái duyệt |
| `reject_reason` | TEXT NULLABLE | Lý do Admin từ chối |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

### Bảng `PostHashtags` (join nhiều-nhiều)
| Cột | Kiểu |
|-----|------|
| `post_id` | INT FK → Posts |
| `hashtag_id` | INT FK → Hashtags |

### Bảng `StadiumHashtags` (join nhiều-nhiều)
| Cột | Kiểu |
|-----|------|
| `stadium_id` | INT FK → Stadiums |
| `hashtag_id` | INT FK → Hashtags |

---

## 3. API Endpoints

### Hashtag API (`/api/hashtags`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/hashtags` | Public | Lấy danh sách tất cả hashtag |
| POST | `/api/hashtags` | Admin | Tạo hashtag mới |
| PUT | `/api/hashtags/:id` | Admin | Sửa hashtag |
| DELETE | `/api/hashtags/:id` | Admin | Xóa hashtag |
| PUT | `/api/stadiums/:id/hashtags` | Admin + Owner (chủ sân) | Gán hashtag cho sân |

### Post API (`/api/posts`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/posts` | Public | Lấy bài đã published (có lọc theo hashtag) |
| GET | `/api/posts/:id` | Public | Xem chi tiết bài viết |
| GET | `/api/posts/manage` | Admin | Xem TẤT CẢ bài (pending, published, rejected) |
| POST | `/api/posts` | Admin + Owner | Tạo bài mới |
| PUT | `/api/posts/:id` | Admin + Owner (chủ bài) | Sửa bài |
| DELETE | `/api/posts/:id` | Admin + Owner (chủ bài) | Xóa bài |
| PUT | `/api/posts/:id/approve` | Admin | Duyệt bài → published |
| PUT | `/api/posts/:id/reject` | Admin | Từ chối bài → rejected + lý do |

---

## 4. Frontend Pages

### Admin Panel (thêm vào AdminLayout + App.jsx routes)
- `/admin/hashtags` — CRUD table hashtag (tên + slug + nút sửa/xóa)
- `/admin/posts` — Danh sách tất cả bài, highlight bài `pending` màu vàng, nút Duyệt/Từ chối

### Owner Panel (thêm route + menu)
- `/owner/posts` — Danh sách bài của Owner + badge trạng thái + nút Tạo/Sửa/Xóa

### Public (không cần đăng nhập)
- `/news` — Danh sách bài `published`, lọc theo hashtag qua query `?tag=slug`
- `/news/:id` — Chi tiết bài viết
- `Trang chủ /` — Section "Tin nổi bật" hiển thị 3 bài mới nhất đã published

---

## 5. UX Flow

### Luồng Owner đăng bài
```
Owner → /owner/posts → "Tạo bài mới"
      → Điền tiêu đề + nội dung + chọn hashtag
      → Submit → status: pending
      → Owner thấy badge "Chờ duyệt"
      → Admin nhận thông báo 🔔 "Có bài viết mới cần duyệt"
```

### Luồng Admin duyệt
```
Admin → /admin/posts → Thấy bài pending (highlight màu vàng)
      → Click "Duyệt" → status: published → hiện trên /news
      → Hoặc "Từ chối" + nhập lý do → status: rejected
      → Owner nhận thông báo 🔔 kết quả duyệt
```

### Luồng User xem tin tức
```
Trang chủ → Section "Tin nổi bật" (3 bài mới nhất)
           → Click "Xem tất cả" → /news
           → Lọc theo hashtag → /news?tag=khuyenmai
           → Click bài → /news/:id
```

### Hashtag trên trang sân
```
/stadium/:id → Hiển thị hashtag của sân VD: [#Quan10] [#SanBong]
             → Click hashtag → /news?tag=sanBong
```

---

## 6. Quyết định kỹ thuật

- **ORM:** Sequelize (theo chuẩn dự án hiện tại)
- **Migration:** Tạo 4 migration file mới
- **Quan hệ:** BelongsToMany qua PostHashtags và StadiumHashtags
- **Auth:** Dùng middleware `verifyToken` + kiểm tra role (roleId 2=Owner, 3=Admin)
- **Thông báo:** Tích hợp hệ thống Notification + Socket.io hiện có
- **Styling:** Bootstrap + CSS inline (theo chuẩn dự án)
