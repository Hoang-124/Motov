import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Bikes } from './pages/Bikes';
import { Booking } from './pages/Booking';
import { Bookings } from './pages/Bookings';
import { Auth } from './pages/Auth';

// Staff pages
import { StaffBookings } from './pages/staff/StaffBookings';
import { StaffBikes } from './pages/staff/StaffBikes';

// Owner pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerBikes } from './pages/owner/OwnerBikes';
import { OwnerBookings } from './pages/owner/OwnerBookings';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBikes } from './pages/admin/AdminBikes';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminUsers } from './pages/admin/AdminUsers';

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
      <div className="min-h-screen bg-dark text-white flex flex-col font-sans selection:bg-neon selection:text-dark">
        {/* Header Navigation */}
        <Header />
        
        {/* Main Content Pages */}
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/bikes" element={<Bikes />} />
            <Route path="/auth" element={<Auth />} />

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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}
