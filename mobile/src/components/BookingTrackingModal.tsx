import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Booking } from '../types';
import { COLORS } from '../theme/colors';

interface BookingTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const BookingTrackingModal: React.FC<BookingTrackingModalProps> = ({
  visible,
  onClose,
  booking,
}) => {
  if (!booking) return null;

  const getTimelineData = () => {
    const isCancelled = booking.status === 'Cancelled' || booking.status === 'Đã hủy';
    const isOngoing = booking.status === 'Ongoing' || booking.status === 'Đang thuê';
    const isCompleted = booking.status === 'Completed' || booking.status === 'Đã trả';

    const events = [
      {
        title: 'Đơn hàng đã được tạo',
        time: booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN') : booking.date.split(' - ')[0],
        description: `Mã đơn ${booking.id} đang chờ phê duyệt.`,
        completed: true,
        icon: 'file-text' as const,
      },
      {
        title: 'Bàn giao xe (Bắt đầu thuê)',
        time: booking.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleString('vi-VN') : booking.date.split(' - ')[0],
        description: isCancelled ? 'Đơn hàng đã bị hủy bỏ' : 'Nhân viên bàn giao xe máy thực tế cho khách.',
        completed: isOngoing || isCompleted,
        isCancelled: isCancelled,
        icon: isCancelled ? ('x-circle' as const) : ('key' as const),
      },
      {
        title: 'Hoàn trả xe (Kết thúc thuê)',
        time: booking.returnDateTime ? new Date(booking.returnDateTime).toLocaleString('vi-VN') : booking.date.split(' - ')[1],
        description: 'Khách hoàn trả xe, thanh toán các phụ phí trễ hạn (nếu có).',
        completed: isCompleted,
        icon: 'check-circle' as const,
      },
    ];

    return events;
  };

  const timeline = getTimelineData();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Feather name="map" size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Lịch Trình Chi Tiết</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryLabel}>Mã đơn hàng</Text>
              <Text style={styles.summaryValue}>#{booking.id}</Text>
              <Text style={styles.summarySubText}>Xe: {booking.bikeName}</Text>
              <Text style={styles.summarySubText}>Trạng thái: <Text style={styles.accentText}>{booking.statusLabel || booking.status}</Text></Text>
            </View>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              {timeline.map((event, idx) => {
                const isLast = idx === timeline.length - 1;
                return (
                  <View key={idx} style={styles.timelineItem}>
                    {/* Left Line */}
                    <View style={styles.lineCol}>
                      <View
                        style={[
                          styles.dot,
                          event.completed && styles.dotCompleted,
                          event.isCancelled && styles.dotCancelled,
                        ]}
                      >
                        <Feather
                          name={event.icon}
                          size={12}
                          color={
                            event.isCancelled
                              ? COLORS.danger
                              : event.completed
                              ? COLORS.accentDark
                              : COLORS.textMuted
                          }
                        />
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.line,
                            event.completed && styles.lineCompleted,
                          ]}
                        />
                      )}
                    </View>

                    {/* Right Content */}
                    <View style={styles.contentCol}>
                      <Text
                        style={[
                          styles.eventTitle,
                          event.completed && styles.eventTitleCompleted,
                          event.isCancelled && styles.eventTitleCancelled,
                        ]}
                      >
                        {event.title}
                      </Text>
                      <Text style={styles.eventTime}>{event.time}</Text>
                      {event.description && (
                        <Text style={styles.eventDesc}>{event.description}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <TouchableOpacity style={styles.btnOk} onPress={onClose}>
            <Text style={styles.btnOkText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  bookingSummary: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  summarySubText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  accentText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  lineCol: {
    alignItems: 'center',
    marginRight: 16,
    width: 24,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dotCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.danger,
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: COLORS.accent,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 20,
  },
  eventTitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventTitleCompleted: {
    color: COLORS.text,
  },
  eventTitleCancelled: {
    color: COLORS.danger,
  },
  eventTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  eventDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  btnOk: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOkText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
