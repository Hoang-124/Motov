import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ChevronRight, Shield, Briefcase, Award, UserCheck, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

type UserRole = 'customer' | 'owner' | 'staff' | 'admin';

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<UserRole>('customer');
  
  // Form states
  const [email, setEmail] = useState('khachhang@motov.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [signupRole, setSignupRole] = useState<'customer' | 'owner'>('customer');

  // Automatically fill default credentials when switching portals in login mode
  useEffect(() => {
    if (!isLogin) return;
    
    if (selectedPortal === 'admin') {
      setEmail('admin@motov.com');
      setPassword('123456');
    } else if (selectedPortal === 'staff') {
      setEmail('nhanvien@motov.com');
      setPassword('123456');
    } else if (selectedPortal === 'owner') {
      setEmail('owner@motov.com');
      setPassword('123456');
    } else {
      setEmail('khachhang@motov.com');
      setPassword('123456');
    }
  }, [selectedPortal, isLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let resolvedRole: UserRole = 'customer';
    let displayName = name;

    if (isLogin) {
      // Login mode: use selected portal or infer from email
      resolvedRole = selectedPortal;
      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes('admin')) resolvedRole = 'admin';
      else if (lowerEmail.includes('nhanvien') || lowerEmail.includes('staff')) resolvedRole = 'staff';
      else if (lowerEmail.includes('owner') || lowerEmail.includes('chuxe')) resolvedRole = 'owner';

      // Mock display name based on role
      if (resolvedRole === 'admin') displayName = 'Quản Trị Viên';
      else if (resolvedRole === 'staff') displayName = 'Nhân Viên Phòng Vé';
      else if (resolvedRole === 'owner') displayName = 'Nguyễn Chủ Xe';
      else displayName = 'Nguyễn Văn Khách';
    } else {
      // Register mode: use chosen signup role
      resolvedRole = signupRole;
      if (!displayName) {
        displayName = resolvedRole === 'owner' ? 'Chủ Xe Đối Tác' : 'Khách Hàng Mới';
      }
    }

    const mockUser = {
      email,
      name: displayName,
      role: resolvedRole,
      token: 'mock-jwt-token-' + resolvedRole,
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Save to user database
    const users = JSON.parse(localStorage.getItem('motov_users') || '[]');
    if (!users.some((u: any) => u.email === email)) {
      users.push({
        id: 'usr-' + Math.floor(1000 + Math.random() * 9000),
        name: displayName,
        email: email,
        role: resolvedRole,
        createdAt: new Date().toLocaleDateString('vi-VN')
      });
      localStorage.setItem('motov_users', JSON.stringify(users));
    }
    
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark flex flex-col items-center justify-center">
      <div className="max-w-md w-full px-4">
        
        {/* Toggle tabs */}
        <div className="flex border-b border-gray-800 mb-8 max-w-[200px] mx-auto justify-center">
          <button 
            onClick={() => { setIsLogin(true); setSelectedPortal('customer'); }}
            className={`flex-grow pb-3 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isLogin ? 'text-neon border-b-2 border-neon' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Đăng Nhập
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-grow pb-3 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer ${!isLogin ? 'text-neon border-b-2 border-neon' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Card wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-neon"></div>
          
          <div className="text-center mb-6">
            <h2 className="font-display font-black text-2xl text-white uppercase mb-2">
              {isLogin ? 'Cổng Đăng Nhập' : 'Đăng Ký Thành Viên'}
            </h2>
            <p className="text-gray-500 text-xs">
              {isLogin 
                ? 'Chọn phân hệ để truy cập vào các giao diện nghiệp vụ' 
                : 'Tạo tài khoản mới để trải nghiệm dịch vụ hoặc chia sẻ xe'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Login Portal Selector */}
            {isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phân hệ truy cập (Portal)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound size={16} className="text-neon" />
                  </div>
                  <select
                    value={selectedPortal}
                    onChange={(e) => setSelectedPortal(e.target.value as UserRole)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="customer">👤 Phân hệ Khách hàng (Customer Portal)</option>
                    <option value="owner">🔑 Phân hệ Đối tác Chủ xe (Owner Portal)</option>
                    <option value="staff">🏢 Phân hệ Nhân viên (Staff Portal)</option>
                    <option value="admin">🛡️ Phân hệ Quản trị (Admin Portal)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Registration Role Selector */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bạn muốn đăng ký là</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole('customer')}
                    className={`p-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupRole === 'customer'
                        ? 'bg-neon/10 border-neon text-neon'
                        : 'bg-black border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Award size={14} />
                    Khách thuê xe
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('owner')}
                    className={`p-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupRole === 'owner'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                        : 'bg-black border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <UserCheck size={14} />
                    Chủ xe đối tác
                  </button>
                </div>
              </div>
            )}

            {/* Full Name (Sign Up only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Họ và tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-neon" />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhập họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Địa chỉ Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-neon" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mật khẩu</label>
                {isLogin && (
                  <a href="#" className="text-xs text-neon hover:underline">Quên mật khẩu?</a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-neon" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Helper Text for Demo */}
            {isLogin && (
              <p className="text-[10px] text-gray-500 text-center italic">
                * Hệ thống tự động điền tài khoản mẫu phù hợp với phân hệ được chọn.
              </p>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full bg-neon text-dark font-bold py-3.5 mt-4 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] cursor-pointer flex items-center justify-center gap-2 group text-sm uppercase tracking-wider"
            >
              {isLogin ? 'Xác Nhận Đăng Nhập' : 'Tạo Tài Khoản'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
};
