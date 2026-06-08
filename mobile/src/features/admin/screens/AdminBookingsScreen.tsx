import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { cancelBooking } from '../../bookings/bookingsSlice';

export const AdminBookingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const bookingsState = useAppSelector(state => state.bookings.bookings);
  
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDeleteBooking = (id: string, renterName: string) => {
    Alert.alert(
      'Xóa Đơn Thuê',
      `Bạn có chắc chắn muốn xóa đơn hàng #${id} của khách: ${renterName} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            dispatch(cancelBooking(id));
            Alert.alert('Thành Công', `Đã xóa đơn đặt xe #${id}!`);
          }
        }
      ]
    );
  };

  const filteredBookings = bookingsState.filter(b => {
    const matchesSearch = b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.phone.includes(searchQuery) ||
                          b.bikeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Toàn Bộ Đơn Thuê</Text>
        <Text style={styles.pageSubtitle}>Tra cứu thông tin và lịch sử thuê xe máy của mọi khách hàng</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm theo khách, SĐT, xe, mã đơn..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Horizontal Status Filter Buttons */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {['All', 'Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                {status === 'All' ? 'Tất cả đơn' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <View style={styles.listContainer}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map(b => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.bikeName}>{b.bikeName}</Text>
                  <Text style={styles.bookingId}>Mã đơn: #{b.id}</Text>
                </View>
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
                  <Feather name="user" size={14} color="#71717a" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>Khách thuê: <Text style={styles.whiteText}>{b.fullName}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="phone" size={14} color="#71717a" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>SĐT: <Text style={styles.whiteText}>{b.phone}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={14} color="#71717a" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>Hạn thuê: <Text style={styles.whiteText}>{b.date}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={14} color="#71717a" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>Giao nhận: <Text style={styles.whiteText}>{b.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : b.location === 'Da Nang Train Station' ? 'Ga Đà Nẵng' : 'Địa điểm khác'}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="dollar-sign" size={14} color="#71717a" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>Doanh thu: <Text style={styles.accentText}>{b.price} VNĐ/ngày</Text></Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.btnDelete} onPress={() => handleDeleteBooking(b.id, b.fullName)}>
                  <Feather name="trash-2" size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
                  <Text style={styles.btnDeleteText}>Hủy / Xóa Đơn Hàng</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Feather name="inbox" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào khớp với điều kiện.</Text>
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
  searchBar: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: COLORS.accentDark,
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
    paddingBottom: 10,
    marginBottom: 10,
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  bookingId: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
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
  badgeCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  btnDelete: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeleteText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
