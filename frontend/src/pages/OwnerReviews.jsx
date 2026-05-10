import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OwnerReviews = () => {
    // 1. Khai báo các State bên trong hàm
    const [reviews, setReviews] = useState([]);
    const [replyText, setReplyText] = useState("");
    const token = JSON.parse(localStorage.getItem('user'))?.token; // Lấy token để gửi API

    // 2. Hàm lấy danh sách đánh giá từ server
    const fetchReviews = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/reviews/owner`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách review:", err);
        }
    };

    // Tự động load dữ liệu khi vào trang
    useEffect(() => {
        fetchReviews();
    }, []);

    // 3. Hàm gửi phản hồi (Hàm của Lâm)
    const handleReply = async (reviewId) => {
        try {
            await axios.post(`http://localhost:5000/api/reviews/reply`, {
                review_id: reviewId,
                owner_reply: replyText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Đã gửi phản hồi thành công!");
            setReplyText(""); // Xóa chữ trong ô nhập sau khi gửi
            fetchReviews(); // Load lại danh sách
        } catch (err) {
            console.error(err);
            alert("Lỗi phản hồi rồi Lâm ơi!");
        }
    };

    // 4. Lệnh RETURN phải nằm cuối hàm và bọc toàn bộ JSX
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Danh sách đánh giá của khách</h2>
            {reviews.length === 0 ? (
                <p>Chưa có đánh giá nào.</p>
            ) : (
                reviews.map(rev => (
                    <div key={rev.id} className="border p-4 mb-2 rounded shadow-sm">
                        <p><strong>Khách hàng:</strong> {rev.comment} (⭐{rev.rating})</p>
                        
                        {rev.owner_reply ? (
                            <p className="ml-5 mt-2 text-blue-600 bg-blue-50 p-2 rounded">
                                <strong>Bạn đã trả lời:</strong> {rev.owner_reply}
                            </p>
                        ) : (
                            <div className="mt-3 flex gap-2">
                                <input 
                                    className="border p-1 flex-1 rounded"
                                    type="text" 
                                    placeholder="Viết lời cảm ơn khách..." 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)} 
                                />
                                <button 
                                    className="bg-green-600 text-white px-4 py-1 rounded"
                                    onClick={() => handleReply(rev.id)}
                                >
                                    Phản hồi
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}; // Đóng ngoặc của hàm OwnerReviews ở đây

export default OwnerReviews; // Cuối cùng mới export