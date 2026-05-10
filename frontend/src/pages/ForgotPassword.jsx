import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await axios.post('http://localhost:5000/api/forgot-password', { email });
        setMessage("Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.");
      } catch (err) {
        setMessage(err.response?.data?.message || "Có lỗi xảy ra!");
      }
    };

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
                <h5 className="fw-bold mb-3">Khôi phục mật khẩu</h5>
                <p className="text-muted small">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        className="form-control mb-3" 
                        placeholder="Email của bạn"
                        required 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button className="btn btn-success w-100">Gửi yêu cầu</button>
                </form>
                {message && <div className="alert alert-info mt-3 small">{message}</div>}
            </div>
        </div>
    );
};

export default ForgotPassword;