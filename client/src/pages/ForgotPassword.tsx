import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Check } from 'lucide-react';
import { motion } from 'motion/react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPreviewUrl(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Yêu cầu đặt lại mật khẩu thất bại.');
      }

      setSuccess('Yêu cầu thành công! Vui lòng kiểm tra hộp thư email của bạn để lấy liên kết khôi phục mật khẩu.');
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi gửi yêu cầu.');
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
              Quên mật khẩu
            </h2>
            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
              Nhập email đăng ký tài khoản của bạn. Chúng tôi sẽ gửi liên kết khôi phục mật khẩu về hộp thư của bạn.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-6">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg text-xs font-semibold text-center mb-6 space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                <Check size={16} />
                Thành công!
              </div>
              <p className="text-gray-300 leading-relaxed font-normal">{success}</p>
            </div>
          )}

          {/* Test Link Alert (only displayed when ethereal sandbox preview is generated) */}
          {previewUrl && (
            <div className="bg-neon/10 border border-neon/30 text-neon p-4 rounded-lg text-xs font-semibold text-center mb-6 space-y-2">
              <p className="text-white">🛠️ HỘP THƯ GIẢ LẬP (ETHEREAL EMAIL)</p>
              <p className="text-gray-400 font-normal">Hệ thống đang chạy giả lập gửi mail. Bạn hãy nhấn liên kết dưới đây để xem email thật và nhận link đặt lại mật khẩu:</p>
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block mt-2 bg-neon text-dark font-bold px-4 py-2 rounded hover:bg-[#bbf000] transition-colors underline"
              >
                Mở Ethereal Test Inbox
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Địa chỉ email</label>
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
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Submit button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-neon text-dark font-bold py-3.5 mt-6 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center gap-2 group text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi yêu cầu khôi phục
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
