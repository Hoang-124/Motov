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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bike, Booking } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { useAppDispatch } from '../../../app/store';
import { addBooking } from '../bookingsSlice';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  selectedBike: Bike | null;
  initialDate: string;
  initialLocation: string;
  onConfirmSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  onClose,
  selectedBike,
  initialDate,
  initialLocation,
  onConfirmSuccess,
}) => {
  const dispatch = useAppDispatch();
  
  // Local state for form input values
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookLocation, setBookLocation] = useState('');

  // Set initial form values when modal opens
  useEffect(() => {
    if (visible) {
      setBookDate(initialDate || '25/05 - 28/05');
      setBookLocation(initialLocation || 'Sân bay Đà Nẵng');
    }
  }, [visible, initialDate, initialLocation]);

  if (!selectedBike) return null;

  const handleConfirm = () => {
    if (!fullName || !phone || !license) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin cá nhân.');
      return;
    }

    const newBooking: Booking = {
      id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
      bikeId: selectedBike.id,
      bikeName: selectedBike.name,
      image: selectedBike.image,
      price: selectedBike.price,
      date: bookDate,
      location: bookLocation,
      fullName,
      phone,
      status: 'Chờ duyệt',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    dispatch(addBooking(newBooking));
    
    // Reset Form
    setFullName('');
    setPhone('');
    setLicense('');

    // Trigger success callback
    onConfirmSuccess();
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

            <View style={styles.modalForm}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Họ và tên</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="user" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Nhập đầy đủ họ tên"
                    placeholderTextColor="#666"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Số điện thoại</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="phone" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Nhập số điện thoại liên lạc"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Số GPLX (Bằng lái)</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="credit-card" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Nhập số bằng lái xe máy"
                    placeholderTextColor="#666"
                    value={license}
                    onChangeText={setLicense}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Ngày thuê</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="calendar" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Ví dụ: 25/05 - 28/05"
                    placeholderTextColor="#666"
                    value={bookDate}
                    onChangeText={setBookDate}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Điểm nhận xe</Text>
                <View style={styles.modalInputWithIcon}>
                  <Feather name="map-pin" size={16} color="#888" style={styles.modalInputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    value={bookLocation}
                    onChangeText={setBookLocation}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>XÁC NHẬN ĐẶT XE</Text>
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
    maxHeight: '85%',
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
  confirmBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
