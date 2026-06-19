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
              const response = await fetch(`${API_BASE_URL}/auth/becomeOwner`, {
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
});
