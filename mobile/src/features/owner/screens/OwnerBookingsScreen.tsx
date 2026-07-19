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

interface OwnerBookingsScreenProps {
  setActiveTab?: (tab: string) => void;
}

export const OwnerBookingsScreen: React.FC<OwnerBookingsScreenProps> = ({ setActiveTab }) => {
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
      {/* Tab Switcher */}
      {setActiveTab && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15, marginTop: 10 }}>
          <TouchableOpacity 
            onPress={() => setActiveTab('owner_dashboard')} 
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 12 }}>Doanh thu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setActiveTab('owner_bikes')} 
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 12 }}>Xe của tôi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              flex: 1,
              backgroundColor: COLORS.accent,
              borderWidth: 1,
              borderColor: COLORS.accent,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: COLORS.accentDark, fontWeight: 'bold', fontSize: 12 }}>Yêu cầu</Text>
          </TouchableOpacity>
        </View>
      )}

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
