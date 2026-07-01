import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (success) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.close();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setError('Mã xác minh không tồn tại hoặc liên kết đã bị hỏng.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Xác minh email thất bại.');
        }

        setSuccess(data.message || 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi trong quá trình xác minh email.');
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token, API_BASE_URL]);

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative"
        >
          {/* Top neon indicator bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

          {loading ? (
            <div className="text-center py-8 space-y-6">
              <Loader2 className="w-12 h-12 text-neon animate-spin mx-auto" />
              <div className="space-y-2">
                <h3 className="font-display font-bold text-white text-lg uppercase tracking-wide">Đang Xác Minh</h3>
                <p className="text-gray-400 text-xs">
                  Vui lòng chờ trong giây lát, chúng tôi đang kích hoạt tài khoản của bạn...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <XCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-red-400 text-lg uppercase tracking-wide">Xác Minh Thất Bại</h3>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {error}
                </p>
              </div>
              
              <Link
                to="/auth"
                className="w-full bg-surface border border-gray-800 text-gray-300 font-semibold py-3.5 rounded-lg hover:border-neon hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group text-xs uppercase tracking-wider cursor-pointer"
              >
                Quay lại đăng nhập / đăng ký
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-neon/10 border border-neon/30 text-neon rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(204,255,0,0.15)] animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="font-display font-bold text-white text-lg uppercase tracking-wide">Kích Hoạt Thành Công</h3>
                <p className="text-gray-300 text-xs leading-relaxed font-normal">
                  Tài khoản của bạn đã được kích hoạt thành công. Giờ đây bạn đã có thể đăng nhập vào hệ thống để trải nghiệm dịch vụ.
                </p>
                <div className="bg-black/40 border border-gray-800 p-3 rounded-lg space-y-2">
                  <p className="text-neon text-xs font-semibold animate-pulse">
                    Cửa sổ này sẽ tự động đóng sau {countdown} giây...
                  </p>
                  <p className="text-gray-500 text-[10px] italic leading-normal">
                    Vui lòng quay lại tab cũ để tiếp tục. Nếu tab không tự đóng, bạn có thể tự tắt tab này.
                  </p>
                </div>
              </div>
              
              <Link
                to="/auth"
                className="w-full bg-neon text-dark font-black py-3.5 rounded-lg hover:bg-[#bbf000] shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group text-xs uppercase tracking-widest cursor-pointer"
              >
                Đăng nhập ngay
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
