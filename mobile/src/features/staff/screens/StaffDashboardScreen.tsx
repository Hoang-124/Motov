import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { fetchBookings } from '../../bookings/bookingsSlice';

const { width } = Dimensions.get('window');

interface StaffDashboardScreenProps {
  setActiveTab: (tab: string) => void;
}

export const StaffDashboardScreen: React.FC<StaffDashboardScreenProps> = ({ setActiveTab }) => {
  const dispatch = useAppDispatch();
  const bikes = useAppSelector(state => state.bikes.bikes);
  const bookings = useAppSelector(state => state.bookings.bookings);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  // Stats
  const totalBikes = bikes.length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'Chờ duyệt' || b.status === 'Pending').length;
  const ongoingBookings = bookings.filter(b => b.status === 'Đang thuê' || b.status === 'Ongoing' || b.status === 'Confirmed' || b.status === 'Rented').length;
  const completedBookings = bookings.filter(b => b.status === 'Đã trả' || b.status === 'Completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'Đã hủy' || b.status === 'Cancelled').length;

  const statusCounts: Record<string, number> = {
    'Chờ duyệt': pendingBookings,
    'Đang thuê': ongoingBookings,
    'Đã trả': completedBookings,
    'Đã hủy': cancelledBookings,
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Bảng Điều Khiển Staff</Text>
        <Text style={styles.pageSubtitle}>Tổng hợp tình hình đơn hàng và phương tiện</Text>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => setActiveTab('staff_bookings')}
        >
          <Feather name="calendar" size={18} color={COLORS.accent} />
          <Text style={styles.quickActionText}>Xử lý Đơn</Text>
          {pendingBookings > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingBookings}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => setActiveTab('staff_bikes')}
        >
          <MaterialCommunityIcons name="motorbike" size={20} color={COLORS.accent} />
          <Text style={styles.quickActionText}>Kiểm Tra Xe</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>TỔNG ĐƠN</Text>
            <Feather name="file-text" size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.statValue}>{totalBookings}</Text>
          <Text style={styles.statSubText}>Đơn hàng trên hệ thống</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>CHỜ DUYỆT</Text>
            <Feather name="clock" size={16} color={COLORS.warning} />
          </View>
          <Text style={[styles.statValue, pendingBookings > 0 && { color: COLORS.warning }]}>{pendingBookings}</Text>
          <Text style={styles.statSubText}>Cần xử lý ngay</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>ĐANG THUÊ</Text>
            <MaterialCommunityIcons name="motorbike" size={18} color="#22d3ee" />
          </View>
          <Text style={styles.statValue}>{ongoingBookings} / {totalBikes}</Text>
          <Text style={styles.statSubText}>Phương tiện đang lăn bánh</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>HOÀN THÀNH</Text>
            <Feather name="check-circle" size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.statValue}>{completedBookings}</Text>
          <Text style={styles.statSubText}>Đơn đã trả xe</Text>
        </View>
      </View>

      {/* Status distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phân Bổ Trạng Thái</Text>
        <View style={styles.chartContainer}>
          {Object.entries(statusCounts).map(([status, count]) => {
            const pct = totalBookings > 0 ? count / totalBookings : 0;
            const colorMap: Record<string, string> = {
              'Chờ duyệt': COLORS.warning,
              'Đang thuê': COLORS.approved,
              'Đã trả': '#3b82f6',
              'Đã hủy': COLORS.danger,
            };
            return (
              <View key={status} style={styles.chartRow}>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabelText}>{status}</Text>
                  <Text style={styles.chartValueText}>{count} đơn ({Math.round(pct * 100)}%)</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill,
                    { width: `${Math.max(5, pct * 100)}%`, backgroundColor: colorMap[status] || COLORS.accent },
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
