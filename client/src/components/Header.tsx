import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Shield, Briefcase, Award, UserCheck, Settings, ClipboardList, BookOpen, Activity, Ticket, Bell, Check, Trash2, MessageSquare, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService, NotificationItem } from '../services/notificationService.js';
import { useLanguage } from '../hooks/useLanguage';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // Lấy thông báo định kỳ
  const fetchNotifications = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const res = await notificationService.getMyNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông báo:', err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string, relatedId?: string) => {
    const noti = notifications.find(n => n._id === id);
    const alreadyRead = noti ? noti.isRead : false;

    const navigateToBooking = () => {
      if (relatedId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'admin') navigate('/admin/bookings');
          else if (parsed.role === 'staff') navigate('/staff/bookings');
          else if (parsed.role === 'owner') navigate('/owner/bookings');
          else navigate('/bookings');
        } else {
          navigate('/bookings');
        }
        setIsNotiOpen(false);
      }
    };

    if (alreadyRead) {
      navigateToBooking();
      return;
    }

    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        // Cập nhật state local
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(res.unreadCount);
        navigateToBooking();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Ngăn chặn trigger click vào item thông báo
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  const handleBecomeOwner = async () => {
    const confirmBecome = window.confirm(
      "Bạn có chắc chắn muốn gửi yêu cầu đăng ký làm chủ xe đối tác của Motov không? Yêu cầu của bạn sẽ được nhân viên xét duyệt."
    );
    if (!confirmBecome) return;

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const { token } = JSON.parse(storedUser);

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/auth/become-owner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert("Đăng ký làm đối tác chủ xe thành công! Vui lòng chờ nhân viên phê duyệt.");
        
        // Cập nhật trạng thái chờ duyệt vào user local
        const parsedUser = JSON.parse(storedUser);
        parsedUser.ownerRequestStatus = 'Pending';
        localStorage.setItem('user', JSON.stringify(parsedUser));
        setUser(parsedUser);
        
        window.location.reload();
      } else {
        alert(data.message || "Có lỗi xảy ra trong quá trình đăng ký.");
      }
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine navigation items based on user role
  const getNavLinks = () => {
    if (!user) {
      return [
        { path: '/', label: t('nav.home') },
        { path: '/bikes', label: t('nav.bikes') },
        { path: '/promotions', label: t('nav.promotions') },
      ];
    }

    if (user.role === 'admin') {
      return [
        { path: '/admin/dashboard', label: t('nav.dashboard') },
        { path: '/admin/bikes', label: t('nav.manageBikes') },
        { path: '/admin/bookings', label: t('nav.allBookings') },
        { path: '/admin/users', label: t('nav.roles') },
        { path: '/admin/promotions', label: t('nav.promotions') },
        { path: '/admin/feedbacks', label: t('nav.feedbacks') },
      ];
    }

    if (user.role === 'staff') {
      return [
        { path: '/staff/bookings', label: t('nav.approveBookings') },
        { path: '/staff/bikes', label: t('nav.bikeStatus') },
      ];
    }

    if (user.role === 'owner') {
      return [
        { path: '/owner/dashboard', label: t('nav.revenue') },
        { path: '/owner/bikes', label: t('nav.myBikes') },
        { path: '/owner/bookings', label: t('nav.myBookings') },
      ];
    }

    // Default: Customer
    return [
      { path: '/', label: t('nav.home') },
      { path: '/bikes', label: t('nav.bikes') },
      { path: '/bookings', label: t('nav.myBookings') },
      { path: '/promotions', label: t('nav.promotions') },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-dark/85 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="font-display font-black text-3xl tracking-tight text-neon transition-transform hover:scale-105 duration-200">
          Motov
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`${isActive(link.path) ? 'text-neon text-glow' : 'text-gray-300 hover:text-white'} transition-all duration-300 uppercase`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User profile / Login button */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher */}
          <div className="relative flex items-center bg-surface/50 border border-gray-800 rounded-full p-0.5 select-none">
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${language === 'vi' ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              VI
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${language === 'en' ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>

          {user ? (
            <>
              {/* Notification Bell Icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotiOpen(!isNotiOpen);
                    setIsDropdownOpen(false); // Đóng dropdown profile nếu đang mở
                  }}
                  className="relative p-2 rounded-full bg-surface border border-gray-800 hover:border-neon hover:text-white text-gray-400 transition-all duration-300 cursor-pointer"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border border-dark animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Notification */}
                <AnimatePresence>
                  {isNotiOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsNotiOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-[320px] md:w-[360px] overflow-hidden text-gray-300 font-sans"
                      >
                        {/* Top Neon line */}
                        <div className="absolute top-0 inset-x-0 h-[3px] bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

                        {/* Header */}
                        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                          <span className="font-bold text-white text-sm uppercase tracking-wider">Thông báo ({unreadCount})</span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-neon hover:underline cursor-pointer flex items-center gap-1 font-semibold border-none bg-transparent"
                            >
                              <Check size={12} /> Đọc tất cả
                            </button>
                          )}
                        </div>

                        {/* List content */}
                        <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                              Không có thông báo nào.
                            </div>
                          ) : (
                            notifications.map((noti) => (
                              <div
                                key={noti._id}
                                onClick={() => handleMarkAsRead(noti._id, noti.relatedId)}
                                className={`p-4 flex gap-3 text-left transition-all duration-200 cursor-pointer ${
                                  noti.isRead ? 'opacity-70 hover:opacity-100 hover:bg-white/5' : 'bg-neon/5 hover:bg-neon/10 border-l-2 border-neon'
                                }`}
                              >
                                {/* Status Indicator Color */}
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  noti.type === 'BookingConfirmed' ? 'bg-green-500' :
                                  noti.type === 'BookingCancelled' ? 'bg-red-500' :
                                  noti.type === 'BookingPending' ? 'bg-yellow-500' :
                                  'bg-neon'
                                }`} />
                                
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{noti.title}</p>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{noti.message}</p>
                                  <span className="text-[10px] text-gray-500 mt-2 block">{formatTimeAgo(noti.createdAt)}</span>
                                </div>

                                <button 
                                  onClick={(e) => handleDeleteNotification(e, noti._id)}
                                  className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all h-fit border-none bg-transparent cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div 
                className="relative animate-fade-in"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
              {/* Profile Trigger Button */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-gray-800 hover:border-neon text-xs font-semibold text-gray-300 hover:text-white transition-all duration-300 cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                    {user.role === 'admin' && <Shield size={10} className="text-neon" />}
                    {user.role === 'staff' && <Briefcase size={10} className="text-yellow-500" />}
                    {user.role === 'owner' && <UserCheck size={10} className="text-cyan-400" />}
                    {user.role === 'customer' && <Award size={10} className="text-green-500" />}
                  </div>
                )}
                <span className="font-medium text-gray-300 max-w-[100px] truncate">{user.name}</span>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  user.role === 'admin' ? 'bg-neon/10 text-neon border border-neon/20' :
                  user.role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  user.role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-green-500/10 text-green-500 border border-green-500/20'
                }`}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : user.role === 'owner' ? 'Owner' : 'Khách'}
                </span>
              </button>

              {/* Dropdown Menu (GitHub Style) */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    {/* Click outside to close overlay */}
                    <div 
                      className="fixed inset-0 z-40 bg-transparent cursor-default"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-[260px] overflow-hidden text-gray-300 font-sans"
                    >
                    {/* Top neon indicator line */}
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

                    {/* Header info */}
                    <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-black/20">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-500">
                          <User size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Role Tag & Info */}
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-gray-400 bg-black/10">
                      <span className="font-medium uppercase tracking-wider text-[10px]">Vai trò</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        user.role === 'admin' ? 'bg-neon/10 text-neon border border-neon/20' :
                        user.role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        user.role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : user.role === 'owner' ? 'Chủ xe' : 'Khách thuê'}
                      </span>
                    </div>

                    {/* Main links section */}
                    <div className="py-2 border-b border-white/5">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                        <User size={15} />
                        <span>Trang cá nhân</span>
                      </Link>

                      {/* Customer-specific links */}
                      {user.role === 'customer' && (
                        <>
                          <Link to="/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>Đơn thuê của tôi</span>
                          </Link>
                          <Link to="/promotions" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Ticket size={15} />
                            <span>Khuyến mãi / Ưu đãi</span>
                          </Link>
                          {user.ownerRequestStatus === 'Pending' ? (
                            <div className="flex items-center gap-3 px-4 py-2 text-xs text-yellow-500 bg-yellow-500/5 border-t border-b border-yellow-500/10">
                              <UserCheck size={15} />
                              <span>Đang chờ duyệt làm Chủ xe...</span>
                            </div>
                          ) : (
                            <button 
                              onClick={handleBecomeOwner}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all text-left cursor-pointer border-none bg-transparent"
                            >
                              <UserCheck size={15} className="text-cyan-400" />
                              <span>Đăng ký chủ xe</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Owner-specific links */}
                      {user.role === 'owner' && (
                        <>
                          <Link to="/owner/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Activity size={15} />
                            <span>Doanh thu / Thống kê</span>
                          </Link>
                          <Link to="/owner/bikes" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <BookOpen size={15} />
                            <span>Xe của tôi</span>
                          </Link>
                          <Link to="/owner/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>Lịch sử thuê xe</span>
                          </Link>
                        </>
                      )}

                      {/* Staff-specific links */}
                      {user.role === 'staff' && (
                        <>
                          <Link to="/staff/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>Duyệt đơn thuê</span>
                          </Link>
                          <Link to="/staff/bikes" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <BookOpen size={15} />
                            <span>Tình trạng xe</span>
                          </Link>
                        </>
                      )}

                      {/* Admin-specific links */}
                      {user.role === 'admin' && (
                        <>
                          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Activity size={15} />
                            <span>Thống kê hệ thống</span>
                          </Link>
                          <Link to="/admin/bikes" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <BookOpen size={15} />
                            <span>Quản lý xe</span>
                          </Link>
                          <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>Đơn toàn hệ thống</span>
                          </Link>
                          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <UserCheck size={15} />
                            <span>Phân quyền thành viên</span>
                          </Link>
                          <Link to="/admin/promotions" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Ticket size={15} />
                            <span>Quản lý khuyến mãi</span>
                          </Link>
                          <Link to="/admin/feedbacks" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <MessageSquare size={15} />
                            <span>Quản lý đánh giá</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Settings & Sign out */}
                    <div className="py-1 bg-black/10">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                        <Settings size={15} />
                        <span>Cài đặt tài khoản</span>
                      </Link>
                      <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left cursor-pointer font-semibold"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <Link 
              to="/auth" 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-800 text-sm font-medium text-gray-300 hover:border-neon hover:text-white transition-all duration-300"
            >
              <User size={16} />
              {t('common.login')}
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-lg border-b border-gray-800 px-4 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              onClick={() => setIsOpen(false)}
              className={`font-medium ${isActive(link.path) ? 'text-neon' : 'text-gray-300'} uppercase`}
            >
              {link.label}
            </Link>
          ))}

          {/* Language Switcher for Mobile */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngôn ngữ / Language</span>
            <div className="flex items-center bg-surface/50 border border-gray-800 rounded-full p-0.5 select-none">
              <button
                onClick={() => setLanguage('vi')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${language === 'vi' ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.2)]' : 'text-gray-400 hover:text-white'}`}
              >
                VI
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${language === 'en' ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.2)]' : 'text-gray-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
          
          {user ? (
            <div className="flex flex-col gap-3 border-t border-gray-800 pt-4 mt-2">
              {user.role === 'customer' && (
                user.ownerRequestStatus === 'Pending' ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 font-bold text-center text-xs">
                    ⏳ ĐANG CHỜ DUYỆT LÀM CHỦ XE
                  </div>
                ) : (
                  <button
                    onClick={handleBecomeOwner}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-gray-800 text-gray-300 font-bold text-center hover:border-cyan-500 hover:text-cyan-400 transition-all cursor-pointer text-xs"
                  >
                    <UserCheck size={14} className="text-cyan-400" />
                    ĐĂNG KÝ CHỦ XE ĐỐI TÁC
                  </button>
                )
              )}
              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded bg-black border border-gray-800 hover:border-neon text-gray-300 hover:text-white transition-all duration-300">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                ) : (
                  <>
                    {user.role === 'admin' && <Shield size={16} className="text-neon" />}
                    {user.role === 'staff' && <Briefcase size={16} className="text-yellow-500" />}
                    {user.role === 'owner' && <UserCheck size={16} className="text-cyan-400" />}
                    {user.role === 'customer' && <Award size={16} className="text-green-500" />}
                  </>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{user.role}</span>
                </div>
              </Link>
              <button 
                onClick={() => { setIsOpen(false); setShowLogoutModal(true); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 text-red-500 font-bold text-center hover:bg-red-500/5 transition-all cursor-pointer"
              >
                <LogOut size={16} />
                ĐĂNG XUẤT
              </button>
            </div>
          ) : (
            <Link 
              to="/auth" 
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-lg bg-neon text-dark font-bold text-center uppercase text-sm"
            >
              <User size={16} />
              {t('common.login')}
            </Link>
          )}
        </div>
      )}
    </header>

    {/* Custom Sliding Logout Popover */}
    <AnimatePresence>
      {showLogoutModal && (
        <>
          {/* Click-Outside Dismiss Area */}
          <div
            onClick={() => setShowLogoutModal(false)}
            className="fixed inset-0 z-[90]"
          />

          {/* Small Popover on the top-right */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 right-4 z-[100] bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl w-[320px] overflow-hidden"
          >
            {/* Top neon indicator bar */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0 border border-red-500/20">
                  <LogOut size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t('common.logout')}</h4>
                  <p className="text-gray-400 text-xs mt-0.5">{t('auth.logoutConfirm')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer text-center"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 rounded-lg bg-neon text-dark hover:bg-[#bbf000] font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)] text-center"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
  );
};

