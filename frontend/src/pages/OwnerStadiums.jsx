import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OwnerStadiums = () => {
    const [fields, setFields] = useState([]);
    const [stadiums, setStadiums] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFieldId, setCurrentFieldId] = useState(null);
    const [formData, setFormData] = useState({ name: '', stadium_id: '', type: 'Football', price_per_hour: '', image: null });

    useEffect(() => {
        fetchFields();
        fetchStadiums();
    }, []);

    const fetchFields = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem('user'));
            const token = authData?.token;
            if (!token) {
                console.error("Không tìm thấy token!");
                return;
            }
            const res = await axios.get('http://localhost:5000/api/owner/fields', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFields(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách sân:", err);
            setFields([]);
        }
    };

    const fetchStadiums = async () => {
        try {
            const ownerId = JSON.parse(localStorage.getItem('user'))?.user?.id || 2;
            const res = await axios.get(`http://localhost:5000/api/stadiums/owner/${ownerId}`);
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setStadiums(data);
        } catch (err) {
            console.error("Lỗi lấy danh sách khu sân:", err);
            setStadiums([]);
        }
    };

    // Gom nhóm các sân vào khu tương ứng
    const groupedFields = stadiums.map(stadium => ({
        ...stadium,
        childFields: fields.filter(f => f.stadium_id === stadium.id)
    }));

    const handleEdit = (field) => {
        setIsEditing(true);
        setCurrentFieldId(field.id);
        setFormData({
            name: field.name,
            stadium_id: field.stadium_id,
            type: field.type,
            price_per_hour: field.price_per_hour,
            image: null
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('stadium_id', formData.stadium_id);
        data.append('type', formData.type);
        data.append('price_per_hour', formData.price_per_hour);
        if (formData.image) data.append('image', formData.image);

        try {
            if (isEditing && currentFieldId) {
                await axios.put(`http://localhost:5000/api/fields/${currentFieldId}`, data);
                alert("Cập nhật sân thành công!");
            } else {
                await axios.post('http://localhost:5000/api/fields', data);
                alert("Thêm sân mới thành công!");
            }
            setIsEditing(false);
            setCurrentFieldId(null);
            setFormData({ name: '', stadium_id: '', type: 'Football', price_per_hour: '', image: null });
            fetchFields();
        } catch (error) {
            alert("Lỗi khi lưu dữ liệu!",error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn muốn xóa sân này?")) {
            await axios.delete(`http://localhost:5000/api/fields/${id}`);
            fetchFields();
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4 fw-bold text-uppercase">{isEditing ? '📝 Sửa Sân' : '⚽ Quản lý Sân theo Khu'}</h2>
            <div className="row">
                <div className="col-md-4">
                    <div className={`card p-3 shadow-sm border-0 ${isEditing ? 'bg-light border-warning' : ''}`} style={{ borderLeft: '5px solid red' }}>
                        <h5 className="fw-bold">{isEditing ? 'Cập nhật' : 'Đăng ký sân mới'}</h5>
                        <form onSubmit={handleSubmit}>
                            <label className="small fw-bold mt-2">Thuộc Khu Sân:</label>
                            <select className="form-select mb-2" value={formData.stadium_id} onChange={e => setFormData({ ...formData, stadium_id: e.target.value })} required>
                                <option value="">-- Chọn Khu --</option>
                                {stadiums.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <label className="small fw-bold">Tên sân:</label>
                            <input className="form-control mb-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                            <label className="small fw-bold">Loại:</label>
                            <select className="form-select mb-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="Football">Bóng đá</option>
                                <option value="Badminton">Cầu lông</option>
                                <option value="Pickleball">Pickleball</option>
                            </select>

                            <label className="small fw-bold">Giá (VNĐ/h):</label>
                            <input type="number" className="form-control mb-2" value={formData.price_per_hour} onChange={e => setFormData({ ...formData, price_per_hour: e.target.value })} required />

                            <label className="small fw-bold">Ảnh:</label>
                            <input type="file" className="form-control mb-3" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />

                            <button type="submit" className={`btn w-100 fw-bold ${isEditing ? 'btn-warning' : 'btn-danger'}`}>
                                {isEditing ? 'LƯU THAY ĐỔI' : 'THÊM SÂN VÀO KHU'}
                            </button>
                            {isEditing && <button className="btn btn-link w-100 text-secondary mt-1" onClick={() => setIsEditing(false)}>Hủy</button>}
                        </form>
                    </div>
                </div>

                <div className="col-md-8">
                    {groupedFields.map(stadium => (
                        <div key={stadium.id} className="mb-5 bg-white shadow-sm rounded-3 overflow-hidden border">
                            <div className="bg-dark text-white p-3 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <h5 className="mb-0 fw-bold">🏢 KHU: {stadium.name.toUpperCase()}</h5>
                                </div>
                                <span className="badge bg-primary">{stadium.childFields.length} sân</span>
                            </div>
                            <div className="p-3">
                                <div className="row">
                                    {stadium.childFields.length > 0 ? (
                                        stadium.childFields.map(f => (
                                            <div key={f.id} className="col-md-6 mb-3">
                                                <div className="d-flex border rounded p-2 align-items-center position-relative">
                                                    <img
                                                        src={f.images?.[0]?.image_url ?
                                                            (f.images[0].image_url.startsWith('http') ? f.images[0].image_url : `http://localhost:5000/uploads/${f.images[0].image_url}`)
                                                            : 'https://via.placeholder.com/80'}
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
                                                        alt={f.name}
                                                    />
                                                    <div className="ms-3 flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="fw-bold">{f.name}</div>
                                                            <span className={`badge ${f.status === 'active' ? 'bg-success' :
                                                                f.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                                                                }`} style={{ fontSize: '0.65rem' }}>
                                                                {f.status === 'active' ? 'Đã duyệt' :
                                                                    f.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                                                            </span>
                                                        </div>
                                                        <div className="small text-muted">{f.type} - {f.price_per_hour?.toLocaleString()}đ</div>
                                                        <div className="mt-1">
                                                            <button className="btn btn-sm text-primary p-0 me-3" onClick={() => handleEdit(f)}>Sửa</button>
                                                            <button className="btn btn-sm text-danger p-0" onClick={() => handleDelete(f.id)}>Xóa</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-muted p-3">Khu này chưa có sân lẻ nào</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OwnerStadiums;