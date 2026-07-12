import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Linking,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppDispatch } from '../../../app/store';
import { updateUser } from '../userSlice';
import { API_BASE_URL } from '../../../constants/api';

export const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isLogin, setIsLogin] = useState(true);

  // Load Google Identity Services SDK on Web mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      const id = 'google-jssdk';
      if (!document.getElementById(id)) {
        const script = document.createElement('script');
        script.id = id;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification states
  const [needsVerificationScreen, setNeedsVerificationScreen] = useState(false);
  const [verificationMailUrl, setVerificationMailUrl] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation states (sync with Web Auth.tsx)
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

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStage, setForgotStage] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailPreviewUrl, setForgotEmailPreviewUrl] = useState<string | null>(null);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // Password strength logic (sync with Web Auth.tsx)
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

  // Validate fields in real-time (sync with Web Auth.tsx)
  const validateField = (fieldName: string, value: string, currentPassword?: string) => {
    let errorMsg = '';
    if (!isLogin) {
      if (fieldName === 'name') {
        if (!value.trim()) {
          errorMsg = 'Họ và tên không được để trống';
        } else {
          const nameRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
          if (nameRegex.test(value)) {
            errorMsg = 'Họ và tên không được chứa số hoặc ký tự đặc biệt.';
          }
        }
      }

      if (fieldName === 'username') {
        if (!value.trim()) {
          errorMsg = 'Tên đăng nhập không được để trống';
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
          errorMsg = 'Địa chỉ email không được để trống';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            errorMsg = 'Địa chỉ email không đúng định dạng';
          }
        }
      }

      if (fieldName === 'password') {
        if (!value) {
          errorMsg = 'Mật khẩu không được để trống';
        } else {
          const hasLowercase = /[a-z]/.test(value);
          const hasUppercase = /[A-Z]/.test(value);
          const hasDigit = /[0-9]/.test(value);
          const hasSpecial = /[\W_]/.test(value);
          if (value.length < 8 || !hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
            errorMsg = 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số';
          }
        }
      }

      if (fieldName === 'confirmPassword') {
        const passwordToCompare = currentPassword !== undefined ? currentPassword : password;
        if (!value) {
          errorMsg = 'Vui lòng xác nhận mật khẩu';
        } else if (value !== passwordToCompare) {
          errorMsg = 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập';
        }
      }
    } else {
      if (fieldName === 'email') {
        if (!value.trim()) {
          errorMsg = 'Vui lòng nhập tên đăng nhập/email';
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
          errorMsg = 'Vui lòng nhập mật khẩu';
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
        errorsList.name = 'Họ và tên không được để trống';
        isValid = false;
      } else if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(name)) {
        errorsList.name = 'Họ và tên không được chứa số hoặc ký tự đặc biệt.';
        isValid = false;
      }

      if (!username.trim()) {
        errorsList.username = 'Tên đăng nhập không được để trống';
        isValid = false;
      } else if (username.length < 3 || username.length > 30) {
        errorsList.username = 'Tên đăng nhập phải dài từ 3 đến 30 ký tự.';
        isValid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errorsList.username = 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số, "_" hoặc "-".';
        isValid = false;
      }

      if (!email.trim()) {
        errorsList.email = 'Địa chỉ email không được để trống';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errorsList.email = 'Địa chỉ email không đúng định dạng';
        isValid = false;
      }

      if (!password) {
        errorsList.password = 'Mật khẩu không được để trống';
        isValid = false;
      } else {
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSpecial = /[\W_]/.test(password);
        if (password.length < 8 || !hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
          errorsList.password = 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số';
          isValid = false;
        }
      }

      if (!confirmPassword) {
        errorsList.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        isValid = false;
      } else if (confirmPassword !== password) {
        errorsList.confirmPassword = 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập';
        isValid = false;
      }
    } else {
      if (!email.trim()) {
        errorsList.email = 'Vui lòng nhập tên đăng nhập/email';
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
        errorsList.password = 'Vui lòng nhập mật khẩu';
        isValid = false;
      }
    }

    setErrors(errorsList);
    return isValid;
  };

  // Check verification status via API
  const checkVerification = async (isManual = false) => {
    if (!email) return false;
    if (isManual) setCheckingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-verification-status?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (response.ok && data.success && data.isVerified) {
        Alert.alert('Xác Thực Thành Công 🎉', 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
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
      console.error('Error checking verification status:', err);
    } finally {
      if (isManual) setCheckingStatus(false);
    }
    return false;
  };

  // Background verification checker
  useEffect(() => {
    let intervalId: any;

    if (needsVerificationScreen && email) {
      checkVerification(false);

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

  const handleSendOtp = () => {
    const cleanPhone = forgotPhone.replace(/\s+/g, '');
    if (!/^\d{9,11}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập từ 9-11 chữ số.');
      return;
    }
    setError(null);
    setLoading(true);
    // Simulate sending OTP (Mock Mode)
    setTimeout(() => {
      setLoading(false);
      setForgotStage('otp');
      Alert.alert('[MOCK MODE]', `Mã OTP thử nghiệm (123456) đã được gửi đến số ${cleanPhone}!`);
    }, 1000);
  };

  const handleSendEmailReset = async () => {
    if (!forgotEmail.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setError('Địa chỉ email không đúng định dạng.');
      return;
    }

    setError(null);
    setLoading(true);
    setForgotEmailPreviewUrl(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gửi yêu cầu khôi phục mật khẩu thất bại.');
      }

      Alert.alert('Thành Công 🎉', 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.');
      if (data.previewUrl) {
        setForgotEmailPreviewUrl(data.previewUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi gửi yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (forgotOtp !== '123456') {
      setError('Mã OTP không chính xác. Vui lòng nhập 123456.');
      return;
    }
    setError(null);
    setForgotStage('reset');
  };

  const handleResetPassword = async () => {
    if (forgotNewPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const cleanPhone = forgotPhone.replace(/\s+/g, '');
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: `mock-token-${cleanPhone}`,
          newPassword: forgotNewPassword
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
      }

      Alert.alert('Thành Công 🎉', 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      setShowForgotPassword(false);
      setIsLogin(true);
      setPassword(forgotNewPassword); // autofill password
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Vui lòng kiểm tra lại thông tin nhập vào.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Log in API call
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Đăng nhập thất bại.');
        }

        const u = data.user;
        dispatch(
          updateUser({
            token: data.token,
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
            phoneNumber: u.phoneNumber || '',
            avatarUrl: u.avatarUrl || '',
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            gender: u.gender || '',
            dob: u.dob || '',
            identityStatus: u.identityStatus || null,
          })
        );

        Alert.alert('Thành Công', `Chào mừng ${u.name} đã quay trở lại!`);
      } else {
        // Register API call
        const nameParts = name.trim().split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts.slice(1).join(' ') || nameParts[0] || '';

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          setError(null);
          setNeedsVerificationScreen(true);
          if (data.previewUrl) {
            setVerificationMailUrl(data.previewUrl);
          }
          return;
        }

        const u = data.user;
        dispatch(
          updateUser({
            token: data.token,
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
            phoneNumber: u.phoneNumber || '',
            avatarUrl: u.avatarUrl || '',
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            gender: u.gender || '',
            dob: u.dob || '',
          })
        );

        Alert.alert('Thành Công', 'Đăng ký tài khoản thành công!');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (Platform.OS === 'web') {
      const google = (window as any).google;
      if (!google) {
        Alert.alert('Lỗi', 'Google SDK chưa được tải xong. Vui lòng tải lại trang hoặc thử lại sau.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: '927292562825-91mdr6b51b97kutl1d6fpqt4c0clm9sg.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (response: any) => {
            if (response.error) {
              setLoading(false);
              setError('Đăng nhập Google thất bại: ' + response.error);
              return;
            }

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
                throw new Error(data.message || 'Xác thực tài khoản với backend thất bại.');
              }

              const u = data.user;
              dispatch(
                updateUser({
                  token: data.token,
                  id: u.id,
                  username: u.username,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  phoneNumber: u.phoneNumber || '',
                  avatarUrl: u.avatarUrl || '',
                  firstName: u.firstName || '',
                  lastName: u.lastName || '',
                  gender: u.gender || '',
                  dob: u.dob || '',
                })
              );

              Alert.alert('Thành Công', `Đăng nhập Google thành công! Chào mừng ${u.name}`);
            } catch (err: any) {
              setError(err.message || 'Đã xảy ra lỗi khi xác thực tài khoản.');
            } finally {
              setLoading(false);
            }
          },
        });

        client.requestAccessToken();
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi khi khởi chạy Google Sign-In.');
        setLoading(false);
      }
    } else {
      // Fallback for native devices
      setLoading(true);
      setError(null);
      setTimeout(() => {
        setLoading(false);
        const mockGoogleUser = {
          token: 'google_mock_token_jwt_123456',
          id: 'usr-google-101',
          username: 'gg_user',
          name: 'Google User',
          email: 'googleuser@gmail.com',
          role: 'customer' as const,
          phoneNumber: '0987654321',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          firstName: 'User',
          lastName: 'Google',
          gender: 'Other',
          dob: '2000-01-01',
        };
        dispatch(updateUser(mockGoogleUser));
        Alert.alert('Thành Công', 'Đăng nhập bằng Google (Giả lập trên thiết bị di động) thành công!');
      }, 1200);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2000' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} pointerEvents="none" />

        {/* Big background watermark text */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkText}>MOTOV</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            {!showForgotPassword && !needsVerificationScreen && (
              /* Toggle Tab */
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, isLogin && styles.tabButtonActive]}
                  onPress={() => {
                    setIsLogin(true);
                    setError(null);
                    setErrors({});
                    setTouched({});
                  }}
                >
                  <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Đăng Nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
                  onPress={() => {
                    setIsLogin(false);
                    setError(null);
                    setErrors({});
                    setTouched({});
                  }}
                >
                  <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Đăng Ký</Text>
                </TouchableOpacity>
              </View>
            )}

            {needsVerificationScreen ? (
              /* Verification Card */
              <View style={styles.formCard}>
                <View style={styles.neonBar} />
                
                <View style={styles.verificationIconContainer}>
                  <Feather name="mail" size={32} color={COLORS.accent} />
                </View>
                
                <Text style={styles.title}>Xác Minh Tài Khoản</Text>
                <Text style={styles.subtitle}>
                  Chúng tôi đã gửi liên kết kích hoạt đến địa chỉ email:
                  {'\n'}
                  <Text style={styles.boldEmail}>{email}</Text>
                  {'\n'}
                  Vui lòng kiểm tra hộp thư để kích hoạt tài khoản của bạn.
                </Text>

                {error && (
                  <View style={styles.errorCard}>
                    <Feather name="alert-triangle" size={14} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {verificationMailUrl && (
                  <View style={styles.testMailboxContainer}>
                    <Text style={styles.testMailboxText}>
                      Bạn đang ở môi trường thử nghiệm (Local). Hãy nhấp nút bên dưới để truy cập hòm thư ảo Ethereal và kích hoạt tài khoản:
                    </Text>
                    <TouchableOpacity
                      style={styles.testMailboxButton}
                      onPress={() => Linking.openURL(verificationMailUrl)}
                    >
                      <Text style={styles.testMailboxButtonText}>Mở Hòm Thư Thử Nghiệm</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, checkingStatus && styles.disabledButton]}
                  onPress={() => checkVerification(true)}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={COLORS.accentDark} />
                      <Text style={styles.submitButtonText}> ĐANG KIỂM TRA...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>TÔI ĐÃ KÍCH HOẠT - KIỂM TRA NGAY</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setIsLogin(true);
                    setNeedsVerificationScreen(false);
                    setVerificationMailUrl(null);
                    setEmail('');
                    setPassword('');
                    setError(null);
                    setErrors({});
                    setTouched({});
                  }}
                >
                  <Feather name="arrow-left" size={14} color={COLORS.accent} />
                  <Text style={styles.backButtonText}> QUAY LẠI ĐĂNG NHẬP</Text>
                </TouchableOpacity>
              </View>
            ) : showForgotPassword ? (
              /* Forgot Password Card */
              <View style={styles.formCard}>
                <View style={styles.neonBar} />
                
                <Text style={styles.title}>
                  {forgotStage === 'phone' && (forgotMethod === 'email' ? 'Khôi phục tài khoản' : 'Khôi phục mật khẩu')}
                  {forgotStage === 'otp' && 'Xác minh OTP'}
                  {forgotStage === 'reset' && 'Đặt lại mật khẩu'}
                </Text>
                <Text style={styles.subtitle}>
                  {forgotStage === 'phone' && (forgotMethod === 'email' ? 'Nhập địa chỉ email của bạn để nhận liên kết khôi phục' : 'Nhập số điện thoại của bạn để nhận mã OTP')}
                  {forgotStage === 'otp' && 'Nhập mã OTP 6 số đã được gửi tới số điện thoại'}
                  {forgotStage === 'reset' && 'Thiết lập mật khẩu mới cho tài khoản của bạn'}
                </Text>

                {/* Method selector for stage 'phone' */}
                {forgotStage === 'phone' && (
                  <View style={styles.forgotToggleContainer}>
                    <TouchableOpacity
                      style={[styles.forgotToggleTab, forgotMethod === 'email' && styles.forgotToggleTabActive]}
                      onPress={() => {
                        setForgotMethod('email');
                        setError(null);
                      }}
                    >
                      <Text style={[styles.forgotToggleTabText, forgotMethod === 'email' && styles.forgotToggleTabTextActive]}>Qua Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.forgotToggleTab, forgotMethod === 'phone' && styles.forgotToggleTabActive]}
                      onPress={() => {
                        setForgotMethod('phone');
                        setError(null);
                      }}
                    >
                      <Text style={[styles.forgotToggleTabText, forgotMethod === 'phone' && styles.forgotToggleTabTextActive]}>Qua Điện thoại</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {error && (
                  <View style={styles.errorCard}>
                    <Feather name="alert-triangle" size={14} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputsContainer}>
                  {forgotStage === 'phone' && forgotMethod === 'phone' && (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Số điện thoại</Text>
                      <View style={styles.inputContainer}>
                        <Feather name="phone" size={16} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.monoText]}
                          placeholder="Ví dụ: 0912345678"
                          placeholderTextColor="#555"
                          keyboardType="phone-pad"
                          value={forgotPhone}
                          onChangeText={setForgotPhone}
                        />
                      </View>
                      <Text style={styles.helperText}>
                        💡 Hệ thống sẽ chạy ở chế độ giả lập (Mock Mode).
                      </Text>
                    </View>
                  )}

                  {forgotStage === 'phone' && forgotMethod === 'email' && (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Địa chỉ Email</Text>
                      <View style={styles.inputContainer}>
                        <Feather name="mail" size={16} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.monoText]}
                          placeholder="name@example.com"
                          placeholderTextColor="#555"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={forgotEmail}
                          onChangeText={setForgotEmail}
                        />
                      </View>
                      {forgotEmailPreviewUrl && (
                        <View style={styles.testMailboxContainer}>
                          <Text style={styles.testMailboxText}>
                            Bạn đang ở môi trường thử nghiệm (Local). Hãy nhấp nút bên dưới để nhận link đặt lại mật khẩu:
                          </Text>
                          <TouchableOpacity
                            style={styles.testMailboxButton}
                            onPress={() => Linking.openURL(forgotEmailPreviewUrl)}
                          >
                            <Text style={styles.testMailboxButtonText}>Mở Hòm Thư Thử Nghiệm</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {forgotStage === 'otp' && (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Mã OTP xác thực</Text>
                      <View style={styles.inputContainer}>
                        <Feather name="shield" size={16} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.monoText, styles.otpInput]}
                          placeholder="******"
                          placeholderTextColor="#555"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={forgotOtp}
                          onChangeText={(val) => setForgotOtp(val.replace(/\D/g, ''))}
                        />
                      </View>
                    </View>
                  )}

                  {forgotStage === 'reset' && (
                    <>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Mật khẩu mới</Text>
                        <View style={styles.inputContainer}>
                          <Feather name="lock" size={16} color={COLORS.accent} style={styles.inputIcon} />
                          <TextInput
                            style={[styles.input, styles.monoText]}
                            placeholder="Tối thiểu 6 ký tự"
                            placeholderTextColor="#555"
                            secureTextEntry
                            value={forgotNewPassword}
                            onChangeText={setForgotNewPassword}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                        <View style={styles.inputContainer}>
                          <Feather name="lock" size={16} color={COLORS.accent} style={styles.inputIcon} />
                          <TextInput
                            style={[styles.input, styles.monoText]}
                            placeholder="Nhập lại mật khẩu mới"
                            placeholderTextColor="#555"
                            secureTextEntry
                            value={forgotConfirmPassword}
                            onChangeText={setForgotConfirmPassword}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={() => {
                      if (forgotStage === 'phone') {
                        if (forgotMethod === 'email') handleSendEmailReset();
                        else handleSendOtp();
                      }
                      else if (forgotStage === 'otp') handleVerifyOtp();
                      else if (forgotStage === 'reset') handleResetPassword();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={COLORS.accentDark} />
                        <Text style={styles.submitButtonText}> ĐANG XỬ LÝ...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {forgotStage === 'phone' && (forgotMethod === 'email' ? 'GỬI YÊU CẦU KHÔI PHỤC' : 'GỬI MÃ OTP XÁC NHẬN')}
                        {forgotStage === 'otp' && 'XÁC NHẬN OTP'}
                        {forgotStage === 'reset' && 'THIẾT LẬP MẬT KHẨU MỚI'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {forgotStage === 'otp' && (
                    <TouchableOpacity
                      onPress={() => {
                        setForgotStage('phone');
                        setError(null);
                      }}
                      disabled={loading}
                      style={styles.retryPhoneLink}
                    >
                      <Text style={styles.retryPhoneLinkText}>
                        NHẬP LẠI SỐ ĐIỆN THOẠI
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() => {
                      setShowForgotPassword(false);
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    <Feather name="arrow-left" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.googleButtonText}>Quay lại đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Form Card */
              <View style={styles.formCard}>
                <View style={styles.neonBar} />
                
                <Text style={styles.title}>
                  {isLogin ? 'Cổng Đăng Nhập' : 'Đăng Ký Thành Viên'}
                </Text>
                <Text style={styles.subtitle}>
                  {isLogin 
                    ? 'Đăng nhập vào hệ thống để tiếp tục' 
                    : 'Tạo tài khoản mới để trải nghiệm dịch vụ hoặc chia sẻ xe'}
                </Text>

                {error && (
                  <View style={styles.errorCard}>
                    <Feather name="alert-triangle" size={14} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputsContainer}>
                  {/* Full Name for Register */}
                  {!isLogin && (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Họ và tên</Text>
                      <View style={[
                        styles.inputContainer,
                        touched.name && errors.name ? styles.inputContainerError : null
                      ]}>
                        <Feather name="user" size={16} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Nhập họ và tên"
                          placeholderTextColor="#555"
                          value={name}
                          onChangeText={(val) => handleFieldChange('name', val)}
                          onBlur={() => handleBlur('name')}
                        />
                      </View>
                      {touched.name && errors.name && (
                        <Text style={styles.fieldErrorText}>{errors.name}</Text>
                      )}
                    </View>
                  )}

                  {/* Tên đăng nhập (Sign Up only) */}
                  {!isLogin && (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Tên đăng nhập</Text>
                      <View style={[
                        styles.inputContainer,
                        touched.username && errors.username ? styles.inputContainerError : null
                      ]}>
                        <Feather name="key" size={16} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.monoText]}
                          placeholder="Nhập tên đăng nhập"
                          placeholderTextColor="#555"
                          autoCapitalize="none"
                          value={username}
                          onChangeText={(val) => handleFieldChange('username', val)}
                          onBlur={() => handleBlur('username')}
                        />
                      </View>
                      {touched.username && errors.username && (
                        <Text style={styles.fieldErrorText}>{errors.username}</Text>
                      )}
                    </View>
                  )}

                  {/* Email / Username */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>
                      {isLogin ? 'Tên đăng nhập hoặc Email' : 'Địa chỉ Email'}
                    </Text>
                    <View style={[
                      styles.inputContainer,
                      touched.email && errors.email ? styles.inputContainerError : null
                    ]}>
                      <Feather name="mail" size={16} color={COLORS.accent} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.monoText]}
                        placeholder={isLogin ? "Nhập tên đăng nhập hoặc email" : "name@example.com"}
                        placeholderTextColor="#555"
                        autoCapitalize="none"
                        keyboardType={isLogin ? 'default' : 'email-address'}
                        value={email}
                        onChangeText={(val) => handleFieldChange('email', val)}
                        onBlur={() => handleBlur('email')}
                      />
                    </View>
                    {touched.email && errors.email && (
                      <Text style={styles.fieldErrorText}>{errors.email}</Text>
                    )}
                    {!isLogin && (
                      <Text style={styles.helperText}>
                        * Nếu dùng email Google thì vui lòng chọn phiên Đăng Nhập (Đăng nhập với Google). Còn nếu dùng email loại khác thì vui lòng điền ở đây.
                      </Text>
                    )}
                  </View>

                  {/* Password */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Mật khẩu</Text>
                      {isLogin && (
                        <TouchableOpacity onPress={() => {
                          setForgotStage('phone');
                          setForgotPhone('');
                          setForgotOtp('');
                          setForgotNewPassword('');
                          setForgotConfirmPassword('');
                          setError(null);
                          setShowForgotPassword(true);
                        }}>
                          <Text style={styles.forgotPassword}>Quên?</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={[
                      styles.inputContainer,
                      touched.password && errors.password ? styles.inputContainerError : null
                    ]}>
                      <Feather name="lock" size={16} color={COLORS.accent} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.monoText]}
                        placeholder="••••••••"
                        placeholderTextColor="#555"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={(val) => handleFieldChange('password', val)}
                        onBlur={() => handleBlur('password')}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    {touched.password && errors.password && (
                      <Text style={styles.fieldErrorText}>{errors.password}</Text>
                    )}

                    {/* Password Strength Meter (Sign Up only) */}
                    {!isLogin && password.length > 0 && (
                      <View style={styles.strengthContainer}>
                        <View style={styles.strengthLabelRow}>
                          <Text style={styles.strengthLabel}>Độ mạnh mật khẩu:</Text>
                          <Text style={[
                            styles.strengthValue,
                            passwordStrength === 1 && { color: COLORS.danger },
                            passwordStrength === 2 && { color: '#fb923c' },
                            passwordStrength === 3 && { color: '#facc15' },
                            passwordStrength === 4 && { color: COLORS.approved },
                          ]}>
                            {passwordStrength === 1 && 'Rất yếu'}
                            {passwordStrength === 2 && 'Yếu'}
                            {passwordStrength === 3 && 'Trung bình'}
                            {passwordStrength === 4 && 'Mạnh'}
                          </Text>
                        </View>
                        <View style={styles.strengthBarsRow}>
                          {[1, 2, 3, 4].map((index) => (
                            <View
                              key={index}
                              style={[
                                styles.strengthBar,
                                index <= passwordStrength
                                  ? (passwordStrength === 1 ? { backgroundColor: COLORS.danger } :
                                     passwordStrength === 2 ? { backgroundColor: '#f97316' } :
                                     passwordStrength === 3 ? { backgroundColor: '#eab308' } :
                                     { backgroundColor: COLORS.approved })
                                  : { backgroundColor: '#27272a' }
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password for Register */}
                  {!isLogin && (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.label}>Xác nhận mật khẩu</Text>
                      <View style={[
                        styles.inputContainer,
                        touched.confirmPassword && errors.confirmPassword ? styles.inputContainerError : null
                      ]}>
                        <Feather name="lock" size={16} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.monoText]}
                          placeholder="••••••••"
                          placeholderTextColor="#555"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          value={confirmPassword}
                          onChangeText={(val) => handleFieldChange('confirmPassword', val)}
                          onBlur={() => handleBlur('confirmPassword')}
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      {touched.confirmPassword && errors.confirmPassword && (
                        <Text style={styles.fieldErrorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={COLORS.accentDark} />
                        <Text style={styles.submitButtonText}> ĐANG XỬ LÝ...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {isLogin ? 'XÁC NHẬN ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Divider and Google Sign In */}
                  {isLogin && (
                    <>
                      <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Hoặc</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                      >
                        <View style={styles.googleIconContainer}>
                          <Feather name="chrome" size={16} color="#fff" />
                        </View>
                        <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.88)', // premium dark semi-transparent layer
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  watermarkText: {
    fontSize: 90,
    fontWeight: '900',
    color: COLORS.accent,
    opacity: 0.04,
    letterSpacing: -2,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 24,
    width: 200,
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    color: '#555',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: COLORS.accent,
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(24, 24, 27, 0.85)', // translucent card background
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.6)',
    padding: 24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  neonBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  boldEmail: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  fieldErrorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  inputsContainer: {
    gap: 14,
  },
  inputWrapper: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputContainerError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 12,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.accentDark,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 10,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  // Password Strength Meter Styles
  strengthContainer: {
    marginTop: 8,
    gap: 4,
  },
  strengthLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  strengthValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
  },
  strengthBar: {
    flex: 1,
    borderRadius: 2,
  },
  // Verification Screen Custom Styles
  verificationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(190, 242, 100, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  testMailboxContainer: {
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  testMailboxText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  testMailboxButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testMailboxButtonText: {
    color: COLORS.accentDark,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  otpInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  retryPhoneLink: {
    marginTop: 8,
    alignItems: 'center',
  },
  retryPhoneLinkText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  forgotToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  forgotToggleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  forgotToggleTabActive: {
    backgroundColor: COLORS.accent,
  },
  forgotToggleTabText: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  forgotToggleTabTextActive: {
    color: COLORS.accentDark,
  },
});
