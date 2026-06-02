import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountPageHeader from '../components/AccountPageHeader';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const account = user?.user || user || {};
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: account?.name || '',
    phone: account?.phone || '',
    email: account?.email || '',
    bank_name: account?.bank_name || '',
    bank_account: account?.bank_account || '',
  });

  useEffect(() => {
    setFormData({
      full_name: account?.name || '',
      phone: account?.phone || '',
      email: account?.email || '',
      bank_name: account?.bank_name || '',
      bank_account: account?.bank_account || '',
    });
  }, [account?.bank_account, account?.bank_name, account?.email, account?.name, account?.phone]);

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      const storedAuth = JSON.parse(localStorage.getItem('user') || 'null');
      const token = user?.token || storedAuth?.token;

      const response = await axios.put(
        `http://localhost:5000/api/users/profile/${account.id}`,
        {
          full_name: formData.full_name,
          phone: formData.phone,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const updatedAccount = {
        ...account,
        ...(response.data?.user || {}),
      };

      updateUser?.({ user: updatedAccount });
      setFormData((prev) => ({
        ...prev,
        full_name: updatedAccount.name || prev.full_name,
        phone: updatedAccount.phone || prev.phone,
        email: updatedAccount.email || prev.email,
        bank_name: updatedAccount.bank_name || '',
        bank_account: updatedAccount.bank_account || '',
      }));
      window.alert('Cập nhật thông tin thành công.');
      setIsEditing(false);
    } catch (requestError) {
      window.alert(requestError.response?.data?.message || 'Không thể cập nhật thông tin.');
    }
  };

  return (
    <div className="account-page">
      <AccountPageHeader
        title="Hồ sơ của tôi"
        description="Cập nhật thông tin liên hệ để việc đặt sân và xác nhận giao dịch diễn ra thuận tiện hơn."
        action={
          <button
            type="button"
            className={isEditing ? 'secondary-button px-4 py-3' : 'primary-button px-4 py-3'}
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
          </button>
        }
      />

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="account-card h-100 text-center">
            <div className="account-avatar mx-auto mb-3" style={{ width: '88px', height: '88px', fontSize: '2rem' }}>
              {(account?.name || account?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <h2 className="h4 fw-bold mb-1">{account?.name || 'Người dùng'}</h2>
            <p className="text-muted mb-0">{account?.email || 'Chưa có email'}</p>
          </div>
        </div>

        <div className="col-lg-8">
          <form className="account-card h-100" onSubmit={handleUpdate}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="filter-label" htmlFor="fullName">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  className="filter-input"
                  disabled={!isEditing}
                  type="text"
                  value={formData.full_name}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="filter-label" htmlFor="phone">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  className="filter-input"
                  disabled={!isEditing}
                  type="text"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-12">
                <div className="account-empty-state text-start">
                  <strong>Email đăng nhập</strong>
                  <p className="mb-0 mt-2">
                    {formData.email || 'Chưa có email'}.
                    Đây là thông tin định danh tài khoản và hiện chưa thể chỉnh sửa tại giao diện này.
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <label className="filter-label" htmlFor="bankName">
                  Tên ngân hàng
                </label>
                <input
                  id="bankName"
                  className="filter-input"
                  disabled={!isEditing}
                  type="text"
                  value={formData.bank_name}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      bank_name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="filter-label" htmlFor="bankAccount">
                  Số tài khoản nhận tiền
                </label>
                <input
                  id="bankAccount"
                  className="filter-input"
                  disabled={!isEditing}
                  type="text"
                  value={formData.bank_account}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      bank_account: event.target.value,
                    }))
                  }
                />
              </div>

              {isEditing && (
                <div className="col-12 text-end">
                  <button type="submit" className="primary-button px-4 py-3">
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
