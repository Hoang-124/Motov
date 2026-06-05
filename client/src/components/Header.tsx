import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Shield, Briefcase, Award, UserCheck } from 'lucide-react';
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

      const response = await fetch('http://localhost:5000/api/auth/become-owner', {
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
            <div className="flex items-center gap-3">
              {user.role === 'customer' && (
                <button
                  onClick={handleBecomeOwner}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-gray-800 text-xs font-semibold text-gray-300 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300 cursor-pointer"
                >
                  <UserCheck size={12} className="text-cyan-400" />
                  Đăng Ký Chủ Xe
                </button>
              )}
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-gray-800 hover:border-neon text-xs font-semibold text-gray-300 hover:text-white transition-all duration-300">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-white/10" />
                ) : (
                  <>
                    {user.role === 'admin' && <Shield size={14} className="text-neon" />}
                    {user.role === 'staff' && <Briefcase size={14} className="text-yellow-500" />}
                    {user.role === 'owner' && <UserCheck size={14} className="text-cyan-400" />}
                    {user.role === 'customer' && <Award size={14} className="text-green-500" />}
                  </>
                )}
                <span className="font-medium text-gray-300">{user.name}</span>
                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  user.role === 'admin' ? 'bg-neon/10 text-neon border border-neon/20' :
                  user.role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  user.role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-green-500/10 text-green-500 border border-green-500/20'
                }`}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : user.role === 'owner' ? 'Owner' : 'Khách'}
                </span>
              </Link>
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center justify-center p-2 rounded-full border border-gray-800 text-gray-400 hover:text-red-500 hover:border-red-500/30 transition-all cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
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

