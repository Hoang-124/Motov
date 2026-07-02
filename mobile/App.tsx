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
  Linking,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { CustomAlert, CustomAlertProvider } from './src/components/CustomAlert';

// Overwrite Alert.alert globally with our custom beautiful modal alert
const nativeAlert = Alert.alert;
Alert.alert = (title: string, message?: string, buttons?: any[]) => {
  CustomAlert.alert(title, message, buttons);
};
(Alert as any).nativeAlert = nativeAlert;

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
import { fetchBookings } from './src/features/bookings/bookingsSlice';

// Import Owner screens
import { OwnerDashboardScreen } from './src/features/owner/screens/OwnerDashboardScreen';
import { OwnerBikesScreen } from './src/features/owner/screens/OwnerBikesScreen';
import { OwnerBookingsScreen } from './src/features/owner/screens/OwnerBookingsScreen';
import { StaffBookingsScreen } from './src/features/staff/screens/StaffBookingsScreen';
import { StaffDashboardScreen } from './src/features/staff/screens/StaffDashboardScreen';
import { StaffBikesScreen } from './src/features/staff/screens/StaffBikesScreen';

const renderTabIcon = (tabId: string, isActive: boolean) => {
  const color = isActive ? COLORS.accent : COLORS.textMuted;
  const size = 20;
  switch (tabId) {
    case 'home':
      return <Feather name="home" size={size} color={color} />;
    case 'bikes':
    case 'owner_bikes':
    case 'staff_bikes':
      return <MaterialCommunityIcons name="motorbike" size={24} color={color} style={{ marginTop: -2 }} />;
    case 'bookings':
    case 'owner_bookings':
    case 'staff_bookings':
      return <Feather name="calendar" size={size} color={color} />;
    case 'owner_dashboard':
    case 'staff_dashboard':
      return <Feather name="trending-up" size={size} color={color} />;
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
    if (role === 'owner') {
      setActiveTab('owner_dashboard');
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

  // Listen for VNPAY Return Deep Link
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('Received deep link URL:', event.url);
      if (event.url.includes('vnpay-return')) {
        // Parse query params
        const queryString = event.url.split('?')[1] || '';
        const params: Record<string, string> = {};
        queryString.split('&').forEach(param => {
          const [key, val] = param.split('=');
          if (key && val) {
            params[decodeURIComponent(key)] = decodeURIComponent(val);
          }
        });
        
        const statusVal = params.status;
        
        // Refresh bookings list so the new/paid status shows up immediately
        dispatch(fetchBookings() as any);
        
        const showAlert = (Alert as any).nativeAlert || Alert.alert;
        if (statusVal === 'success') {
          showAlert(
            'Thanh Toán Thành Công 🎉',
            'Đơn hàng của bạn đã được đặt cọc thành công qua cổng VNPAY!'
          );
        } else if (statusVal === 'failed') {
          showAlert(
            'Thanh Toán Thất Bại ❌',
            'Giao dịch VNPAY thất bại hoặc đã bị hủy bỏ.'
          );
        } else if (statusVal === 'error') {
          showAlert(
            'Lỗi Thanh Toán',
            'Đã xảy ra lỗi trong quá trình xử lý giao dịch.'
          );
        }
        
        // Redirect to customer bookings tab
        setActiveTab('bookings');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was opened by a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  const handleHomeSearch = () => {
    setActiveTab('bikes');
  };

  const handleOpenBooking = (bike: Bike) => {
    if (role === 'guest') {
      Alert.alert('Yêu Cầu Đăng Nhập', 'Vui lòng Đăng Nhập hoặc Đăng Ký tài khoản trong tab Cá nhân để đặt xe!', [
        { text: 'Đăng nhập', onPress: () => setActiveTab('profile') },
        { text: 'Hủy', style: 'cancel' }
      ]);
      return;
    }
    setSelectedBike(bike);
    setBookingModalVisible(true);
  };

  const handleConfirmSuccess = () => {
    setBookingModalVisible(false);
    setActiveTab('bookings');
  };

  // Determine bottom tab links dynamically
  const getTabs = () => {
    switch (role) {
      case 'owner':
        return [
          { id: 'home', label: 'Trang chủ' },
          { id: 'bikes', label: 'Dòng xe' },
          { id: 'bookings', label: 'Đơn thuê' },
          { id: 'owner_dashboard', label: 'Chủ xe' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'admin':
      case 'staff':
        return [
          { id: 'home', label: 'Trang chủ' },
          { id: 'staff_bikes', label: 'Dòng xe' },
          { id: 'staff_bookings', label: 'Yêu cầu' },
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
      <View style={styles.scrollContainer}>
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

        {/* --- STAFF VIEWS --- */}
        {activeTab === 'staff_bikes' && (
          <StaffBikesScreen setActiveTab={setActiveTab} />
        )}
        {activeTab === 'staff_bookings' && (
          <StaffBookingsScreen />
        )}

        {/* --- OWNER VIEWS --- */}
        {activeTab === 'owner_dashboard' && (
          <OwnerDashboardScreen setActiveTab={setActiveTab} />
        )}
        {activeTab === 'owner_bikes' && (
          <OwnerBikesScreen setActiveTab={setActiveTab} />
        )}
        {activeTab === 'owner_bookings' && (
          <OwnerBookingsScreen setActiveTab={setActiveTab} />
        )}
      </View>

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
      <CustomAlertProvider />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 80,
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
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
});