import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { updateUser } from '../userSlice';

type UserRole = 'guest' | 'customer' | 'owner' | 'staff' | 'admin';

export const ProfileScreen: React.FC = () => {
  const user = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();

  const handleSwitchRole = (role: UserRole) => {
    let name = 'Khách vãng lai';
    let email = 'khach@motov.com';
    let memberTag = 'Thành viên mới';

    switch (role) {
      case 'customer':
        name = 'Nguyễn Văn Khách';
        email = 'khachhang@motov.com';
        memberTag = 'Thành viên Vàng';
        break;
      case 'owner':
        name = 'Nguyễn Chủ Xe';
        email = 'owner@motov.com';
        memberTag = 'Đối tác Chủ xe';
        break;
      case 'staff':
        name = 'Nhân Viên Phòng Vé';
        email = 'nhanvien@motov.com';
        memberTag = 'Nhân viên Hỗ trợ';
        break;
      case 'admin':
        name = 'Quản Trị Viên';
        email = 'admin@motov.com';
        memberTag = 'Quản trị hệ thống';
        break;
      default:
        break;
    }

    dispatch(updateUser({ name, email, memberTag, role }));
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return { bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.dangerBorder };
      case 'staff': return { bg: COLORS.warningBg, text: COLORS.warning, border: COLORS.warningBorder };
      case 'owner': return { bg: 'rgba(34, 211, 238, 0.1)', text: '#22d3ee', border: 'rgba(34, 211, 238, 0.3)' }; // Cyan
      case 'customer': return { bg: COLORS.approvedBg, text: COLORS.approved, border: COLORS.approvedBorder };
      default: return { bg: COLORS.border, text: COLORS.textMuted, border: COLORS.border };
    }
  };

  const badgeStyles = getRoleBadgeColor(user.role);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Cá Nhân</Text>
      
      {/* User Information Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Feather name="user" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        
        <View style={[styles.tagMember, { backgroundColor: badgeStyles.bg, borderColor: badgeStyles.border }]}>
          <Text style={[styles.tagMemberText, { color: badgeStyles.text }]}>
            {user.memberTag}
          </Text>
        </View>
      </View>

      {/* Role Switcher Portal Selector (Aligned with Web Auth portal selector) */}
      <View style={styles.portalCard}>
        <Text style={styles.portalTitle}>CỔNG ĐĂNG NHẬP (PORTALS)</Text>
        <Text style={styles.portalDesc}>Chọn vai trò để thay đổi giao diện trải nghiệm di động tương ứng</Text>

        <View style={styles.portalGrid}>
          {[
            { id: 'guest', label: 'Khách vãng lai', icon: 'eye', color: COLORS.textMuted },
            { id: 'customer', label: 'Khách thuê xe', icon: 'award', color: COLORS.approved },
            { id: 'owner', label: 'Đối tác Chủ xe', icon: 'user-check', color: '#22d3ee' },
            { id: 'staff', label: 'Nhân viên hệ thống', icon: 'briefcase', color: COLORS.warning },
            { id: 'admin', label: 'Quản trị viên', icon: 'shield', color: COLORS.danger },
          ].map(portal => {
            const isActive = user.role === portal.id;
            return (
              <TouchableOpacity
                key={portal.id}
                style={[
                  styles.portalItem,
                  isActive && { borderColor: portal.color, backgroundColor: 'rgba(255, 255, 255, 0.03)' }
                ]}
                onPress={() => handleSwitchRole(portal.id as UserRole)}
              >
                <View style={styles.portalItemLeft}>
                  <View style={[styles.portalIconWrapper, { backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : COLORS.bg }]}>
                    <Feather name={portal.icon as any} size={16} color={isActive ? portal.color : COLORS.textMuted} />
                  </View>
                  <Text style={[styles.portalLabel, isActive && { color: COLORS.text, fontWeight: 'bold' }]}>
                    {portal.label}
                  </Text>
                </View>
                {isActive && <Feather name="check-circle" size={14} color={portal.color} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Auxiliary settings menu */}
      <View style={styles.profileMenu}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="book-open" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>Hướng dẫn đặt xe</Text>
          </View>
          <Feather name="chevron-right" size={14} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="shield" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>Chính sách bảo hiểm</Text>
          </View>
          <Feather name="chevron-right" size={14} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="phone" size={16} color={COLORS.accent} style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>Liên hệ hỗ trợ khách hàng</Text>
          </View>
          <Feather name="chevron-right" size={14} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Motov App v1.1.0 (Expo • Multi-role)</Text>
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
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginBottom: 10,
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  portalDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
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
  profileMenu: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
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
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  versionText: {
    color: '#3f3f46',
    fontSize: 11,
  },
});
