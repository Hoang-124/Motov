import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider } from 'react-redux';

// Imports from modular structure
import { store, useAppDispatch, useAppSelector } from './src/app/store';
import { Bike } from './src/types';
import { COLORS } from './src/theme/colors';
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import { BikesScreen } from './src/features/bikes/screens/BikesScreen';
import { BookingsScreen } from './src/features/bookings/screens/BookingsScreen';
import { ProfileScreen } from './src/features/profile/screens/ProfileScreen';
import { BookingModal } from './src/features/bookings/components/BookingModal';
import { fetchBikes } from './src/features/bikes/bikesSlice';

// Import Owner screens
import { OwnerDashboardScreen } from './src/features/owner/screens/OwnerDashboardScreen';
import { OwnerBikesScreen } from './src/features/owner/screens/OwnerBikesScreen';
import { OwnerBookingsScreen } from './src/features/owner/screens/OwnerBookingsScreen';

// Import Staff screens
import { StaffBookingsScreen } from './src/features/staff/screens/StaffBookingsScreen';
import { StaffBikesScreen } from './src/features/staff/screens/StaffBikesScreen';

// Import Admin screens
import { AdminDashboardScreen } from './src/features/admin/screens/AdminDashboardScreen';
import { AdminBikesScreen } from './src/features/admin/screens/AdminBikesScreen';
import { AdminBookingsScreen } from './src/features/admin/screens/AdminBookingsScreen';
import { AdminUsersScreen } from './src/features/admin/screens/AdminUsersScreen';

const renderTabIcon = (tabId: string, isActive: boolean) => {
  const color = isActive ? COLORS.accent : COLORS.textMuted;
  const size = 20;
  switch (tabId) {
    case 'home':
      return <Feather name="home" size={size} color={color} />;
    case 'bikes':
    case 'owner_bikes':
    case 'admin_bikes':
    case 'staff_bikes':
      return <MaterialCommunityIcons name="motorbike" size={24} color={color} style={{ marginTop: -2 }} />;
    case 'bookings':
    case 'owner_bookings':
    case 'staff_bookings':
    case 'admin_bookings':
      return <Feather name="calendar" size={size} color={color} />;
    case 'owner_dashboard':
    case 'admin_dashboard':
      return <Feather name="trending-up" size={size} color={color} />;
    case 'admin_users':
      return <Feather name="users" size={size} color={color} />;
    case 'profile':
      return <Feather name="user" size={size} color={color} />;
    default:
      return null;
  }
};

function MainApp() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.user.role);
  const [activeTab, setActiveTab] = useState<string>('home');

  // Reset tab on role switch
  useEffect(() => {
    if (role === 'admin') {
      setActiveTab('admin_dashboard');
    } else if (role === 'owner') {
      setActiveTab('owner_dashboard');
    } else if (role === 'staff') {
      setActiveTab('staff_bookings');
    } else {
      setActiveTab('home');
    }
  }, [role]);

  // Home search state
  const [homeDate, setHomeDate] = useState('');
  const [homeLocation, setHomeLocation] = useState('Sân bay Đà Nẵng');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Booking Modal state
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);

  // Fetch bikes from local Express server on mount via Redux Thunk
  useEffect(() => {
    dispatch(fetchBikes());
  }, [dispatch]);

  const handleHomeSearch = () => {
    setActiveTab('bikes');
  };

  const handleOpenBooking = (bike: Bike) => {
    if (role === 'guest') {
      Alert.alert('Yêu Cầu Đăng Nhập', 'Vui lòng chuyển đổi sang phân hệ Khách Thuê Xe trong tab Cá nhân để đăng ký đặt xe!', [
        { text: 'Đến Cá nhân', onPress: () => setActiveTab('profile') },
        { text: 'Hủy', style: 'cancel' }
      ]);
      return;
    }
    setSelectedBike(bike);
    setBookingModalVisible(true);
  };

  const handleConfirmSuccess = () => {
    setBookingModalVisible(false);
    Alert.alert('Thành Công', 'Đơn đặt xe của bạn đã được ghi nhận và đang chờ duyệt!', [
      { text: 'Xem đơn hàng', onPress: () => setActiveTab('bookings') },
      { text: 'Quay lại', style: 'cancel' }
    ]);
  };

  // Determine bottom tab links dynamically
  const getTabs = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'admin_dashboard', label: 'Thống kê' },
          { id: 'admin_bikes', label: 'Quản lý xe' },
          { id: 'admin_bookings', label: 'Toàn bộ đơn' },
          { id: 'admin_users', label: 'Phân quyền' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'owner':
        return [
          { id: 'owner_dashboard', label: 'Doanh thu' },
          { id: 'owner_bikes', label: 'Xe của tôi' },
          { id: 'owner_bookings', label: 'Yêu cầu' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'staff':
        return [
          { id: 'staff_bookings', label: 'Duyệt đơn' },
          { id: 'staff_bikes', label: 'Kiểm tra xe' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'customer':
        return [
          { id: 'home', label: 'Trang chủ' },
          { id: 'bikes', label: 'Dòng xe' },
          { id: 'bookings', label: 'Đơn thuê' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      default: // guest
        return [
          { id: 'home', label: 'Trang chủ' },
          { id: 'bikes', label: 'Dòng xe' },
          { id: 'profile', label: 'Cá nhân' }
        ];
    }
  };

  const tabs = getTabs();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- RENDER CURRENT TAB VIEW --- */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'home' && (
          <HomeScreen
            homeDate={homeDate}
            setHomeDate={setHomeDate}
            homeLocation={homeLocation}
            setHomeLocation={setHomeLocation}
            showLocationPicker={showLocationPicker}
            setShowLocationPicker={setShowLocationPicker}
            handleHomeSearch={handleHomeSearch}
            handleOpenBooking={handleOpenBooking}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'bikes' && (
          <BikesScreen
            handleOpenBooking={handleOpenBooking}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsScreen
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen />
        )}

        {/* --- OWNER VIEWS --- */}
        {activeTab === 'owner_dashboard' && (
          <OwnerDashboardScreen setActiveTab={setActiveTab} />
        )}
        {activeTab === 'owner_bikes' && (
          <OwnerBikesScreen />
        )}
        {activeTab === 'owner_bookings' && (
          <OwnerBookingsScreen />
        )}

        {/* --- STAFF VIEWS --- */}
        {activeTab === 'staff_bookings' && (
          <StaffBookingsScreen />
        )}
        {activeTab === 'staff_bikes' && (
          <StaffBikesScreen />
        )}

        {/* --- ADMIN VIEWS --- */}
        {activeTab === 'admin_dashboard' && (
          <AdminDashboardScreen />
        )}
        {activeTab === 'admin_bikes' && (
          <AdminBikesScreen />
        )}
        {activeTab === 'admin_bookings' && (
          <AdminBookingsScreen />
        )}
        {activeTab === 'admin_users' && (
          <AdminUsersScreen />
        )}
      </ScrollView>

      {/* --- BOTTOM TAB NAVIGATION BAR --- */}
      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <View style={[styles.tabItemContainer, isActive && styles.tabItemContainerActive]}>
                {renderTabIcon(tab.id, isActive)}
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- BOOKING MODAL FORM --- */}
      <BookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        selectedBike={selectedBike}
        initialDate={homeDate}
        initialLocation={homeLocation}
        onConfirmSuccess={handleConfirmSuccess}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    paddingBottom: 90,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 15,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemContainerActive: {
    opacity: 1,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
});