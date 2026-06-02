import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { resolveNotificationTarget } from '../utils/notificationHelpers';

const NOTIFICATION_LIMIT = 20;

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      const token = userData?.token;
      const currentUser = userData?.user;

      if (!token || !currentUser) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const res = await fetch(
        `http://localhost:5000/api/bookings/notifications?limit=${NOTIFICATION_LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error('API trả về lỗi:', text);
        throw new Error(`API lỗi ${res.status}`);
      }

      const data = await res.json();
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const nextUnreadCount =
        typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : items.filter((item) => !item.is_read).length;

      setNotifications(items);
      setUnreadCount(nextUnreadCount);
    } catch (err) {
      console.error('Lỗi lấy thông báo từ DB:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    const currentUser = userData?.user;
    const socket = io('http://localhost:5000', { transports: ['websocket'] });

    const registerUser = () => {
      if (currentUser?.id) {
        socket.emit('login', currentUser.id);
      }
    };

    socket.on('connect', registerUser);
    socket.on('reconnect', registerUser);

    fetchNotifications();

    socket.on('newNotification', (data) => {
      setNotifications((prev) => {
        const next = prev.filter((item) => item.id !== data.id);
        return [data, ...next].slice(0, NOTIFICATION_LIMIT);
      });

      if (!data.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off('connect', registerUser);
      socket.off('reconnect', registerUser);
      socket.off('newNotification');
      socket.disconnect();
    };
  }, []);

  const markAsRead = async () => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    const token = userData?.token;

    try {
      await fetch('http://localhost:5000/api/bookings/notifications/read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setShowDropdown(false);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      setShowDropdown(false);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    const token = userData?.token;
    const currentUser = userData?.user;
    const notification = notifications.find((item) => item.id === notificationId);
    const wasUnread = notification && !notification.is_read;

    try {
      await fetch(`http://localhost:5000/api/bookings/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
    }

    setShowDropdown(false);
    navigate(resolveNotificationTarget(notification, currentUser));
  };

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
              fontFamily: 'var(--font-family-base)',
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
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                {unreadCount} mới
              </span>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '13px',
                }}
              >
                Đang tải thông báo...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n, index) => (
                <div
                  key={n.id || index}
                  onClick={() => handleNotificationClick(n.id)}
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
                    {n.title && (
                      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                        {n.title}
                      </div>
                    )}
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

          {unreadCount > 0 && (
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
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationComponent;
