import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';

export const OwnerBikesScreen: React.FC = () => {
  const bikes = useAppSelector(state => state.bikes.bikes);
  
  // Mocking owner's bikes
  const myBikes = bikes.filter(b => b.id === 'cb300r' || b.id === 'xsr155' || b.id === 'ninja400');

  const handleAddBike = () => {
    Alert.alert('Tính Năng Đang Phát Triển', 'Phiên bản di động đang được cập nhật tính năng đăng ký thông tin cà vẹt xe mới!');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Xe Của Tôi</Text>
        <Text style={styles.pageSubtitle}>Quản lý thông tin và trạng thái xe đăng ký cho thuê</Text>
      </View>

      {/* Add Bike Button */}
      <TouchableOpacity style={styles.addBtn} onPress={handleAddBike}>
        <Feather name="plus-circle" size={16} color={COLORS.accentDark} style={{ marginRight: 6 }} />
        <Text style={styles.addBtnText}>ĐĂNG KÝ XE MỚI</Text>
      </TouchableOpacity>

      {/* Bikes list */}
      <View style={styles.bikesList}>
        {myBikes.map(bike => (
          <View key={bike.id} style={styles.bikeCard}>
            <Image source={{ uri: bike.image }} style={styles.bikeImage} />
            <View style={styles.bikeInfo}>
              <View>
                <View style={styles.bikeHeader}>
                  <Text style={styles.bikeName}>{bike.name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Hoạt động</Text>
                  </View>
                </View>
                <Text style={styles.bikeType}>{bike.type}</Text>
              </View>
              <View style={styles.bikeFooter}>
                <Text style={styles.price}>{bike.price} đ/ngày</Text>
                <TouchableOpacity style={styles.editBtn}>
                  <Feather name="edit-2" size={12} color={COLORS.accent} />
                  <Text style={styles.editBtnText}>Sửa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtnText: {
    color: COLORS.accentDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
  bikesList: {
    gap: 16,
  },
  bikeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
  },
  bikeImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  bikeInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: COLORS.approvedBg,
    borderColor: COLORS.approvedBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: COLORS.approved,
    fontSize: 9,
    fontWeight: 'bold',
  },
  bikeType: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  bikeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editBtnText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
