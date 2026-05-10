import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />; // Phải có dòng này để hiện trang con bên trong route bảo vệ
};

export default ProtectedRoute;