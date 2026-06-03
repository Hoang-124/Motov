import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';

const { width } = Dimensions.get('window');

export const AdminDashboardScreen: React.FC = () => {
  const bikes = useAppSelector(state => state.bikes.bikes);
  const bookings = useAppSelector(state => state.bookings.bookings);

  // Stats calculation
  const totalBikes = bikes.length;
  const totalBookings = bookings.length;
  const activeRentals = bookings.filter(b => b.status === 'Đang thuê').length;
  
  // Global revenue: completed/ongoing bookings * 3 days mock duration
  const totalRevenue = bookings
    .filter(b => b.status === 'Đang thuê' || b.status === 'Đã trả')
    .reduce((sum, b) => {
      const priceVal = parseInt(b.price.replace(/\./g, ''), 10) || 0;
      return sum + (priceVal * 3);
    }, 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Bảng Điều Khiển Admin</Text>
        <Text style={styles.pageSubtitle}>Hệ thống giám sát doanh số và quản trị chuỗi Motov</Text>
      </View>

      {/* Grid Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>TỔNG DOANH THU</Text>
            <Feather name="trending-up" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.statSubText}>Dự kiến từ các đơn được duyệt</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>TỔNG ĐƠN HÀNG</Text>
            <Feather name="file-text" size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.statValue}>{totalBookings} đơn</Text>
          <Text style={styles.statSubText}>Toàn bộ đơn lưu trên hệ thống</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>XE ĐANG THUÊ</Text>
            <MaterialCommunityIcons name="motorbike" size={18} color="#22d3ee" />
          </View>
          <Text style={styles.statValue}>{activeRentals} / {totalBikes}</Text>
          <Text style={styles.statSubText}>Phương tiện đang lăn bánh</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>NGƯỜI DÙNG</Text>
            <Feather name="users" size={16} color={COLORS.warning} />
          </View>
          <Text style={styles.statValue}>4 tài khoản</Text>
          <Text style={styles.statSubText}>Phân quyền thành viên hệ thống</Text>
        </View>
      </View>

      {/* Status distribution chart/list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trạng Thái Thuê Xe Máy</Text>
        <View style={styles.chartContainer}>
          {['Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map(status => {
            const count = statusCounts[status] || 0;
            const pct = totalBookings > 0 ? (count / totalBookings) : 0;
            return (
              <View key={status} style={styles.chartRow}>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabelText}>{status}</Text>
                  <Text style={styles.chartValueText}>{count} đơn ({Math.round(pct * 100)}%)</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill,
                    { width: `${Math.max(5, pct * 100)}%` },
                    status === 'Chờ duyệt' && { backgroundColor: COLORS.warning },
                    status === 'Đang thuê' && { backgroundColor: COLORS.approved },
                    status === 'Đã trả' && { backgroundColor: '#3b82f6' },
                    status === 'Đã hủy' && { backgroundColor: COLORS.danger },
                  ]} />
                </View>
              </View>
            );
          })}
        </View>
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
    marginBottom: 24,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    width: (width - 52) / 2,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  statSubText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 16,
  },
  chartRow: {
    gap: 6,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartLabelText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  chartValueText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
