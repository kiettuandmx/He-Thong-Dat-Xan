import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = 'http://localhost:5000/api/hashtags';

const AdminHashtags = () => {
  const [hashtags, setHashtags] = useState([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  const token = JSON.parse(localStorage.getItem('user'))?.token;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchHashtags = async () => {
    try {
      const res = await axios.get(API);
      setHashtags(res.data);
    } catch {
      toast.error('Không thể tải danh sách hashtag');
    }
  };

  useEffect(() => { fetchHashtags(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return toast.warning('Vui lòng nhập tên hashtag');
    setLoading(true);
    try {
      await axios.post(API, { name: newName.trim() }, authHeaders);
      toast.success('Đã thêm hashtag!');
      setNewName('');
      fetchHashtags();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo hashtag');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return toast.warning('Tên không được để trống');
    try {
      await axios.put(`${API}/${id}`, { name: editName.trim() }, authHeaders);
      toast.success('Đã cập nhật!');
      setEditId(null);
      setEditName('');
      fetchHashtags();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa hashtag #${name}?`)) return;
    try {
      await axios.delete(`${API}/${id}`, authHeaders);
      toast.success('Đã xóa hashtag');
      fetchHashtags();
    } catch {
      toast.error('Lỗi khi xóa hashtag');
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-1">Quản lý Hashtag</h2>
      <p className="text-muted mb-4">Tạo và quản lý hashtag để phân loại sân và bài viết.</p>

      {/* Form thêm hashtag mới */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h5 className="fw-bold mb-3"><i className="bi bi-plus-circle me-2 text-success"></i>Thêm Hashtag mới</h5>
        <form onSubmit={handleCreate} className="d-flex gap-2">
          <input
            id="new-hashtag-input"
            type="text"
            className="form-control rounded-3"
            placeholder="Nhập tên hashtag (VD: Quan12, KhuyenMai...)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button
            id="create-hashtag-btn"
            className="btn btn-success rounded-3 px-4"
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Thêm'}
          </button>
        </form>
      </div>

      {/* Bảng danh sách hashtag */}
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-3">Danh sách Hashtag ({hashtags.length})</h5>
        {hashtags.length === 0 ? (
          <p className="text-muted text-center py-4">Chưa có hashtag nào. Hãy thêm mới!</p>
        ) : (
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Tên Hashtag</th>
                <th>Slug</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {hashtags.map((tag, idx) => (
                <tr key={tag.id}>
                  <td>{idx + 1}</td>
                  <td>
                    {editId === tag.id ? (
                      <input
                        id={`edit-hashtag-${tag.id}`}
                        type="text"
                        className="form-control form-control-sm"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="badge bg-success-subtle text-success fs-6 fw-normal px-3 py-2 rounded-pill">
                        #{tag.name}
                      </span>
                    )}
                  </td>
                  <td><code className="text-muted">{tag.slug}</code></td>
                  <td>
                    {editId === tag.id ? (
                      <div className="d-flex gap-2">
                        <button
                          id={`save-hashtag-${tag.id}`}
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdate(tag.id)}
                        >
                          <i className="bi bi-check-lg"></i> Lưu
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => { setEditId(null); setEditName(''); }}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-2">
                        <button
                          id={`edit-hashtag-btn-${tag.id}`}
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => { setEditId(tag.id); setEditName(tag.name); }}
                        >
                          <i className="bi bi-pencil"></i> Sửa
                        </button>
                        <button
                          id={`delete-hashtag-btn-${tag.id}`}
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(tag.id, tag.name)}
                        >
                          <i className="bi bi-trash"></i> Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminHashtags;
