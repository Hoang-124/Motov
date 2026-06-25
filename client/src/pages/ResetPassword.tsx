import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Key, Check } from 'lucide-react';
import { motion } from 'motion/react';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const firebaseToken = searchParams.get('firebaseToken') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token && !firebaseToken) {
      setError('Token khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = firebaseToken
        ? `${API_BASE_URL}/auth/reset-password-phone`
        : `${API_BASE_URL}/auth/reset-password`;

      const body = firebaseToken
        ? { idToken: firebaseToken, newPassword }
        : { token, newPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
      }

      setSuccess('Đặt lại mật khẩu thành công! Tài khoản của bạn đã được cập nhật mật khẩu mới.');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-dark">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2000" 
          alt="Motorcycle background" 
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/90 to-dark/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent"></div>
      </div>

      {/* Giant Typography Background */}
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[22vw] leading-none text-neon opacity-[0.05] mix-blend-screen pointer-events-none select-none z-10 w-full text-center tracking-tighter">
        MOTOV
      </h1>

      <div className="max-w-md w-full px-4 relative z-20">
        
        {/* Navigation back */}
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-neon text-sm font-semibold uppercase tracking-wider mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative"
        >
          {/* Top neon indicator bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl text-white uppercase tracking-tight">
              ĐẶT LẠI MẬT KHẨU
            </h2>
            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
              Thiết lập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          {!token && !firebaseToken && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-6">
              Không tìm thấy Token xác minh mật khẩu trong liên kết của bạn. Vui lòng kiểm tra lại quy trình khôi phục.
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-neon/5 border border-neon/30 p-4 rounded-xl text-xs text-white text-center mb-6 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 text-neon font-display font-black text-sm uppercase tracking-wider neon-text-glow">
                <Check size={16} strokeWidth={3} />
                Thành công
              </div>
              <p className="text-gray-300 leading-relaxed font-normal">{success}</p>
              <p className="text-gray-500 font-normal text-[11px] pt-1">Đang tự động chuyển hướng về trang đăng nhập...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock size={14} className="text-neon" />
                Mật khẩu mới
              </label>
              <input 
                type="password" 
                required
                disabled={(!token && !firebaseToken) || !!success}
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3.5 outline-none transition-all duration-300 disabled:opacity-50"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock size={14} className="text-neon" />
                Xác nhận mật khẩu mới
              </label>
              <input 
                type="password" 
                required
                disabled={(!token && !firebaseToken) || !!success}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3.5 outline-none transition-all duration-300 disabled:opacity-50"
              />
            </div>

            {/* Submit button */}
            <button 
              type="submit"
              disabled={loading || (!token && !firebaseToken) || !!success}
              className="w-full bg-neon text-dark font-bold py-3.5 mt-6 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center gap-2 group text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang thiết lập...
                </>
              ) : (
                <>
                  <Key size={16} />
                  Xác nhận đặt lại
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
