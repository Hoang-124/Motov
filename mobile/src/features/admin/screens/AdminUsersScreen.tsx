import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { updateUser } from '../../profile/userSlice';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | 'owner';
  createdAt: string;
}

const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'usr-1001',
    name: 'Quản Trị Viên',
    email: 'admin@motov.com',
    role: 'admin',
    createdAt: '25/05/2026'
  },
  {
    id: 'usr-1002',
    name: 'Nhân Viên Phòng Vé',
    email: 'nhanvien@motov.com',
    role: 'staff',
    createdAt: '26/05/2026'
  },
  {
    id: 'usr-1003',
    name: 'Nguyễn Văn Khách',
    email: 'khachhang@motov.com',
    role: 'customer',
    createdAt: '27/05/2026'
  },
  {
    id: 'usr-1004',
    name: 'Nguyễn Chủ Xe',
    email: 'owner@motov.com',
    role: 'owner',
    createdAt: '28/05/2026'
  }
];

export const AdminUsersScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.user);
  const [users, setUsers] = useState<SystemUser[]>(DEFAULT_USERS);

  const handleChangeRole = (userId: string, newRole: 'customer' | 'staff' | 'admin' | 'owner') => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    setUsers(updated);

    const userToChange = users.find(u => u.id === userId);
    // If the changed user matches the currently logged in demo user, dispatch to redux
    if (userToChange && currentUser.email === userToChange.email) {
      dispatch(updateUser({
        role: newRole,
      }));
    }
    Alert.alert('Thành Công', `Đã cập quyền thành công thành viên: ${userToChange?.name}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Phân Quyền Thành Viên</Text>
        <Text style={styles.pageSubtitle}>Thiết lập quyền hạn bảo mật và quản lý phân hệ người dùng</Text>
      </View>

      <View style={styles.listContainer}>
        {users.map(user => (
          <View key={user.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={[
                styles.roleBadge,
                user.role === 'admin' && styles.badgeAdmin,
                user.role === 'staff' && styles.badgeStaff,
                user.role === 'owner' && styles.badgeOwner,
                user.role === 'customer' && styles.badgeCustomer,
              ]}>
                <Text style={[
                  styles.roleBadgeText,
                  user.role === 'admin' && { color: COLORS.accent },
                  user.role === 'staff' && { color: COLORS.warning },
                  user.role === 'owner' && { color: '#22d3ee' },
                  user.role === 'customer' && { color: COLORS.approved },
                ]}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Nhân viên' : user.role === 'owner' ? 'Chủ xe' : 'Khách thuê'}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.infoText}>Mã số tài khoản: <Text style={styles.whiteText}>{user.id}</Text></Text>
              <Text style={styles.infoText}>Ngày tham gia: <Text style={styles.whiteText}>{user.createdAt}</Text></Text>
            </View>

            <View style={styles.actionsRow}>
              <Text style={styles.actionsLabel}>Cấp quyền nhanh:</Text>
              <View style={styles.buttonsGroup}>
                <TouchableOpacity
                  style={[styles.roleButton, user.role === 'customer' && { backgroundColor: COLORS.approved }]}
                  onPress={() => handleChangeRole(user.id, 'customer')}
                >
                  <Text style={[styles.roleButtonText, user.role === 'customer' && styles.roleButtonTextActive]}>Khách</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, user.role === 'owner' && { backgroundColor: '#0e7490' }]}
                  onPress={() => handleChangeRole(user.id, 'owner')}
                >
                  <Text style={[styles.roleButtonText, user.role === 'owner' && styles.roleButtonTextActive]}>Chủ xe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, user.role === 'staff' && { backgroundColor: '#b45309' }]}
                  onPress={() => handleChangeRole(user.id, 'staff')}
                >
                  <Text style={[styles.roleButtonText, user.role === 'staff' && styles.roleButtonTextActive]}>N.Viên</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, user.role === 'admin' && { backgroundColor: COLORS.accent }]}
                  onPress={() => handleChangeRole(user.id, 'admin')}
                >
                  <Text style={[styles.roleButtonText, user.role === 'admin' && { color: COLORS.accentDark }]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  userName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  userEmail: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeAdmin: {
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
    borderColor: 'rgba(190, 242, 100, 0.3)',
  },
  badgeStaff: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  badgeOwner: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  badgeCustomer: {
    backgroundColor: COLORS.approvedBg,
    borderColor: COLORS.approvedBorder,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 6,
    marginBottom: 14,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  whiteText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  actionsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 10,
  },
  actionsLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  buttonsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  roleButtonText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
});
