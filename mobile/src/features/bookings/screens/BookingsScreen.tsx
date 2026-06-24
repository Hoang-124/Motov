import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BookingCard } from '../components/BookingCard';
import { COLORS } from '../../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { cancelBooking, submitFeedback, fetchBookings, returnBookingApi } from '../bookingsSlice';
import { Booking } from '../../../types';
import { BookingTrackingModal } from '../components/BookingTrackingModal';
import { FeedbackModal } from '../../../components/FeedbackModal';

interface BookingsScreenProps {
  setActiveTab: (tab: 'home' | 'bikes' | 'bookings' | 'profile') => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({ setActiveTab }) => {
  const dispatch = useAppDispatch();
  const bookings = useAppSelector(state => state.bookings.bookings);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  // Modal states
  const [trackingVisible, setTrackingVisible] = useState(false);
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<Booking | null>(null);

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [selectedFeedbackBookingId, setSelectedFeedbackBookingId] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    Alert.alert(
      'Hủy Đơn',
      'Bạn có chắc chắn muốn hủy đơn thuê xe này không?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Có', 
          style: 'destructive', 
          onPress: () => {
            dispatch(cancelBooking(id));
          } 
        }
      ]
    );
  };

  const getReturnDetails = (booking: Booking) => {
    const pickupTime = new Date(booking.pickupDateTime || '');
    const returnTime = new Date(booking.returnDateTime || '');
    const now = new Date();

    const totalRentalHours = Math.ceil((returnTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60));
    const hourlyRate = (booking.totalAmount || 0) / (totalRentalHours || 1);

    const diffMs = returnTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let type: 'early' | 'late' | 'normal' = 'normal';
    let hours = 0;
    let amount = 0;
    const deposit = booking.depositAmount || Math.round((booking.totalAmount || 0) * 0.3);
    const actualHours = Math.max(0, Math.ceil((now.getTime() - pickupTime.getTime()) / (1000 * 60 * 60)));
    const actualRentalFee = Math.round(actualHours * hourlyRate);

    if (diffHours >= 2) {
      // Trả sớm trên 2 tiếng
      type = 'early';
      hours = Math.floor(diffHours);
      // Mất cọc, khách hàng phải thanh toán thêm số tiền bằng đúng tiền thuê thực tế
      amount = actualRentalFee;
    } else if (diffHours < -0.25) {
      // Trả muộn trên 15 phút (0.25 giờ)
      type = 'late';
      hours = Math.ceil(Math.abs(diffHours));
      amount = Math.round(hours * hourlyRate); // Phí trễ đơn giản
    }

    return { type, hours, amount, deposit, actualHours, actualRentalFee };
  };

  const handleReturn = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    const details = getReturnDetails(booking);
    let policyText = '';

    if (details.type === 'early') {
      policyText = `\n\n🎉 Trả xe sớm hơn ${details.hours} giờ.\nTheo chính sách của Motov:\n- Bạn sẽ mất tiền cọc: ${details.deposit.toLocaleString('vi-VN')} VNĐ\n- Bạn cần thanh toán thêm tiền thuê thực tế (${details.actualHours} giờ): ${details.amount.toLocaleString('vi-VN')} VNĐ`;
    } else if (details.type === 'late') {
      const finalAmount = (booking.remainingAmount !== undefined ? booking.remainingAmount : ((booking.totalAmount || 0) - details.deposit)) + details.amount;
      policyText = `\n\n⚠️ Trả xe trễ hơn ${details.hours} giờ.\nPhát sinh phụ phí trễ hạn:\n💵 Phụ thu trễ: +${details.amount.toLocaleString('vi-VN')} VNĐ\n👉 Số tiền cần thanh toán còn lại: ${finalAmount.toLocaleString('vi-VN')} VNĐ`;
    } else {
      const finalRemaining = booking.remainingAmount !== undefined ? booking.remainingAmount : ((booking.totalAmount || 0) - details.deposit);
      policyText = `\n\n💵 Tiền cọc đã đóng (30%): ${details.deposit.toLocaleString('vi-VN')} VNĐ\n👉 Số tiền cần thanh toán còn lại (70%): ${finalRemaining.toLocaleString('vi-VN')} VNĐ`;
    }

    Alert.alert(
      'Trả Xe',
      `Bạn có chắc chắn muốn trả xe máy và hoàn tất đơn thuê xe này không?${policyText}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận trả xe', 
          onPress: async () => {
            const result = await dispatch(returnBookingApi(id));
            if (returnBookingApi.fulfilled.match(result)) {
              Alert.alert('Thành Công 🎉', 'Đã trả xe thành công. Đơn hàng của bạn đã hoàn thành!');
              dispatch(fetchBookings());
            } else {
              const errMsg = (result.payload as string) || 'Không thể thực hiện trả xe lúc này.';
              Alert.alert('Lỗi', errMsg);
            }
          } 
        }
      ]
    );
  };

  const handleOpenTracking = (booking: Booking) => {
    setSelectedTrackingBooking(booking);
    setTrackingVisible(true);
  };

  const handleOpenFeedback = (id: string) => {
    setSelectedFeedbackBookingId(id);
    setFeedbackVisible(true);
  };

  const handleFeedbackSubmit = (id: string, rating: number, content: string) => {
    dispatch(submitFeedback({ id, rating, content }));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Đơn Thuê Của Bạn</Text>
      
      {bookings.length > 0 ? (
        <View style={styles.bookingsContainer}>
          {bookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              handleCancelBooking={handleCancel} 
              onOpenTracking={handleOpenTracking}
              onOpenFeedback={handleOpenFeedback}
              handleReturnBooking={handleReturn}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBookings}>
          <View style={styles.emptyBookingsIconContainer}>
            <Feather name="calendar" size={48} color="#3f3f46" />
          </View>
          <Text style={styles.emptyBookingsText}>Bạn chưa có đơn thuê xe nào.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => setActiveTab('bikes')}>
            <Text style={styles.exploreBtnText}>Tìm Xe Ngay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tracking Modal Component */}
      <BookingTrackingModal
        visible={trackingVisible}
        onClose={() => {
          setTrackingVisible(false);
          setSelectedTrackingBooking(null);
        }}
        bookingId={selectedTrackingBooking?.id || null}
      />

      {/* Feedback Modal Component */}
      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => {
          setFeedbackVisible(false);
          setSelectedFeedbackBookingId(null);
        }}
        bookingId={selectedFeedbackBookingId}
        onSubmit={handleFeedbackSubmit}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 10,
  },
  bookingsContainer: {
    marginTop: 10,
  },
  emptyBookings: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyBookingsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  emptyBookingsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
