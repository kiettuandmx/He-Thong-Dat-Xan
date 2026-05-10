// components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user } = useAuth();

    // Kiểm tra nếu chưa login hoặc role không phải là 1 (Admin)
    if (!user || user.user.role_id !== 1) {
        alert("Bạn không có quyền truy cập trang này!");
        return <Navigate to="/" />;
    }

    return children;
};

export default AdminRoute;