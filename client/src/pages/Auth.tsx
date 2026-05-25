import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set a mock user profile in localStorage
    const mockUser = {
      email,
      name: isLogin ? 'User' : name,
      token: 'mock-jwt-token-xyz',
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Redirect to home page
    navigate('/');
    
    // Refresh page to trigger header state update
    window.location.reload();
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        
        {/* Toggle tabs */}
        <div className="flex border-b border-gray-800 mb-8 max-w-[200px] mx-auto justify-center">
          <button 
            onClick={() => setIsLogin(true)}
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
          
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-2xl text-white uppercase mb-2">
              {isLogin ? 'Chào Mừng Trở Lại' : 'Đăng Ký Tài Khoản'}
            </h2>
            <p className="text-gray-500 text-xs">
              {isLogin ? 'Đăng nhập để đặt xe và quản lý đơn đặt dễ dàng' : 'Tạo tài khoản mới để bắt đầu thuê xe ngay'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all duration-300"
                  />
                </div>
              </div>
            )}

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
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all duration-300"
                />
              </div>
            </div>

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
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-neon text-dark font-bold py-3.5 mt-4 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] cursor-pointer flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
};
