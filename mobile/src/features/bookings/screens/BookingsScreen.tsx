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
import { cancelBooking, submitFeedback, fetchBookings } from '../bookingsSlice';
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
