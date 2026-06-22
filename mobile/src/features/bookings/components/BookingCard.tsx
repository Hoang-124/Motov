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
  onOpenTracking: (booking: Booking) => void;
  onOpenFeedback: (id: string) => void;
  isStaff?: boolean;
  onStaffAction?: (booking: Booking, action: 'Confirmed' | 'Cancelled' | 'Ongoing' | 'Return') => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  handleCancelBooking,
  onOpenTracking,
  onOpenFeedback,
  isStaff,
  onStaffAction,
}) => {
  const isPending = booking.status === 'Pending';
  const isOngoing = booking.status === 'Rented' || booking.status === 'Confirmed' || booking.status === 'Ongoing';
  const isCompleted = booking.status === 'Completed';
  const isReviewed = booking.status === 'Đã đánh giá';
  const isCancelled = booking.status === 'Cancelled';

  const basePriceNum = parseInt(String(booking.price).replace(/\./g, ''), 10) || 100000;
  const rentalDays = booking.rentalDays || 2;
  const calculatedTotal = booking.totalAmount || (basePriceNum * rentalDays);

  return (
    <View style={styles.bookingCard}>
      <Image source={{ uri: booking.image }} style={styles.bookingImage} />
      <View style={styles.bookingDetails}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingCode}>Mã: #{booking.id}</Text>
          <View style={[
            styles.statusBadge,
            isPending && styles.statusBadgePending,
            isOngoing && styles.statusBadgeOngoing,
            isCompleted && styles.statusBadgeCompleted,
            isReviewed && styles.statusBadgeReviewed,
            isCancelled && styles.statusBadgeCancelled,
          ]}>
            <Text style={[
              styles.statusText,
              isPending && { color: COLORS.warning },
              isOngoing && { color: COLORS.approved },
              isCompleted && { color: '#3b82f6' },
              isReviewed && { color: COLORS.accent },
              isCancelled && { color: COLORS.danger },
            ]}>{booking.statusLabel || booking.status}</Text>
          </View>
        </View>

        <Text style={styles.bookingName}>{booking.bikeName}</Text>
        
        <View style={styles.bookingRow}>
          <Feather name="calendar" size={13} color="#888" style={styles.bookingRowIcon} />
          <Text style={styles.bookingText}>Nhận: {booking.date}</Text>
        </View>

        {booking.returnDateTime && (
          <View style={styles.bookingRow}>
            <Feather name="clock" size={13} color="#888" style={styles.bookingRowIcon} />
            <Text style={styles.bookingText}>Trả: {new Date(booking.returnDateTime).toLocaleDateString('vi-VN')}</Text>
          </View>
        )}
        
        <View style={styles.bookingRow}>
          <Feather name="map-pin" size={13} color="#888" style={styles.bookingRowIcon} />
          <Text style={styles.bookingText}>Điểm nhận: {booking.location}</Text>
        </View>

        {booking.surcharges && booking.surcharges.length > 0 && (
          <View style={styles.surchargeBox}>
            <Text style={styles.surchargeTitle}>Phụ thu phạt trễ hạn:</Text>
            {booking.surcharges.map((s, idx) => (
              <Text key={idx} style={styles.surchargeItem}>
                ⚠️ {s.surchargeType}: +{s.amount.toLocaleString('vi-VN')} VNĐ
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.bookingPrice}>
          Tổng thanh toán: {calculatedTotal.toLocaleString('vi-VN')} VNĐ
        </Text>
        
        {/* Actions Button Grid */}
        <View style={styles.actionsContainer}>
          {/* Tracking Button */}
          <TouchableOpacity 
            style={styles.trackingBtn}
            onPress={() => onOpenTracking(booking)}
          >
            <Feather name="map" size={12} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.trackingBtnText}>Xem lịch trình</Text>
          </TouchableOpacity>

          {/* Feedback/Cancel/Status Button */}
          {isStaff ? (
             isPending ? (
               <View style={{ flex: 1.2, flexDirection: 'row', gap: 5 }}>
                 <TouchableOpacity 
                   style={[styles.feedbackBtn, { flex: 1, backgroundColor: COLORS.approved }]}
                   onPress={() => onStaffAction?.(booking, 'Confirmed')}
                 >
                   <Text style={[styles.feedbackBtnText, { color: '#fff' }]}>Duyệt</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.cancelBtn, { flex: 1 }]}
                   onPress={() => onStaffAction?.(booking, 'Cancelled')}
                 >
                   <Text style={styles.cancelBtnText}>Từ chối</Text>
                 </TouchableOpacity>
               </View>
             ) : booking.status === 'Confirmed' ? (
               <View style={{ flex: 1.2, flexDirection: 'row', gap: 5 }}>
                 <TouchableOpacity 
                   style={[styles.feedbackBtn, { flex: 1, backgroundColor: COLORS.approved }]}
                   onPress={() => onStaffAction?.(booking, 'Ongoing')}
                 >
                   <Text style={[styles.feedbackBtnText, { color: '#fff' }]}>Giao xe</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.cancelBtn, { flex: 1 }]}
                   onPress={() => onStaffAction?.(booking, 'Cancelled')}
                 >
                   <Text style={styles.cancelBtnText}>Hủy</Text>
                 </TouchableOpacity>
               </View>
             ) : booking.status === 'Ongoing' || booking.status === 'Rented' ? (
               <TouchableOpacity 
                 style={[styles.feedbackBtn, { flex: 1.2, backgroundColor: COLORS.warning }]}
                 onPress={() => onStaffAction?.(booking, 'Return')}
               >
                 <Feather name="key" size={12} color={COLORS.dark} style={{ marginRight: 6 }} />
                 <Text style={[styles.feedbackBtnText, { color: COLORS.dark }]}>Thu hồi xe</Text>
               </TouchableOpacity>
             ) : isCompleted || isReviewed ? (
               <View style={styles.reviewedLabel}>
                 <Feather name="check" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                 <Text style={styles.reviewedLabelText}>Đã hoàn thành</Text>
               </View>
             ) : isCancelled ? (
               <View style={styles.lockedLabel}>
                 <Text style={styles.lockedLabelText}>Đơn đã hủy</Text>
               </View>
             ) : (
               <View style={styles.lockedLabel}>
                 <Text style={styles.lockedLabelText}>Khóa</Text>
               </View>
             )
          ) : (
            isPending ? (
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => handleCancelBooking(booking.id)}
              >
                <Text style={styles.cancelBtnText}>Yêu cầu hủy</Text>
              </TouchableOpacity>
            ) : isOngoing ? (
              <View style={styles.lockedLabel}>
                <Feather name="activity" size={12} color={COLORS.approved} style={{ marginRight: 4 }} />
                <Text style={[styles.lockedLabelText, { color: COLORS.approved }]}>Đang thuê</Text>
              </View>
            ) : isCompleted ? (
              <TouchableOpacity 
                style={styles.feedbackBtn}
                onPress={() => onOpenFeedback(booking.id)}
              >
                <Feather name="star" size={12} color={COLORS.accentDark} style={{ marginRight: 6 }} />
                <Text style={styles.feedbackBtnText}>Đánh giá xe</Text>
              </TouchableOpacity>
            ) : isReviewed ? (
              <View style={styles.reviewedLabel}>
                <Feather name="check" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                <Text style={styles.reviewedLabelText}>Đã đánh giá</Text>
              </View>
            ) : (
              <View style={styles.lockedLabel}>
                <Text style={styles.lockedLabelText}>
                  {isCancelled ? 'Đơn đã đóng' : 'Khóa chỉnh sửa'}
                </Text>
              </View>
            )
          )}
        </View>
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
    height: 140,
    backgroundColor: COLORS.border,
  },
  bookingDetails: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingCode: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  statusBadgeOngoing: {
    backgroundColor: COLORS.approvedBg,
    borderColor: COLORS.approvedBorder,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statusBadgeReviewed: {
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
    borderColor: 'rgba(190, 242, 100, 0.3)',
  },
  statusBadgeCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
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
    fontSize: 12,
  },
  surchargeBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  surchargeTitle: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  surchargeItem: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  bookingPrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  trackingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
  },
  cancelBtn: {
    flex: 1.2,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 12,
  },
  feedbackBtn: {
    flex: 1.2,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  reviewedLabel: {
    flex: 1.2,
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewedLabelText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  lockedLabel: {
    flex: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedLabelText: {
    color: COLORS.textMuted,
    fontWeight: '500',
    fontSize: 12,
  },
});
