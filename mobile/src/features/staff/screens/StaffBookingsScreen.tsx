import React, { useEffect, useState } from 'react';
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
import { useAppSelector, useAppDispatch } from '../../../app/store';
import {
  updateBookingStatus,
  returnBookingWithFees,
  approveOwnerRequest,
  rejectOwnerRequest,
  fetchBookings
} from '../../bookings/bookingsSlice';
import { Booking } from '../../../types';
import { ReturnMotorbikeModal } from '../../../components/ReturnMotorbikeModal';

import { BookingCard } from '../../bookings/components/BookingCard';

export const StaffBookingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const bookingsState = useAppSelector(state => state.bookings.bookings);
  const ownerRequests = useAppSelector(state => state.bookings.ownerRequests);

  const [activeTab, setActiveTab] = useState<'bookings' | 'ownerRequests'>('bookings');

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  // Return Motorbike Modal States
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedReturnBooking, setSelectedReturnBooking] = useState<Booking | null>(null);

  const handleAction = (id: string, newStatus: string, label: string) => {
    dispatch(updateBookingStatus({ id, status: newStatus, statusLabel: label }));
    Alert.alert('Thành Công', `Đã cập nhật trạng thái đơn hàng sang: ${newStatus}!`);
  };

  const handleReturnConfirm = (bookingId: string, lateFee: number, returnTime: string) => {
    dispatch(returnBookingWithFees({ id: bookingId, lateFee, returnTime }));
    setReturnModalVisible(false);
  };

  const handleApproveOwner = (id: string, name: string) => {
    Alert.alert('Duyệt Chủ Xe', `Xác nhận phê duyệt đối tác ${name} thành chủ xe?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: () => {
          dispatch(approveOwnerRequest(id));
          Alert.alert('Thành Công', `Đã phê duyệt chủ xe ${name} đối tác!`);
        }
      }
    ]);
  };

  const handleRejectOwner = (id: string, name: string) => {
    Alert.alert('Từ Chối', `Xác nhận từ chối yêu cầu của đối tác ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: () => {
          dispatch(rejectOwnerRequest(id));
          Alert.alert('Đã xử lý', `Đã từ chối yêu cầu đăng ký của ${name}.`);
        }
      }
    ]);
  };

  const pendingBookings = bookingsState.filter(b => b.status === 'Chờ duyệt' || b.status === 'Pending');
  const ongoingBookings = bookingsState.filter(b => b.status === 'Đang thuê' || b.status === 'Ongoing' || b.status === 'Confirmed' || b.status === 'Rented');
  const otherBookings = bookingsState.filter(b =>
    !['Chờ duyệt', 'Pending', 'Đang thuê', 'Ongoing', 'Confirmed', 'Rented'].includes(b.status)
  );

  const handleStaffAction = (booking: Booking, action: 'Confirmed' | 'Cancelled' | 'Ongoing' | 'Return') => {
    if (action === 'Confirmed') handleAction(booking.id, 'Confirmed', 'Chờ nhận xe');
    if (action === 'Cancelled') handleAction(booking.id, 'Cancelled', 'Đã hủy');
    if (action === 'Ongoing') handleAction(booking.id, 'Ongoing', 'Đang thuê');
    if (action === 'Return') {
      setSelectedReturnBooking(booking);
      setReturnModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Điều Phối & Phê Duyệt</Text>
        <Text style={styles.pageSubtitle}>Duyệt đối tác chủ xe mới và quản lý quy trình giao nhận xe máy</Text>
      </View>

      {/* Tabs Layout */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.tabBtnTextActive]}>
            📋 Đơn đặt xe ({bookingsState.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ownerRequests' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ownerRequests')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ownerRequests' && styles.tabBtnTextActive]}>
            🤝 Duyệt chủ xe ({ownerRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* --- TAB 1: BOOKINGS --- */}
        {activeTab === 'bookings' && (
          <View style={styles.contentSection}>
            {/* Chờ xét duyệt */}
            <Text style={styles.sectionTitle}>Chờ Xét Duyệt ({pendingBookings.length})</Text>
            <View style={styles.listContainer}>
              {pendingBookings.length > 0 ? (
                pendingBookings.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    isStaff={true}
                    onStaffAction={handleStaffAction}
                    handleCancelBooking={() => { }}
                    onOpenFeedback={() => { }}
                    onOpenTracking={() => { }}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Không có đơn nào đang chờ duyệt.</Text>
                </View>
              )}
            </View>

            {/* Đang thuê */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Đang thuê xe ({ongoingBookings.length})</Text>
            <View style={styles.listContainer}>
              {ongoingBookings.length > 0 ? (
                ongoingBookings.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    isStaff={true}
                    onStaffAction={handleStaffAction}
                    handleCancelBooking={() => { }}
                    onOpenFeedback={() => { }}
                    onOpenTracking={() => { }}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Không có đơn nào đang trong quá trình thuê.</Text>
                </View>
              )}
            </View>

            {/* Đơn hàng đã hoàn tất / hủy */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Lịch Sử Đơn Đã Xử Lý</Text>
            <View style={styles.listContainer}>
              {otherBookings.length > 0 ? (
                otherBookings.slice(0, 5).map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    isStaff={true}
                    onStaffAction={handleStaffAction}
                    handleCancelBooking={() => { }}
                    onOpenFeedback={() => { }}
                    onOpenTracking={() => { }}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Chưa có lịch sử đơn hàng nào.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- TAB 2: OWNER REQUESTS --- */}
        {activeTab === 'ownerRequests' && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Đăng ký chờ duyệt ({ownerRequests.length})</Text>
            <View style={styles.listContainer}>
              {ownerRequests.length > 0 ? (
                ownerRequests.map(r => (
                  <View key={r.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.bikeName}>{r.name}</Text>
                      <View style={[styles.statusBadge, styles.badgePending]}>
                        <Text style={[styles.statusBadgeText, { color: COLORS.warning }]}>
                          Đang Chờ
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.infoText}>Tài khoản: <Text style={styles.whiteText}>{r.username}</Text></Text>
                      <Text style={styles.infoText}>Email: <Text style={styles.whiteText}>{r.email}</Text></Text>
                      <Text style={styles.infoText}>SĐT liên hệ: <Text style={styles.whiteText}>{r.phoneNumber || 'Chưa cung cấp'}</Text></Text>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.btnReject}
                        onPress={() => handleRejectOwner(r.id, r.name)}
                      >
                        <Text style={styles.btnRejectText}>Từ chối</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnApprove}
                        onPress={() => handleApproveOwner(r.id, r.name)}
                      >
                        <Text style={styles.btnApproveText}>Duyệt đối tác</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Feather name="user-check" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>Tuyệt vời! Không có đối tác chủ xe nào đang chờ duyệt.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Return Motorbike Modal */}
      <ReturnMotorbikeModal
        visible={returnModalVisible}
        onClose={() => {
          setReturnModalVisible(false);
          setSelectedReturnBooking(null);
        }}
        booking={selectedReturnBooking}
        onConfirmSuccess={handleReturnConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.accent,
  },
  tabBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: COLORS.accent,
  },
  contentSection: {
    marginTop: 6,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    gap: 12,
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
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  whiteText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  btnReject: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 8,
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
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnApproveText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnReturn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReturnText: {
    color: COLORS.accentDark,
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
