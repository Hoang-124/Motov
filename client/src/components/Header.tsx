import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Shield, Briefcase, Award, UserCheck } from 'lucide-react';

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.location.reload();
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
          {!user && (
            <a 
              href="#footer" 
              className="text-gray-300 hover:text-white transition-all duration-300 uppercase"
            >
              Liên Hệ
            </a>
          )}
        </nav>

        {/* User profile / Login button */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-gray-800 text-xs font-semibold">
                {user.role === 'admin' && <Shield size={14} className="text-neon" />}
                {user.role === 'staff' && <Briefcase size={14} className="text-yellow-500" />}
                {user.role === 'owner' && <UserCheck size={14} className="text-cyan-400" />}
                {user.role === 'customer' && <Award size={14} className="text-green-500" />}
                <span className="text-gray-300 font-medium">{user.name}</span>
                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                  user.role === 'admin' ? 'bg-neon/10 text-neon border border-neon/20' :
                  user.role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  user.role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-green-500/10 text-green-500 border border-green-500/20'
                }`}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : user.role === 'owner' ? 'Owner' : 'Khách'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
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
          {!user && (
            <a 
              href="#footer" 
              onClick={() => setIsOpen(false)}
              className="text-gray-300 font-medium uppercase"
            >
              LIÊN HỆ
            </a>
          )}
          
          {user ? (
            <div className="flex flex-col gap-3 border-t border-gray-800 pt-4 mt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-black border border-gray-800">
                {user.role === 'admin' && <Shield size={16} className="text-neon" />}
                {user.role === 'staff' && <Briefcase size={16} className="text-yellow-500" />}
                {user.role === 'owner' && <UserCheck size={16} className="text-cyan-400" />}
                {user.role === 'customer' && <Award size={16} className="text-green-500" />}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{user.role}</span>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); handleLogout(); }}
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
  );
};

