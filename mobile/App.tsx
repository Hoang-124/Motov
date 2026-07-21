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
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { CustomAlert, CustomAlertProvider } from './src/components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUser } from './src/features/profile/userSlice';

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
import { StaffScheduleScreen } from './src/features/staff/screens/StaffScheduleScreen';
import { InventoryScreen } from './src/features/staff/screens/InventoryScreen';

// Import Admin screens
import { AdminDashboardScreen } from './src/features/admin/screens/AdminDashboardScreen';
import { AdminBikesScreen } from './src/features/admin/screens/AdminBikesScreen';
import { AdminBookingsScreen } from './src/features/admin/screens/AdminBookingsScreen';
import { AdminUsersScreen } from './src/features/admin/screens/AdminUsersScreen';
import { AdminPromotionsScreen } from './src/features/admin/screens/AdminPromotionsScreen';
import { AdminCategoriesScreen } from './src/features/admin/screens/AdminCategoriesScreen';
import { AdminFeedbacksScreen } from './src/features/admin/screens/AdminFeedbacksScreen';
import { AdminSettingsScreen } from './src/features/admin/screens/AdminSettingsScreen';

// Import Chat screens & Context
import { ChatProvider, useChat } from './src/contexts/ChatContext';
import { ConversationListScreen } from './src/features/chat/screens/ConversationListScreen';
import { ChatDetailScreen } from './src/features/chat/screens/ChatDetailScreen';

const renderTabIcon = (tabId: string, isActive: boolean, unreadCount: number = 0) => {
  const color = isActive ? COLORS.accent : COLORS.textMuted;
  const size = 20;
  switch (tabId) {
    case 'home':
      return <Feather name="home" size={size} color={color} />;
    case 'bikes':
    case 'owner_bikes':
    case 'staff_bikes':
    case 'admin_bikes':
      return <MaterialCommunityIcons name="motorbike" size={24} color={color} style={{ marginTop: -2 }} />;
    case 'bookings':
    case 'owner_bookings':
    case 'staff_bookings':
    case 'admin_bookings':
      return <Feather name="calendar" size={size} color={color} />;
    case 'chat':
      return (
        <View style={{ position: 'relative' }}>
          <Feather name="message-square" size={size} color={color} />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -8,
              backgroundColor: '#ef4444',
              borderRadius: 8,
              paddingHorizontal: 4,
              paddingVertical: 1,
              minWidth: 14,
              alignItems: 'center',
            }}>
              <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '900' }}>{unreadCount}</Text>
            </View>
          )}
        </View>
      );
    case 'owner_dashboard':
    case 'staff_dashboard':
    case 'admin_dashboard':
      return <Feather name="trending-up" size={size} color={color} />;
    case 'admin_manage':
      return <Feather name="settings" size={size} color={color} />;
    case 'staff_schedule':
      return <Feather name="clock" size={size} color={color} />;
    case 'staff_inventory':
      return <Feather name="package" size={size} color={color} />;
    case 'profile':
      return <Feather name="user" size={size} color={color} />;
    default:
      return null;
  }
};

// Admin Manage sub-navigation screen
const ADMIN_SECTIONS = [
  { id: 'admin_bikes', label: 'Xe', icon: 'truck' as const },
  { id: 'admin_users', label: 'Users', icon: 'users' as const },
  { id: 'admin_promotions', label: 'KM', icon: 'tag' as const },
  { id: 'admin_categories', label: 'Danh mục', icon: 'folder' as const },
  { id: 'admin_feedbacks', label: 'Đánh giá', icon: 'message-square' as const },
  { id: 'admin_settings', label: 'Cài đặt', icon: 'settings' as const },
];

