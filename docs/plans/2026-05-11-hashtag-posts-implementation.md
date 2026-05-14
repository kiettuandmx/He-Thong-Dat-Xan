# Hashtag & Bài viết Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Thêm quản lý Hashtag và Bài viết/Tin tức vào hệ thống S-Book.

**Architecture:** Hướng A — 4 bảng mới: Hashtags, Posts, PostHashtags, StadiumHashtags. Backend Node/Sequelize, Frontend React/Bootstrap.

**Tech Stack:** Node.js, Sequelize, MySQL, React, Bootstrap 5

---

## Task 1: Migration — Tạo bảng Hashtags

**Files:**
- Create: `backend/migrations/20260511001001-create-hashtag.js`

**Step 1: Tạo file migration**

```js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Hashtags', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING(50), allowNull: false },
      slug: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Hashtags');
  }
};
```

**Step 2: Chạy migration**
```bash
cd backend && npx sequelize-cli db:migrate
```

---

## Task 2: Migration — Tạo bảng Posts

**Files:**
- Create: `backend/migrations/20260511001002-create-post.js`

```js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING(255), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      author_id: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' } },
      status: { type: Sequelize.ENUM('pending', 'published', 'rejected'), defaultValue: 'pending' },
      reject_reason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Posts');
  }
};
```

---

## Task 3: Migration — Bảng join PostHashtags & StadiumHashtags

**Files:**
- Create: `backend/migrations/20260511001003-create-post-hashtag.js`
- Create: `backend/migrations/20260511001004-create-stadium-hashtag.js`

**PostHashtags:**
```js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PostHashtags', {
      post_id: { type: Sequelize.INTEGER, references: { model: 'Posts', key: 'id' }, onDelete: 'CASCADE' },
      hashtag_id: { type: Sequelize.INTEGER, references: { model: 'Hashtags', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('PostHashtags'); }
};
```

**StadiumHashtags:**
```js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StadiumHashtags', {
      stadium_id: { type: Sequelize.INTEGER, references: { model: 'Stadiums', key: 'id' }, onDelete: 'CASCADE' },
      hashtag_id: { type: Sequelize.INTEGER, references: { model: 'Hashtags', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('StadiumHashtags'); }
};
```

**Step: Chạy migration**
```bash
npx sequelize-cli db:migrate
```

---

## Task 4: Sequelize Models

**Files:**
- Create: `backend/models/hashtag.js`
- Create: `backend/models/post.js`
- Modify: `backend/models/index.js` — thêm associations

**hashtag.js:**
```js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Hashtag extends Model {
    static associate(models) {
      Hashtag.belongsToMany(models.Post, { through: 'PostHashtags', as: 'posts', foreignKey: 'hashtag_id' });
      Hashtag.belongsToMany(models.Stadium, { through: 'StadiumHashtags', as: 'stadiums', foreignKey: 'hashtag_id' });
    }
  }
  Hashtag.init({
    name: { type: DataTypes.STRING(50), allowNull: false },
    slug: { type: DataTypes.STRING(50), allowNull: false, unique: true }
  }, { sequelize, modelName: 'Hashtag', tableName: 'Hashtags' });
  return Hashtag;
};
```

**post.js:**
```js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      Post.belongsTo(models.User, { foreignKey: 'author_id', as: 'author' });
      Post.belongsToMany(models.Hashtag, { through: 'PostHashtags', as: 'hashtags', foreignKey: 'post_id' });
    }
  }
  Post.init({
    title: { type: DataTypes.STRING(255), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    author_id: DataTypes.INTEGER,
    status: { type: DataTypes.ENUM('pending', 'published', 'rejected'), defaultValue: 'pending' },
    reject_reason: { type: DataTypes.TEXT, allowNull: true }
  }, { sequelize, modelName: 'Post', tableName: 'Posts' });
  return Post;
};
```

**Thêm vào Stadium model's associate():**
```js
Stadium.belongsToMany(models.Hashtag, { through: 'StadiumHashtags', as: 'hashtags', foreignKey: 'stadium_id' });
```

---

## Task 5: Backend — hashtagController.js

**Files:**
- Create: `backend/controllers/hashtagController.js`
- Create: `backend/routes/hashtagRoutes.js`
- Modify: `backend/server.js` — mount route

**hashtagController.js:**
```js
const db = require('../models');

exports.getAll = async (req, res) => {
  const hashtags = await db.Hashtag.findAll({ order: [['name', 'ASC']] });
  res.json(hashtags);
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const hashtag = await db.Hashtag.create({ name, slug });
    res.status(201).json(hashtag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  await db.Hashtag.update({ name, slug }, { where: { id: req.params.id } });
  res.json({ success: true });
};

exports.remove = async (req, res) => {
  await db.Hashtag.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
};

exports.setStadiumHashtags = async (req, res) => {
  const { hashtag_ids } = req.body;
  const stadium = await db.Stadium.findByPk(req.params.id);
  if (!stadium) return res.status(404).json({ message: 'Không tìm thấy sân' });
  await stadium.setHashtags(hashtag_ids);
  res.json({ success: true });
};
```

