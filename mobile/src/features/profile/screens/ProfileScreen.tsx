import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { updateUser, logout, UserRole, getMemberTag } from '../userSlice';
import { AuthScreen } from './AuthScreen';
import { API_BASE_URL } from '../../../constants/api';

// Preset avatar options for interactive demo
const PRESET_AVATARS = [
  { name: 'Rider Neon', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=150' },
  { name: 'Biker Classic', url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=150' },
  { name: 'Modern Pilot', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' }
];

export const ProfileScreen: React.FC = () => {
  const user = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();

  // Navigation section state: 'menu' | 'profile' | 'password'
  const [activeSection, setActiveSection] = useState<'menu' | 'profile' | 'password'>('menu');

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // UI States
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Change Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sync state with redux user
  useEffect(() => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhoneNumber(user.phoneNumber || '');
    setGender(user.gender || '');
    setAvatarUrl(user.avatarUrl || '');
    
    if (user.dob) {
      const dateObj = new Date(user.dob);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        setDob(`${yyyy}-${mm}-${dd}`);
      } else {
        setDob(user.dob);
      }
    } else {
      setDob('');
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const u = data.user;
        dispatch(updateUser({
          name: u.name,
          email: u.email,
          role: u.role,
          phoneNumber: u.phoneNumber,
          avatarUrl: u.avatarUrl,
          firstName: u.firstName,
          lastName: u.lastName,
          gender: u.gender,
          dob: u.dob,
          identityStatus: u.identityStatus,
          identityRejectReason: u.identityRejectReason,
        }));
      }
    } catch (err) {
      console.error('Error fetching user profile on mobile:', err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user.token]);

  // eKYC States
  const [ekycModalVisible, setEkycModalVisible] = useState(false);
  const [ekycStep, setEkycStep] = useState<'upload' | 'liveness' | 'scanning' | 'result'>('upload');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [selfie, setSelfie] = useState('');
  const [ekycError, setEkycError] = useState<string | null>(null);
  const [uploadingCard, setUploadingCard] = useState<'front' | 'back' | null>(null);
  const [livenessSubStep, setLivenessSubStep] = useState(1);
  const [livenessLogs, setLivenessLogs] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const handleCardUploadWeb = async (event: any, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCard(side);
    setEkycError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (side === 'front') setCardFront(data.url);
        else setCardBack(data.url);
      } else {
        throw new Error(data.message || 'Lỗi tải ảnh lên.');
      }
    } catch (err: any) {
      setEkycError(err.message || 'Không thể tải ảnh lên.');
    } finally {
      setUploadingCard(null);
    }
  };

  const handleCardSelect = async (side: 'front' | 'back') => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => handleCardUploadWeb(e, side);
      input.click();
    } else {
      setUploadingCard(side);
      setTimeout(() => {
        setUploadingCard(null);
        if (side === 'front') {
          setCardFront('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400');
        } else {
          setCardBack('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400');
        }
      }, 1000);
    }
  };

  const startLivenessScan = () => {
    setEkycStep('liveness');
    setLivenessSubStep(1);
    setLivenessLogs(['Đang kết nối camera...', 'Vui lòng giữ thẳng khuôn mặt và nhìn vào khung hình.']);

    // Step 2.1: Nhìn thẳng (2s)
    setTimeout(() => {
      setLivenessSubStep(2);
      setLivenessLogs(prev => [...prev, 'Đã khớp định vị khuôn mặt.', 'Yêu cầu 2: Vui lòng chớp mắt 2 lần...']);

      // Step 2.2: Chớp mắt (2s)
      setTimeout(() => {
        setLivenessSubStep(3);
        setLivenessLogs(prev => [...prev, 'Đã xác nhận chớp mắt thành công.', 'Yêu cầu 3: Vui lòng mỉm cười nhẹ...']);

        // Step 2.3: Mỉm cười (2s)
        setTimeout(() => {
          setLivenessLogs(prev => [...prev, 'Đã xác thực thực thể sống thành công!', 'Đang tải ảnh chụp selfie lên...']);
          const mockSelfie = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
          setSelfie(mockSelfie);
          
          setTimeout(() => {
            startOcrScan(mockSelfie);
          }, 1000);
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const startOcrScan = (selfieUrl: string) => {
    setEkycStep('scanning');
    setScanProgress(0);
    setScanLogs(['Đang nạp ảnh CCCD mặt trước & mặt sau...', 'Đang kiểm tra độ sáng và góc nghiêng của thẻ...']);

    const logs = [
      'Đang trích xuất OCR văn bản từ thẻ...',
      'Tìm thấy: Số CCCD, Họ tên, Ngày sinh...',
      'Đang nạp ảnh selfie và chạy Face Matching...',
      'Tính toán độ trùng khớp giữa selfie và ảnh thẻ (Khớp: 94.5%)...',
      'Đang gửi thông tin xét duyệt lên máy chủ...',
      'Hoàn tất phân tích eKYC thành công!'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 12.5;
        if (next >= 100) {
          clearInterval(interval);
          submitEkycData(selfieUrl);
          return 100;
        }
        if (next % 25 === 0 && currentLogIndex < logs.length) {
          setScanLogs(prevLogs => [...prevLogs, logs[currentLogIndex]]);
          currentLogIndex++;
        }
        return next;
      });
    }, 400);
  };

  const submitEkycData = async (selfieUrl: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardFrontUrl: cardFront || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
          cardBackUrl: cardBack || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400',
          selfieUrl: selfieUrl
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOcrResult(data.data.ocrResult);
        dispatch(updateUser({
          identityStatus: 'Pending'
        }));
        setEkycStep('result');
      } else {
        throw new Error(data.message || 'Xác thực eKYC thất bại.');
      }
    } catch (err: any) {
      setScanLogs(prev => [...prev, `Lỗi: ${err.message || 'Lỗi kết nối máy chủ'}`]);
    }
  };



  // Profile Save Action
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          gender: gender || undefined,
          dob: dob ? new Date(dob) : undefined,
          avatarUrl,
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Cập nhật thông tin thất bại.');
      }

      dispatch(updateUser({
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phoneNumber: data.user.phoneNumber,
        gender: data.user.gender,
        dob: data.user.dob,
      }));

      Alert.alert('Thành Công', 'Thông tin cá nhân đã được lưu trữ thành công!');
      setActiveSection('menu'); // Return to menu after success
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu thông tin cá nhân.');
    } finally {
      setSaving(false);
    }
  };

  // Change Password Action
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Đổi mật khẩu thất bại.');
      }

      Alert.alert('Thành Công 🎉', 'Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSection('menu'); // Return to menu after success
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đổi mật khẩu.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Upgrade user to Owner
  const handleBecomeOwner = async () => {
    Alert.alert(
      'Xác Nhận Đăng Ký',
      'Bạn có chắc chắn muốn đăng ký làm đối tác chia sẻ xe và nâng cấp vai trò thành Chủ Xe?',
      [
        {
          text: 'Nâng cấp ngay',
          onPress: async () => {
            setUpgrading(true);
            try {
              const response = await fetch(`${API_BASE_URL}/auth/become-owner`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
                }
              });

              const data = await response.json();

              if (!response.ok || !data.success) {
                throw new Error(data.message || 'Nâng cấp đối tác thất bại.');
              }

              dispatch(updateUser({
                role: 'owner',
                token: data.token,
                memberTag: getMemberTag('owner')
              }));

              Alert.alert('Thành Công 🎉', 'Tài khoản của bạn đã được nâng cấp lên ĐỐI TÁC CHỦ XE! Vui lòng tải lại trang hoặc kiểm tra Dashboard.');
            } catch (err: any) {
              Alert.alert('Lỗi nâng cấp', err.message || 'Đã xảy ra lỗi trong quá trình nâng cấp.');
            } finally {
              setUpgrading(false);
            }
          }
        },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  // Logout confirmation
  const handleLogoutPress = () => {
    Alert.alert(
      'Đăng Xuất',
      'Bạn có thực sự muốn đăng xuất khỏi ứng dụng?',
      [
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            setActiveSection('menu'); // reset section on logout
            Alert.alert('Đã Đăng Xuất', 'Hẹn gặp lại bạn lần sau!');
          }
        },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return { bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.dangerBorder };
      case 'staff': return { bg: COLORS.warningBg, text: COLORS.warning, border: COLORS.warningBorder };
      case 'owner': return { bg: 'rgba(34, 211, 238, 0.1)', text: '#22d3ee', border: 'rgba(34, 211, 238, 0.3)' };
      case 'customer': return { bg: COLORS.approvedBg, text: COLORS.approved, border: COLORS.approvedBorder };
      default: return { bg: COLORS.border, text: COLORS.textMuted, border: COLORS.border };
    }
  };

  // Redirect to login if user is guest
  if (user.role === 'guest') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Cá Nhân</Text>
        <AuthScreen />
      </ScrollView>
    );
  }

  const badgeStyles = getRoleBadgeColor(user.role);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title changes dynamically based on active sub-screen */}
      <Text style={styles.pageTitle}>
        {activeSection === 'profile' && 'Chỉnh sửa thông tin'}
        {activeSection === 'password' && 'Đổi mật khẩu'}
        {activeSection === 'menu' && 'Cá Nhân'}
      </Text>

      {activeSection === 'menu' ? (
        /* MENU MAIN SCREEN */
        <>
          {/* User Information Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => setShowPresets(!showPresets)}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Feather name="user" size={40} color={COLORS.accent} />
              )}
              <View style={styles.cameraIconBadge}>
                <Feather name="camera" size={12} color={COLORS.accentDark} />
              </View>
            </TouchableOpacity>

            {showPresets && (
              <View style={styles.presetContainer}>
                <Text style={styles.presetTitle}>Chọn ảnh đại diện mẫu:</Text>
                <View style={styles.presetList}>
                  {PRESET_AVATARS.map((avatar, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.presetItem}
                      onPress={() => {
                        setAvatarUrl(avatar.url);
                        setShowPresets(false);
                      }}
                    >
                      <Image source={{ uri: avatar.url }} style={styles.presetThumb} />
                      <Text style={styles.presetText} numberOfLines={1}>{avatar.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            
            <View style={[styles.tagMember, { backgroundColor: badgeStyles.bg, borderColor: badgeStyles.border }]}>
              <Text style={[styles.tagMemberText, { color: badgeStyles.text }]}>
                {user.memberTag}
              </Text>
            </View>
          </View>

          {/* eKYC Status Card */}
          <View style={styles.ekycStatusCard}>
            <View style={styles.ekycHeader}>
              <Feather 
                name={
                  user.identityStatus === 'Verified' ? "shield" :
                  user.identityStatus === 'Pending' ? "clock" :
                  user.identityStatus === 'Rejected' ? "alert-triangle" : "shield"
                } 
                size={16} 
                color={
                  user.identityStatus === 'Verified' ? COLORS.approved :
                  user.identityStatus === 'Pending' ? COLORS.pending :
                  user.identityStatus === 'Rejected' ? COLORS.danger : COLORS.warning
                } 
              />
              <Text style={[styles.ekycTitle, {
                color: user.identityStatus === 'Verified' ? COLORS.approved :
                       user.identityStatus === 'Pending' ? COLORS.pending :
                       user.identityStatus === 'Rejected' ? COLORS.danger : COLORS.warning
              }]}>
                XÁC MINH DANH TÍNH (eKYC)
              </Text>
            </View>
            <Text style={styles.ekycDesc}>
              {user.identityStatus === 'Verified' && 'Tài khoản của bạn đã được xác minh danh tính thành công. Bạn có quyền đặt xe không giới hạn.'}
              {user.identityStatus === 'Pending' && 'Hồ sơ eKYC của bạn đã được gửi lên hệ thống và đang chờ nhân viên kiểm duyệt.'}
              {user.identityStatus === 'Rejected' && `Rất tiếc! Hồ sơ eKYC bị từ chối. Lý do: "${user.identityRejectReason || 'Ảnh mờ hoặc không hợp lệ'}".`}
              {(!user.identityStatus || user.identityStatus === 'Unverified') && 'Bạn chưa thực hiện xác minh danh tính. Vui lòng xác thực danh tính để kích hoạt tính năng đặt xe máy.'}
            </Text>
            
            {(user.identityStatus === 'Verified' && user.firstName && user.lastName) && (
              <View style={styles.ekycInfoBox}>
                <Text style={styles.ekycInfoText}>Họ tên: {user.lastName} {user.firstName}</Text>
                <Text style={styles.ekycInfoText}>Trạng thái: Đã liên kết CCCD</Text>
              </View>
            )}

            {(!user.identityStatus || user.identityStatus === 'Unverified' || user.identityStatus === 'Rejected') && (
              <TouchableOpacity 
                style={styles.ekycBtn}
                onPress={() => {
                  setCardFront('');
                  setCardBack('');
                  setSelfie('');
                  setEkycError(null);
                  setEkycStep('upload');
                  setEkycModalVisible(true);
                }}
              >
                <Text style={styles.ekycBtnText}>
                  {user.identityStatus === 'Rejected' ? 'XÁC THỰC LẠI' : 'XÁC THỰC NGAY'}
                </Text>
              </TouchableOpacity>
            )}

            {user.identityStatus === 'Pending' && (
              <View style={[styles.ekycPendingBadge, { backgroundColor: COLORS.pendingBg, borderColor: COLORS.pendingBorder }]}>
                <ActivityIndicator size="small" color={COLORS.pending} style={{ marginRight: 6 }} />
                <Text style={{ color: COLORS.pending, fontSize: 12, fontWeight: '700' }}>ĐANG CHỜ PHÊ DUYỆT</Text>
              </View>
            )}
          </View>

          {/* Become Owner Banner (Customer only) */}
          {user.role === 'customer' && (
            <View style={styles.ownerUpgradeCard}>
              <View style={styles.upgradeHeader}>
                <Feather name="trending-up" size={18} color={COLORS.accent} />
                <Text style={styles.upgradeTitle}>ĐĂNG KÝ HỢP TÁC CHỦ XE</Text>
              </View>
              <Text style={styles.upgradeDesc}>
                Chia sẻ xe máy nhàn rỗi của bạn để bắt đầu tạo ra doanh thu thụ động hấp dẫn cùng Motov ngay hôm nay!
              </Text>
              <TouchableOpacity 
                style={[styles.upgradeBtn, upgrading && styles.disabledBtn]}
                onPress={handleBecomeOwner}
                disabled={upgrading}
              >
                {upgrading ? (
                  <ActivityIndicator size="small" color={COLORS.accentDark} />
                ) : (
                  <Text style={styles.upgradeBtnText}>NÂNG CẤP TÀI KHOẢN NGAY</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 5-Item Settings Menu (Like user requested) */}
          <View style={styles.profileMenu}>
            {/* 1. Profile Editing */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveSection('profile')}>
              <View style={styles.menuItemLeft}>
                <Feather name="user" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>

            {/* 2. Change Password */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveSection('password')}>
              <View style={styles.menuItemLeft}>
                <Feather name="lock" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>

            {/* 3. Booking Guide */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Hướng Dẫn', 'Hướng dẫn đặt xe chi tiết trên hệ thống Motov sẽ được cập nhật trong phiên bản tiếp theo.')}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="book-open" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Hướng dẫn đặt xe</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>

            {/* 4. Insurance Policy */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Bảo Hiểm', 'Chính sách bảo hiểm xe máy Motov giúp bảo vệ chuyến đi của bạn an toàn tối đa.')}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="shield" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Chính sách bảo hiểm</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>

            {/* 5. Customer Support */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Hỗ Trợ', 'Hotline hỗ trợ khách hàng: 1900 6868 (Hoạt động 24/7).')}
            >
              <View style={styles.menuItemLeft}>
                <Feather name="phone" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Liên hệ hỗ trợ khách hàng</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
            <Feather name="log-out" size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>ĐĂNG XUẤT</Text>
          </TouchableOpacity>
        </>
      ) : activeSection === 'profile' ? (
        /* SUB-SCREEN: EDIT PROFILE FORM */
        <View>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backToMenuBtn} 
            onPress={() => setActiveSection('menu')}
          >
            <Feather name="arrow-left" size={16} color={COLORS.accent} />
            <Text style={styles.backToMenuBtnText}>QUAY LẠI MENU CHÍNH</Text>
          </TouchableOpacity>

          <View style={styles.formSection}>
            <View style={styles.formHeader}>
              <Feather name="user" size={14} color={COLORS.accent} />
              <Text style={styles.formTitle}>THÔNG TIN CÁ NHÂN</Text>
            </View>

            <View style={styles.fieldsContainer}>
              <View style={styles.rowFields}>
                {/* Họ */}
                <View style={[styles.fieldWrapper, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Họ & Tên đệm</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Nguyễn"
                    placeholderTextColor="#444"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>

                {/* Tên */}
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Tên</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Văn Khách"
                    placeholderTextColor="#444"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>

              {/* SĐT */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="090XXXXXXXX"
                  placeholderTextColor="#444"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              {/* Giới tính */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Giới tính</Text>
                <View style={styles.genderRow}>
                  {[
                    { id: 'Male', label: 'Nam' },
                    { id: 'Female', label: 'Nữ' },
                    { id: 'Other', label: 'Khác' }
                  ].map(item => {
                    const isActive = gender === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.genderBtn, isActive && styles.genderBtnActive]}
                        onPress={() => setGender(item.id)}
                      >
                        <Text style={[styles.genderBtnText, isActive && styles.genderBtnTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Ngày sinh */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Ngày sinh (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="1995-05-25"
                  placeholderTextColor="#444"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>

              {/* Avatar URL */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Đường dẫn ảnh đại diện (Avatar URL)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor="#444"
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  autoCapitalize="none"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabledBtn]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.accentDark} />
                ) : (
                  <>
                    <Feather name="save" size={14} color={COLORS.accentDark} style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* SUB-SCREEN: CHANGE PASSWORD FORM */
        <View>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backToMenuBtn} 
            onPress={() => setActiveSection('menu')}
          >
            <Feather name="arrow-left" size={16} color={COLORS.accent} />
            <Text style={styles.backToMenuBtnText}>QUAY LẠI MENU CHÍNH</Text>
          </TouchableOpacity>

          <View style={styles.formSection}>
            <View style={styles.formHeader}>
              <Feather name="lock" size={14} color={COLORS.accent} />
              <Text style={styles.formTitle}>ĐỔI MẬT KHẨU</Text>
            </View>

            <View style={styles.fieldsContainer}>
              {/* Old Password */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Mật khẩu hiện tại</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="••••••••"
                  placeholderTextColor="#444"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* New Password */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Mật khẩu mới</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="••••••••"
                  placeholderTextColor="#444"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Xác nhận mật khẩu mới</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="••••••••"
                  placeholderTextColor="#444"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Change Password Button */}
              <TouchableOpacity
                style={[styles.saveBtn, passwordSaving && styles.disabledBtn]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? (
                  <ActivityIndicator size="small" color={COLORS.accentDark} />
                ) : (
                  <>
                    <Feather name="key" size={14} color={COLORS.accentDark} style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>ĐỔI MẬT KHẨU</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal eKYC */}
      <Modal
        visible={ekycModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (ekycStep !== 'scanning') {
            setEkycModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.ekycModalContainer}>
            {/* Header */}
            <View style={styles.ekycModalHeader}>
              <Text style={styles.ekycModalTitle}>Xác thực danh tính eKYC</Text>
              {ekycStep !== 'scanning' && (
                <TouchableOpacity onPress={() => setEkycModalVisible(false)}>
                  <Feather name="x" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Trạng thái Tiến trình các bước */}
            <View style={styles.stepIndicatorRow}>
              {[
                { label: 'Tải ảnh', step: 'upload' },
                { label: 'Liveness', step: 'liveness' },
                { label: 'Phân tích', step: 'scanning' },
                { label: 'Kết quả', step: 'result' }
              ].map((item, idx) => {
                const stepsOrder = ['upload', 'liveness', 'scanning', 'result'];
                const currentIdx = stepsOrder.indexOf(ekycStep);
                const isActive = item.step === ekycStep;
                const isCompleted = stepsOrder.indexOf(item.step) < currentIdx;
                
                return (
                  <React.Fragment key={item.step}>
                    <View style={styles.stepItemWrapper}>
                      <View style={[
                        styles.stepCircle, 
                        isActive && styles.stepCircleActive,
                        isCompleted && styles.stepCircleCompleted
                      ]}>
                        {isCompleted ? (
                          <Feather name="check" size={10} color={COLORS.accentDark} />
                        ) : (
                          <Text style={[
                            styles.stepCircleText, 
                            isActive && styles.stepCircleTextActive
                          ]}>{idx + 1}</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.stepLabelText,
                        isActive && styles.stepLabelTextActive,
                        isCompleted && styles.stepLabelTextCompleted
                      ]}>{item.label}</Text>
                    </View>
                    {idx < 3 && (
                      <View style={[
                        styles.stepConnector,
                        stepsOrder.indexOf(stepsOrder[idx + 1]) <= currentIdx && styles.stepConnectorActive
                      ]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            {/* Nội dung các bước */}
            <ScrollView contentContainerStyle={styles.ekycModalContent} showsVerticalScrollIndicator={false}>
              
              {/* BƯỚC 1: TẢI ẢNH CCCD */}
              {ekycStep === 'upload' && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepInstruction}>
                    Vui lòng cung cấp hình ảnh Căn cước công dân rõ ràng, không bị lóa sáng hay mất góc.
                  </Text>

                  <View style={styles.cardUploadGrid}>
                    {/* Mặt trước */}
                    <TouchableOpacity 
                      style={[styles.cardUploadBox, cardFront ? styles.cardUploadBoxSelected : null]} 
                      onPress={() => handleCardSelect('front')}
                      disabled={uploadingCard !== null}
                    >
                      {uploadingCard === 'front' ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                      ) : cardFront ? (
                        <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                          <Image source={{ uri: cardFront }} style={styles.cardImagePreview} />
                          <View style={styles.imageOverlayBadge}>
                            <Feather name="check" size={14} color="#000" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadPlaceholder}>
                          <Feather name="image" size={24} color={COLORS.textMuted} />
                          <Text style={styles.uploadPlaceholderTitle}>Mặt trước CCCD</Text>
                          <Text style={styles.uploadPlaceholderDesc}>Bấm để chụp/chọn ảnh</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Mặt sau */}
                    <TouchableOpacity 
                      style={[styles.cardUploadBox, cardBack ? styles.cardUploadBoxSelected : null]} 
                      onPress={() => handleCardSelect('back')}
                      disabled={uploadingCard !== null}
                    >
                      {uploadingCard === 'back' ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                      ) : cardBack ? (
                        <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                          <Image source={{ uri: cardBack }} style={styles.cardImagePreview} />
                          <View style={styles.imageOverlayBadge}>
                            <Feather name="check" size={14} color="#000" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadPlaceholder}>
                          <Feather name="image" size={24} color={COLORS.textMuted} />
                          <Text style={styles.uploadPlaceholderTitle}>Mặt sau CCCD</Text>
                          <Text style={styles.uploadPlaceholderDesc}>Bấm để chụp/chọn ảnh</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {ekycError && (
                    <Text style={styles.errorText}>{ekycError}</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.actionBtn, 
                      (!cardFront || !cardBack || uploadingCard !== null) && styles.disabledBtn
                    ]}
                    disabled={!cardFront || !cardBack || uploadingCard !== null}
                    onPress={startLivenessScan}
                  >
                    <Text style={styles.actionBtnText}>TIẾP TỤC XÁC THỰC LIVENESS</Text>
                    <Feather name="arrow-right" size={14} color={COLORS.accentDark} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              )}

              {/* BƯỚC 2: XÁC THỰC LIVENESS (GIẢ LẬP) */}
              {ekycStep === 'liveness' && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepInstruction}>
                    Giữ điện thoại thẳng trước mặt và thực hiện theo hướng dẫn hiển thị trên màn hình.
                  </Text>

                  {/* Vòng tròn camera giả lập */}
                  <View style={styles.cameraFrameWrapper}>
                    <View style={[
                      styles.cameraFrameCircle,
                      livenessSubStep === 1 && { borderColor: COLORS.warning },
                      livenessSubStep === 2 && { borderColor: COLORS.pending },
                      livenessSubStep === 3 && { borderColor: COLORS.approved }
                    ]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' }} 
                        style={styles.mockCameraFeed} 
                      />
                      {/* Laser scan line */}
                      <View style={styles.laserScanLine} />
                      
                      {/* Pulsing ring */}
                      <View style={styles.pulsingRing} />
                    </View>
                    
                    {/* Hướng dẫn to rõ */}
                    <View style={styles.livenessInstructionBox}>
                      <Text style={styles.livenessInstructionText}>
                        {livenessSubStep === 1 && 'ℹ️ VUI LÒNG NHÌN THẲNG VÀO CAMERA'}
                        {livenessSubStep === 2 && '👁️ CHỚP MẮT 2 LẦN LIÊN TỤC'}
                        {livenessSubStep === 3 && '😊 HÃY MỈM CƯỜI NHẸ'}
                      </Text>
                    </View>
                  </View>

                  {/* Logs phân tích trực quan */}
                  <View style={styles.logsCard}>
                    <Text style={styles.logsHeader}>TIẾN TRÌNH QUÉT THỰC THỂ SỐNG:</Text>
                    {livenessLogs.map((log, index) => (
                      <Text key={index} style={styles.logLineText}>▶ {log}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* BƯỚC 3: PHÂN TÍCH OCR & ĐỐI KHỚP */}
              {ekycStep === 'scanning' && (
                <View style={styles.stepContainer}>
                  <ActivityIndicator size="large" color={COLORS.accent} style={{ marginBottom: 20 }} />
                  <Text style={styles.stepInstruction}>
                    Đang xử lý thông tin giấy tờ và chạy thuật toán so sánh khuôn mặt...
                  </Text>

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(scanProgress)}%</Text>
                  </View>

                  {/* Logs quét */}
                  <View style={styles.logsCard}>
                    <Text style={styles.logsHeader}>LOGS HỆ THỐNG AI OCR:</Text>
                    {scanLogs.map((log, index) => (
                      <Text key={index} style={styles.logLineText}>⚙ {log}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* BƯỚC 4: KẾT QUẢ eKYC */}
              {ekycStep === 'result' && (
                <View style={styles.stepContainer}>
                  <View style={styles.successIconWrapper}>
                    <Feather name="check-circle" size={48} color={COLORS.approved} />
                  </View>
                  
                  <Text style={styles.resultSuccessTitle}>Gửi Hồ Sơ Thành Công!</Text>
                  <Text style={styles.resultSuccessDesc}>
                    Thông tin eKYC của bạn đã được trích xuất và lưu trữ trên hệ thống để duyệt tự động.
                  </Text>

                  {ocrResult && (
                    <View style={styles.ocrResultContainer}>
                      <Text style={styles.ocrResultHeader}>THÔNG TIN TRÍCH XUẤT OCR:</Text>
                      <View style={styles.ocrInfoRow}>
                        <Text style={styles.ocrInfoLabel}>Họ và tên:</Text>
                        <Text style={styles.ocrInfoVal}>{ocrResult.fullName}</Text>
                      </View>
                      <View style={styles.ocrInfoRow}>
                        <Text style={styles.ocrInfoLabel}>Số định danh:</Text>
                        <Text style={styles.ocrInfoVal}>{ocrResult.idNumber}</Text>
                      </View>
                      <View style={styles.ocrInfoRow}>
                        <Text style={styles.ocrInfoLabel}>Ngày sinh:</Text>
                        <Text style={styles.ocrInfoVal}>
                          {ocrResult.dob ? new Date(ocrResult.dob).toLocaleDateString('vi-VN') : ''}
                        </Text>
                      </View>
                      <View style={styles.ocrInfoRow}>
                        <Text style={styles.ocrInfoLabel}>Thường trú:</Text>
                        <Text style={styles.ocrInfoVal} numberOfLines={1}>{ocrResult.address}</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setEkycModalVisible(false);
                      fetchUserProfile();
                    }}
                  >
                    <Text style={styles.actionBtnText}>HOÀN TẤT & ĐÓNG</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Motov App v1.2.0 (Sync Active DB • Expo • Redux)</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 10,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(190, 242, 100, 0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetContainer: {
    width: '100%',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  presetTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
  },
  presetText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  profileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  tagMember: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagMemberText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ownerUpgradeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  upgradeTitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  upgradeDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  upgradeBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: COLORS.accentDark,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  formSection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10,
  },
  formTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fieldsContainer: {
    gap: 14,
  },
  rowFields: {
    flexDirection: 'row',
  },
  fieldWrapper: {
    gap: 5,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  fieldInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(190, 242, 100, 0.05)',
  },
  genderBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  genderBtnTextActive: {
    color: COLORS.accent,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  saveBtnText: {
    color: COLORS.accentDark,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  profileMenu: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 30,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  portalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  portalTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  portalDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 16,
  },
  portalGrid: {
    gap: 10,
  },
  portalItem: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portalIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  portalLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    color: '#3f3f46',
    fontSize: 11,
  },
  /* Sub-screen Navigation Style */
  backToMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backToMenuBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  /* eKYC Status Card styles */
  ekycStatusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  ekycHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  ekycTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ekycDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  ekycInfoBox: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  ekycInfoText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  ekycBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekycBtnText: {
    color: COLORS.accentDark,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  ekycPendingBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  /* Modal eKYC styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ekycModalContainer: {
    backgroundColor: COLORS.card,
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingTop: 20,
  },
  ekycModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  ekycModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ekycModalContent: {
    padding: 20,
    paddingBottom: 30,
  },

  /* Step Indicator styles */
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  stepItemWrapper: {
    alignItems: 'center',
    width: 50,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#09090b',
    borderWidth: 1.5,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(190, 242, 100, 0.05)',
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  stepCircleText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepCircleTextActive: {
    color: COLORS.accent,
  },
  stepLabelText: {
    color: '#71717a',
    fontSize: 8,
    marginTop: 4,
    fontWeight: 'bold',
  },
  stepLabelTextActive: {
    color: COLORS.accent,
  },
  stepLabelTextCompleted: {
    color: COLORS.textSecondary,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#3f3f46',
    marginHorizontal: -5,
    marginTop: -12,
  },
  stepConnectorActive: {
    backgroundColor: COLORS.accent,
  },

  /* Step General styles */
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepInstruction: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },

  /* Upload CCCD styles */
  cardUploadGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  cardUploadBox: {
    flex: 1,
    aspectRatio: 1.58,
    backgroundColor: '#09090b',
    borderWidth: 1.5,
    borderColor: '#222',
    borderStyle: 'dashed',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardUploadBoxSelected: {
    borderStyle: 'solid',
    borderColor: COLORS.accent,
  },
  cardImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 10,
  },
  uploadPlaceholderTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  uploadPlaceholderDesc: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  /* Camera and Liveness styles */
  cameraFrameWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  cameraFrameCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  mockCameraFeed: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  laserScanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent,
    top: '50%',
  },
  pulsingRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(190, 242, 100, 0.2)',
  },
  livenessInstructionBox: {
    backgroundColor: 'rgba(9, 9, 11, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginTop: 16,
  },
  livenessInstructionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Logs card styles */
  logsCard: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    width: '100%',
    padding: 12,
    gap: 4,
  },
  logsHeader: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  logLineText: {
    color: COLORS.approved,
    fontSize: 10,
  },

  /* Progress bar styles */
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#09090b',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },

  /* Result styles */
  successIconWrapper: {
    marginBottom: 16,
  },
  resultSuccessTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultSuccessDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  ocrResultContainer: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    width: '100%',
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  ocrResultHeader: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 6,
    marginBottom: 4,
  },
  ocrInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrInfoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  ocrInfoVal: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },

  /* Action buttons */
  actionBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  actionBtnText: {
    color: COLORS.accentDark,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: 8,
    fontWeight: 'bold',
  },
});
