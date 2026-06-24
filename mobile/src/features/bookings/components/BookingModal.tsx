import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { createBookingApi } from '../bookingsSlice';
import { API_BASE_URL } from '../../../constants/api';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  selectedBike: Bike | null;
  initialDate: string;
  initialLocation: string;
  onConfirmSuccess: () => void;
}

/** Return today + N days as "YYYY-MM-DD" for default date values. */
const offsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Build an ISO-8601 string from separate date ("YYYY-MM-DD") and time ("HH:MM"). */
const toISO = (date: string, time: string) => `${date}T${time}:00.000Z`;

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  onClose,
  selectedBike,
  initialDate,
  initialLocation,
  onConfirmSuccess,
}) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(s => s.bookings.loading);
  const identityStatus = useAppSelector(s => s.user.identityStatus);
  const token = useAppSelector(s => s.user.token);
  const isVerified = identityStatus === 'Verified';

  // Date + time fields (split so user can type them separately)
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('08:00');

  const [pickupLocation, setPickupLocation] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Banking'>('Banking');
  const [deliveryMethod, setDeliveryMethod] = useState<'StorePickup' | 'HomeDelivery'>('StorePickup');

  useEffect(() => {
    if (visible) {
      setPickupDate(offsetDate(1));
      setReturnDate(offsetDate(4));
      setPickupLocation(initialLocation || 'Sân bay Đà Nẵng');
      setPromoCode('');
      setPaymentMethod('Banking');
      setDeliveryMethod('StorePickup');
    }
  }, [visible, initialLocation]);

  if (!selectedBike) return null;

  const getRentalDays = () => {
    if (!pickupDate || !returnDate || !selectedBike) return 0;
    try {
      const start = new Date(`${pickupDate}T${pickupTime}:00`);
      const end = new Date(`${returnDate}T${returnTime}:00`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      if (start >= end) return 0;
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  };

  const rentalDays = getRentalDays();
  const totalAmount = selectedBike ? (parseInt(selectedBike.price.replace(/\./g, ''), 10) || 0) * rentalDays : 0;
  const depositAmount = Math.round(totalAmount * 0.3);
  const remainingAmount = totalAmount - depositAmount;

  const handleConfirm = async () => {
    if (!isVerified) {
      Alert.alert(
        'Chưa xác minh danh tính',
        'Tài khoản của bạn chưa được xác minh eKYC. Vui lòng xác thực danh tính tại trang cá nhân.',
        [{ text: 'Đồng ý', style: 'default' }]
      );
      return;
    }
    // Basic validation
    if (!pickupDate || !returnDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày nhận xe và ngày trả xe.');
      return;
    }
    if (new Date(toISO(returnDate, returnTime)) <= new Date(toISO(pickupDate, pickupTime))) {
      Alert.alert('Lỗi', 'Ngày trả xe phải sau ngày nhận xe.');
      return;
    }

    const locationAddress = pickupLocation.trim() || 'Sân bay Đà Nẵng';
    const payload = {
      vehicleId: selectedBike.id,
      pickupDateTime: toISO(pickupDate, pickupTime),
      returnDateTime: toISO(returnDate, returnTime),
      pickupLocation: { address: deliveryMethod === 'StorePickup' ? 'Nhận tại cửa hàng Motov' : locationAddress, coordinates: [0, 0] },
      returnLocation: { address: deliveryMethod === 'StorePickup' ? 'Trả tại cửa hàng Motov' : locationAddress, coordinates: [0, 0] },
      promoCode: promoCode.trim() || undefined,
      paymentMethod,
      deliveryMethod,
    };


    const result = await dispatch(createBookingApi(payload));

    if (createBookingApi.fulfilled.match(result)) {
      setPromoCode('');
      
      if (paymentMethod === 'Banking') {
        const createdBooking = result.payload as any;
        Alert.alert(
          'Thanh Toán Đặt Cọc (VNPAY)',
          `Đơn hàng đã được tạo thành công.\nSố tiền cọc cần trả (30%): ${depositAmount.toLocaleString()} VNĐ.\n\nBạn muốn thanh toán online ngay qua VNPAY chứ?`,
          [
            {
              text: 'Để sau (Không cọc)',
              style: 'cancel',
              onPress: () => {
                onConfirmSuccess();
              }
            },
            {
              text: 'Thanh toán ngay',
              style: 'default',
              onPress: async () => {
                try {
                  const resUrl = await fetch(`${API_BASE_URL}/bookings/${createdBooking.id}/vnpay-url`, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  const urlData = await resUrl.json();
                  if (urlData.success && urlData.paymentUrl) {
                    Linking.openURL(urlData.paymentUrl);
                  } else {
                    Alert.alert('Lỗi', 'Không thể khởi tạo liên kết thanh toán VNPAY.');
                  }
                } catch (e) {
                  Alert.alert('Lỗi', 'Không thể kết nối đến cổng thanh toán VNPAY.');
                }
                onConfirmSuccess();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Đặt Xe Thành Công 🎉',
          'Bạn đã đăng ký đặt xe bằng Tiền mặt.\nVui lòng đến trực tiếp cửa hàng Motov để nhận xe và thanh toán.'
        );
        onConfirmSuccess();
      }
    } else {
      const errMsg = (result.payload as string) || 'Không thể tạo đặt xe. Vui lòng thử lại.';
      Alert.alert('Đặt xe thất bại', errMsg);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thông Tin Đặt Xe</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBikeInfo}>
              <Image source={{ uri: selectedBike.image }} style={styles.modalBikeImage} />
              <Text style={styles.modalBikeName}>{selectedBike.name}</Text>
              <Text style={styles.modalBikePrice}>{selectedBike.price} VNĐ/ngày</Text>
            </View>

            {/* eKYC banner */}
            {!isVerified && (
              <View style={styles.kycBanner}>
                <Feather name="alert-triangle" size={16} color="#f59e0b" />
                <Text style={styles.kycBannerText}>
                  Tài khoản chưa xác minh danh tính (eKYC). Vui lòng hoàn thành xác thực tại trang Cá nhân trước khi đặt xe.
                </Text>
              </View>
            )}
            <View style={styles.modalForm}>
              {/* Pickup date */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Ngày nhận xe (YYYY-MM-DD)</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="calendar" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="2026-06-25"
                    placeholderTextColor="#666"
                    value={pickupDate}
                    onChangeText={setPickupDate}
                  />
                </View>
              </View>

              {/* Pickup time */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Giờ nhận xe (HH:MM)</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="clock" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="08:00"
                    placeholderTextColor="#666"
                    value={pickupTime}
                    onChangeText={setPickupTime}
                  />
                </View>
              </View>

              {/* Return date */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Ngày trả xe (YYYY-MM-DD)</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="calendar" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="2026-06-28"
                    placeholderTextColor="#666"
                    value={returnDate}
                    onChangeText={setReturnDate}
                  />
                </View>
              </View>

              {/* Return time */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Giờ trả xe (HH:MM)</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="clock" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="08:00"
                    placeholderTextColor="#666"
                    value={returnTime}
                    onChangeText={setReturnTime}
                  />
                </View>
              </View>

              {/* Payment Method Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Phương thức thanh toán</Text>
                <View style={styles.selectorGrid}>
                  <TouchableOpacity
                    style={[
                      styles.selectorItem,
                      paymentMethod === 'Banking' && styles.selectorItemSelected
                    ]}
                    onPress={() => setPaymentMethod('Banking')}
                  >
                    <Feather name="credit-card" size={14} color={paymentMethod === 'Banking' ? COLORS.accent : '#888'} style={{ marginRight: 6 }} />
                    <Text style={[styles.selectorItemText, paymentMethod === 'Banking' && styles.selectorItemTextSelected]}>VNPAY Banking</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.selectorItem,
                      paymentMethod === 'Cash' && styles.selectorItemSelected
                    ]}
                    onPress={() => {
                      setPaymentMethod('Cash');
                      setDeliveryMethod('StorePickup');
                    }}
                  >
                    <Feather name="user" size={14} color={paymentMethod === 'Cash' ? COLORS.accent : '#888'} style={{ marginRight: 6 }} />
                    <Text style={[styles.selectorItemText, paymentMethod === 'Cash' && styles.selectorItemTextSelected]}>Tiền mặt</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery Method Selector */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Hình thức giao nhận xe</Text>
                <View style={styles.selectorGrid}>
                  <TouchableOpacity
                    style={[
                      styles.selectorItem,
                      deliveryMethod === 'StorePickup' && styles.selectorItemSelected
                    ]}
                    onPress={() => setDeliveryMethod('StorePickup')}
                  >
                    <Text style={[styles.selectorItemText, deliveryMethod === 'StorePickup' && styles.selectorItemTextSelected]}>Nhận tại cửa hàng</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.selectorItem,
                      deliveryMethod === 'HomeDelivery' && styles.selectorItemSelected,
                      paymentMethod === 'Cash' && styles.selectorItemDisabled
                    ]}
                    disabled={paymentMethod === 'Cash'}
                    onPress={() => setDeliveryMethod('HomeDelivery')}
                  >
                    <Text style={[styles.selectorItemText, deliveryMethod === 'HomeDelivery' && styles.selectorItemTextSelected, paymentMethod === 'Cash' && { color: '#444' }]}>Giao xe tận nơi</Text>
                  </TouchableOpacity>
                </View>
                {paymentMethod === 'Cash' && (
                  <Text style={styles.warningText}>* Thanh toán tiền mặt bắt buộc nhận tại cửa hàng.</Text>
                )}
              </View>

              {/* Pickup location */}
              {deliveryMethod === 'HomeDelivery' && (
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Điểm nhận xe</Text>
                  <View style={styles.modalInputWithIcon}>
                    <Feather name="map-pin" size={16} color="#888" style={styles.modalInputIcon} />
                    <TextInput
                      style={styles.modalTextInput}
                      value={pickupLocation}
                      onChangeText={setPickupLocation}
                      placeholder="Nhập địa điểm nhận xe"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              )}

              {/* Promo code */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Mã giảm giá (tuỳ chọn)</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="tag" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Nhập mã voucher"
                    placeholderTextColor="#666"
                    autoCapitalize="characters"
                    value={promoCode}
                    onChangeText={setPromoCode}
                  />
                </View>
              </View>

              {/* Hóa đơn tóm tắt đặt cọc */}
              {rentalDays > 0 && (
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Số ngày thuê:</Text>
                    <Text style={styles.summaryValue}>{rentalDays} ngày</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.borderTop]}>
                    <Text style={styles.summaryLabel}>Tổng cộng:</Text>
                    <Text style={[styles.summaryValue, styles.totalText]}>{totalAmount.toLocaleString()} VNĐ</Text>
                  </View>
                  {paymentMethod === 'Banking' ? (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, styles.depositText]}>Đặt cọc giữ xe (VNPAY 30%):</Text>
                        <Text style={[styles.summaryValue, styles.depositText]}>{depositAmount.toLocaleString()} VNĐ</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Thanh toán còn lại (70%):</Text>
                        <Text style={styles.summaryValue}>{remainingAmount.toLocaleString()} VNĐ</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, styles.depositText]}>Đặt cọc giữ xe:</Text>
                        <Text style={[styles.summaryValue, styles.depositText]}>0 VNĐ (Không cần cọc)</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Thanh toán tại cửa hàng (100%):</Text>
                        <Text style={styles.summaryValue}>{totalAmount.toLocaleString()} VNĐ</Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmBtn, (loading || !isVerified) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={loading || !isVerified}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.accentDark} />
            ) : (
              <Text style={styles.confirmBtnText}>XÁC NHẬN ĐẶT XE</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    marginTop: 16,
  },
  modalBikeInfo: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  modalBikeImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  modalBikeName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalBikePrice: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  modalForm: {
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalTextInput: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 12,
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  kycBannerText: {
    flex: 1,
    color: '#f59e0b',
    fontSize: 12,
    lineHeight: 18,
  },
  summaryContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalText: {
    color: COLORS.accent,
    fontSize: 14,
  },
  depositText: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  selectorGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  selectorItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  selectorItemSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
  },
  selectorItemDisabled: {
    opacity: 0.35,
    borderColor: COLORS.border,
  },
  selectorItemText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectorItemTextSelected: {
    color: COLORS.accent,
  },
  warningText: {
    color: '#eab308',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
