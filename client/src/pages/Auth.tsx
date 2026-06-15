import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ChevronRight, Shield, Briefcase, Award, UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

type UserRole = 'customer' | 'owner' | 'staff' | 'admin';

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationMailUrl, setVerificationMailUrl] = useState<string | null>(null);
  const [needsVerificationScreen, setNeedsVerificationScreen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // API loading & error states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Field validation states
  const [errors, setErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched] = useState<{
    name?: boolean;
    username?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[\W_]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);

  const validateField = (fieldName: string, value: string, currentPassword?: string) => {
    let errorMsg = '';
    if (!isLogin) {
      if (fieldName === 'name') {
        if (!value.trim()) {
          errorMsg = 'Họ và tên là bắt buộc.';
        } else {
          const nameRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
          if (nameRegex.test(value)) {
            errorMsg = 'Họ và tên không được chứa số hoặc ký tự đặc biệt.';
          }
        }
      }

      if (fieldName === 'username') {
        if (!value.trim()) {
          errorMsg = 'Tên đăng nhập là bắt buộc.';
        } else if (value.length < 3 || value.length > 30) {
          errorMsg = 'Tên đăng nhập phải dài từ 3 đến 30 ký tự.';
        } else {
          const usernameRegex = /^[a-zA-Z0-9_-]+$/;
          if (!usernameRegex.test(value)) {
            errorMsg = 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, "_" hoặc "-".';
          }
        }
      }

      if (fieldName === 'email') {
        if (!value.trim()) {
          errorMsg = 'Địa chỉ email là bắt buộc.';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            errorMsg = 'Địa chỉ email không đúng định dạng.';
          }
        }
      }

      if (fieldName === 'password') {
        if (!value) {
          errorMsg = 'Mật khẩu là bắt buộc.';
        } else if (value.length < 8) {
          errorMsg = 'Mật khẩu phải dài ít nhất 8 ký tự.';
        } else {
          const hasLowercase = /[a-z]/.test(value);
          const hasUppercase = /[A-Z]/.test(value);
          const hasDigit = /[0-9]/.test(value);
          const hasSpecial = /[\W_]/.test(value);
          if (!hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
            errorMsg = 'Mật khẩu phải gồm chữ thường, chữ hoa, số và ký tự đặc biệt.';
          }
        }
      }

      if (fieldName === 'confirmPassword') {
        const passwordToCompare = currentPassword !== undefined ? currentPassword : password;
        if (!value) {
          errorMsg = 'Vui lòng xác nhận mật khẩu.';
        } else if (value !== passwordToCompare) {
          errorMsg = 'Mật khẩu xác nhận không trùng khớp.';
        }
      }
    } else {
      if (fieldName === 'email') {
        if (!value.trim()) {
          errorMsg = 'Vui lòng nhập tên đăng nhập hoặc email.';
        } else if (value.includes('@')) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            errorMsg = 'Email không đúng định dạng.';
          }
        } else {
          const usernameRegex = /^[a-zA-Z0-9_-]+$/;
          if (value.length < 3 || value.length > 30) {
            errorMsg = 'Tên đăng nhập phải dài từ 3 đến 30 ký tự.';
          } else if (!usernameRegex.test(value)) {
            errorMsg = 'Tên đăng nhập chỉ chứa chữ cái không dấu, số, "_" hoặc "-".';
          }
        }
      }
      if (fieldName === 'password') {
        if (!value) {
          errorMsg = 'Vui lòng nhập mật khẩu.';
        }
      }
    }

    setErrors(prev => ({ ...prev, [fieldName]: errorMsg || undefined }));
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    let val = '';
    if (fieldName === 'name') val = name;
    if (fieldName === 'username') val = username;
    if (fieldName === 'email') val = email;
    if (fieldName === 'password') val = password;
    if (fieldName === 'confirmPassword') val = confirmPassword;
    validateField(fieldName, val);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === 'name') setName(value);
    if (fieldName === 'username') setUsername(value);
    if (fieldName === 'email') setEmail(value);
    if (fieldName === 'password') {
      setPassword(value);
      if (touched.confirmPassword) {
        validateField('confirmPassword', confirmPassword, value);
      }
    }
    if (fieldName === 'confirmPassword') setConfirmPassword(value);

    if (touched[fieldName as keyof typeof touched]) {
      validateField(fieldName, value, fieldName === 'password' ? value : password);
    }
  };

  const validateForm = () => {
    const newTouched = {
      name: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true
    };
    setTouched(newTouched);

    let isValid = true;
    const errorsList: any = {};

    if (!isLogin) {
      if (!name.trim()) {
        errorsList.name = 'Họ và tên là bắt buộc.';
        isValid = false;
      } else if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(name)) {
        errorsList.name = 'Họ và tên không được chứa số hoặc ký tự đặc biệt.';
        isValid = false;
      }

      if (!username.trim()) {
        errorsList.username = 'Tên đăng nhập là bắt buộc.';
        isValid = false;
      } else if (username.length < 3 || username.length > 30) {
        errorsList.username = 'Tên đăng nhập phải dài từ 3 đến 30 ký tự.';
        isValid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errorsList.username = 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, "_" hoặc "-".';
        isValid = false;
      }

      if (!email.trim()) {
        errorsList.email = 'Địa chỉ email là bắt buộc.';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errorsList.email = 'Địa chỉ email không đúng định dạng.';
        isValid = false;
      }

      if (!password) {
        errorsList.password = 'Mật khẩu là bắt buộc.';
        isValid = false;
      } else if (password.length < 8) {
        errorsList.password = 'Mật khẩu phải dài ít nhất 8 ký tự.';
        isValid = false;
      } else {
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSpecial = /[\W_]/.test(password);
        if (!hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
          errorsList.password = 'Mật khẩu phải gồm chữ thường, chữ hoa, số và ký tự đặc biệt.';
          isValid = false;
        }
      }

      if (!confirmPassword) {
        errorsList.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
        isValid = false;
      } else if (confirmPassword !== password) {
        errorsList.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
        isValid = false;
      }
    } else {
      if (!email.trim()) {
        errorsList.email = 'Vui lòng nhập tên đăng nhập hoặc email.';
        isValid = false;
      } else if (email.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errorsList.email = 'Email không đúng định dạng.';
          isValid = false;
        }
      } else {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (email.length < 3 || email.length > 30) {
          errorsList.email = 'Tên đăng nhập phải dài từ 3 đến 30 ký tự.';
          isValid = false;
        } else if (!usernameRegex.test(email)) {
          errorsList.email = 'Tên đăng nhập chỉ chứa chữ cái không dấu, số, "_" hoặc "-".';
          isValid = false;
        }
      }

      if (!password) {
        errorsList.password = 'Vui lòng nhập mật khẩu.';
        isValid = false;
      }
    }

    setErrors(errorsList);
    return isValid;
  };

  const tokenClientRef = useRef<any>(null);

  const handleGoogleTokenResponse = async (response: any) => {
    if (response.error) {
      setError('Đăng nhập Google thất bại: ' + response.error);
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  const checkVerification = async (isManual = false) => {
    if (!email) return false;
    if (isManual) setCheckingStatus(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/check-verification-status?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (response.ok && data.success && data.isVerified) {
        setSuccess('Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
        setNeedsVerificationScreen(false);
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setError(null);
        return true;
      } else if (isManual && data.success && !data.isVerified) {
        setError('Tài khoản chưa được kích hoạt. Vui lòng click link kích hoạt trong hòm thư của bạn.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Lỗi kiểm tra trạng thái xác thực:', err);
    } finally {
      if (isManual) setCheckingStatus(false);
    }
    return false;
  };

  // Tự động kiểm tra trạng thái xác minh trong nền
  useEffect(() => {
    let intervalId: any;

    if (needsVerificationScreen && email) {
      // Kiểm tra ngay lập tức lần đầu khi màn hình xuất hiện
      checkVerification(false);

      // Định kỳ kiểm tra mỗi 3 giây
      intervalId = setInterval(async () => {
        const isVerified = await checkVerification(false);
        if (isVerified && intervalId) {
          clearInterval(intervalId);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [needsVerificationScreen, email]);

  const handleGoogleSignInClick = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    } else {
      setError('Google SDK chưa được tải xong. Vui lòng tải lại trang hoặc thử lại sau.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Vui lòng kiểm tra lại thông tin nhập vào.');
      return;
    }
    setError(null);
    setSuccess(null);
    setNeedsVerificationScreen(false);
    setVerificationMailUrl(null);
    setLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim() !== '' ? email.trim() : undefined,
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

        if (data.needsVerification) {
          setSuccess(data.message || 'Đăng ký tài khoản thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.');
          setNeedsVerificationScreen(true);
          if (data.previewUrl) {
            setVerificationMailUrl(data.previewUrl);
          }
          return;
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
            onClick={() => { 
              setIsLogin(true); 
              setConfirmPassword(''); 
              setError(null); 
              setSuccess(null);
              setNeedsVerificationScreen(false);
              setVerificationMailUrl(null);
              setErrors({});
              setTouched({});
            }}
            className={`flex-grow pb-3 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer ${isLogin ? 'text-neon border-b-2 border-neon' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Đăng Nhập
          </button>
          <button 
            onClick={() => { 
              setIsLogin(false); 
              setConfirmPassword(''); 
              setError(null); 
              setSuccess(null);
              setNeedsVerificationScreen(false);
              setVerificationMailUrl(null);
              setErrors({});
              setTouched({});
            }}
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
          
          {needsVerificationScreen ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-neon/10 border border-neon/30 text-neon rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(204,255,0,0.15)] animate-pulse">
                <Mail size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-white text-lg uppercase tracking-wide">Xác Minh Tài Khoản</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Chúng tôi đã gửi liên kết kích hoạt đến địa chỉ email <strong className="text-white font-mono">{email}</strong>. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản của bạn.
                </p>
              </div>
              
              {verificationMailUrl && (
                <div className="bg-black/40 border border-gray-800 p-4 rounded-xl space-y-3">
                  <p className="text-gray-500 text-[11px] leading-normal">
                    Bạn đang ở môi trường thử nghiệm (Local). Hãy nhấp nút bên dưới để truy cập hòm thư ảo Ethereal và kích hoạt tài khoản:
                  </p>
                  <a 
                    href={verificationMailUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-neon text-dark font-black py-3 px-4 rounded-lg text-xs uppercase tracking-widest hover:bg-[#bbf000] shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all block text-center cursor-pointer"
                  >
                    Mở Hòm Thư Thử Nghiệm
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => checkVerification(true)}
                disabled={checkingStatus}
                className={`w-full border border-neon/50 text-neon font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-widest hover:bg-neon/10 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${checkingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {checkingStatus ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-neon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang kiểm tra...
                  </>
                ) : (
                  'Tôi đã kích hoạt - Kiểm tra ngay'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setSuccess(null);
                  setError(null);
                  setNeedsVerificationScreen(false);
                  setVerificationMailUrl(null);
                  setEmail('');
                  setPassword('');
                }}
                className="text-neon hover:underline text-xs font-semibold uppercase tracking-wider block mx-auto cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <>
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
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={`w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all ${touched.name && errors.name ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gray-800'}`}
                  />
                </div>
                {touched.name && errors.name && (
                  <p className="text-red-400 text-[11px] font-semibold mt-1">⚠️ {errors.name}</p>
                )}
              </div>
            )}

            {/* Tên đăng nhập (Sign Up only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tên đăng nhập</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound size={16} className="text-neon" />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    onBlur={() => handleBlur('username')}
                    className={`w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all ${touched.username && errors.username ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gray-800'}`}
                  />
                </div>
                {touched.username && errors.username && (
                  <p className="text-red-400 text-[11px] font-semibold mt-1">⚠️ {errors.username}</p>
                )}
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
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono ${touched.email && errors.email ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gray-800'}`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-400 text-[11px] font-semibold mt-1">⚠️ {errors.email}</p>
              )}
              {!isLogin && (
                <p className="text-[10px] text-gray-500 mt-1 italic leading-normal">
                  * Nếu dùng email Google thì vui lòng chọn phiên Đăng Nhập (Đăng nhập với Google). Còn nếu dùng email loại khác thì vui lòng điền ở đây.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mật khẩu</label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-xs text-neon hover:underline">Quên mật khẩu?</Link>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-neon" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 pr-10 p-3 outline-none transition-all font-mono ${touched.password && errors.password ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gray-800'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-400 text-[11px] font-semibold mt-1">⚠️ {errors.password}</p>
              )}

              {/* Password Strength Meter (Sign Up only) */}
              {!isLogin && password && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 uppercase tracking-wider font-semibold">Độ mạnh mật khẩu:</span>
                    <span className={
                      passwordStrength === 1 ? 'text-red-400 font-bold' :
                      passwordStrength === 2 ? 'text-orange-400 font-bold' :
                      passwordStrength === 3 ? 'text-yellow-400 font-bold' :
                      passwordStrength === 4 ? 'text-green-400 font-bold' : 'text-gray-500'
                    }>
                      {passwordStrength === 1 && 'Rất yếu'}
                      {passwordStrength === 2 && 'Yếu'}
                      {passwordStrength === 3 && 'Trung bình'}
                      {passwordStrength === 4 && 'Mạnh'}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((index) => (
                      <div 
                        key={index} 
                        className={`flex-grow rounded-full transition-all duration-300 ${
                          index <= passwordStrength 
                            ? (passwordStrength === 1 ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' :
                               passwordStrength === 2 ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]' :
                               passwordStrength === 3 ? 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]' :
                               'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]')
                            : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
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
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 pr-10 p-3 outline-none transition-all font-mono ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gray-800'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-red-400 text-[11px] font-semibold mt-1">⚠️ {errors.confirmPassword}</p>
                )}
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

            {/* Divider and Google Sign-in */}
            {isLogin && (
              <>
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
              </>
            )}
          </form>
        </>
      )}
    </motion.div>

      </div>
    </div>
  );
};