**hashtagRoutes.js:**
```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hashtagController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', ctrl.getAll);
router.post('/', verifyToken, checkRole([3]), ctrl.create);
router.put('/:id', verifyToken, checkRole([3]), ctrl.update);
router.delete('/:id', verifyToken, checkRole([3]), ctrl.remove);
router.put('/stadium/:id/hashtags', verifyToken, checkRole([2, 3]), ctrl.setStadiumHashtags);

module.exports = router;
```

**Thêm vào server.js:**
```js
const hashtagRoutes = require('./routes/hashtagRoutes');
app.use('/api/hashtags', hashtagRoutes);
```

---

## Task 6: Backend — postController.js

**Files:**
- Create: `backend/controllers/postController.js`
- Create: `backend/routes/postRoutes.js`
- Modify: `backend/server.js`

**postController.js:**
```js
const db = require('../models');
const { getIO, userSockets } = require('../socket');

exports.getPublished = async (req, res) => {
  const { tag } = req.query;
  const include = [
    { model: db.User, as: 'author', attributes: ['name'] },
    { model: db.Hashtag, as: 'hashtags', through: { attributes: [] } }
  ];
  let where = { status: 'published' };
  const options = { where, include, order: [['createdAt', 'DESC']] };
  if (tag) {
    options.include[1].where = { slug: tag };
    options.include[1].required = true;
  }
  const posts = await db.Post.findAll(options);
  res.json(posts);
};

exports.getOne = async (req, res) => {
  const post = await db.Post.findByPk(req.params.id, {
    include: [
      { model: db.User, as: 'author', attributes: ['name'] },
      { model: db.Hashtag, as: 'hashtags', through: { attributes: [] } }
    ]
  });
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  res.json(post);
};

exports.getAll = async (req, res) => {
  const posts = await db.Post.findAll({
    include: [
      { model: db.User, as: 'author', attributes: ['name'] },
      { model: db.Hashtag, as: 'hashtags', through: { attributes: [] } }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json(posts);
};

exports.create = async (req, res) => {
  const { title, content, hashtag_ids } = req.body;
  const role = req.user.role;
  const status = role === 3 ? 'published' : 'pending';
  const post = await db.Post.create({ title, content, author_id: req.user.id, status });
  if (hashtag_ids?.length) await post.setHashtags(hashtag_ids);

  // Notify admin if owner posted
  if (role === 2) {
    const admins = await db.User.findAll({ where: { role_id: 3 } });
    for (const admin of admins) {
      const noti = await db.Notification.create({
        user_id: admin.id,
        content: `Có bài viết mới cần duyệt: "${title}"`,
        is_read: false
      });
      const io = getIO();
      const sid = userSockets[admin.id];
      if (sid) io.to(sid).emit('newNotification', noti);
    }
  }
  res.status(201).json(post);
};

exports.update = async (req, res) => {
  const { title, content, hashtag_ids } = req.body;
  const post = await db.Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy' });
  if (req.user.role !== 3 && post.author_id !== req.user.id)
    return res.status(403).json({ message: 'Không có quyền' });
  await post.update({ title, content });
  if (hashtag_ids) await post.setHashtags(hashtag_ids);
  res.json(post);
};

exports.remove = async (req, res) => {
  const post = await db.Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy' });
  if (req.user.role !== 3 && post.author_id !== req.user.id)
    return res.status(403).json({ message: 'Không có quyền' });
  await post.destroy();
  res.json({ success: true });
};

exports.approve = async (req, res) => {
  const post = await db.Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy' });
  await post.update({ status: 'published', reject_reason: null });

  const noti = await db.Notification.create({
    user_id: post.author_id,
    content: `Bài viết "${post.title}" đã được duyệt và đăng công khai!`,
    is_read: false
  });
  const io = getIO();
  const sid = userSockets[post.author_id];
  if (sid) io.to(sid).emit('newNotification', noti);

  res.json({ success: true });
};

exports.reject = async (req, res) => {
  const { reject_reason } = req.body;
  const post = await db.Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy' });
  await post.update({ status: 'rejected', reject_reason });

  const noti = await db.Notification.create({
    user_id: post.author_id,
    content: `Bài viết "${post.title}" bị từ chối. Lý do: ${reject_reason}`,
    is_read: false
  });
  const io = getIO();
  const sid = userSockets[post.author_id];
  if (sid) io.to(sid).emit('newNotification', noti);

  res.json({ success: true });
};
```

**postRoutes.js:**
```js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', ctrl.getPublished);
router.get('/manage', verifyToken, checkRole([3]), ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', verifyToken, checkRole([2, 3]), ctrl.create);
router.put('/:id', verifyToken, ctrl.update);
router.delete('/:id', verifyToken, ctrl.remove);
router.put('/:id/approve', verifyToken, checkRole([3]), ctrl.approve);
router.put('/:id/reject', verifyToken, checkRole([3]), ctrl.reject);

module.exports = router;
```

