import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [stadiums, setStadiums] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStadiums();
    }, []);

    const fetchStadiums = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/stadiums');
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            setStadiums(data);
        } catch (err) {
            console.error("Lỗi lấy danh sách:", err);
        }
    };

    return (
        <div className="container mt-5">
            <div className="mb-5 text-center">
                <h2 className="fw-bold text-dark">Hệ thống sân bóng</h2>
                <p className="text-muted">Chọn cơ sở và đặt sân ngay hôm nay</p>
            </div>

            {stadiums.map((stadium) => (
                <div key={stadium.id} className="stadium-card mb-5 bg-white shadow-sm rounded-4 border-0">
                    {/* PHẦN ĐẦU: THÔNG TIN KHU */}
                    <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top-4">
                        <div>
                            <h3 className="fw-bold text-primary mb-1">🏢 {stadium.name}</h3>
                            <p className="text-muted mb-0 small">
                                <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                                {stadium.address} - {stadium.district}
                            </p>
                        </div>
                        <div className="text-end">
                            <span className="badge bg-dark px-3 py-2 rounded-pill">
                                {stadium.fields?.length || 0} Sân con
                            </span>
                        </div>
                    </div>

                    {/* PHẦN DƯỚI: DANH SÁCH SÂN CON TRONG KHU */}
                    <div className="p-4">
                        <div className="row">
                            {stadium.fields && stadium.fields.length > 0 ? (
                                stadium.fields.map((field) => (
                                    <div key={field.id} className="col-lg-3 col-md-6 mb-4">
                                        <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                                            {/* --- ĐOẠN ẢNH ĐÃ SỬA Ở ĐÂY --- */}
                                            <div style={{ height: '150px', backgroundColor: '#eee' }}>
                                                <img 
                                                    src={
                                                        (() => {
                                                            const img = (field.images && field.images.length > 0) 
                                                                ? field.images[0].image_url 
                                                                : field.image_url;
                                                            
                                                            if (!img) return 'https://via.placeholder.com/300x200?text=San+Bong';
                                                            return img.startsWith('http') ? img : `http://localhost:5000/uploads/${img}`;
                                                        })()
                                                    } 
                                                    className="w-100 h-100" 
                                                    style={{ objectFit: 'cover' }}
                                                    alt={field.name} 
                                                />
                                            </div>
                                            {/* ---------------------------- */}

                                            <div className="card-body p-3">
                                                <h6 className="fw-bold text-truncate">{field.name}</h6>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                        {field.type}
                                                    </span>
                                                    <span className="fw-bold text-danger">
                                                        {/* Ép kiểu Number để toLocaleString chạy đúng */}
                                                        {Number(field.price_per_hour).toLocaleString()}đ
                                                    </span>
                                                </div>
                                                <button 
                                                    className="btn btn-primary w-100 btn-sm fw-bold rounded-pill"
                                                    onClick={() => navigate(`/stadium/${stadium.id}`)}
                                                >
                                                    Đặt sân
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center py-4 text-muted">
                                    <i>Cơ sở này đang cập nhật danh sách sân lẻ...</i>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Home;