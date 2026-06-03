import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';

export const OwnerBookingsScreen: React.FC = () => {
  const bikes = useAppSelector(state => state.bikes.bikes);
  const bookingsState = useAppSelector(state => state.bookings.bookings);
  const [localBookings, setLocalBookings] = useState(bookingsState);
  
  // Mock owner's bikes list
  const myBikes = bikes.filter(b => b.id === 'cb300r' || b.id === 'xsr155' || b.id === 'ninja400');
  const myBikeIds = myBikes.map(b => b.id);
  const myBookings = localBookings.filter(b => myBikeIds.includes(b.bikeId));

  const handleAction = (id: string, newStatus: string) => {
    setLocalBookings(prev => 
      prev.map(b => b.id === id ? { ...b, status: newStatus } : b)
    );
    Alert.alert('Thành Công', `Đã cập nhật trạng thái đơn hàng sang: ${newStatus}!`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Yêu Cầu Thuê Xe</Text>
        <Text style={styles.pageSubtitle}>Xét duyệt và kiểm tra lịch sử đặt xe từ khách thuê</Text>
      </View>

      {/* Bookings List */}
      <View style={styles.listContainer}>
        {myBookings.length > 0 ? (
          myBookings.map(b => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bikeName}>{b.bikeName}</Text>
                <View style={[
                  styles.statusBadge,
                  b.status === 'Chờ duyệt' && styles.badgePending,
                  b.status === 'Đang thuê' && styles.badgeOngoing,
                  b.status === 'Đã trả' && styles.badgeCompleted,
                  b.status === 'Đã hủy' && styles.badgeCancelled,
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    b.status === 'Chờ duyệt' && { color: COLORS.warning },
                    b.status === 'Đang thuê' && { color: COLORS.approved },
                    b.status === 'Đã trả' && { color: '#3b82f6' },
                    b.status === 'Đã hủy' && { color: COLORS.danger },
                  ]}>
                    {b.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={14} color="#71717a" />
                  <Text style={styles.infoText}>Khách thuê: <Text style={styles.whiteText}>{b.fullName}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={14} color="#71717a" />
                  <Text style={styles.infoText}>Hạn thuê: <Text style={styles.whiteText}>{b.date}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={14} color="#71717a" />
                  <Text style={styles.infoText}>Giao nhận: <Text style={styles.whiteText}>{b.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : 'Địa điểm khác'}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="dollar-sign" size={14} color="#71717a" />
                  <Text style={styles.infoText}>Giá tiền: <Text style={styles.accentText}>{b.price} VNĐ/ngày</Text></Text>
                </View>
              </View>

              {/* Action buttons if Pending */}
              {b.status === 'Chờ duyệt' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.btnReject} 
                    onPress={() => handleAction(b.id, 'Đã hủy')}
                  >
                    <Text style={styles.btnRejectText}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnApprove} 
                    onPress={() => handleAction(b.id, 'Đang thuê')}
                  >
                    <Text style={styles.btnApproveText}>Duyệt</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Feather name="calendar" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Chưa có lịch sử yêu cầu thuê xe nào.</Text>
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
  bikeName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
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
  badgeCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  whiteText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  accentText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  btnReject: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnRejectText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnApprove: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnApproveText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
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
  },
});
