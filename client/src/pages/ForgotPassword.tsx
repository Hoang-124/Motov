import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Check, Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  
  // Email states
  const [email, setEmail] = useState('');
  
  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recaptchaWrapperRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
  const isFirebaseMock = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'placeholder-api-key';

  useEffect(() => {
    // Cleanup recaptcha on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPreviewUrl(null);
    setLoading(true);

    if (!email.trim()) {
      setError('Địa chỉ email không được để trống');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Địa chỉ email không đúng định dạng');
      setLoading(false);
      return;
    }

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!phoneNumber.trim()) {
      setError('Số điện thoại không được để trống.');
      setLoading(false);
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^\d{9,11}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập từ 9-11 chữ số.');
      setLoading(false);
      return;
    }

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+84' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+84' + formattedPhone;
    }

    if (isFirebaseMock) {
      // Simulation / Mock mode
      setTimeout(() => {
        setOtpSent(true);
        setSuccess(`[MOCK MODE] Mã OTP thử nghiệm (123456) đã được gửi đến số ${cleanPhone}!`);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      // Initialize reCAPTCHA
      if (!recaptchaVerifierRef.current && recaptchaWrapperRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaWrapperRef.current, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA đã hết hạn. Vui lòng thử lại.');
          }
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current!);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setSuccess('Mã OTP đã được gửi về số điện thoại của bạn!');
    } catch (err: any) {
      console.error('Lỗi khi gửi OTP:', err);
      setError(err.message || 'Gửi OTP thất bại. Vui lòng kiểm tra cấu hình Firebase hoặc thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Mã OTP phải gồm 6 chữ số.');
      setLoading(false);
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    if (isFirebaseMock) {
      // Simulation / Mock mode verify
      setTimeout(() => {
        if (otp === '123456') {
          setSuccess('Xác thực thành công! Đang chuyển hướng...');
          setTimeout(() => {
            navigate(`/reset-password?firebaseToken=mock-token-${cleanPhone}`);
          }, 1500);
        } else {
          setError('Mã OTP không chính xác. Vui lòng nhập 123456 trong chế độ thử nghiệm.');
          setLoading(false);
        }
      }, 1000);
      return;
    }

    try {
      if (!confirmationResult) {
        throw new Error('Không có phiên xác thực OTP hiện tại.');
      }
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();

      setSuccess('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(`/reset-password?firebaseToken=${idToken}`);
      }, 1500);
    } catch (err: any) {
      console.error('Lỗi xác thực OTP:', err);
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
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

          <div className="text-center mb-6">
            <h2 className="font-display font-black text-3xl text-white uppercase tracking-tight">
              Quên mật khẩu
            </h2>
            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
              Chọn phương thức khôi phục tài khoản của bạn.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex bg-black/45 border border-gray-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setMethod('email');
                setError(null);
                setSuccess(null);
                setOtpSent(false);
              }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all duration-300 ${
                method === 'email' 
                  ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Qua Email
            </button>
            <button
              onClick={() => {
                setMethod('phone');
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-all duration-300 ${
                method === 'phone' 
                  ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.2)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Qua Điện thoại
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-6">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-neon/5 border border-neon/30 p-4 rounded-xl text-xs text-white text-center mb-6 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 text-neon font-display font-black text-sm uppercase tracking-wider neon-text-glow">
                <Check size={16} strokeWidth={3} />
                Thành công
              </div>
              <p className="text-gray-300 leading-relaxed font-normal">{success}</p>
            </div>
          )}

          {/* Test Link Alert (only displayed when ethereal sandbox preview is generated) */}
          {method === 'email' && previewUrl && (
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

          {/* Invisible recaptcha container */}
          <div ref={recaptchaWrapperRef} id="recaptcha-container"></div>

          {method === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Phone Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Số điện thoại</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-neon" />
                      </div>
                      <input 
                        type="tel" 
                        required
                        placeholder="Ví dụ: 0912345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                    {isFirebaseMock && (
                      <p className="text-[10px] text-neon/60 italic mt-1">
                        💡 Firebase chưa cấu hình. Hệ thống sẽ chạy ở chế độ giả lập (Mock Mode).
                      </p>
                    )}
                  </div>

                  {/* Send OTP button */}
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
                        Đang gửi mã OTP...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gửi mã OTP xác nhận
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nhập mã OTP</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ShieldCheck size={16} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        maxLength={6}
                        placeholder="Mã gồm 6 chữ số"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none tracking-[0.3em] font-mono text-center transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Verify OTP button */}
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
                        Đang xác thực...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Xác nhận OTP
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setError(null);
                      setSuccess(null);
                    }}
                    disabled={loading}
                    className="w-full text-center text-xs text-gray-500 hover:text-white transition-colors duration-200 mt-2 block uppercase tracking-wider"
                  >
                    Nhập lại số điện thoại
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
