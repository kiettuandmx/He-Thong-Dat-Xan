import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return setError("Mật khẩu xác nhận không khớp!");
        }

        try {
            const res = await axios.post(`http://localhost:5000/api/reset-password/${token}`, { password });
            setMessage("Đặt lại mật khẩu thành công! Đang chuyển hướng đến đăng nhập...");
            setError('');
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra, token có thể đã hết hạn!");
            setMessage('');
        }
    };

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
                <h5 className="fw-bold mb-3">Đặt mật khẩu mới</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label text-muted small">Mật khẩu mới</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            required 
                            minLength="6"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small">Xác nhận mật khẩu</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            required 
                            minLength="6"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-success w-100">Cập nhật mật khẩu</button>
                </form>
                {message && <div className="alert alert-success mt-3 small">{message}</div>}
                {error && <div className="alert alert-danger mt-3 small">{error}</div>}
            </div>
        </div>
    );
};

export default ResetPassword;
