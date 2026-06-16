import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Booking } from '../types';
import { COLORS } from '../theme/colors';

interface ReturnMotorbikeModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirmSuccess: (bookingId: string, lateFee: number, returnTime: string) => void;
}

export const ReturnMotorbikeModal: React.FC<ReturnMotorbikeModalProps> = ({
  visible,
  onClose,
  booking,
  onConfirmSuccess,
}) => {
  const [lateOption, setLateOption] = useState<'ontime' | 'late1d' | 'late3d'>('ontime');
  const [actualReturnTime, setActualReturnTime] = useState<Date>(new Date());
  const [lateFee, setLateFee] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    if (!booking) return;

    const basePriceNum = parseInt(booking.price.replace(/\./g, ''), 10) || 100000;
    const rentalDays = booking.rentalDays || 1;
    const originalTotal = booking.totalAmount || (basePriceNum * rentalDays);

    let calculatedFee = 0;
    const now = new Date();
    
    if (lateOption === 'ontime') {
      setActualReturnTime(now);
      calculatedFee = 0;
    } else if (lateOption === 'late1d') {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setActualReturnTime(tomorrow);
      // Phí trễ hạn = 150% đơn giá ngày thuê
      calculatedFee = Math.round(basePriceNum * 1.5);
    } else if (lateOption === 'late3d') {
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      setActualReturnTime(threeDaysLater);
      calculatedFee = Math.round(basePriceNum * 1.5 * 3);
    }

    setLateFee(calculatedFee);
    setTotalAmount(originalTotal + calculatedFee);
  }, [lateOption, booking]);

  if (!booking) return null;

  const handleConfirm = () => {
    onConfirmSuccess(booking.id, lateFee, actualReturnTime.toISOString());
    Alert.alert('Thành Công', 'Đã xác nhận trả xe và kết thúc thủ tục thuê thành công!');
    onClose();
  };

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
              <Feather name="check-square" size={18} color={COLORS.approved} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Thủ Tục Thu Hồi Xe</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Info Summary */}
            <View style={styles.bookingInfo}>
              <Text style={styles.bikeName}>{booking.bikeName}</Text>
              <Text style={styles.renterName}>Khách thuê: {booking.fullName}</Text>
              <Text style={styles.infoRow}>Nhận: {booking.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleString('vi-VN') : booking.date.split(' - ')[0]}</Text>
              <Text style={styles.infoRow}>Hạn trả: {booking.returnDateTime ? new Date(booking.returnDateTime).toLocaleString('vi-VN') : booking.date.split(' - ')[1]}</Text>
            </View>

            {/* Late Return Simulation Selector */}
            <Text style={styles.sectionLabel}>Giả lập thời gian trả xe thực tế</Text>
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                style={[styles.selectorBtn, lateOption === 'ontime' && styles.selectorBtnActive]}
                onPress={() => setLateOption('ontime')}
              >
                <Text style={[styles.selectorBtnText, lateOption === 'ontime' && styles.selectorBtnTextActive]}>
                  Đúng hạn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectorBtn, lateOption === 'late1d' && styles.selectorBtnActive]}
                onPress={() => setLateOption('late1d')}
              >
                <Text style={[styles.selectorBtnText, lateOption === 'late1d' && styles.selectorBtnTextActive]}>
                  Trễ 1 ngày
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectorBtn, lateOption === 'late3d' && styles.selectorBtnActive]}
                onPress={() => setLateOption('late3d')}
              >
                <Text style={[styles.selectorBtnText, lateOption === 'late3d' && styles.selectorBtnTextActive]}>
                  Trễ 3 ngày
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bill Summary */}
            <View style={styles.billContainer}>
              <Text style={styles.billTitle}>Chi tiết thanh toán cuối cùng</Text>
              
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Tiền thuê gốc</Text>
                <Text style={styles.billValue}>
                  {(booking.totalAmount || (parseInt(booking.price.replace(/\./g, ''), 10) * (booking.rentalDays || 1))).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>

              {lateFee > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: COLORS.danger }]}>Phí trả trễ xe (Phạt)</Text>
                  <Text style={[styles.billValue, { color: COLORS.danger }]}>
                    +{lateFee.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Tổng số tiền cần thu</Text>
                <Text style={styles.billTotalValue}>
                  {totalAmount.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </View>

            <Text style={styles.noteText}>
              * Thời điểm trả thực tế giả lập: {actualReturnTime.toLocaleString('vi-VN')}
            </Text>
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirm}>
              <Text style={styles.btnConfirmText}>Xác nhận trả xe</Text>
            </TouchableOpacity>
          </View>
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
  bookingInfo: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  renterName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  infoRow: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  selectorBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
  },
  selectorBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectorBtnTextActive: {
    color: COLORS.accent,
  },
  billContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  billTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  billLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  billValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  billTotalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  billTotalValue: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  btnCancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  btnConfirm: {
    flex: 1.2,
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: COLORS.accentDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
