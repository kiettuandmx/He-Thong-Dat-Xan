import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5000', { transports: ['websocket'] });

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // =========================
  // LOAD DATA
  // =========================
  const fetchNotifications = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = userData?.token;
      const currentUser = userData?.user;

      if (!token || !currentUser) return;

      const roleMap = {
        1: 'user',
        2: 'owner',
        3: 'admin',
      };

      const roleName = roleMap[currentUser.role];
      const url = `http://localhost:5000/api/bookings/notifications?role=${roleName}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API trả về lỗi:', text);
        throw new Error('API lỗi ' + res.status);
      }

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi lấy thông báo từ DB:', err);
      setNotifications([]);
    }
  };

  // =========================
  // SOCKET REALTIME
  // =========================
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const currentUser = userData?.user;

    if (currentUser?.id) {
      socket.emit('login', currentUser.id);
    }

    fetchNotifications();

    socket.on('newNotification', (data) => {
      console.log('ĐÃ NHẬN THÔNG BÁO MỚI:', data);
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.off('newNotification');
    };
  }, []);

  // =========================
  // MARK AS READ
  // =========================
  const markAsRead = async () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = userData?.token;

    try {
      await fetch('http://localhost:5000/api/bookings/notifications/read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      // CẬP NHẬT TẠI CHỖ (Không gọi lại API để tránh bị mất danh sách)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
    }
  };

  const handleNotificationClick = async () => {
    // Có thể mark as read ở đây hoặc giữ nguyên logic hiện tại
    // Đóng dropdown
    setShowDropdown(false);
    // Chuyển hướng sang trang lịch sử/duyệt đơn
    navigate('/history');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="noti-wrapper">
      <div className="bell-icon" onClick={() => setShowDropdown(!showDropdown)}>
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </div>

      {showDropdown && (
        <div
          className="noti-dropdown"
          style={{
            position: 'absolute',
            right: 0,
            top: '45px',
            width: '320px',
            background: '#ffffff',
            borderRadius: '12px',
            zIndex: 1000,
            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
          }}
        >
          {/* Header màu xanh phẳng (Flat Blue) */}
          <div
            style={{
              background: '#007b54',
              color: '#fff',
              padding: '14px 16px',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderBottom: '1px solid #f0f0f0',
              fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
            }}
          >
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '15px',
                  color: '#ffffff',
                  position: 'absolute',
                  right: '16px',
                  fontWeight: '500',
                  fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
                }}
              >
                {unreadCount} mới
              </span>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((n, index) => (
                <div
                  key={n.id || index}
                  onClick={handleNotificationClick}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    background: n.is_read ? '#fff' : '#fafafa',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13.5px',
                      color: n.is_read ? '#000000' : '#1f1f1f',
                      lineHeight: '1.5',
                      fontWeight: n.is_read ? '400' : '500',
                    }}
                  >
                    {n.content || n.message}
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      color: '#bfbfbf',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ marginRight: '4px' }}>🕒</span>
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'Vừa xong'}
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#bfbfbf',
                  fontSize: '13px',
                }}
              >
                Không có thông báo mới
              </div>
            )}
          </div>

          {/* Nút bấm tinh tế */}
          <div
            style={{
              padding: '8px',
              borderTop: '1px solid #f0f0f0',
              background: '#fff',
            }}
          >
            <button
              onClick={markAsRead}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                padding: '8px',
                color: '#010101',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f0f9ff')}
              onMouseLeave={(e) => (e.target.style.background = 'transparent')}
            >
              ✓ Đánh dấu đã đọc
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationComponent;
