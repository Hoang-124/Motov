import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ChevronRight, Shield, Briefcase, Award, UserCheck, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

type UserRole = 'customer' | 'owner' | 'staff' | 'admin';

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // API loading & error states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tokenClientRef = useRef<any>(null);

  const handleGoogleTokenResponse = async (response: any) => {
    if (response.error) {
      setError('Đăng nhập Google thất bại: ' + response.error);
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    const API_BASE_URL = 'http://localhost:5000/api';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: response.access_token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Đăng nhập Google thất bại.');
      }

      const userObj = {
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        token: data.token,
        avatarUrl: data.user.avatarUrl,
      };

      localStorage.setItem('user', JSON.stringify(userObj));

      const redirectPath = 
        userObj.role === 'admin' ? '/admin/dashboard' :
        userObj.role === 'owner' ? '/owner/dashboard' :
        userObj.role === 'staff' ? '/staff/bookings' :
        '/';

      setSuccess('Đăng nhập bằng Google thành công! Đang chuyển hướng...');

      setTimeout(() => {
        navigate(redirectPath);
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đăng nhập bằng Google.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '927292562825-91mdr6b51b97kutl1d6fpqt4c0clm9sg.apps.googleusercontent.com';
    
    const initializeGoogleSignIn = () => {
      if ((window as any).google) {
        tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: handleGoogleTokenResponse,
        });
      }
    };

    if ((window as any).google) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLogin]);

  const handleGoogleSignInClick = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    } else {
      setError('Google SDK chưa được tải xong. Vui lòng tải lại trang hoặc thử lại sau.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const API_BASE_URL = 'http://localhost:5000/api';

    try {
      if (isLogin) {
        // Đăng nhập
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
        }

        const userObj = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          token: data.token,
        };
        
        localStorage.setItem('user', JSON.stringify(userObj));
        
        // Xét từng vai trò (role) để chuyển hướng về đúng trang
        const redirectPath = 
          userObj.role === 'admin' ? '/admin/dashboard' :
          userObj.role === 'owner' ? '/owner/dashboard' :
          userObj.role === 'staff' ? '/staff/bookings' :
          '/';

        setSuccess(`Đăng nhập thành công với vai trò ${data.user.role === 'admin' ? 'Quản trị viên' : data.user.role === 'owner' ? 'Chủ xe' : data.user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}! Đang chuyển hướng...`);
        
        setTimeout(() => {
          navigate(redirectPath);
          window.location.reload();
        }, 1000);
      } else {
        // Đăng ký
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }

        const nameParts = name.trim().split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        const username = email.split('@')[0] + '_' + Math.floor(1000 + Math.random() * 9000);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password,
            firstName,
            lastName,
            role: 'customer',
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Đăng ký tài khoản thất bại.');
        }

        const userObj = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          token: data.token,
        };
        
        localStorage.setItem('user', JSON.stringify(userObj));
        
        const redirectPath = 
          userObj.role === 'owner' ? '/owner/dashboard' :
          '/';

        setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        
        setTimeout(() => {
          navigate(redirectPath);
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2000" 
          alt="Motorcycle background" 
          className="w-full h-full object-cover object-bottom animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/90 to-dark/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent"></div>
      </div>

      {/* Giant Typography Background */}
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[22vw] leading-none text-neon opacity-[0.05] mix-blend-screen pointer-events-none select-none z-10 w-full text-center tracking-tighter">
        MOTOV
      </h1>

      <div className="max-w-md w-full px-4 relative z-20">
        
        {/* Toggle tabs */}
        <div className="flex border-b border-white/5 mb-8 max-w-[200px] mx-auto justify-center">
          <button 
            onClick={() => { setIsLogin(true); setConfirmPassword(''); setError(null); }}
            className={`flex-grow pb-3 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isLogin ? 'text-neon border-b-2 border-neon' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Đăng Nhập
          </button>
          <button 
            onClick={() => { setIsLogin(false); setConfirmPassword(''); setError(null); }}
            className={`flex-grow pb-3 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer ${!isLogin ? 'text-neon border-b-2 border-neon' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Card wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
          
          <div className="text-center mb-6">
            <h2 className="font-display font-black text-2xl text-white uppercase mb-2">
              {isLogin ? 'Cổng Đăng Nhập' : 'Đăng Ký Thành Viên'}
            </h2>
            <p className="text-gray-500 text-xs">
              {isLogin 
                ? 'Đăng nhập vào hệ thống để tiếp tục' 
                : 'Tạo tài khoản mới để trải nghiệm dịch vụ hoặc chia sẻ xe'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-4 flex items-center justify-center gap-2"
            >
              <span>⚠️ {error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs font-semibold text-center mb-4 flex items-center justify-center gap-2"
            >
              <span>✅ {success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            



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

            {/* Username or Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isLogin ? 'Tên đăng nhập hoặc Email' : 'Địa chỉ Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-neon" />
                </div>
                <input 
                  type={isLogin ? 'text' : 'email'} 
                  required
                  placeholder={isLogin ? 'Nhập tên đăng nhập hoặc email' : 'name@example.com'}
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

            {/* Confirm Password (Sign Up only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-neon" />
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            )}


            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-neon text-dark font-bold py-3.5 mt-4 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center gap-2 group text-sm uppercase tracking-wider ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  {isLogin ? 'Xác Nhận Đăng Nhập' : 'Tạo Tài Khoản'}
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">Hoặc</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            {/* Custom Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={loading}
              className="w-full bg-surface border border-gray-800 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:border-neon hover:text-white hover:shadow-[0_0_15px_rgba(204,255,0,0.15)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer text-sm uppercase tracking-wider"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.466 0-6.277-2.81-6.277-6.277 0-3.466 2.81-6.277 6.277-6.277 1.503 0 2.873.53 3.96 1.402l3.07-3.07C18.847 1.836 15.753 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.262 0 11.36-4.996 11.36-11.24 0-.713-.082-1.393-.227-1.955H12.24z"
                />
              </svg>
              Đăng nhập với Google
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
};
