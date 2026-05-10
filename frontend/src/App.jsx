import React, { useEffect } from 'react';
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
  const userData = JSON.parse(localStorage.getItem('user'));
  const user = userData?.user;
  const role = user?.role;



  console.log('DEBUG ROLE:', role);

  return (
    <AuthProvider>
      <ToastContainer />
      <BrowserRouter>
        {user && (
          <NotificationComponent type={role === 2 ? 'owner' : 'user'} />
        )}
        <Routes>
          {/* 1. Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<FieldListPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* 2. Protected Routes cho mọi User */}
          <Route element={<MainLayout />}>
            <Route path="/football" element={<FootballPage />} />
            <Route path="/badminton" element={<BadmintonPage />} />
            <Route path="/pickleball" element={<PickleballPage />} />
            <Route path="/history" element={<BookingHistory />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/field/:id" element={<FieldDetail />} />
            <Route path="/payment-vnpay/:bookingId" element={<PaymentPage />} />
            <Route path="/payment-momo/:bookingId" element={<PaymentMoMo />} />
            <Route path="/stadium/:id" element={<StadiumDetail />} />
            <Route path="/my-reviews" element={<MyReviews />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Home />} />
          </Route>

          {/* 3. Owner Routes */}
          <Route element={<ProtectedRoute allowedRoles={[2]} />}>
            <Route element={<MainLayout />}>
              <Route path="/owner/stadiums" element={<ManageStadiums />} />
              <Route path="/owner/fields" element={<OwnerStadiums />} />
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/history" element={<BookingHistory />} />
              <Route path="/owner/edit-field/:id" element={<EditField />} />
              <Route path="/stadium/:id" element={<StadiumDetail />} />
              <Route path="/owner/reviews" element={<OwnerReviews />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={<Home />} />
            </Route>
          </Route>

          {/* 4. Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="stadiums" element={<AdminStadiums />} />
            <Route path="add-field" element={<AddFieldPage />} />
            <Route path="edit-field/:id" element={<EditFieldPage />} />
          </Route>

          {/* 5. Trạng thái khác */}
          <Route
            path="/403"
            element={
              <div className="text-center mt-5">
                <h1>403 - Không có quyền!</h1>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="text-center mt-5">
                <h1>404 - Không tồn tại!</h1>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
