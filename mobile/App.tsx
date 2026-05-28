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
import { store, useAppDispatch } from './src/app/store';
import { Bike } from './src/types';
import { COLORS } from './src/theme/colors';
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import { BikesScreen } from './src/features/bikes/screens/BikesScreen';
import { BookingsScreen } from './src/features/bookings/screens/BookingsScreen';
import { ProfileScreen } from './src/features/profile/screens/ProfileScreen';
import { BookingModal } from './src/features/bookings/components/BookingModal';
import { fetchBikes } from './src/features/bikes/bikesSlice';

const renderTabIcon = (tabId: 'home' | 'bikes' | 'bookings' | 'profile', isActive: boolean) => {
  const color = isActive ? COLORS.accent : COLORS.textMuted;
  const size = 20;
  switch (tabId) {
    case 'home':
      return <Feather name="home" size={size} color={color} />;
    case 'bikes':
      return <MaterialCommunityIcons name="motorbike" size={24} color={color} style={{ marginTop: -2 }} />;
    case 'bookings':
      return <Feather name="calendar" size={size} color={color} />;
    case 'profile':
      return <Feather name="user" size={size} color={color} />;
    default:
      return null;
  }
};

function MainApp() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'home' | 'bikes' | 'bookings' | 'profile'>('home');

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
    if (homeDate) {
      // In a real app we could dispatch custom date queries
    }
    setActiveTab('bikes');
  };

  const handleOpenBooking = (bike: Bike) => {
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
      </ScrollView>

      {/* --- BOTTOM TAB NAVIGATION BAR --- */}
      <View style={styles.tabBar}>
        {[
          { id: 'home', label: 'Trang chủ' },
          { id: 'bikes', label: 'Dòng xe' },
          { id: 'bookings', label: 'Đơn thuê' },
          { id: 'profile', label: 'Cá nhân' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <View style={[styles.tabItemContainer, isActive && styles.tabItemContainerActive]}>
                {renderTabIcon(tab.id as any, isActive)}
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
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
});