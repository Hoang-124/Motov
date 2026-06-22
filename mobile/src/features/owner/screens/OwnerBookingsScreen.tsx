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
import { BookingCard } from '../../bookings/components/BookingCard';
import { Booking } from '../../../types';

export const OwnerBookingsScreen: React.FC = () => {
  const bikes = useAppSelector(state => state.bikes.bikes);
  const bookingsState = useAppSelector(state => state.bookings.bookings);
  const [localBookings, setLocalBookings] = useState(bookingsState);
  
  // Mock owner's bikes list
  const myBikes = bikes.filter(b => b.id === 'cb300r' || b.id === 'xsr155' || b.id === 'ninja400');
  const myBikeIds = myBikes.map(b => b.id);
  const myBookings = localBookings.filter(b => myBikeIds.includes(b.bikeId));

  const handleOwnerAction = (booking: Booking, action: 'Confirmed' | 'Cancelled' | 'Ongoing' | 'Return') => {
    let newStatus = '';
    if (action === 'Confirmed' || action === 'Ongoing') newStatus = 'Đang thuê';
    if (action === 'Cancelled') newStatus = 'Đã hủy';
    if (action === 'Return') newStatus = 'Đã trả';

    setLocalBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b)
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
          myBookings.map(b => {
            // Map the legacy status to the ones expected by BookingCard
            let mappedStatus = b.status;
            if (b.status === 'Chờ duyệt') mappedStatus = 'Pending';
            else if (b.status === 'Đang thuê') mappedStatus = 'Ongoing';
            else if (b.status === 'Đã trả') mappedStatus = 'Completed';
            else if (b.status === 'Đã hủy') mappedStatus = 'Cancelled';

            const mappedBooking = { ...b, status: mappedStatus, statusLabel: b.status };

            return (
              <BookingCard
                key={b.id}
                booking={mappedBooking}
                isStaff={true} // Use staff layout to show action buttons
                onStaffAction={handleOwnerAction}
                handleCancelBooking={() => {}}
                onOpenTracking={() => {}}
                onOpenFeedback={() => {}}
              />
            );
          })
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
