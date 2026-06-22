import React from 'react';
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
import { useAppSelector } from '../../../app/store';

const { width } = Dimensions.get('window');

interface OwnerDashboardScreenProps {
  setActiveTab?: (tab: string) => void;
}

export const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({ setActiveTab }) => {
  const user = useAppSelector(state => state.user.user);
  const bikes = useAppSelector(state => state.bikes.bikes);
  const bookings = useAppSelector(state => state.bookings.bookings);
  
  // Filter for current owner
  const myBikes = bikes.filter(b => b.ownerId === user?.id);
  const myBikeIds = myBikes.map(b => b.id);
  const myBookings = bookings.filter(b => myBikeIds.includes(b.bikeId));

  // Stats calculation
  const totalBikes = myBikes.length;
  const totalBookings = myBookings.length;
  const activeRentals = myBookings.filter(b => b.status === 'Đang thuê').length;
  
  // Revenue: 3 days rental for completed/ongoing bookings
  const totalRevenue = myBookings
    .filter(b => b.status === 'Đang thuê' || b.status === 'Đã trả')
    .reduce((sum, b) => {
      const priceVal = parseInt(b.price.replace(/\./g, ''), 10) || 0;
      return sum + (priceVal * 3);
    }, 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Doanh Thu & Thống Kê</Text>
        <Text style={styles.pageSubtitle}>Hộp cát tài chính dành cho Đối tác Chủ xe</Text>
      </View>

      {/* Grid Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>DOANH THU</Text>
            <Feather name="dollar-sign" size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.statSubText}>Từ lượt thuê thành công</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>LƯỢT THUÊ</Text>
            <Feather name="calendar" size={16} color={COLORS.approved} />
          </View>
          <Text style={styles.statValue}>{totalBookings}</Text>
          <Text style={styles.statSubText}>Tổng số lượt đặt đăng ký</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>ĐANG CHO THUÊ</Text>
            <MaterialCommunityIcons name="motorbike" size={18} color="#22d3ee" />
          </View>
          <Text style={styles.statValue}>{activeRentals} / {totalBikes}</Text>
          <Text style={styles.statSubText}>Xe đang có hợp đồng</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>XE ĐĂNG KÝ</Text>
            <Feather name="shield" size={16} color={COLORS.warning} />
          </View>
          <Text style={styles.statValue}>{totalBikes} xe</Text>
          <Text style={styles.statSubText}>Tổng xe bạn sở hữu</Text>
        </View>
      </View>

      {/* Latest Booking Requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yêu Cầu Thuê Xe Mới Nhất</Text>
          {setActiveTab && (
            <TouchableOpacity onPress={() => setActiveTab('owner_bookings')}>
              <Text style={styles.sectionLink}>Xem tất cả</Text>
            </TouchableOpacity>
          )}
        </View>

        {myBookings.length > 0 ? (
          <View style={styles.listContainer}>
            {myBookings.slice(0, 4).map(b => (
              <View key={b.id} style={styles.bookingRow}>
                <View style={styles.bookingRowLeft}>
                  <View style={styles.bikeInfo}>
                    <Text style={styles.bikeName}>{b.bikeName}</Text>
                    <View style={[
                      styles.statusBadge,
                      b.status === 'Chờ duyệt' && styles.badgePending,
                      b.status === 'Đang thuê' && styles.badgeOngoing,
                      b.status === 'Đã trả' && styles.badgeCompleted,
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        b.status === 'Chờ duyệt' && { color: COLORS.warning },
                        b.status === 'Đang thuê' && { color: COLORS.approved },
                        b.status === 'Đã trả' && { color: '#3b82f6' },
                      ]}>
                        {b.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.renterName}>Khách: {b.fullName}</Text>
                  <Text style={styles.dateText}>Hạn thuê: {b.date}</Text>
                </View>
                <View style={styles.bookingRowRight}>
                  <Text style={styles.priceText}>{b.price} đ/ngày</Text>
                  <Text style={styles.codeText}>Mã: {b.id}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Feather name="inbox" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Chưa có yêu cầu thuê xe nào dành cho bạn.</Text>
          </View>
        )}
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
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionLink: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bookingRowLeft: {
    flex: 1,
  },
  bikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgePending: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  badgeOngoing: {
    backgroundColor: COLORS.approvedBg,
    borderColor: COLORS.approvedBorder,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  renterName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  bookingRowRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  priceText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  codeText: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
