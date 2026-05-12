import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:5000/api/admin/users');
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (userId, newRoleId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role_id: newRoleId }
      );
      alert('Đã đổi quyền hạn!');
      fetchUsers();
    } catch (err) {
      alert('Lỗi khi đổi quyền', err);
    }
  };

  return (
    <div className="p-4">
      <h3 className="fw-bold mb-4">Quản lý người dùng</h3>
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-dark text-white">
            <tr>
              <th className="ps-4">Tên người dùng</th>
              <th>Email</th>
              <th>Quyền hiện tại</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="ps-4 fw-bold">{u.full_name || u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className={`badge ${u.role_id === 3 ? 'bg-danger' : u.role_id === 2 ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    {u.role?.role_name ||
                      (u.role_id === 3
                        ? 'Admin'
                        : u.role_id === 2
                          ? 'Owner'
                          : 'User')}
                  </span>
                </td>
                <td>
                  <select
                    className="form-select form-select-sm d-inline-block w-auto me-2"
                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    value={u.role_id}
                  >
                    <option value="3">Admin</option>
                    <option value="2">Owner</option>
                    <option value="1">User</option>
                  </select>
                  <Link
                    to={`/admin/user-cash-flow/${u.id}`}
                    className="btn btn-sm btn-outline-primary me-2"
                    title="Xem dòng tiền"
                  >
                    <i className="bi bi-cash-stack"></i>
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      /* Hàm xóa */
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
