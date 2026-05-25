import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// 1. Definition of a Bike structure
interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  specs: string[];
  image: string;
  featured: boolean;
}

// Offline-first fallback mock data
const LOCAL_BIKES: Bike[] = [
  {
    id: 'cb300r',
    name: 'Honda CB300R',
    price: '120.000',
    type: 'Sport Cafe',
    specs: ['Chế Độ Lái Thể Thao', 'Phanh ABS', 'Cốp Phụ Nhỏ', 'Tiết Kiệm Xăng'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
    featured: true,
  },
  {
    id: 'xsr155',
    name: 'Yamaha XSR155',
    price: '150.000',
    type: 'Classic',
    specs: ['Kiểu Dáng Cổ Điển', 'Động Cơ VVA', 'Phuộc USD', 'Côn Tay'],
    image: 'https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'vespa',
    name: 'Vespa GTS Super Sport',
    price: '150.000',
    type: 'Scooter',
    specs: ['Sang Trọng', 'Phanh ABS / ASR', 'Hộc Để Đồ Trực Diện', 'Smartkey'],
    image: 'https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'ninja400',
    name: 'Kawasaki Ninja 400',
    price: '250.000',
    type: 'Sport',
    specs: ['Động Cơ 2 Xi-lanh', 'Ly Hợp Chống Trượt', 'Tư Thế Lái Thể Thao', 'Hệ Thống Đèn LED'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
    featured: true,
  },
  {
    id: 'vision',
    name: 'Honda Vision 110cc',
    price: '80.000',
    type: 'Scooter',
    specs: ['Khóa Smartkey', 'Động Cơ eSP', 'Cốp Xe Rộng', 'Siêu Tiết Kiệm Xăng'],
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'exciter155',
    name: 'Yamaha Exciter 155 VVA',
    price: '100.000',
    type: 'Underbone',
    specs: ['Động cơ VVA 155cc', 'Côn Tay Thể Thao', 'Khóa Thông Minh', 'Phanh Đĩa Thủy Lực'],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
    featured: true,
  }
];

interface Booking {
  id: string;
  bikeId: string;
  bikeName: string;
  image: string;
  price: string;
  date: string;
  location: string;
  fullName: string;
  phone: string;
  status: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'bikes' | 'bookings' | 'profile'>('home');
  const [bikes, setBikes] = useState<Bike[]>(LOCAL_BIKES);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  
  // Home search state
  const [homeDate, setHomeDate] = useState('');
  const [homeLocation, setHomeLocation] = useState('Sân bay Đà Nẵng');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Booking Modal state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  
  // Booking Form state
  const [bookDate, setBookDate] = useState('');
  const [bookLocation, setBookLocation] = useState('Sân bay Đà Nẵng');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');

  // Fetch bikes from local Express server
  useEffect(() => {
    // Falls back to LOCAL_BIKES if offline
    fetch('http://10.0.2.2:5000/api/bikes') // 10.0.2.2 is local host address for Android Emulators
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setBikes(data);
      })
      .catch(err => {
        console.log("Using offline mock data. Server is offline.");
      });
  }, []);

  const handleHomeSearch = () => {
    // Apply parameters and switch tab
    setSelectedType('All');
    if (homeDate) {
      setSearchQuery(homeDate);
    }
    setActiveTab('bikes');
  };

  const handleOpenBooking = (bike: Bike) => {
    setSelectedBike(bike);
    setBookDate(homeDate || '25/05 - 28/05');
    setBookLocation(homeLocation);
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = () => {
    if (!fullName || !phone || !license) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin cá nhân.');
      return;
    }

    if (!selectedBike) return;

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

    setBookings([newBooking, ...bookings]);
    setBookingModalVisible(false);
    
    // Reset Form
    setFullName('');
    setPhone('');
    setLicense('');

    Alert.alert('Thành Công', 'Đơn đặt xe của bạn đã được ghi nhận và đang chờ duyệt!', [
      { text: 'Xem đơn hàng', onPress: () => setActiveTab('bookings') },
      { text: 'Quay lại', style: 'cancel' }
    ]);
  };

  const handleCancelBooking = (id: string) => {
    Alert.alert(
      'Hủy Đơn',
      'Bạn có chắc chắn muốn hủy đơn thuê xe này không?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Có', 
          style: 'destructive', 
          onPress: () => {
            setBookings(bookings.filter(b => b.id !== id));
          } 
        }
      ]
    );
  };

  // Filter logic
  const filteredBikes = bikes.filter(bike => {
    const matchesSearch = bike.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          bike.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || bike.type === selectedType;
    return matchesSearch && matchesType;
  });

  const featuredBikes = bikes.filter(b => b.featured);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- RENDER CURRENT TAB VIEW --- */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>MOTOV</Text>
              <Text style={styles.subtitle}>THUÊ XE MÁY ĐÀ NẴNG</Text>
            </View>

            {/* Search Form Card */}
            <View style={styles.searchCard}>
              <Text style={styles.cardTitle}>Tìm Kiếm Xe</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📅 Ngày Nhận/Trả</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: 25/05 - 28/05"
                  placeholderTextColor="#666"
                  value={homeDate}
                  onChangeText={setHomeDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📍 Địa Điểm Nhận Xe</Text>
                <TouchableOpacity 
                  style={styles.pickerSelector} 
                  onPress={() => setShowLocationPicker(!showLocationPicker)}
                >
                  <Text style={styles.pickerSelectorText}>{homeLocation}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
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
                <Text style={styles.sectionTitle}>🔥 DÒNG XE ĐƯỢC YÊU THÍCH</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
                {featuredBikes.map(bike => (
                  <View key={bike.id} style={styles.featuredCard}>
                    <Image source={{ uri: bike.image }} style={styles.featuredImage} />
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
        )}

        {activeTab === 'bikes' && (
          <View style={styles.tabContent}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.pageTitle}>Dòng Xe Cho Thuê</Text>
              <TextInput
                style={styles.searchBarInput}
                placeholder="🔍 Tìm tên hoặc loại xe..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Categories horizontal scroll */}
            <View style={styles.categoryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', 'Scooter', 'Classic', 'Sport Cafe', 'Sport', 'Underbone'].map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryTab, selectedType === category && styles.categoryTabActive]}
                    onPress={() => setSelectedType(category)}
                  >
                    <Text style={[styles.categoryTabText, selectedType === category && styles.categoryTabTextActive]}>
                      {category === 'All' ? 'Tất cả' : category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bikes List */}
            <View style={styles.bikesGrid}>
              {filteredBikes.map(bike => (
                <View key={bike.id} style={styles.bikeListCard}>
                  <Image source={{ uri: bike.image }} style={styles.bikeListImage} />
                  <View style={styles.bikeListInfo}>
                    <Text style={styles.bikeListName}>{bike.name}</Text>
                    <Text style={styles.bikeListPrice}>{bike.price} VNĐ/ngày</Text>
                    <Text style={styles.bikeListType}>🏷️ {bike.type}</Text>
                    
                    <View style={styles.specsContainer}>
                      {bike.specs.slice(0, 2).map((spec, i) => (
                        <Text key={i} style={styles.specTag}>• {spec}</Text>
                      ))}
                    </View>

                    <TouchableOpacity 
                      style={styles.bikeListBookBtn}
                      onPress={() => handleOpenBooking(bike)}
                    >
                      <Text style={styles.bikeListBookBtnText}>ĐẶT XE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {filteredBikes.length === 0 && (
                <Text style={styles.emptyText}>Không tìm thấy xe phù hợp.</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'bookings' && (
          <View style={styles.tabContent}>
            <Text style={styles.pageTitle}>Đơn Thuê Của Bạn</Text>
            
            {bookings.length > 0 ? (
              <View style={styles.bookingsContainer}>
                {bookings.map(booking => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <Image source={{ uri: booking.image }} style={styles.bookingImage} />
                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingHeader}>
                        <Text style={styles.bookingCode}>{booking.id}</Text>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{booking.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.bookingName}>{booking.bikeName}</Text>
                      <Text style={styles.bookingText}>📅 Ngày: {booking.date}</Text>
                      <Text style={styles.bookingText}>📍 Nơi nhận: {booking.location}</Text>
                      <Text style={styles.bookingPrice}>Tổng cộng: {booking.price} VNĐ/ngày</Text>
                      
                      <TouchableOpacity 
                        style={styles.cancelBtn}
                        onPress={() => handleCancelBooking(booking.id)}
                      >
                        <Text style={styles.cancelBtnText}>Hủy Đơn</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBookings}>
                <Text style={styles.emptyBookingsIcon}>📅</Text>
                <Text style={styles.emptyBookingsText}>Bạn chưa có đơn thuê xe nào.</Text>
                <TouchableOpacity style={styles.exploreBtn} onPress={() => setActiveTab('bikes')}>
                  <Text style={styles.exploreBtnText}>Tìm Xe Ngay</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={styles.pageTitle}>Cá Nhân</Text>
            
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarPlaceholder}>👤</Text>
              </View>
              <Text style={styles.profileName}>Khách Hàng Motov</Text>
              <Text style={styles.profileEmail}>khachhang@motov.com</Text>
              <View style={styles.tagMember}>
                <Text style={styles.tagMemberText}>Thành viên Bạc 🥈</Text>
              </View>
            </View>

            <View style={styles.profileMenu}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>📝 Hướng dẫn đặt xe</Text>
                <Text style={styles.menuItemArrow}>❯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>🛡️ Chính sách bảo hiểm</Text>
                <Text style={styles.menuItemArrow}>❯</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>📞 Liên hệ hỗ trợ khách hàng</Text>
                <Text style={styles.menuItemArrow}>❯</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Motov App v1.0.0 (Expo)</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- BOTTOM TAB NAVIGATION BAR --- */}
      <View style={styles.tabBar}>
        {[
          { id: 'home', label: 'Trang chủ', icon: '🏠' },
          { id: 'bikes', label: 'Dòng xe', icon: '🏍️' },
          { id: 'bookings', label: 'Đơn thuê', icon: '📅' },
          { id: 'profile', label: 'Cá nhân', icon: '👤' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabIcon, activeTab === tab.id && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- BOOKING MODAL FORM --- */}
      {selectedBike && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={bookingModalVisible}
          onRequestClose={() => setBookingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thông Tin Đặt Xe</Text>
                <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                  <Text style={styles.closeModalBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.modalBikeInfo}>
                  <Image source={{ uri: selectedBike.image }} style={styles.modalBikeImage} />
                  <Text style={styles.modalBikeName}>{selectedBike.name}</Text>
                  <Text style={styles.modalBikePrice}>{selectedBike.price} VNĐ/ngày</Text>
                </View>

                <View style={styles.modalForm}>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Họ và tên</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Nhập đầy đủ họ tên"
                      placeholderTextColor="#666"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Số điện thoại</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Nhập số điện thoại liên lạc"
                      placeholderTextColor="#666"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Số GPLX (Bằng lái)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Nhập số bằng lái xe máy"
                      placeholderTextColor="#666"
                      value={license}
                      onChangeText={setLicense}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Ngày thuê</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ví dụ: 25/05 - 28/05"
                      placeholderTextColor="#666"
                      value={bookDate}
                      onChangeText={setBookDate}
                    />
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>Điểm nhận xe</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={bookLocation}
                      onChangeText={setBookLocation}
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking}>
                <Text style={styles.confirmBtnText}>XÁC NHẬN ĐẶT XE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    paddingBottom: 90,
  },
  tabContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ccff00',
    letterSpacing: 3,
    textShadowColor: 'rgba(204, 255, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#131313',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  pickerSelector: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerSelectorText: {
    color: '#fff',
    fontSize: 13,
  },
  pickerArrow: {
    color: '#888',
    fontSize: 10,
  },
  pickerDropdown: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    marginBottom: 16,
  },
  pickerDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  pickerDropdownItemText: {
    color: '#888',
    fontSize: 13,
  },
  pickerDropdownItemTextActive: {
    color: '#ccff00',
    fontWeight: 'bold',
  },
  searchBtn: {
    backgroundColor: '#ccff00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  searchBtnText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ccff00',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  featuredList: {
    paddingBottom: 10,
  },
  featuredCard: {
    backgroundColor: '#131313',
    width: width * 0.65,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  featuredImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#222',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredPrice: {
    color: '#ccff00',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuredBookBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccff00',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  featuredBookBtnText: {
    color: '#ccff00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pageTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 10,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBarInput: {
    backgroundColor: '#131313',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#131313',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: '#ccff00',
  },
  categoryTabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#ccff00',
  },
  bikesGrid: {
    marginTop: 10,
  },
  bikeListCard: {
    backgroundColor: '#131313',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
  },
  bikeListImage: {
    width: 110,
    height: '100%',
    minHeight: 120,
    backgroundColor: '#222',
  },
  bikeListInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  bikeListName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bikeListPrice: {
    color: '#ccff00',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bikeListType: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 2,
  },
  specsContainer: {
    marginVertical: 6,
  },
  specTag: {
    color: '#666',
    fontSize: 10,
    marginBottom: 1,
  },
  bikeListBookBtn: {
    backgroundColor: '#ccff00',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  bikeListBookBtnText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 11,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  bookingsContainer: {
    marginTop: 10,
  },
  bookingCard: {
    backgroundColor: '#131313',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  bookingImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#222',
  },
  bookingDetails: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCode: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'orange',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'orange',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookingText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  bookingPrice: {
    color: '#ccff00',
    fontSize: 13,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyBookings: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyBookingsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyBookingsText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: '#ccff00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: '#131313',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    fontSize: 36,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#666',
    fontSize: 13,
    marginBottom: 12,
  },
  tagMember: {
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagMemberText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileMenu: {
    backgroundColor: '#131313',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  menuItemText: {
    color: '#ccc',
    fontSize: 13,
  },
  menuItemArrow: {
    color: '#555',
    fontSize: 11,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    color: '#444',
    fontSize: 11,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#131313',
    borderTopWidth: 1,
    borderTopColor: '#222',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
    color: '#666',
  },
  tabIconActive: {
    color: '#ccff00',
  },
  tabLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#ccff00',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131313',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeModalBtn: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
  modalScroll: {
    marginTop: 16,
  },
  modalBikeInfo: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 16,
  },
  modalBikeImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  modalBikeName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalBikePrice: {
    color: '#ccff00',
    fontSize: 15,
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
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: '#ccff00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
    fontSize: 14,
  },
});