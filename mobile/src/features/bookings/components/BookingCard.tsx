import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Booking } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface BookingCardProps {
  booking: Booking;
  handleCancelBooking: (id: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, handleCancelBooking }) => {
  const isPending = booking.status === 'Chờ duyệt';
  return (
    <View style={styles.bookingCard}>
      <Image source={{ uri: booking.image }} style={styles.bookingImage} />
      <View style={styles.bookingDetails}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingCode}>{booking.id}</Text>
          <View style={[
            styles.statusBadge,
            isPending ? styles.statusBadgePending : styles.statusBadgeApproved
          ]}>
            <Text style={[
              styles.statusText,
              isPending ? styles.statusTextPending : styles.statusTextApproved
            ]}>{booking.status}</Text>
          </View>
        </View>
        <Text style={styles.bookingName}>{booking.bikeName}</Text>
        <View style={styles.bookingRow}>
          <Feather name="calendar" size={14} color="#888" style={styles.bookingRowIcon} />
          <Text style={styles.bookingText}>Ngày: {booking.date}</Text>
        </View>
        <View style={styles.bookingRow}>
          <Feather name="map-pin" size={14} color="#888" style={styles.bookingRowIcon} />
          <Text style={styles.bookingText}>Nơi nhận: {booking.location}</Text>
        </View>
        <Text style={styles.bookingPrice}>Tổng cộng: {booking.price} VNĐ/ngày</Text>
        
        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => handleCancelBooking(booking.id)}
        >
          <Text style={styles.cancelBtnText}>Hủy Đơn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingImage: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.border,
  },
  bookingDetails: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingCode: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: COLORS.pendingBg,
    borderWidth: 1,
    borderColor: COLORS.pendingBorder,
  },
  statusBadgeApproved: {
    backgroundColor: COLORS.approvedBg,
    borderWidth: 1,
    borderColor: COLORS.approvedBorder,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextPending: {
    color: COLORS.pending,
  },
  statusTextApproved: {
    color: COLORS.approved,
  },
  bookingName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingRowIcon: {
    marginRight: 8,
  },
  bookingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  bookingPrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
