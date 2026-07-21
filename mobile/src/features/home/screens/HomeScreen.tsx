import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { PromotionsModal } from '../components/PromotionsModal';
import { NotificationModal } from '../components/NotificationModal';
import { BikeDetailModal } from '../../bikes/components/BikeDetailModal';
import { DatePickerModal } from '../../../components/DatePickerModal';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';

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
  setActiveTab: (val: 'home' | 'bikes' | 'bookings' | 'profile') => void;
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
  setActiveTab,
}) => {
  const bikes = useAppSelector(state => state.bikes.bikes);
  const token = useAppSelector(state => state.user.token);
  const role = useAppSelector(state => state.user.role);

  const [promotionsVisible, setPromotionsVisible] = useState(false);
  const [notiVisible, setNotiVisible] = useState(false);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [detailBike, setDetailBike] = useState<Bike | null>(null);

  const featuredBikes = bikes.filter(b => b.featured);
  const otherBikes = bikes.filter(b => !b.featured).slice(0, 3);

  // Poll for unread notification count
  useEffect(() => {
    if (!token || role === 'guest') return;

    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const response = await apiFetch('/notifications');
        const data = await response.json();
        if (isMounted && data.success) {
          setUnreadNotiCount(data.unreadCount);
        }
      } catch (e) {
        console.error('Lỗi khi fetch count notifications:', e);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s instead of 15s to be more gentle
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, role]);

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.tabContent}>
      {/* Hero Section with Background Image */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800' }}
        style={styles.heroBackground}
        imageStyle={styles.heroBackgroundImage}
      >
        <View style={styles.heroOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.logo}>MOTOV</Text>
              <Text style={styles.subtitle}>THUÊ XE MÁY ĐÀ NẴNG</Text>
            </View>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => {
                if (role === 'guest') {
                  Alert.alert('Đăng Nhập', 'Vui lòng đăng nhập để xem thông báo.');
                } else {
                  setNotiVisible(true);
                }
              }}
            >
              <Feather name="bell" size={18} color={COLORS.accent} />
              {unreadNotiCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadNotiCount > 99 ? '99+' : unreadNotiCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Hero Typography */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>TỰ DO KHÁM PHÁ</Text>
            <Text style={styles.heroTitleAccent}>ĐƯỜNG PHỐ</Text>
            <Text style={styles.heroDescription}>
              Trải nghiệm dịch vụ thuê xe máy cao cấp chất lượng hàng đầu. Giao nhận xe tận nơi nhanh chóng, thủ tục đơn giản.
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Search Form Card (Overlapping Hero Section) */}
      <View style={styles.searchCardContainer}>
        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>Tìm Kiếm Xe</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày Nhận Xe</Text>
            <TouchableOpacity 
              style={styles.pickerSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.pickerSelectorLeft}>
                <Feather name="calendar" size={16} color="#888" style={styles.inputIcon} />
                <Text style={styles.pickerSelectorText}>
                  {homeDate || 'Chọn ngày nhận xe'}
                </Text>
              </View>
              <Feather name="chevron-down" size={16} color="#888" />
            </TouchableOpacity>
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
              {['Sân bay Đà Nẵng', 'Bán đảo Sơn Trà', 'Trung tâm Thành phố'].map(loc => (
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
      </View>

      {/* Banner Khuyến Mãi */}
      <View style={styles.promoBannerContainer}>
        <TouchableOpacity 
          style={styles.promoBanner}
          onPress={() => setPromotionsVisible(true)}
        >
          <View style={styles.promoBannerLeft}>
            <View style={styles.giftIconWrapper}>
              <Feather name="gift" size={16} color={COLORS.accentDark} />
            </View>
            <View>
              <Text style={styles.promoBannerTitle}>SIÊU ƯU ĐÃI THÁNG 6</Text>
              <Text style={styles.promoBannerSub}>Nhận voucher giảm giá đến 50K!</Text>
            </View>
          </View>
          <View style={styles.promoBannerRight}>
            <Text style={styles.promoBannerAction}>XEM MÃ</Text>
            <Feather name="chevron-right" size={14} color={COLORS.accent} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Promotions Modal */}
      <PromotionsModal
        visible={promotionsVisible}
        onClose={() => setPromotionsVisible(false)}
      />

      {/* Notification Modal */}
      <NotificationModal
        visible={notiVisible}
        onClose={() => setNotiVisible(false)}
        token={token}
        onUpdateCount={setUnreadNotiCount}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={homeDate || new Date().toISOString().slice(0, 10)}
        onSelectDate={(date) => setHomeDate(date)}
        minDate={new Date().toISOString().slice(0, 10)}
        title="Chọn ngày nhận xe"
      />

      {/* Featured Section */}
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Feather name="zap" size={16} color={COLORS.accent} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>DÒNG XE ĐƯỢC YÊU THÍCH</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList} contentContainerStyle={styles.featuredListContent}>
          {featuredBikes.map(bike => (
            <View key={bike.id} style={styles.featuredCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setDetailBike(bike)}
              >
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
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* High Quality Section */}
      <View style={styles.highQualitySection}>
        <Text style={styles.highQualityTitle}>THUÊ XE ĐÀ NẴNG</Text>
        <Text style={styles.highQualityTitleAccent}>CHẤT LƯỢNG CAO</Text>
        <Text style={styles.highQualityDesc}>
          Trải nghiệm những dòng xe hiện đại, được bảo dưỡng định kỳ, đảm bảo an toàn tuyệt đối cho mọi chuyến đi của bạn. Khám phá thành phố biển xinh đẹp không giới hạn.
        </Text>

        {/* Bullet points */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Feather name="check" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureItemTitle}>Bảo Dưỡng Định Kỳ</Text>
              <Text style={styles.featureItemDesc}>Mỗi xe đều được kiểm tra kỹ lưỡng trước khi giao</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Feather name="check" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureItemTitle}>Hỗ Trợ 24/7</Text>
              <Text style={styles.featureItemDesc}>Đội ngũ kỹ thuật hỗ trợ tận nơi trên mọi hành trình</Text>
            </View>
          </View>
        </View>

        {/* Non-featured Bikes List */}
        <View style={styles.otherBikesContainer}>
          {otherBikes.map(bike => (
            <TouchableOpacity
              key={bike.id}
              style={styles.otherBikeCard}
              activeOpacity={0.85}
              onPress={() => setDetailBike(bike)}
            >
              <Image source={{ uri: bike.image }} style={styles.otherBikeImage} />
              <View style={styles.otherBikeInfo}>
                <Text style={styles.otherBikeName}>{bike.name}</Text>
                <Text style={styles.otherBikeType}>{bike.type}</Text>
                <View style={styles.otherBikeBottom}>
                  <Text style={styles.otherBikePrice}>{bike.price} đ/ngày</Text>
                  <TouchableOpacity 
                    style={styles.otherBikeBookBtn}
                    onPress={() => handleOpenBooking(bike)}
                  >
                    <Text style={styles.otherBikeBookText}>ĐẶT XE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Banner CTA */}
      <View style={styles.bannerCta}>
        <Text style={styles.bannerTitle}>KHÁM PHÁ ĐÀ NẴNG</Text>
        <Text style={styles.bannerTitleSub}>THEO CÁCH RIÊNG BẠN</Text>
        <TouchableOpacity 
          style={styles.bannerBtn}
          onPress={() => setActiveTab('bikes')}
        >
          <Text style={styles.bannerBtnText}>ĐẶT CHỖ NGAY</Text>
        </TouchableOpacity>
      </View>
      </View>

      {/* Bike Detail Modal */}
      <BikeDetailModal
        visible={!!detailBike}
        onClose={() => setDetailBike(null)}
        bike={detailBike}
        onBooking={handleOpenBooking}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContentContainer: {
    paddingBottom: 90,
  },
  tabContent: {
    backgroundColor: COLORS.bg,
  },
  heroBackground: {
    width: '100%',
    height: 340,
  },
  heroBackgroundImage: {
    opacity: 0.6,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    padding: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerIconBtn: {
    backgroundColor: 'rgba(24, 24, 27, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.6)',
    padding: 10,
    borderRadius: 20,
  },
  logo: {
    fontSize: 28,
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
  heroTextContainer: {
    marginBottom: 50,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitleAccent: {
    color: COLORS.accent,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: -5,
  },
  heroDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
    maxWidth: '90%',
  },
  searchCardContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
    zIndex: 10,
  },
  searchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
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
    marginBottom: 14,
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
    marginTop: 6,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  searchBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  featuredSection: {
    marginTop: 35,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
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
  featuredListContent: {
    paddingLeft: 20,
    paddingRight: 4,
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
  highQualitySection: {
    marginTop: 40,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  highQualityTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  highQualityTitleAccent: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: '900',
    marginTop: -2,
  },
  highQualityDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  featuresList: {
    marginTop: 20,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(190, 242, 100, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureItemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureItemDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  otherBikesContainer: {
    marginTop: 30,
    gap: 14,
  },
  otherBikeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    flexDirection: 'row',
  },
  otherBikeImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  otherBikeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  otherBikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  otherBikeType: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  otherBikeBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  otherBikePrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  otherBikeBookBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  otherBikeBookText: {
    color: COLORS.accentDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bannerCta: {
    marginTop: 40,
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  bannerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  bannerTitleSub: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: -2,
  },
  bannerBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  promoBannerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  promoBanner: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(190, 242, 100, 0.25)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  giftIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBannerTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  promoBannerSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  promoBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoBannerAction: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
