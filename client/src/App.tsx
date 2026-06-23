import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LanguageProvider } from './hooks/useLanguage';
import { ToastProvider } from './hooks/useToast';
import { Home } from './pages/Home';
import { Bikes } from './pages/Bikes';
import { MotorbikeDetail } from './pages/MotorbikeDetail';
import { MotorbikeForm } from './pages/MotorbikeForm';
import { Booking } from './pages/Booking';
import { Bookings } from './pages/Bookings';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';

// Staff pages
import { StaffBookings } from './pages/staff/StaffBookings';
import { StaffBikes } from './pages/staff/StaffBikes';
import { StaffSchedule } from './pages/staff/StaffSchedule';

// Owner pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerBikes } from './pages/owner/OwnerBikes';
import { OwnerBookings } from './pages/owner/OwnerBookings';

import { Promotions } from './pages/Promotions';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBikes } from './pages/admin/AdminBikes';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPromotions } from './pages/admin/AdminPromotions';
import { AdminFeedbacks } from './pages/admin/AdminFeedbacks';

// Route Guard component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: ('customer' | 'staff' | 'admin' | 'owner')[] }) => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return <Navigate to="/auth" replace />;
  }
  try {
    const user = JSON.parse(storedUser);
    if (!allowedRoles.includes(user.role)) {
      // Redirect to home if unauthorized
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
          <div className="min-h-screen bg-dark text-white flex flex-col font-sans selection:bg-neon selection:text-dark">
          {/* Header Navigation */}
          <Header />

          {/* Main Content Pages */}
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/bikes" element={<Bikes />} />
              <Route path="/motorbike/new" element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <MotorbikeForm />
                </ProtectedRoute>
              } />
              <Route path="/motorbike/:id" element={<MotorbikeDetail />} />
              <Route path="/motorbike/:id/edit" element={
                <ProtectedRoute allowedRoles={['staff', 'admin', 'owner']}>
                  <MotorbikeForm />
                </ProtectedRoute>
              } />
              <Route path="/bike-add" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <MotorbikeForm />
                </ProtectedRoute>
              } />
              <Route path="/bike-edit/:id" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <MotorbikeForm />
                </ProtectedRoute>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* Customer Protected Route */}
              <Route path="/booking/:bikeId" element={
                <ProtectedRoute allowedRoles={['customer', 'staff', 'admin', 'owner']}>
                  <Booking />
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Bookings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['customer', 'staff', 'admin', 'owner']}>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Staff Protected Routes */}
              <Route path="/staff/bookings" element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffBookings />
                </ProtectedRoute>
              } />
              <Route path="/staff/bikes" element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffBikes />
                </ProtectedRoute>
              } />
              <Route path="/staff/schedule" element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffSchedule />
                </ProtectedRoute>
              } />

              {/* Owner Protected Routes */}
              <Route path="/owner/dashboard" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/owner/bikes" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerBikes />
                </ProtectedRoute>
              } />
              <Route path="/owner/bookings" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerBookings />
                </ProtectedRoute>
              } />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/bikes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBikes />
                </ProtectedRoute>
              } />
              <Route path="/admin/bookings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBookings />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/promotions" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPromotions />
                </ProtectedRoute>
              } />
              <Route path="/admin/feedbacks" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminFeedbacks />
                </ProtectedRoute>
              } />
              <Route path="/promotions" element={<Promotions />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
          </div>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}