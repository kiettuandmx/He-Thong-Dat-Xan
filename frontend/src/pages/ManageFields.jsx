import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Add from '../components/Add';
import Delete from '../components/Delete';
import Edit from '../components/Edit';

const ManageFields = () => {
  const [fields, setFields] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const fetchFields = useCallback(async () => {
    if (!selectedStadium) return;
    setLoading(true);
    try {
      const authData = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`http://localhost:5000/api/admin/fields`, {
        headers: { Authorization: `Bearer ${authData?.token}` },
      });
      const allFields = res.data.data || res.data;
      const filtered = allFields.filter(
        (f) => String(f.stadium_id) === String(selectedStadium)
      );
      setFields(filtered);
    } catch (err) {
      console.error('Lỗi fetch danh sách sân:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStadium]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/stadiums`)
      .then((res) => {
        const stadiumData = res.data.data || [];
        setStadiums(stadiumData);
        if (stadiumData.length > 0) setSelectedStadium(stadiumData[0].id);
      })
      .catch((err) => console.error('Lỗi lấy danh sách khu:', err));
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Duyệt & Quản lý Sân Chi Tiết (Admin)</h2>

      <div className="card p-3 shadow-sm border-0 mb-4">
        <label className="form-label fw-bold">
          Chọn Khu sân để quản lý sân lẻ:
        </label>
        <select
          className="form-select"
          value={selectedStadium}
          onChange={(e) => setSelectedStadium(e.target.value)}
        >
          {stadiums.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        {/* Sửa lại dấu ngoặc nhọn ở đây */}
        <Add stadiumId={selectedStadium} onAdded={fetchFields} />
      </div>

      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table align-middle">
          <thead className="table-light">
            <tr>
              <th>Tên sân lẻ</th>
              <th>Giá thuê</th>
              <th className="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : fields.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  Khu vực này chưa có sân lẻ.
                </td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr key={field.id}>
                  <td>
                    {editingId === field.id ? (
                      <Edit
                        field={field}
                        onUpdated={() => {
                          setEditingId(null);
                          fetchFields();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      field.name
                    )}
                  </td>
                  <td>
                    {editingId !== field.id &&
                      `${Number(field.price_per_hour).toLocaleString()} đ`}
                  </td>
                  <td className="text-end">
                    {editingId !== field.id && (
                      <>
                        <button
                          className="btn btn-sm btn-info me-2 text-white"
                          onClick={() => setEditingId(field.id)}
                        >
                          Sửa
                        </button>
                        <Delete id={field.id} onSuccess={fetchFields} />
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageFields;
