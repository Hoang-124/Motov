import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';

export const ProfileScreen: React.FC = () => {
  const user = useAppSelector(state => state.user);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.pageTitle}>Cá Nhân</Text>
      
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Feather name="user" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.tagMember}>
          <Feather name="award" size={12} color="#eab308" style={{ marginRight: 4 }} />
          <Text style={styles.tagMemberText}>{user.memberTag}</Text>
        </View>
      </View>

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
        <Text style={styles.versionText}>Motov App v1.0.0 (Expo)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: 20,
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
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  tagMember: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagMemberText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: 'bold',
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
    marginTop: 40,
  },
  versionText: {
    color: '#3f3f46',
    fontSize: 11,
  },
});
