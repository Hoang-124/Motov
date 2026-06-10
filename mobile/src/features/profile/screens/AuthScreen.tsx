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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError('Vui lòng điền đầy đủ email/tên đăng nhập và mật khẩu.');
        return;
      }
    } else {
      if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
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
          })
        );

        Alert.alert('Thành Công', `Chào mừng ${u.name} đã quay trở lại!`);
      } else {
        // Register API call
        const nameParts = name.trim().split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        const username = email.split('@')[0] + '_' + Math.floor(1000 + Math.random() * 9000);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      <View style={styles.container}>
        {/* Toggle Tab */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, isLogin && styles.tabButtonActive]}
            onPress={() => {
              setIsLogin(true);
              setError(null);
            }}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Đăng Nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
            onPress={() => {
              setIsLogin(false);
              setError(null);
            }}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Đăng Ký</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
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
                <View style={styles.inputContainer}>
                  <Feather name="user" size={16} color={COLORS.accent} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor="#555"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            {/* Email / Username */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                {isLogin ? 'Tên đăng nhập hoặc Email' : 'Địa chỉ Email'}
              </Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={16} color={COLORS.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.monoText]}
                  placeholder={isLogin ? "Nhập tên đăng nhập hoặc email" : "name@example.com"}
                  placeholderTextColor="#555"
                  autoCapitalize="none"
                  keyboardType={isLogin ? 'default' : 'email-address'}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Mật khẩu</Text>
                {isLogin && (
                  <TouchableOpacity>
                    <Text style={styles.forgotPassword}>Quên?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={16} color={COLORS.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.monoText]}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Confirm Password for Register */}
            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={16} color={COLORS.accent} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.monoText]}
                    placeholder="••••••••"
                    placeholderTextColor="#555"
                    secureTextEntry
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
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

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
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

          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 24,
    maxWidth: 200,
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
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
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
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
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
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
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
});