**Thêm vào server.js:**
```js
const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);
```

---

## Task 7: Frontend — AdminHashtags.jsx

**Files:**
- Create: `frontend/src/pages/AdminHashtags.jsx`
- Modify: `frontend/src/pages/AdminLayout.jsx` — thêm menu
- Modify: `frontend/src/App.jsx` — thêm route

**AdminHashtags.jsx** — CRUD table đơn giản:
- State: `hashtags`, `newName`, `editId`, `editName`
- Fetch: `GET /api/hashtags`
- Create: form input + POST
- Edit: inline edit row
- Delete: nút xóa với confirm

**Thêm vào AdminLayout.jsx navbar:**
```jsx
<li className="nav-item">
  <Link className={`nav-link fw-semibold px-3 ${isActive('/admin/hashtags')}`} to="/admin/hashtags">
    Hashtag
  </Link>
</li>
<li className="nav-item">
  <Link className={`nav-link fw-semibold px-3 ${isActive('/admin/posts')}`} to="/admin/posts">
    Bài viết
  </Link>
</li>
```

**Thêm vào App.jsx trong Admin Routes:**
```jsx
import AdminHashtags from './pages/AdminHashtags';
import AdminPosts from './pages/AdminPosts';
// ...
<Route path="hashtags" element={<AdminHashtags />} />
<Route path="posts" element={<AdminPosts />} />
```

---

## Task 8: Frontend — AdminPosts.jsx

**Files:**
- Create: `frontend/src/pages/AdminPosts.jsx`

**Chức năng:**
- Fetch: `GET /api/posts/manage` (với token Admin)
- Hiển thị bảng: tiêu đề, tác giả, trạng thái, ngày tạo
- Bài `pending` highlight nền vàng nhạt `#fffbea`
- Nút "Duyệt" → `PUT /api/posts/:id/approve`
- Nút "Từ chối" → modal nhập lý do → `PUT /api/posts/:id/reject`
- Nút "Xóa" → `DELETE /api/posts/:id`

---

## Task 9: Frontend — OwnerPosts.jsx

**Files:**
- Create: `frontend/src/pages/OwnerPosts.jsx`
- Modify: `frontend/src/components/MainLayout.jsx` — thêm menu Owner
- Modify: `frontend/src/App.jsx` — thêm route Owner

**Chức năng:**
- Fetch: `GET /api/posts/manage` filter theo `author_id === currentUser.id` (hoặc tạo API riêng)
- Nút "Tạo bài" → form modal: tiêu đề, nội dung, chọn hashtag (multi-select)
- Hiển thị badge trạng thái: pending=vàng, published=xanh, rejected=đỏ
- Nếu rejected: hiển thị lý do bên dưới
- Nút Sửa + Xóa

**Thêm route App.jsx:**
```jsx
import OwnerPosts from './pages/OwnerPosts';
// trong Owner Routes:
<Route path="/owner/posts" element={<OwnerPosts />} />
```

---

## Task 10: Frontend — NewsPage.jsx (Public)

**Files:**
- Create: `frontend/src/pages/NewsPage.jsx`
- Modify: `frontend/src/App.jsx` — thêm route public

**Chức năng:**
- Fetch: `GET /api/posts?tag=slug` (lọc theo hashtag nếu có query param)
- Hiển thị grid card bài viết: tiêu đề, tác giả, ngày, hashtag badges
- Click card → `/news/:id`
- Sidebar/thanh lọc: danh sách hashtag clickable

**Thêm route App.jsx (trong public routes):**
```jsx
import NewsPage from './pages/NewsPage';
import NewsDetail from './pages/NewsDetail';
// ...
<Route path="/news" element={<NewsPage />} />
<Route path="/news/:id" element={<NewsDetail />} />
```

---

## Task 11: Frontend — NewsDetail.jsx

**Files:**
- Create: `frontend/src/pages/NewsDetail.jsx`

**Chức năng:**
- Fetch: `GET /api/posts/:id`
- Hiển thị: tiêu đề lớn, tên tác giả, ngày đăng, hashtag badges, nội dung
- Nút "← Quay lại" → `/news`

---

## Task 12: Frontend — Trang chủ "Tin nổi bật"

**Files:**
- Modify: `frontend/src/pages/FieldListPage.jsx` hoặc `frontend/src/components/Home.jsx`

**Chức năng:**
- Fetch: `GET /api/posts?limit=3` (3 bài mới nhất published)
- Thêm section "📰 Tin nổi bật & Khuyến mãi" hiển thị 3 card ngang
- Mỗi card: ảnh placeholder (emoji), tiêu đề, hashtag, nút "Đọc thêm" → `/news/:id`
- Dưới cards: nút "Xem tất cả tin tức" → `/news`

---

## Task 13: Commit

```bash
git add .
git commit -m "feat: add hashtag and post/news management system"
```
