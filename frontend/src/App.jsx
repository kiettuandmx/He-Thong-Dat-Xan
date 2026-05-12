import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerStadiums from './pages/OwnerStadiums';
import ManageStadiums from './pages/ManageStadiums';
import FieldDetail from './pages/FieldDetail';
import EditField from './pages/EditField';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import AdminStadiums from './pages/AdminStadiums';
import AdminLayout from './pages/AdminLayout';
import BadmintonPage from './pages/BadmintonPage';
import PickleballPage from './pages/PickleballPage';
import FootballPage from './pages/FootballPage';
import BookingHistory from './pages/BookingHistory';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';
import PaymentMoMo from './pages/PaymentMoMo';
import Home from './components/Home';
import StadiumDetail from './pages/StadiumDetail';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerReviews from './pages/OwnerReviews';
import MyReviews from './components/MyReviews';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AddFieldPage from './pages/AddFieldPage';
import EditFieldPage from './pages/EditFieldPage';
import NotificationComponent from './components/NotificationComponent';
import FavoritesPage from './pages/FavoritesPage';
import RefundHistory from './pages/RefundHistory';
import AdminRefundHistory from './pages/AdminRefundHistory';
import UserCashFlow from './pages/UserCashFlow';

// Layout & Pages
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import FieldListPage from './pages/FieldListPage';
import './App.css';

// --- TOAST ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  let user = null;
  let role = null;
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    user = userData?.user;
    role = user?.role;
  } catch (error) {
    console.error("Lỗi đọc dữ liệu user:", error);
  }

  return (
    <AuthProvider>
      <ToastContainer />
      <BrowserRouter>
        {user && (
          <NotificationComponent type={role === 2 ? 'owner' : 'user'} />
        )}
        
        <Routes>
          {/* 1. PUBLIC & GENERAL ROUTES */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<FieldListPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/football" element={<FootballPage />} />
            <Route path="/badminton" element={<BadmintonPage />} />
            <Route path="/pickleball" element={<PickleballPage />} />
            <Route path="/history" element={<BookingHistory />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/field/:id" element={<FieldDetail />} />
            <Route path="/stadium/:id" element={<StadiumDetail />} />
            <Route path="/payment-vnpay/:bookingId" element={<PaymentPage />} />
            <Route path="/payment-momo/:bookingId" element={<PaymentMoMo />} />
            <Route path="/my-reviews" element={<MyReviews />} />
            <Route path="/home" element={<Home />} />
          </Route>

          {/* 2. OWNER ROUTES (Role 2) */}
          <Route element={<ProtectedRoute allowedRoles={[2]} />}>
            <Route element={<MainLayout />}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/stadiums" element={<ManageStadiums />} />
              <Route path="/owner/fields" element={<OwnerStadiums />} />
              <Route path="/owner/edit-field/:id" element={<EditField />} />
              <Route path="/owner/reviews" element={<OwnerReviews />} />
              <Route path="/owner/refund-history" element={<RefundHistory />} />
            </Route>
          </Route>

          {/* 3. ADMIN ROUTES */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="stadiums" element={<AdminStadiums />} />
            <Route path="add-field" element={<AddFieldPage />} />
            <Route path="edit-field/:id" element={<EditFieldPage />} />
            <Route path="refund-history" element={<AdminRefundHistory />} />
            <Route path="user-cash-flow/:userId" element={<UserCashFlow />} />
          </Route>

          {/* 4. ERROR PAGES */}
          <Route path="/403" element={<div className="text-center mt-5"><h1>403 - Không có quyền!</h1></div>} />
          <Route path="*" element={<div className="text-center mt-5"><h1>404 - Không tồn tại!</h1></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;