function AdminManageScreen({ activeSubTab, setActiveSubTab }: { activeSubTab: string; setActiveSubTab: (t: string) => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Sub-tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 8 }}
      >
        {ADMIN_SECTIONS.map(s => {
          const active = activeSubTab === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setActiveSubTab(s.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? 'rgba(204,255,0,0.1)' : COLORS.card,
                borderWidth: 1,
                borderColor: active ? COLORS.accent : COLORS.border,
              }}
            >
              <Feather name={s.icon} size={13} color={active ? COLORS.accent : COLORS.textMuted} />
              <Text style={{ color: active ? COLORS.accent : COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Render active sub-screen */}
      {activeSubTab === 'admin_bikes' && <AdminBikesScreen />}
      {activeSubTab === 'admin_users' && <AdminUsersScreen />}
      {activeSubTab === 'admin_promotions' && <AdminPromotionsScreen />}
      {activeSubTab === 'admin_categories' && <AdminCategoriesScreen />}
      {activeSubTab === 'admin_feedbacks' && <AdminFeedbacksScreen />}
      {activeSubTab === 'admin_settings' && <AdminSettingsScreen />}
    </View>
  );
}

function MainApp() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.user.role);
  const { unreadCount, activeConversation, selectConversation } = useChat();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isHydrating, setIsHydrating] = useState(true);

  // Load persisted session on startup
  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('user_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          dispatch(updateUser(session));
        }
      } catch (e) {
        console.error('Failed to hydrate session:', e);
      } finally {
        setIsHydrating(false);
      }
    };
    hydrateSession();
  }, [dispatch]);

  // Admin sub-tab state
  const [adminSubTab, setAdminSubTab] = useState<string>('admin_bikes');

  // Reset tab on role switch
  useEffect(() => {
    if (role === 'owner') {
      setActiveTab('owner_dashboard');
    } else if (role === 'admin') {
      setActiveTab('admin_dashboard');
    } else if (role === 'staff') {
      setActiveTab('staff_dashboard');
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
          { id: 'chat', label: 'Chat' },
          { id: 'owner_dashboard', label: 'Chủ xe' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'admin':
        return [
          { id: 'admin_dashboard', label: 'Tổng hợp' },
          { id: 'admin_bookings', label: 'Đơn hàng' },
          { id: 'chat', label: 'Chat' },
          { id: 'admin_manage', label: 'Quản trị' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'staff':
        return [
          { id: 'staff_dashboard', label: 'Tổng hợp' },
          { id: 'staff_bookings', label: 'Yêu cầu' },
          { id: 'chat', label: 'Chat' },
          { id: 'staff_schedule', label: 'Lịch trình' },
          { id: 'staff_inventory', label: 'Kho' },
          { id: 'profile', label: 'Cá nhân' }
        ];
      case 'customer':
        return [
          { id: 'home', label: 'Trang chủ' },
          { id: 'bikes', label: 'Dòng xe' },
          { id: 'bookings', label: 'Đơn thuê' },
          { id: 'chat', label: 'Chat' },
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

  if (isHydrating) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.text, marginTop: 16, fontWeight: 'bold', fontSize: 14, letterSpacing: 1.5 }}>ĐANG TẢI MOTOV...</Text>
      </SafeAreaView>
    );
  }

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
        {activeTab === 'staff_dashboard' && (
          <StaffDashboardScreen setActiveTab={setActiveTab} />
        )}
        {activeTab === 'staff_bikes' && (
          <StaffBikesScreen setActiveTab={setActiveTab} />
        )}
        {activeTab === 'staff_bookings' && (
          <StaffBookingsScreen />
        )}
        {activeTab === 'staff_schedule' && (
          <StaffScheduleScreen />
        )}
        {activeTab === 'staff_inventory' && (
          <InventoryScreen />
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

        {/* --- ADMIN VIEWS --- */}
        {activeTab === 'admin_dashboard' && (
          <AdminDashboardScreen />
        )}
        {activeTab === 'admin_bookings' && (
          <AdminBookingsScreen />
        )}
        {activeTab === 'admin_manage' && (
          <AdminManageScreen activeSubTab={adminSubTab} setActiveSubTab={setAdminSubTab} />
        )}
        {/* --- CHAT VIEW --- */}
        {activeTab === 'chat' && (
          activeConversation ? (
            <ChatDetailScreen onBack={() => selectConversation(null)} />
          ) : (
            <ConversationListScreen onSelectConversation={(conv) => selectConversation(conv)} />
          )
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
                {renderTabIcon(tab.id, isActive, unreadCount)}
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
      <ChatProvider>
        <MainApp />
        <CustomAlertProvider />
      </ChatProvider>
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