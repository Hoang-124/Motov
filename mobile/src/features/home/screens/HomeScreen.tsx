import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  homeDate: string;
  setHomeDate: (val: string) => void;
  homeLocation: string;
  setHomeLocation: (val: string) => void;
  showLocationPicker: boolean;
  setShowLocationPicker: (val: boolean) => void;
  handleHomeSearch: () => void;
  handleOpenBooking: (bike: Bike) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  homeDate,
  setHomeDate,
  homeLocation,
  setHomeLocation,
  showLocationPicker,
  setShowLocationPicker,
  handleHomeSearch,
  handleOpenBooking,
}) => {
  const bikes = useAppSelector(state => state.bikes.bikes);
  const featuredBikes = bikes.filter(b => b.featured);

  return (
    <View style={styles.tabContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>MOTOV</Text>
          <Text style={styles.subtitle}>THUÊ XE MÁY ĐÀ NẴNG</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Feather name="bell" size={18} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Search Form Card */}
      <View style={styles.searchCard}>
        <Text style={styles.cardTitle}>Tìm Kiếm Xe</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngày Nhận/Trả</Text>
          <View style={styles.inputWithIcon}>
            <Feather name="calendar" size={16} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.textInputWithIcon}
              placeholder="Ví dụ: 25/05 - 28/05"
              placeholderTextColor="#666"
              value={homeDate}
              onChangeText={setHomeDate}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa Điểm Nhận Xe</Text>
          <TouchableOpacity 
            style={styles.pickerSelector} 
            onPress={() => setShowLocationPicker(!showLocationPicker)}
          >
            <View style={styles.pickerSelectorLeft}>
              <Feather name="map-pin" size={16} color="#888" style={styles.inputIcon} />
              <Text style={styles.pickerSelectorText}>{homeLocation}</Text>
            </View>
            <Feather name={showLocationPicker ? "chevron-up" : "chevron-down"} size={16} color="#888" />
          </TouchableOpacity>
        </View>

        {showLocationPicker && (
          <View style={styles.pickerDropdown}>
            {['Sân bay Đà Nẵng', 'Ga Đà Nẵng', 'Bán đảo Sơn Trà', 'Khách sạn Mỹ Khê'].map(loc => (
              <TouchableOpacity 
                key={loc}
                style={styles.pickerDropdownItem}
                onPress={() => {
                  setHomeLocation(loc);
                  setShowLocationPicker(false);
                }}
              >
                <Text style={[styles.pickerDropdownItemText, homeLocation === loc && styles.pickerDropdownItemTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.searchBtn} onPress={handleHomeSearch}>
          <Text style={styles.searchBtnText}>TÌM XE NGAY</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="zap" size={16} color={COLORS.accent} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>DÒNG XE ĐƯỢC YÊU THÍCH</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
          {featuredBikes.map(bike => (
            <View key={bike.id} style={styles.featuredCard}>
              <View style={styles.featuredImageContainer}>
                <Image source={{ uri: bike.image }} style={styles.featuredImage} />
                <View style={styles.featuredCardBadge}>
                  <Ionicons name="star" size={10} color={COLORS.accent} />
                  <Text style={styles.featuredCardBadgeText}>4.9</Text>
                </View>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredName}>{bike.name}</Text>
                <Text style={styles.featuredPrice}>{bike.price} VNĐ/ngày</Text>
                <TouchableOpacity 
                  style={styles.featuredBookBtn} 
                  onPress={() => handleOpenBooking(bike)}
                >
                  <Text style={styles.featuredBookBtnText}>ĐẶT NGAY</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerIconBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  searchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInputWithIcon: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 12,
    fontSize: 14,
  },
  pickerSelector: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerSelectorText: {
    color: COLORS.text,
    fontSize: 14,
  },
  pickerDropdown: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 4,
  },
  pickerDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerDropdownItemText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  pickerDropdownItemTextActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  searchBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  searchBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  featuredList: {
    paddingBottom: 10,
  },
  featuredCard: {
    backgroundColor: COLORS.card,
    width: width * 0.65,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featuredImageContainer: {
    position: 'relative',
    height: 130,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
  },
  featuredCardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredCardBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  featuredInfo: {
    padding: 14,
  },
  featuredName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredPrice: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuredBookBtn: {
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  featuredBookBtnText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
