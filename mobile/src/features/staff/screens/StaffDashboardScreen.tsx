import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { fetchBookings } from '../../bookings/bookingsSlice';

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

  const statusList = [
    { label: 'Chờ duyệt', count: pendingBookings, color: COLORS.warning },
    { label: 'Đang thuê', count: ongoingBookings, color: COLORS.approved },
    { label: 'Đã trả', count: completedBookings, color: '#3b82f6' },
    { label: 'Đã hủy', count: cancelledBookings, color: COLORS.danger },
  ];

  const maxCount = Math.max(1, ...statusList.map(s => s.count));

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeStaff}>
          <Text style={styles.badgeStaffText}>NHÂN VIÊN HỆ THỐNG</Text>
        </View>
        <Text style={styles.pageTitle}>Bảng Điều Khiển Staff</Text>
        <Text style={styles.pageSubtitle}>Tổng hợp tình hình đơn hàng & phương tiện khả dụng</Text>
      </View>

      {/* Quick Action Buttons (50% - 50% Symmetrical Grid) */}
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => setActiveTab('staff_bookings')}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(204,255,0,0.12)' }]}>
              <Feather name="calendar" size={18} color={COLORS.accent} />
            </View>
            {pendingBookings > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pendingBookings}</Text>
              </View>
            )}
          </View>
          <Text style={styles.quickActionTitle}>Xử lý Đơn</Text>
          <Text style={styles.quickActionSub}>{pendingBookings} đơn cần duyệt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => setActiveTab('staff_bikes')}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,211,238,0.12)' }]}>
              <MaterialCommunityIcons name="motorbike" size={20} color="#22d3ee" />
            </View>
          </View>
          <Text style={styles.quickActionTitle}>Kiểm Tra Xe</Text>
          <Text style={styles.quickActionSub}>{totalBikes} xe khả dụng</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Stats (2x2 Balanced Grid - 48.5% width per item) */}
      <Text style={styles.sectionTitle}>THỐNG KÊ TỔNG QUAN</Text>
      <View style={styles.statsGridContainer}>
        {/* Card 1: Total Bookings */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>TỔNG ĐƠN</Text>
            <Feather name="file-text" size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.statValue}>{totalBookings}</Text>
          <Text style={styles.statSubText}>Đơn hàng trên hệ thống</Text>
        </View>

        {/* Card 2: Pending */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>CHỜ DUYỆT</Text>
            <Feather name="clock" size={16} color={COLORS.warning} />
          </View>
          <Text style={[styles.statValue, pendingBookings > 0 && { color: COLORS.warning }]}>
            {pendingBookings}
          </Text>
          <Text style={styles.statSubText}>Cần xử lý ngay</Text>
        </View>

        {/* Card 3: Ongoing */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>ĐANG THUÊ</Text>
            <MaterialCommunityIcons name="motorbike" size={18} color="#22d3ee" />
          </View>
          <Text style={styles.statValue}>{ongoingBookings} / {totalBikes}</Text>
          <Text style={styles.statSubText}>Phương tiện đang lăn bánh</Text>
        </View>

        {/* Card 4: Completed */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>HOÀN THÀNH</Text>
            <Feather name="check-circle" size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.statValue}>{completedBookings}</Text>
          <Text style={styles.statSubText}>Đơn đã trả xe</Text>
        </View>
      </View>

      {/* SVG Bar Chart Distribution */}
      <Text style={styles.sectionTitle}>PHÂN BỔ TRẠNG THÁI ĐƠN HÀNG</Text>
      <View style={styles.chartCard}>
        <Svg width="100%" height={150} viewBox="0 0 320 150">
          <Line x1="0" y1="20" x2="320" y2="20" stroke={COLORS.border} strokeDasharray="3 3" />
          <Line x1="0" y1="65" x2="320" y2="65" stroke={COLORS.border} strokeDasharray="3 3" />
          <Line x1="0" y1="110" x2="320" y2="110" stroke={COLORS.border} strokeWidth="1" />

          {statusList.map((item, index) => {
            const barWidth = 36;
            const x = 20 + index * 75;
            const barHeight = Math.max(10, (item.count / maxCount) * 80);
            const y = 110 - barHeight;

            return (
              <G key={item.label}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  rx={6}
                  ry={6}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fill={COLORS.text}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.count}
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y="130"
                  fill={COLORS.textMuted}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 8,
    marginBottom: 18,
  },
  badgeStaff: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeStaffText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCount: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActionSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statSubText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
});
