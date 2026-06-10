import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Shield, Briefcase, Award, UserCheck, Settings, ClipboardList, BookOpen, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Header = () => {
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  const handleBecomeOwner = async () => {
    const confirmBecome = window.confirm(
      "Bạn có chắc chắn muốn đăng ký làm chủ xe đối tác của Motov không? Bạn sẽ có quyền đăng tải xe và quản lý doanh thu của riêng mình."
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
        alert("Chúc mừng! Bạn đã đăng ký làm Chủ xe đối tác thành công.");
        
        const updatedUser = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          token: data.token
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        navigate('/owner/dashboard');
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
        { path: '/', label: 'Trang Chủ' },
        { path: '/bikes', label: 'Dòng Xe' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { path: '/admin/dashboard', label: 'Thống Kê' },
        { path: '/admin/bikes', label: 'Quản Lý Xe' },
        { path: '/admin/bookings', label: 'Đơn Toàn Hệ Thống' },
        { path: '/admin/users', label: 'Phân Quyền' },
      ];
    }

    if (user.role === 'staff') {
      return [
        { path: '/staff/bookings', label: 'Duyệt Đơn Thuê' },
        { path: '/staff/bikes', label: 'Tình Trạng Xe' },
      ];
    }

    if (user.role === 'owner') {
      return [
        { path: '/owner/dashboard', label: 'Doanh Thu' },
        { path: '/owner/bikes', label: 'Xe Của Tôi' },
        { path: '/owner/bookings', label: 'Lịch Sử Thuê' },
      ];
    }

    // Default: Customer
    return [
      { path: '/', label: 'Trang Chủ' },
      { path: '/bikes', label: 'Dòng Xe' },
      { path: '/bookings', label: 'Đơn Thuê Của Tôi' },
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
          {user ? (
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
                          <button 
                            onClick={handleBecomeOwner}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all text-left cursor-pointer"
                          >
                            <UserCheck size={15} className="text-cyan-400" />
                            <span>Đăng ký chủ xe</span>
                          </button>
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
          ) : (
            <Link 
              to="/auth" 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-800 text-sm font-medium text-gray-300 hover:border-neon hover:text-white transition-all duration-300"
            >
              <User size={16} />
              Đăng Nhập
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
          
          {user ? (
            <div className="flex flex-col gap-3 border-t border-gray-800 pt-4 mt-2">
              {user.role === 'customer' && (
                <button
                  onClick={handleBecomeOwner}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-gray-800 text-gray-300 font-bold text-center hover:border-cyan-500 hover:text-cyan-400 transition-all cursor-pointer text-xs"
                >
                  <UserCheck size={14} className="text-cyan-400" />
                  ĐĂNG KÝ CHỦ XE ĐỐI TÁC
                </button>
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
              className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-lg bg-neon text-dark font-bold text-center"
            >
              <User size={16} />
              ĐĂNG NHẬP
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
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Đăng xuất</h4>
                  <p className="text-gray-400 text-xs mt-0.5">Bạn muốn đăng xuất đúng không?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer text-center"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 rounded-lg bg-neon text-dark hover:bg-[#bbf000] font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)] text-center"
                >
                  Đồng ý
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

