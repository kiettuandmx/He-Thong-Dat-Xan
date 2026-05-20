import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import NotificationComponent from './components/NotificationComponent';
import Home from './components/Home';
import MyReviews from './components/MyReviews';

import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import FieldListPage from './pages/FieldListPage';
import FootballPage from './pages/FootballPage';
import BadmintonPage from './pages/BadmintonPage';
import PickleballPage from './pages/PickleballPage';
import BookingHistory from './pages/BookingHistory';
import FavoritesPage from './pages/FavoritesPage';
import MyComplaints from './pages/MyComplaints';
import ProfilePage from './pages/ProfilePage';
import FieldDetail from './pages/FieldDetail';
import PaymentPage from './pages/PaymentPage';
import PaymentMoMo from './pages/PaymentMoMo';
import StadiumDetail from './pages/StadiumDetail';
import OwnerStadiums from './pages/OwnerStadiums';
import ManageStadiums from './pages/ManageStadiums';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerReviews from './pages/OwnerReviews';
import PaymentHistory from './pages/PaymentHistory';
import WalletPage from './pages/WalletPage';
import RecurringBookingPage from './pages/RecurringBookingPage';
import BookingDetailPage from './pages/BookingDetailPage';
import EditField from './pages/EditField';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import AdminStadiums from './pages/AdminStadiums';
import AdminLayout from './pages/AdminLayout';
import AddFieldPage from './pages/AddFieldPage';
import EditFieldPage from './pages/EditFieldPage';
import AdminHashtags from './pages/AdminHashtags';
import AdminActivityLogs from './pages/AdminActivityLogs';
import AdminComplaints from './pages/AdminComplaints';
import AdminOwnerOverview from './pages/AdminOwnerOverview';
import AdminOwnerStadiums from './pages/AdminOwnerStadiums';
import AdminBookingManagement from './pages/AdminBookingManagement';
import AdminReviewManagement from './pages/AdminReviewManagement';
import OwnerRecurringRequests from './pages/OwnerRecurringRequests';
import OwnerFieldMenuPage from './pages/OwnerFieldMenuPage';
import OwnerFoodOrdersPage from './pages/OwnerFoodOrdersPage';

import './App.css';

function App() {
  const storedAuth = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = storedAuth?.user;
  const role = Number(currentUser?.role_id || currentUser?.role);

  return (
    <AuthProvider>
      <ToastContainer />
      <BrowserRouter>
        {currentUser && <NotificationComponent type={role === 2 ? 'owner' : 'user'} />}

        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<FieldListPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/football" element={<FootballPage />} />
            <Route path="/badminton" element={<BadmintonPage />} />
            <Route path="/pickleball" element={<PickleballPage />} />
            <Route path="/field/:id" element={<FieldDetail />} />
            <Route path="/payment-vnpay/:bookingId" element={<PaymentPage />} />
            <Route path="/payment-momo/:bookingId" element={<PaymentMoMo />} />
            <Route path="/stadium/:id" element={<StadiumDetail />} />
            <Route path="/home" element={<Home />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[1, 2, 3]} />}>
            <Route element={<MainLayout />}>
              <Route path="/history" element={<BookingHistory />} />
              <Route path="/history/:bookingId" element={<BookingDetailPage />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/recurring-bookings" element={<RecurringBookingPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/complaints" element={<MyComplaints />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-reviews" element={<MyReviews />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[2, 3]} />}>
            <Route element={<MainLayout />}>
              <Route path="/owner/stadiums" element={<ManageStadiums />} />
              <Route path="/owner/fields" element={<OwnerStadiums />} />
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/edit-field/:id" element={<EditField />} />
              <Route path="/owner/reviews" element={<OwnerReviews />} />
              <Route path="/owner/payment-history" element={<PaymentHistory />} />
              <Route path="/owner/recurring-requests" element={<OwnerRecurringRequests />} />
              <Route path="/owner/fields/:fieldId/menu" element={<OwnerFieldMenuPage />} />
              <Route path="/owner/fields/:fieldId/food-orders" element={<OwnerFoodOrdersPage />} />
            </Route>
          </Route>

           <Route element={<ProtectedRoute allowedRoles={[3]} />}>
             <Route path="/admin" element={<AdminLayout />}>
               <Route path="dashboard" element={<AdminDashboard />} />
               <Route path="users" element={<AdminUsers />} />
               <Route path="stadiums" element={<AdminStadiums />} />
               <Route path="add-field" element={<AddFieldPage />} />
               <Route path="edit-field/:id" element={<EditFieldPage />} />
               <Route path="hashtags" element={<AdminHashtags />} />
               <Route path="activity-logs" element={<AdminActivityLogs />} />
               <Route path="complaints" element={<AdminComplaints />} />
               <Route path="owner/overview" element={<AdminOwnerOverview />} />
               <Route path="owner/stadiums" element={<AdminOwnerStadiums />} />
               <Route path="owner/fields" element={<AdminStadiums />} />
               <Route path="owner/bookings" element={<AdminBookingManagement />} />
               <Route path="owner/reviews" element={<AdminReviewManagement />} />
               <Route path="book-field" element={<FieldListPage detailBasePath="/admin/field" />} />
               <Route path="field/:id" element={<FieldDetail />} />
               <Route path="payment-vnpay/:bookingId" element={<PaymentPage />} />
               <Route path="payment-momo/:bookingId" element={<PaymentMoMo />} />
               <Route path="profile" element={<ProfilePage />} />
               <Route path="history" element={<BookingHistory />} />
               <Route path="favorites" element={<FavoritesPage />} />
               <Route path="my-complaints" element={<MyComplaints />} />
               <Route path="my-reviews" element={<MyReviews />} />
             </Route>
           </Route>

          <Route
            path="/403"
            element={
              <div className="text-center mt-5">
                <h1>403 - Bạn không có quyền truy cập</h1>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="text-center mt-5">
                <h1>404 - Trang bạn tìm không tồn tại</h1>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
