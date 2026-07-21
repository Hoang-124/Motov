import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';
import { Bike } from '../../../types';
import { useAppSelector } from '../../../app/store';
import { WebView } from 'react-native-webview';
import { resolveImageUrl } from '../../../utils/image';
import * as Location from 'expo-location';
import { useChat } from '../../../contexts/ChatContext';
import { ChatDetailScreen } from '../../chat/screens/ChatDetailScreen';

const { width } = Dimensions.get('window');

// Da Nang default coordinates
const DEFAULT_LAT = 16.068;
const DEFAULT_LNG = 108.22;

interface NearbyBike {
  _id: string;
  vehicleModel: string;
  licensePlate: string;
  rentalPrice: number;
  transmissionType: string;
  imageUrls: string[];
  distance: number;
  category?: { name: string } | string;
  location?: { type: string; coordinates: number[] };
}

interface BikesMapScreenProps {
  onClose: () => void;
  handleOpenBooking: (bike: Bike) => void;
}

export const BikesMapScreen: React.FC<BikesMapScreenProps> = ({ onClose, handleOpenBooking }) => {
  const allBikes = useAppSelector(state => state.bikes.bikes);
  const [nearbyBikes, setNearbyBikes] = useState<NearbyBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBike, setSelectedBike] = useState<NearbyBike | null>(null);

  // Chat State
  const { createOrOpenConversation } = useChat();
  const currentUser = useAppSelector((state) => state.user);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Customer GPS & Radius State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [userAddress, setUserAddress] = useState<string>('254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>('all');
  const geocodeTimerRef = useRef<any>(null);

  const fetchNearby = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/vehicles/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=20000`);
      const data = await res.json();
      if (res.ok && data.success) {
        setNearbyBikes(data.data || []);
      } else {
        setNearbyBikes([]);
      }
    } catch {
      setNearbyBikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNearby(); }, [userCoords]);

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền vị trí GPS để tìm xe máy gần nhất.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      if (loc && loc.coords) {
        setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setUserAddress(`Vị trí GPS của bạn (${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)})`);
      }
    } catch (err) {
      Alert.alert('Thông báo', 'Đang sử dụng vị trí trung tâm Đà Nẵng.');
    }
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const rawBikesList = nearbyBikes.length > 0 ? nearbyBikes : allBikes as any[];

  const filteredBikes = React.useMemo(() => {
    return rawBikesList
      .map((b, idx) => {
        const defaultCoords = [
          { lat: 16.0820, lng: 108.2350 },
          { lat: 16.0730, lng: 108.2180 },
          { lat: 16.0540, lng: 108.1970 },
          { lat: 16.0610, lng: 108.2050 },
          { lat: 16.0480, lng: 108.2450 },
          { lat: 16.0680, lng: 108.2160 },
          { lat: 16.0700, lng: 108.2400 },
          { lat: 16.0710, lng: 108.2130 },
          { lat: 16.0250, lng: 108.2400 },
        ];
        const pos = b.location?.coordinates && b.location.coordinates[0] !== 0
          ? { lat: b.location.coordinates[1], lng: b.location.coordinates[0] }
          : defaultCoords[idx % defaultCoords.length];

        const dist = getDistanceKm(userCoords.lat, userCoords.lng, pos.lat, pos.lng);
        return {
          ...b,
          calculatedDist: dist,
          distance: b.distance || dist * 1000,
        };
      })
      .filter((b) => {
        if (selectedRadius === 'all') return true;
        return b.calculatedDist <= Number(selectedRadius);
      });
  }, [rawBikesList, userCoords, selectedRadius]);

  const displayBikes = filteredBikes;

  const isMyBike = useCallback((bike: any) => {
    if (!currentUser?.id || !bike) return false;
    const oId = typeof bike.ownerId === 'object' ? bike.ownerId?._id : bike.ownerId;
    const oStr = typeof bike.owner === 'object' ? bike.owner?._id : bike.owner;
    const target = String(oId || oStr || bike.user?._id || '');
    return target === String(currentUser.id);
  }, [currentUser?.id]);

  const handleStartChatWithOwner = async (bike: any) => {
    if (!currentUser.token) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để gửi tin nhắn cho chủ xe.');
      return;
    }
    
    let targetOwnerId: string | null = null;
    if (typeof bike.ownerId === 'string' && bike.ownerId) {
      targetOwnerId = bike.ownerId;
    } else if (typeof bike.ownerId === 'object' && bike.ownerId?._id) {
      targetOwnerId = String(bike.ownerId._id);
    } else if (typeof bike.owner === 'string' && bike.owner) {
      targetOwnerId = bike.owner;
    } else if (typeof bike.owner === 'object' && bike.owner?._id) {
      targetOwnerId = String(bike.owner._id);
    }

    if (!targetOwnerId) {
      const fullBike = allBikes.find(b => String(b.id || (b as any)._id) === String(bike._id || bike.id));
      if (fullBike) {
        targetOwnerId = typeof fullBike.ownerId === 'object' ? String((fullBike.ownerId as any)._id) : String(fullBike.ownerId || '');
      }
    }

    if (!targetOwnerId) {
      targetOwnerId = '650000000000000000000001';
    }

    setShowChatModal(true);

    try {
      setChatLoading(true);
      await createOrOpenConversation(targetOwnerId, 'customer-owner', undefined, bike._id || bike.id);
    } catch (e) {
      console.warn('Chat API background connection warning:', e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleBikesMapMessage = (event: any) => {
    try {
      const data = typeof event.nativeEvent?.data === 'string' 
        ? JSON.parse(event.nativeEvent.data) 
        : (event.data ? (typeof event.data === 'string' ? JSON.parse(event.data) : event.data) : event.nativeEvent?.data);
      if (data && data.type === 'BOOK_BIKE' && data.bikeId) {
        const foundBike = displayBikes.find(b => String(b._id || b.id) === String(data.bikeId)) || displayBikes[0];
        if (foundBike) {
          handleBookFromMap(foundBike);
        }
      } else if (data && data.type === 'CHAT_BIKE' && data.bikeId) {
        const foundBike = displayBikes.find(b => String(b._id || b.id) === String(data.bikeId)) || displayBikes[0];
        if (foundBike) {
          handleStartChatWithOwner(foundBike);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'CHAT_BIKE' && data.bikeId) {
            const foundBike = displayBikes.find(b => String(b._id || b.id) === String(data.bikeId)) || displayBikes[0];
            if (foundBike) {
              handleStartChatWithOwner(foundBike);
            }
          } else if (data && data.type === 'BOOK_BIKE' && data.bikeId) {
            const foundBike = displayBikes.find(b => String(b._id || b.id) === String(data.bikeId)) || displayBikes[0];
            if (foundBike) {
              handleBookFromMap(foundBike);
            }
          }
        } catch (e) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [displayBikes]);

  const generateBikesMapLeafletHTML = (bikes: any[], selectedBikeId?: string, uLat: number = 16.068, uLng: number = 108.220) => {
    const bikeMarkersJS = bikes.map((b, idx) => {
      const defaultCoords = [
        { lat: 16.0820, lng: 108.2350 },
        { lat: 16.0730, lng: 108.2180 },
        { lat: 16.0540, lng: 108.1970 },
        { lat: 16.0610, lng: 108.2050 },
        { lat: 16.0480, lng: 108.2450 },
        { lat: 16.0680, lng: 108.2160 },
        { lat: 16.0700, lng: 108.2400 },
        { lat: 16.0710, lng: 108.2130 },
        { lat: 16.0250, lng: 108.2400 },
      ];
      const pos = b.location?.coordinates && b.location.coordinates[0] !== 0
        ? { lat: b.location.coordinates[1], lng: b.location.coordinates[0] }
        : defaultCoords[idx % defaultCoords.length];

      const bikeImg = b.imageUrls?.[0] || b.image || 'https://res.cloudinary.com/dsxbuk4pe/image/upload/f_auto,q_auto/bikes/1_3.jpg.png';
      const bikePrice = typeof b.rentalPrice === 'number' ? b.rentalPrice.toLocaleString('vi-VN') : (b.price || '100.000');

      return {
        id: b._id || b.id,
        name: (b.vehicleModel || b.name || 'Xe máy').replace(/"/g, "'"),
        price: bikePrice,
        img: bikeImg,
        lat: pos.lat,
        lng: pos.lng,
        isSelected: selectedBikeId === (b._id || b.id),
        isMyBike: isMyBike(b)
      };
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0f172a; }
    .custom-bike-marker {
      background: #ccff00; border: 2px solid #000; border-radius: 50%;
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 15px; cursor: pointer;
    }
    .my-owner-pin {
      background: #3b82f6 !important; border: 2.5px solid #ffffff !important;
      box-shadow: 0 0 16px rgba(59,130,246,0.9) !important; font-size: 14px !important;
    }
    .my-owner-badge {
      background: #3b82f6; color: #ffffff; font-weight: 900; font-size: 9px;
      padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 3px;
    }
    .disabled-owner-btn {
      background: #334155 !important; color: #94a3b8 !important; border: none !important;
      font-weight: bold !important; cursor: not-allowed !important;
    }
    .custom-user-marker-wrap {
      position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    }
    .custom-user-marker {
      width: 28px; height: 28px; background: #38bdf8; border: 2.5px solid #ffffff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(56,189,248,0.9), 0 4px 10px rgba(0,0,0,0.5);
      font-size: 13px; color: #0f172a; font-weight: 900; z-index: 1000 !important;
    }
    .custom-user-pulse {
      position: absolute; width: 44px; height: 44px; top: -6px; left: -6px; border-radius: 50%;
      background: rgba(56, 189, 248, 0.35); border: 1.5px solid rgba(56, 189, 248, 0.8);
      animation: userPulse 2s infinite ease-out; pointer-events: none;
    }
    @keyframes userPulse {
      0% { transform: scale(0.7); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .leaflet-popup-content-wrapper {
      background: #18181b; color: #fff; border-radius: 12px; border: 1px solid #ccff00;
      padding: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.6);
    }
    .leaflet-popup-tip { background: #18181b; }
    .popup-card { display: flex; gap: 10px; align-items: center; min-width: 200px; }
    .popup-img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
    .popup-title { font-weight: bold; font-size: 13px; color: #fff; margin: 0; }
    .popup-price { color: #ccff00; font-weight: 900; font-size: 12px; margin-top: 2px; }
    .popup-btn-row { display: flex; gap: 4px; margin-top: 6px; }
    .popup-btn {
      flex: 1; background: #ccff00; color: #000; font-weight: 900; border: none; border-radius: 6px;
      padding: 5px 6px; font-size: 10px; cursor: pointer;
    }
    .popup-chat-btn {
      background: #1e293b; color: #ccff00; border: 1px solid #ccff00; font-weight: bold; border-radius: 6px;
      padding: 5px 6px; font-size: 10px; cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var bikes = ${JSON.stringify(bikeMarkersJS)};
    var userLat = ${uLat};
    var userLng = ${uLng};
    var map = L.map('map', { zoomControl: true }).setView([userLat, userLng], 13);

    setTimeout(function() {
      if (map) map.invalidateSize();
    }, 250);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Soft Light Blue Pulsing User Location Marker
    var userIcon = L.divIcon({
      className: 'custom-user-marker-wrap',
      html: '<div class="custom-user-pulse"></div><div class="custom-user-marker">👤</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    var userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    userMarker.bindPopup("<b>📍 Vị trí GPS của bạn</b>").openPopup();

    // Global Post & Action Handlers
    window.postToRN = function(msg) {
      var str = typeof msg === 'string' ? msg : JSON.stringify(msg);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(str);
      }
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(str, '*');
      }
      if (window.top && window.top.postMessage) {
        window.top.postMessage(str, '*');
      }
    };

    window.bookBike = function(id) {
      window.postToRN({ type: 'BOOK_BIKE', bikeId: id });
    };

    window.chatBike = function(id) {
      window.postToRN({ type: 'CHAT_BIKE', bikeId: id });
    };

    document.addEventListener('click', function(e) {
      var el = e.target;
      while (el && el !== document) {
        if (el.getAttribute && el.getAttribute('data-action') === 'chat') {
          var bId = el.getAttribute('data-bike-id');
          if (bId) window.chatBike(bId);
          break;
        }
        if (el.getAttribute && el.getAttribute('data-action') === 'book') {
          var bId = el.getAttribute('data-bike-id');
          if (bId) window.bookBike(bId);
          break;
        }
        el = el.parentElement;
      }
    });

    // Bike markers
    bikes.forEach(function(b) {
      var markerClass = b.isMyBike ? 'custom-bike-marker my-owner-pin' : 'custom-bike-marker';
      var markerIconStr = b.isMyBike ? '👑' : '🛵';
      var bikeIcon = L.divIcon({
        className: markerClass,
        html: markerIconStr,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      var ownerTagHTML = b.isMyBike ? '<div class="my-owner-badge">🏷️ XE CỦA BẠN</div>' : '';
      var btnRowHTML = b.isMyBike
        ? '<button class="popup-btn disabled-owner-btn" disabled>XE CỦA BẠN</button>'
        : '<button class="popup-btn" data-action="book" data-bike-id="' + b.id + '">ĐẶT XE NGAY</button><button class="popup-chat-btn" data-action="chat" data-bike-id="' + b.id + '">💬 CHAT</button>';

      var popupHTML = '<div class="popup-card">' +
        '<img src="' + b.img + '" class="popup-img" />' +
        '<div>' +
          ownerTagHTML +
          '<div class="popup-title">' + b.name + '</div>' +
          '<div class="popup-price">' + b.price + ' VNĐ/ngày</div>' +
          '<div class="popup-btn-row">' +
            btnRowHTML +
          '</div>' +
        '</div>' +
      '</div>';

      var marker = L.marker([b.lat, b.lng], { icon: bikeIcon }).addTo(map);
      marker.bindPopup(popupHTML);

      if (b.isSelected) {
        map.setView([b.lat, b.lng], 14);
        marker.openPopup();
      }
    });
  </script>
</body>
</html>
    `;
  };

  const getCategoryName = (cat: any) => {
    if (typeof cat === 'object' && cat?.name) return cat.name;
    return cat || '';
  };

  const handleBookFromMap = (nb: NearbyBike) => {
    // Find matching bike in redux store by id
    const match = allBikes.find(b => b.id === nb._id);
    if (match) {
      handleOpenBooking(match);
    } else {
      Alert.alert('Thông báo', 'Vui lòng chuyển sang tab Dòng Xe để đặt xe này.');
    }
  };

  const leafletHTML = useMemo(() => {
    return generateBikesMapLeafletHTML(displayBikes, selectedBike?._id, userCoords.lat, userCoords.lng);
  }, [displayBikes, selectedBike?._id, userCoords.lat, userCoords.lng, currentUser?.id]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bản Đồ Xe Gần Bạn</Text>
          <Text style={styles.headerSub}>Khu vực Đà Nẵng • Bán kính 10km</Text>
        </View>
        <TouchableOpacity onPress={fetchNearby} style={styles.backBtn}>
          <Feather name="refresh-cw" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Single-Row Compact Control Bar: Customer GPS Chip + Radius Selector */}
      <View style={styles.compactControlBar}>
        {/* GPS Quick Locator Chip */}
        <TouchableOpacity style={styles.gpsChipBtn} onPress={handleGetCurrentLocation}>
          <Feather name="navigation" size={12} color={COLORS.accent} />
          <Text style={styles.gpsChipText} numberOfLines={1}>
            {userAddress ? userAddress.split(',')[0] : 'GPS của bạn'}
          </Text>
        </TouchableOpacity>

        {/* Inline Compact Radius Selector */}
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}>BÁN KÍNH:</Text>
          <View style={styles.radiusButtonsRow}>
            {[
              { label: '1km', value: 1 },
              { label: '3km', value: 3 },
              { label: '5km', value: 5 },
              { label: '10km', value: 10 },
              { label: 'Tất cả', value: 'all' },
            ].map(r => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.radiusBtn,
                  selectedRadius === r.value && styles.radiusBtnActive
                ]}
                onPress={() => setSelectedRadius(r.value as any)}
              >
                <Text style={[
                  styles.radiusBtnText,
                  selectedRadius === r.value && styles.radiusBtnTextActive
                ]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Real OpenStreetMap Section (Half Phone Height) */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={leafletHTML}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 } as any}
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: leafletHTML }}
              style={{ flex: 1, borderRadius: 16 }}
              onMessage={handleBikesMapMessage}
            />
          )}
        </View>
      </View>

        {/* Selected bike popup */}
        {selectedBike && (
          <View style={styles.popupCard}>
            <Image
              source={{ uri: selectedBike.imageUrls?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200' }}
              style={styles.popupImage}
            />
            <View style={styles.popupInfo}>
              {isMyBike(selectedBike) && (
                <View style={styles.myBikeTagInline}>
                  <Text style={styles.myBikeTagTextInline}>🏷️ Xe của bạn</Text>
                </View>
              )}
              <Text style={styles.popupName} numberOfLines={1}>{selectedBike.vehicleModel}</Text>
              <Text style={styles.popupPrice}>{(selectedBike.rentalPrice || 0).toLocaleString()} VNĐ/ngày</Text>
              <Text style={styles.popupMeta}>{getCategoryName(selectedBike.category)} • {selectedBike.licensePlate}</Text>
              {selectedBike.distance > 0 && (
                <Text style={styles.popupDistance}>📍 {(selectedBike.distance / 1000).toFixed(1)} km</Text>
              )}
            </View>
            <TouchableOpacity style={styles.popupChatBtnIcon} onPress={() => handleStartChatWithOwner(selectedBike)}>
              <Feather name="message-square" size={16} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupBookBtn} onPress={() => handleBookFromMap(selectedBike)}>
              <Text style={styles.popupBookText}>ĐẶT XE</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Nearby bikes list */}
      <View style={styles.listHeader}>
        <Feather name="map-pin" size={14} color={COLORS.accent} />
        <Text style={styles.listTitle}>Xe Gần Đây</Text>
        <Text style={styles.listCount}>{displayBikes.length} xe</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
      ) : displayBikes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="map" size={30} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Không tìm thấy xe gần khu vực này.</Text>
          <Text style={styles.emptySubText}>Hãy thử mở rộng bán kính tìm kiếm.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.bikesList} showsVerticalScrollIndicator={false}>
          {displayBikes.map(bike => (
            <TouchableOpacity
              key={bike._id}
              style={[styles.bikeCard, selectedBike?._id === bike._id && styles.bikeCardSelected]}
              onPress={() => setSelectedBike(selectedBike?._id === bike._id ? null : bike)}
              activeOpacity={0.85}
            >
              <Image 
                source={{ uri: resolveImageUrl(bike.imageUrls?.[0] || bike.image, bike.vehicleModel || bike.name) }} 
                style={styles.bikeCardImage} 
              />
              <View style={styles.bikeCardInfo}>
                {isMyBike(bike) && (
                  <View style={styles.myBikeTagInline}>
                    <Text style={styles.myBikeTagTextInline}>🏷️ Xe của bạn</Text>
                  </View>
                )}
                <Text style={styles.bikeCardName} numberOfLines={1}>{bike.vehicleModel}</Text>
                <Text style={styles.bikeCardPrice}>{(bike.rentalPrice || 0).toLocaleString()} đ/ngày</Text>
                <View style={styles.bikeCardMeta}>
                  <Text style={styles.bikeCardType}>{getCategoryName(bike.category)}</Text>
                  {bike.distance > 0 && <Text style={styles.bikeCardDist}>{(bike.distance / 1000).toFixed(1)} km</Text>}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.cardChatBtn} 
                onPress={() => handleStartChatWithOwner(bike)}
              >
                <Feather name="message-square" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Live Chat Modal with Bike Owner */}
      <Modal visible={showChatModal} animationType="slide" onRequestClose={() => setShowChatModal(false)}>
        <ChatDetailScreen onBack={() => setShowChatModal(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  headerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  // Map
  mapSection: { marginHorizontal: 16, marginBottom: 12 },
  mapContainer: {
    height: Dimensions.get('window').height * 0.45,
    minHeight: 330,
    backgroundColor: '#0a1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  // Single-Row Compact Control Bar
  compactControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 6,
  },
  gpsChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    maxWidth: 110,
  },
  gpsChipText: {
    color: COLORS.accent,
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  radiusContainer: {
    flex: 1,
    backgroundColor: '#121214',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  radiusLabel: {
    color: '#a1a1aa',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  radiusButtonsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusBtnActive: {
    backgroundColor: COLORS.accent,
  },
  radiusBtnText: {
    color: '#e4e4e7',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  radiusBtnTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  // Popup
  popupCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accent, padding: 10, marginTop: 8, alignItems: 'center' },
  popupImage: { width: 56, height: 48, borderRadius: 8, backgroundColor: COLORS.border },
  popupInfo: { flex: 1, marginLeft: 10 },
  popupName: { color: COLORS.text, fontSize: 13, fontWeight: 'bold' },
  popupPrice: { color: COLORS.accent, fontSize: 12, fontWeight: '600', marginTop: 1 },
  popupMeta: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  popupDistance: { color: COLORS.textSecondary, fontSize: 10, marginTop: 1 },
  popupBookBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 6 },
  popupBookText: { color: COLORS.accentDark, fontSize: 11, fontWeight: '900' },
  popupChatBtnIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(204,255,0,0.15)', borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  cardChatBtn: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  // My Bike Badge
  myBikeTagInline: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  myBikeTagTextInline: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // List
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  listTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', flex: 1 },
  listCount: { color: COLORS.textMuted, fontSize: 11 },
  emptyBox: { alignItems: 'center', padding: 30, gap: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  emptySubText: { color: COLORS.textMuted, fontSize: 11 },
  bikesList: { paddingHorizontal: 16, paddingBottom: 30, gap: 8 },
  bikeCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  bikeCardSelected: { borderColor: COLORS.accent },
  bikeCardImage: { width: 70, height: 60, backgroundColor: COLORS.border },
  bikeCardInfo: { flex: 1, padding: 10 },
  bikeCardName: { color: COLORS.text, fontSize: 13, fontWeight: 'bold' },
  bikeCardPrice: { color: COLORS.accent, fontSize: 11, fontWeight: '600', marginTop: 1 },
  bikeCardMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  bikeCardType: { color: COLORS.textMuted, fontSize: 10 },
  bikeCardDist: { color: COLORS.textSecondary, fontSize: 10 },
});
