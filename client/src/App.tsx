import React, { lazy, Suspense } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LanguageProvider } from './hooks/useLanguage';
import { ToastProvider } from './hooks/useToast';

// Token refresh management
let refreshPromise: Promise<string | null> | null = null;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    if (data && data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.token = data.token;
        localStorage.setItem('user', JSON.stringify(user));
      }
      return data.token;
    }
  } catch (err) {
    console.error('Refresh token error:', err);
  }

  // If refresh fails, clear auth and redirect
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/auth';
  return null;
}

// 1. Wrap Global Axios
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    if (response && response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = performTokenRefresh();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

// 2. Wrap Global Fetch
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  // Automatically append Authorization header if token exists and header is not explicitly set
  const token = localStorage.getItem('token');
  const actualInit = { ...init };
  if (token) {
    const urlString = typeof input === 'string' ? input : (input as Request).url;
    const isSameOrigin = !urlString.startsWith('http://') && !urlString.startsWith('https://') 
      || urlString.startsWith(API_BASE_URL) 
      || urlString.startsWith(window.location.origin);

    if (isSameOrigin) {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      actualInit.headers = headers;
    }
  }

  let response = await originalFetch(input, actualInit);

  if (response.status === 401) {
    const urlString = typeof input === 'string' ? input : (input as Request).url;
    if (urlString.includes('/auth/refresh') || urlString.includes('/auth/login') || urlString.includes('/auth/register')) {
      return response;
    }

    if (!refreshPromise) {
      refreshPromise = performTokenRefresh();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      const headers = new Headers(init?.headers || {});
      headers.set('Authorization', `Bearer ${newToken}`);
      return originalFetch(input, { ...init, headers });
    }
  }

  return response;
};

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Bikes = lazy(() => import('./pages/Bikes').then(module => ({ default: module.Bikes })));
const BikesMap = lazy(() => import('./pages/BikesMap').then(module => ({ default: module.BikesMap })));
const MotorbikeDetail = lazy(() => import('./pages/MotorbikeDetail').then(module => ({ default: module.MotorbikeDetail })));
const MotorbikeForm = lazy(() => import('./pages/MotorbikeForm').then(module => ({ default: module.MotorbikeForm })));
const Booking = lazy(() => import('./pages/Booking').then(module => ({ default: module.Booking })));
const Bookings = lazy(() => import('./pages/Bookings').then(module => ({ default: module.Bookings })));
const Auth = lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(module => ({ default: module.VerifyEmail })));
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));

// Chat
import { ChatProvider } from './contexts/ChatContext';
import { ChatLayout } from './components/chat/ChatLayout';

// Staff pages
const StaffBookings = lazy(() => import('./pages/staff/StaffBookings').then(module => ({ default: module.StaffBookings })));
const StaffBikes = lazy(() => import('./pages/staff/StaffBikes').then(module => ({ default: module.StaffBikes })));
const StaffSchedule = lazy(() => import('./pages/staff/StaffSchedule').then(module => ({ default: module.StaffSchedule })));

// Owner pages
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard').then(module => ({ default: module.OwnerDashboard })));
const OwnerBikes = lazy(() => import('./pages/owner/OwnerBikes').then(module => ({ default: module.OwnerBikes })));
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings').then(module => ({ default: module.OwnerBookings })));

const Promotions = lazy(() => import('./pages/Promotions').then(module => ({ default: module.Promotions })));
const VNPayReturn = lazy(() => import('./pages/VNPayReturn').then(module => ({ default: module.VNPayReturn })));
const CompareBikes = lazy(() => import('./pages/CompareBikes').then(module => ({ default: module.CompareBikes })));
import { CompareProvider } from './contexts/CompareContext';
import { CompareBar } from './components/CompareBar';

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminBikes = lazy(() => import('./pages/admin/AdminBikes').then(module => ({ default: module.AdminBikes })));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings').then(module => ({ default: module.AdminBookings })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions').then(module => ({ default: module.AdminPromotions })));
const AdminFeedbacks = lazy(() => import('./pages/admin/AdminFeedbacks').then(module => ({ default: module.AdminFeedbacks })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then(module => ({ default: module.AdminCategories })));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement').then(module => ({ default: module.InventoryManagement })));

const LoadingFallback = () => (
  <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-neon/15"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-neon border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
    </div>
    <span className="text-gray-400 text-sm font-medium animate-pulse">Đang tải ứng dụng...</span>
  </div>
);

// Auto-migrate session token if missing
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser && !localStorage.getItem('token')) {
    const user = JSON.parse(storedUser);
    if (user && user.token) {
      localStorage.setItem('token', user.token);
    }
  }
} catch (e) {
  console.error('Session migration error:', e);
}

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
          <ChatProvider>
            <CompareProvider>
            <div className="min-h-screen bg-dark text-white flex flex-col font-sans selection:bg-neon selection:text-dark">
              {/* Header Navigation */}
              <Header />

              {/* Main Content Pages */}
              <main className="flex-grow">
              <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/bikes" element={<Bikes />} />
                <Route path="/bikes-map" element={<BikesMap />} />
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
                  <ProtectedRoute allowedRoles={['customer', 'owner']}>
                    <Bookings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin', 'owner']}>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin', 'owner']}>
                    <Chat />
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
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCategories />
                  </ProtectedRoute>
                } />
                <Route path="/admin/inventory" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <InventoryManagement />
                  </ProtectedRoute>
                } />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/vnpay-return" element={<VNPayReturn />} />
                <Route path="/compare" element={<CompareBikes />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
              </main>

              {/* Footer */}
              <Footer />
              {/* Compare Bar - appears when bikes are selected for comparison */}
              <CompareBar />
              </div>
            </CompareProvider>
          </ChatProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}