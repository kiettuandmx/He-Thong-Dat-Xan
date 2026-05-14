import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StadiumHashtagModal = ({ stadium, isOpen, onClose, onSave }) => {
    const [allHashtags, setAllHashtags] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchHashtags();
            // Pre-select existing hashtags
            const currentIds = stadium?.hashtags?.map(h => h.id) || [];
            setSelectedIds(currentIds);
        }
    }, [isOpen, stadium]);

    const fetchHashtags = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/hashtags');
            setAllHashtags(res.data);
        } catch (err) {
            toast.error('Không thể tải danh sách hashtag');
        }
    };

    const handleToggle = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const authData = JSON.parse(localStorage.getItem('user'));
            await axios.put(
                `http://localhost:5000/api/hashtags/stadium/${stadium.id}/hashtags`,
                { hashtag_ids: selectedIds },
                {
                    headers: { Authorization: `Bearer ${authData?.token}` }
                }
            );
            toast.success('Cập nhật hashtag thành công!');
            onSave();
            onClose();
        } catch (err) {
            toast.error('Lỗi khi cập nhật hashtag');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">Gán Hashtag cho "{stadium?.name}"</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body py-4">
                        <p className="text-muted small mb-3">Chọn các hashtag để phân loại sân của bạn:</p>
                        
                        <div className="row g-2">
                            {allHashtags.map(tag => (
                                <div className="col-6" key={tag.id}>
                                    <div 
                                        className={`p-2 border rounded-3 d-flex align-items-center gap-2 cursor-pointer ${selectedIds.includes(tag.id) ? 'border-success bg-success-subtle' : ''}`}
                                        onClick={() => handleToggle(tag.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input mt-0"
                                            checked={selectedIds.includes(tag.id)}
                                            onChange={() => {}} // Handled by div click
                                        />
                                        <span className={selectedIds.includes(tag.id) ? 'text-success fw-bold' : ''}>
                                            #{tag.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {allHashtags.length === 0 && (
                          <div className="text-center py-3 text-muted">
                            Chưa có hashtag nào trong hệ thống.
                          </div>
                        )}
                    </div>
                    <div className="modal-footer border-0 pt-0">
                        <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Đóng</button>
                        <button 
                            type="button" 
                            className="btn btn-success rounded-pill px-4" 
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StadiumHashtagModal;
