import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Shield, Briefcase, Award, UserCheck, Settings, ClipboardList, BookOpen, Activity, Ticket, Bell, Check, Trash2, MessageSquare, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService, NotificationItem } from '../services/notificationService.js';
import { useLanguage } from '../hooks/useLanguage';

const translateNotificationTitle = (title: string, t: any) => {
  const tLower = (title || '').toLowerCase().trim();
  if (tLower.includes('chờ duyệt') && tLower.includes('mới')) return t('notifications.newPendingTitle');
  if (tLower.includes('phê duyệt') || tLower.includes('được duyệt')) return t('notifications.confirmedTitle');
  if (tLower.includes('bị hủy')) return t('notifications.cancelledTitle');
  if (tLower.includes('yêu cầu duyệt')) return t('notifications.ownerActionTitle');
  if (tLower.includes('thành công') && tLower.includes('thanh toán')) {
    if (tLower.includes('không') || tLower.includes('thất bại')) {
      return t('notifications.paymentFailedTitle');
    }
    return t('notifications.paymentSuccessTitle');
  }
  if (tLower.includes('thành công') && tLower.includes('đặt cọc')) {
    return t('notifications.paymentSuccessTitle');
  }
  return title;
};

const translateNotificationMessage = (message: string, t: any) => {
  const mLower = (message || '').toLowerCase().trim();
  // Extract booking code (e.g. MV-XXXXXX)
  const codeMatch = message.match(/MV-\d+/i) || message.match(/[A-Z0-9]{8,}/);
  const code = codeMatch ? codeMatch[0] : '';
  
  if (mLower.includes('chờ duyệt') && mLower.includes('của bạn')) {
    return t('notifications.pendingCustomerMsg', { code });
  }
  if (mLower.includes('chờ duyệt') && (mLower.includes('hệ thống') || mLower.includes('bạn có'))) {
    return t('notifications.pendingStaffMsg', { code });
  }
  if (mLower.includes('phê duyệt') || mLower.includes('duyệt thành công')) {
    return t('notifications.confirmedMsg', { code });
  }
  if (mLower.includes('bị hủy')) {
    const reasonMatch = message.split(/lý do:|reason:/i);
    const reason = reasonMatch.length > 1 ? reasonMatch[1].trim() : '';
    return t('notifications.cancelledMsg', { code, reason: reason || 'N/A' });
  }
  if (mLower.includes('thành công') && mLower.includes('thanh toán')) {
    return t('notifications.paymentSuccessMsg', { code });
  }
  if (mLower.includes('thất bại') || mLower.includes('không thành công')) {
    return t('notifications.paymentFailedMsg', { code });
  }
  return message;
};

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
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notiFilter, setNotiFilter] = useState<'all' | 'unread'>('all');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string } | null>(null);

  const languagesList = [
    { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'ko' as const, label: '한국어', flag: '🇰🇷' },
  ];

  // Tự đóng Toast sau 5 giây
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

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

  // Thiết lập kết nối SSE (Server-Sent Events) thời gian thực
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    fetchNotifications();

    try {
      const parsedUser = JSON.parse(storedUser);
      const token = parsedUser.token;

      if (token) {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const sseUrl = `${API_BASE_URL}/notifications/stream?token=${token}`;
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NOTIFICATION') {
              const newNoti = data.data;
              // Thêm thông báo mới lên đầu danh sách và tăng số lượng tin chưa đọc
              setNotifications(prev => {
                // Kiểm tra trùng lặp để tránh tin nhắn trùng
                if (prev.some(n => n._id === newNoti._id)) return prev;
                return [newNoti, ...prev];
              });
              setUnreadCount(prev => prev + 1);
              // Kích hoạt Toast hiển thị thông báo pop-up
              setActiveToast({
                id: newNoti._id,
                title: translateNotificationTitle(newNoti.title, t),
                message: translateNotificationMessage(newNoti.message, t)
              });
            }
          } catch (err) {
            console.error('Lỗi phân tích dữ liệu thông báo thời gian thực:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('Mất kết nối với SSE Stream, đang thử kết nối lại...', err);
          eventSource.close();
        };

        // Dự phòng: Poll dữ liệu mỗi 45 giây nếu SSE gặp sự cố
        const interval = setInterval(fetchNotifications, 45000);

        return () => {
          eventSource.close();
          clearInterval(interval);
        };
      }
    } catch (e) {
      console.error('Lỗi khởi tạo kết nối SSE:', e);
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

  const handleDeleteAllNotifications = () => {
    setShowConfirmDeleteAll(true);
  };

  const executeDeleteAllNotifications = async () => {
    try {
      const res = await notificationService.deleteAllNotifications();
      if (res.success) {
        setNotifications([]);
        setUnreadCount(0);
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
        { path: '/admin/settings', label: 'Cấu hình hệ thống' },
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
      {/* Toast Notification Pop-up thời gian thực */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={() => {
              handleMarkAsRead(activeToast.id);
              setActiveToast(null);
            }}
            className="fixed top-24 right-6 z-[9999] max-w-sm w-full bg-surface/95 border border-neon/30 rounded-xl shadow-[0_0_20px_rgba(0,242,254,0.2)] backdrop-blur-md overflow-hidden flex items-start gap-4 p-4 cursor-pointer hover:border-neon transition-all"
          >
            <div className="p-2 bg-neon/10 rounded-lg text-neon">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate">{activeToast.title}</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed break-words">{activeToast.message}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Language Switcher Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowLangMenu(true)}
            onMouseLeave={() => setShowLangMenu(false)}
          >
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-gray-800 hover:border-neon text-xs font-semibold text-gray-300 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <Globe size={14} className="text-neon" />
              <span className="uppercase">
                {language === 'vi' ? 'VI 🇻🇳' : language === 'en' ? 'EN 🇺🇸' : 'KO 🇰🇷'}
              </span>
            </button>

            <AnimatePresence>
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowLangMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-[150px] overflow-hidden py-1"
                  >
                    {languagesList.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-all hover:bg-white/5 border-none bg-transparent cursor-pointer ${
                          language === lang.code ? 'text-neon font-bold' : 'text-gray-300'
                        }`}
                      >
                        <span>{lang.flag} {lang.label}</span>
                        {language === lang.code && <Check size={12} className="text-neon" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              {/* Notification Bell Icon */}
              <div 
                className="relative"
                onMouseEnter={() => {
                  setIsNotiOpen(true);
                  setIsDropdownOpen(false); // Close profile dropdown if open
                }}
                onMouseLeave={() => {
                  setIsNotiOpen(false);
                }}
              >
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
                      <div className="fixed inset-0 z-40 bg-transparent md:hidden" onClick={() => setIsNotiOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-[320px] md:w-[360px] overflow-hidden text-gray-300 font-sans pb-2"
                      >
                        {/* Top Neon line */}
                        <div className="absolute top-0 inset-x-0 h-[3px] bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

                        {/* Header */}
                        <div className="p-4 flex items-center justify-between pb-2">
                          <span className="font-bold text-white text-base">{t('headerDropdown.notificationsTitle')}</span>
                          <div className="flex items-center gap-1">
                            {/* Đánh dấu tất cả đã đọc */}
                            <button 
                              onClick={handleMarkAllAsRead}
                              title={t('headerDropdown.markAllAsReadTooltip')}
                              className="w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 hover:text-neon transition-all cursor-pointer flex items-center justify-center border-none bg-transparent"
                            >
                              <Check size={16} />
                            </button>
                            {/* Xóa tất cả thông báo */}
                            <button 
                              onClick={handleDeleteAllNotifications}
                              title={t('headerDropdown.deleteAllTooltip')}
                              className="w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-500 transition-all cursor-pointer flex items-center justify-center border-none bg-transparent"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Facebook-style Pill Filters */}
                        <div className="flex gap-2 px-4 pb-3 border-b border-white/5">
                          <button
                            onClick={() => setNotiFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                              notiFilter === 'all'
                                ? 'bg-neon/15 text-neon shadow-[0_0_8px_rgba(204,255,0,0.1)]'
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {t('headerDropdown.all')}
                          </button>
                          <button
                            onClick={() => setNotiFilter('unread')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                              notiFilter === 'unread'
                                ? 'bg-neon/15 text-neon shadow-[0_0_8px_rgba(204,255,0,0.1)]'
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {unreadCount > 0 ? t('headerDropdown.unreadCount', { count: unreadCount }) : t('headerDropdown.unread')}
                          </button>
                        </div>

                        {/* List content */}
                        <div className="max-h-[320px] overflow-y-auto py-2 space-y-0.5">
                          {notifications.filter(n => notiFilter === 'all' || !n.isRead).length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-xs italic">
                              {t('headerDropdown.noNotifications')}
                            </div>
                          ) : (
                            notifications
                              .filter(n => notiFilter === 'all' || !n.isRead)
                              .map((noti) => (
                                <div
                                  key={noti._id}
                                  onClick={() => handleMarkAsRead(noti._id, noti.relatedId)}
                                  className={`group p-3 flex gap-3 text-left transition-all duration-200 cursor-pointer rounded-lg mx-2 ${
                                    noti.isRead 
                                      ? 'hover:bg-white/5' 
                                      : 'bg-neon/5 hover:bg-neon/10'
                                  }`}
                                >
                                  {/* Left side: Circular Icon Container like FB avatar */}
                                  <div className="relative w-11 h-11 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                    {noti.type === 'BookingConfirmed' ? (
                                      <ClipboardList size={20} className="text-neon" />
                                    ) : noti.type === 'BookingCancelled' ? (
                                      <ClipboardList size={20} className="text-red-400" />
                                    ) : noti.type === 'BookingPending' ? (
                                      <ClipboardList size={20} className="text-yellow-400" />
                                    ) : noti.type === 'IdentityVerified' ? (
                                      <UserCheck size={20} className="text-neon" />
                                    ) : (
                                      <Bell size={20} className="text-neon" />
                                    )}
                                    
                                    {/* Mini badge at bottom-right corner */}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface shadow-md ${
                                      noti.type === 'BookingConfirmed' ? 'bg-neon text-dark' :
                                      noti.type === 'BookingCancelled' ? 'bg-red-500 text-white' :
                                      noti.type === 'BookingPending' ? 'bg-yellow-500 text-dark' :
                                      'bg-neon text-dark'
                                    }`}>
                                      {noti.type === 'BookingConfirmed' ? (
                                        <Check size={8} className="stroke-[3]" />
                                      ) : noti.type === 'BookingCancelled' ? (
                                        <X size={8} className="stroke-[3]" />
                                      ) : (
                                        <Bell size={8} className="stroke-[3]" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Middle Content */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs text-white leading-relaxed ${noti.isRead ? 'font-normal' : 'font-bold'}`}>
                                      {translateNotificationTitle(noti.title, t)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{translateNotificationMessage(noti.message, t)}</p>
                                    <span className={`text-[10px] mt-1.5 block ${noti.isRead ? 'text-gray-500' : 'text-neon font-semibold'}`}>
                                      {formatTimeAgo(noti.createdAt)}
                                    </span>
                                  </div>

                                  {/* Right side status & action */}
                                  <div className="flex flex-col items-center justify-between self-stretch shrink-0 py-0.5 gap-2">
                                    {/* Unread indicator dot */}
                                    {!noti.isRead ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] my-auto" />
                                    ) : (
                                      <div className="w-2.5 h-2.5 opacity-0" />
                                    )}
                                    
                                    {/* Delete Button (shows on hover like FB) */}
                                    <button 
                                      onClick={(e) => handleDeleteNotification(e, noti._id)}
                                      className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
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
                  {user.role === 'admin' ? t('headerDropdown.roleAdmin') : user.role === 'staff' ? t('headerDropdown.roleStaff') : user.role === 'owner' ? t('headerDropdown.roleOwner') : t('headerDropdown.roleShortCustomer')}
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
                      <span className="font-medium uppercase tracking-wider text-[10px]">{t('common.role')}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        user.role === 'admin' ? 'bg-neon/10 text-neon border border-neon/20' :
                        user.role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        user.role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {user.role === 'admin' ? t('headerDropdown.roleAdmin') : user.role === 'staff' ? t('headerDropdown.roleStaff') : user.role === 'owner' ? t('headerDropdown.roleOwner') : t('headerDropdown.roleCustomer')}
                      </span>
                    </div>

                    {/* Main links section */}
                    <div className="py-2 border-b border-white/5">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                        <User size={15} />
                        <span>{t('nav.profile')}</span>
                      </Link>

                      {/* Customer-specific links */}
                      {user.role === 'customer' && (
                        <>
                          <Link to="/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>{t('nav.myBookings')}</span>
                          </Link>
                          <Link to="/promotions" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Ticket size={15} />
                            <span>{t('nav.promotions')}</span>
                          </Link>
                          {user.ownerRequestStatus === 'Pending' ? (
                            <div className="flex items-center gap-3 px-4 py-2 text-xs text-yellow-500 bg-yellow-500/5 border-t border-b border-yellow-500/10">
                              <UserCheck size={15} />
                              <span>{t('nav.pendingOwner')}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={handleBecomeOwner}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all text-left cursor-pointer border-none bg-transparent"
                            >
                              <UserCheck size={15} className="text-cyan-400" />
                              <span>{t('nav.becomeOwner')}</span>
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
                            <span>{t('nav.myBikes')}</span>
                          </Link>
                          <Link to="/owner/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>{t('nav.allBookings')}</span>
                          </Link>
                        </>
                      )}

                      {/* Staff-specific links */}
                      {user.role === 'staff' && (
                        <>
                          <Link to="/staff/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>{t('nav.approveBookings')}</span>
                          </Link>
                          <Link to="/staff/bikes" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <BookOpen size={15} />
                            <span>{t('nav.bikeStatus')}</span>
                          </Link>
                        </>
                      )}

                      {/* Admin-specific links */}
                      {user.role === 'admin' && (
                        <>
                          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Activity size={15} />
                            <span>{t('nav.dashboard')}</span>
                          </Link>
                          <Link to="/admin/bikes" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <BookOpen size={15} />
                            <span>{t('nav.manageBikes')}</span>
                          </Link>
                          <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <ClipboardList size={15} />
                            <span>{t('nav.allBookings')}</span>
                          </Link>
                          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <UserCheck size={15} />
                            <span>{t('nav.roles')}</span>
                          </Link>
                          <Link to="/admin/promotions" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <Ticket size={15} />
                            <span>{t('nav.promotions')}</span>
                          </Link>
                          <Link to="/admin/feedbacks" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-neon hover:bg-white/5 transition-all">
                            <MessageSquare size={15} />
                            <span>{t('nav.feedbacks')}</span>
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
          <div className="flex flex-col gap-2 border-t border-white/5 pt-4 mt-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} className="text-neon" /> {language === 'vi' ? 'Ngôn ngữ' : language === 'ko' ? '언어' : 'Language'}
            </span>
            <div className="grid grid-cols-3 gap-2 bg-surface/50 border border-gray-800 rounded-xl p-1 select-none">
              {languagesList.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer text-center border-none ${
                    language === lang.code 
                      ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {lang.flag} {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          {user ? (
            <div className="flex flex-col gap-3 border-t border-gray-800 pt-4 mt-2">
              {user.role === 'customer' && (
                user.ownerRequestStatus === 'Pending' ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 font-bold text-center text-xs">
                    {t('headerDropdown.pendingOwnerStatus')}
                  </div>
                ) : (
                  <button
                    onClick={handleBecomeOwner}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-gray-800 text-gray-300 font-bold text-center hover:border-cyan-500 hover:text-cyan-400 transition-all cursor-pointer text-xs"
                  >
                    <UserCheck size={14} className="text-cyan-400" />
                    {t('headerDropdown.registerOwnerBtn')}
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
                  <span className="text-[10px] text-gray-500 uppercase">{user.role === 'admin' ? t('headerDropdown.roleAdmin') : user.role === 'staff' ? t('headerDropdown.roleStaff') : user.role === 'owner' ? t('headerDropdown.roleOwner') : t('headerDropdown.roleCustomer')}</span>
                </div>
              </Link>
              <button 
                onClick={() => { setIsOpen(false); setShowLogoutModal(true); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 text-red-500 font-bold text-center hover:bg-red-500/5 transition-all cursor-pointer"
              >
                <LogOut size={16} />
                {t('common.logout').toUpperCase()}
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

    {/* Custom Sliding Delete All Notifications Popover */}
    <AnimatePresence>
      {showConfirmDeleteAll && (
        <>
          {/* Click-Outside Dismiss Area */}
          <div
            onClick={() => setShowConfirmDeleteAll(false)}
            className="fixed inset-0 z-[90]"
          />

          {/* Small Popover on the top-right */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 right-4 z-[100] bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl w-[320px] overflow-hidden text-gray-300 font-sans"
          >
            {/* Top red indicator bar */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0 border border-red-500/20 mt-0.5 animate-pulse">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t('headerDropdown.deleteAllTitle')}</h4>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{t('headerDropdown.deleteAllConfirm')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => setShowConfirmDeleteAll(false)}
                  className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer text-center bg-transparent"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDeleteAll(false);
                    executeDeleteAllNotifications();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)] text-center border-none"
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

