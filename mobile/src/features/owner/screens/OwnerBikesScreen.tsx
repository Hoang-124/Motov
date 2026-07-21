import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { apiFetch } from '../../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';

interface OwnerBikesScreenProps {
  setActiveTab?: (tab: string) => void;
}

interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  image: string;
  status?: string;
  statusLabel?: string;
}

interface Category {
  _id: string;
  name: string;
}

export const OwnerBikesScreen: React.FC<OwnerBikesScreenProps> = ({ setActiveTab }) => {
  const user = useAppSelector(state => state.user);

  const [myBikes, setMyBikes] = useState<any[]>([]);
  const [loadingBikes, setLoadingBikes] = useState<boolean>(true);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingBike, setEditingBike] = useState<any | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Fields
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [transmissionType, setTransmissionType] = useState<'Manual' | 'Automatic' | 'Semi-Automatic'>('Manual');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleImageUri, setVehicleImageUri] = useState<string | null>(null);
  const [regCertUri, setRegCertUri] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({ lat: 16.068, lng: 108.220 });
  const [fullscreenMapVisible, setFullscreenMapVisible] = useState<boolean>(false);
  const geocodeTimerRef = useRef<any>(null);

  const geocodeAddressLocal = (query: string): { lat: number; lng: number } | null => {
    const q = query.toLowerCase();
    if (q.includes('mai đăng chơn')) return { lat: 16.0120, lng: 108.2420 };
    if (q.includes('ngô quyền')) return { lat: 16.0820, lng: 108.2350 };
    if (q.includes('cao thắng')) return { lat: 16.0730, lng: 108.2180 };
    if (q.includes('nguyễn văn linh')) return { lat: 16.0610, lng: 108.2050 };
    if (q.includes('võ nguyên giáp') || q.includes('mỹ khê')) return { lat: 16.0480, lng: 108.2450 };
    if (q.includes('sân bay')) return { lat: 16.0540, lng: 108.1970 };
    if (q.includes('hùng vương')) return { lat: 16.0680, lng: 108.2160 };
    if (q.includes('điện biên phủ')) return { lat: 16.0620, lng: 108.1880 };
    if (q.includes('phạm văn đồng')) return { lat: 16.0700, lng: 108.2400 };
    if (q.includes('lê duẩn')) return { lat: 16.0710, lng: 108.2130 };
    if (q.includes('ngũ hành sơn')) return { lat: 16.0250, lng: 108.2400 };
    if (q.includes('sơn trà')) return { lat: 16.0900, lng: 108.2400 };
    if (q.includes('hải châu')) return { lat: 16.0600, lng: 108.2150 };
    if (q.includes('thanh khê')) return { lat: 16.0650, lng: 108.1900 };
    if (q.includes('liên chiểu')) return { lat: 16.0850, lng: 108.1400 };
    if (q.includes('cẩm lệ')) return { lat: 16.0150, lng: 108.1950 };
    if (q.includes('hòa vắng') || q.includes('hòa xuân')) return { lat: 16.0000, lng: 108.2100 };
    return null;
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setTouched(prev => ({ ...prev, address: true }));

    // 1. Instant local Da Nang street keyword geocoding
    const localMatch = geocodeAddressLocal(val);
    if (localMatch) {
      setMapCoords(localMatch);
    }

    // 2. Debounced OpenStreetMap Nominatim Geocoding API
    if (val.trim().length > 4) {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = setTimeout(async () => {
        try {
          const query = val.includes('Đà Nẵng') ? val : `${val}, Đà Nẵng`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapCoords({ lat, lng });
            }
          }
        } catch (e) {}
      }, 500);
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setMapCoords({ lat: data.lat, lng: data.lng });
      }
    } catch (e) {}
  };

  const generateLeafletHTML = (lat: number, lng: number, addressLabel: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #f8fafc; }
    .custom-bike-marker {
      background: #ccff00; border: 2px solid #000; border-radius: 50%;
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var customIcon = L.divIcon({
      className: 'custom-bike-marker',
      html: '🛵',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    var marker = L.marker([${lat}, ${lng}], { icon: customIcon, draggable: true }).addTo(map);
    marker.bindPopup("<b>${(addressLabel || 'Vị trí xe máy').replace(/"/g, '')}</b>").openPopup();

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      marker.bindPopup("<b>Đã chọn vị trí này</b>").openPopup();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      marker.bindPopup("<b>Đã ghim vị trí này</b>").openPopup();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: pos.lat, lng: pos.lng }));
      }
    });
  </script>
</body>
</html>
`;

  const validatePlateError = (plate: string) => {
    if (!plate.trim()) return 'Vui lòng nhập Biển số xe';
    const cleanPlate = plate.trim().toUpperCase();
    const plateRegex = /^[0-9]{2}-?([A-Z][0-9]|[A-Z]{2})[\s-]?([0-9]{4}|[0-9]{5}|[0-9]{3}\.[0-9]{2})$/;
    if (!plateRegex.test(cleanPlate)) {
      return 'Biển số không hợp lệ. Ví dụ đúng: 43-C1 123.45 hoặc 43C1-12345';
    }
    return '';
  };

  const validatePriceError = (price: string) => {
    if (!price.trim()) return 'Vui lòng nhập giá thuê ngày';
    if (isNaN(Number(price)) || Number(price) <= 0) {
      return 'Giá thuê phải là số dương (VNĐ)';
    }
    return '';
  };

  // Load Categories & Owner Bikes on mount
  const fetchMyBikes = async () => {
    if (!user.id) {
      setMyBikes([]);
      setLoadingBikes(false);
      return;
    }
    setLoadingBikes(true);
    try {
      const res = await apiFetch(`/vehicles?ownerId=${user.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyBikes(data.data);
      } else {
        setMyBikes([]);
      }
    } catch (err) {
      console.error('Failed to fetch owner bikes', err);
      setMyBikes([]);
    } finally {
      setLoadingBikes(false);
    }
  };

  useEffect(() => {
    fetchMyBikes();
  }, [user.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch('/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingBike(null);
    setVehicleModel('');
    setLicensePlate('');
    setRentalPrice('');
    setSelectedCategory(categories[0]?._id || '');
    setTransmissionType('Manual');
    setAddress('');
    setDescription('');
    setVehicleImageUri(null);
    setRegCertUri(null);
    setTouched({});
    setModalVisible(true);
  };

  const openEditModal = (bike: any) => {
    setEditingBike(bike);
    setVehicleModel(bike.vehicleModel || bike.name || '');
    setLicensePlate(bike.licensePlate || '');
    setRentalPrice(String(bike.rentalPrice || bike.price || ''));
    setSelectedCategory(typeof bike.category === 'object' ? bike.category._id : (bike.category || ''));
    setTransmissionType(bike.transmissionType || 'Manual');
    setAddress(bike.address || bike.location?.address || '');
    setDescription(bike.description || '');
    setVehicleImageUri((bike.imageUrls && bike.imageUrls.length > 0) ? bike.imageUrls[0] : (bike.image || null));
    setRegCertUri(bike.regCertificateUrl || null);
    setTouched({});
    setModalVisible(true);
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PendingApproval':
        return (
          <View style={[styles.statusBadge, { backgroundColor: COLORS.pendingBg, borderColor: COLORS.pendingBorder }]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.pending }]}>Đang chờ duyệt</Text>
          </View>
        );
      case 'Available':
        return (
          <View style={[styles.statusBadge, { backgroundColor: COLORS.approvedBg, borderColor: COLORS.approvedBorder }]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.approved }]}>Sẵn sàng</Text>
          </View>
        );
      case 'Rented':
        return (
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: COLORS.accent }]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.accent }]}>Đang thuê</Text>
          </View>
        );
      case 'Maintenance':
        return (
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: COLORS.danger }]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.danger }]}>Bảo dưỡng</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: COLORS.pendingBg, borderColor: COLORS.pendingBorder }]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.pending }]}>Đang chờ duyệt</Text>
          </View>
        );
    }
  };

  const selectImage = async (type: 'vehicle' | 'cert') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền Truy Cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để tải lên hình ảnh xe.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        if (type === 'vehicle') {
          setVehicleImageUri(selectedUri);
        } else {
          setRegCertUri(selectedUri);
        }
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
    }
  };

  const uploadImageToServer = async (uri: string): Promise<string | null> => {
    try {
      console.log('[uploadImageToServer] Original URI:', uri);
      const formData = new FormData();
      let rawName = uri.split('/').pop()?.split('?')[0] || 'upload.jpg';
      let ext = (/\.(\w+)$/.exec(rawName)?.[1] || '').toLowerCase();

      if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('data:')) {
        const res = await fetch(uri);
        const blob = await res.blob();
        if (!ext && blob.type) {
          const mimeExt = blob.type.split('/')[1]?.toLowerCase();
          if (mimeExt) ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
        }
        if (!ext) ext = 'jpg';
        const fileType = blob.type || `image/${ext}`;
        const finalName = ext && !rawName.toLowerCase().endsWith(`.${ext}`) ? `${rawName}.${ext}` : rawName;
        formData.append('image', blob, finalName);
      } else {
        if (!ext) ext = 'jpg';
        const fileType = `image/${ext}`;
        const finalName = !rawName.toLowerCase().endsWith(`.${ext}`) ? `${rawName}.${ext}` : rawName;
        let decodedUri = uri;
        try {
          decodedUri = decodeURIComponent(uri);
        } catch {
          // ignore malformed uri decode error
        }
        formData.append('image', {
          uri: decodedUri,
          name: finalName,
          type: fileType,
        } as any);
      }

      // Do NOT specify headers containing Content-Type for FormData uploads
      const response = await apiFetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, errorText);
        try {
          const errJson = JSON.parse(errorText);
          throw new Error(errJson.message || errJson.error || `HTTP ${response.status}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Server rejected upload');
      }
      return data.url;
    } catch (e: any) {
      console.error('Image upload failed with error:', e);
      throw e;
    }
  };

  const handleRegisterBike = async () => {
    // 1. Mark all fields as touched for validation
    setTouched({ vehicleModel: true, licensePlate: true, rentalPrice: true, address: true });

    // 2. Validation
    if (!vehicleModel.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập Tên/Mẫu xe.');
    
    const plateErr = validatePlateError(licensePlate);
    if (plateErr) return Alert.alert('Lỗi Định Dạng Biển Số', plateErr);

    const priceErr = validatePriceError(rentalPrice);
    if (priceErr) return Alert.alert('Lỗi Giá Thuê', priceErr);

    if (!selectedCategory) return Alert.alert('Lỗi', 'Vui lòng chọn Danh mục xe.');
    if (!address.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập Địa chỉ nơi để xe.');
    if (!vehicleImageUri) return Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ảnh thực tế của xe.');

    setFormLoading(true);

    try {
      // 2. Geocoding using OpenStreetMap Nominatim API (Matches Web implementation)
      let coordinates = [108.22, 16.068]; // default Da Nang center coordinates
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}`,
          {
            headers: {
              'User-Agent': 'MotovMobileApp/1.0',
            },
          }
        );
        const geoData = await geoRes.json();
        if (geoRes.ok && geoData && geoData.length > 0) {
          const firstResult = geoData[0];
          coordinates = [parseFloat(firstResult.lon), parseFloat(firstResult.lat)];
          console.log('Geocoding successful! Coordinates resolved:', coordinates);
        } else {
          console.log('Geocoding query returned empty or failed. Using fallback Da Nang center.');
        }
      } catch (geoErr) {
        console.error('Geocoding failed, using fallback:', geoErr);
      }

      // 3. Proactively refresh token if expired using a simple GET request
      // This prevents the FormData body from being consumed and failing on a 401 retry
      try {
        await apiFetch('/auth/me');
      } catch (tokenErr) {
        console.warn('Pre-flight token check failed', tokenErr);
      }

      // 4. Upload Images
      let uploadedVehicleUrl = (vehicleImageUri && vehicleImageUri.startsWith('http')) ? vehicleImageUri : '';
      if (vehicleImageUri && !vehicleImageUri.startsWith('http')) {
        try {
          const url = await uploadImageToServer(vehicleImageUri);
          if (!url) throw new Error('Không nhận được URL ảnh từ server');
          uploadedVehicleUrl = url;
        } catch (uploadErr: any) {
          setFormLoading(false);
          return Alert.alert('Lỗi Tải Ảnh', `Không thể tải ảnh thực tế của xe lên máy chủ. Chi tiết: ${uploadErr.message}`);
        }
      }

      let uploadedCertUrl = (regCertUri && regCertUri.startsWith('http')) ? regCertUri : '';
      if (regCertUri && !regCertUri.startsWith('http')) {
        try {
          const url = await uploadImageToServer(regCertUri);
          if (url) uploadedCertUrl = url;
        } catch (certErr) {
          console.warn('Optional reg certificate upload failed', certErr);
        }
      }

      // 4. Send POST Request to register vehicle
      const bodyPayload = {
        vehicleModel: vehicleModel.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        seats: 2,
        odometer: 0,
        rentalPrice: Number(rentalPrice),
        category: selectedCategory,
        transmissionType,
        description: description.trim(),
        regCertificateUrl: uploadedCertUrl || undefined,
        imageUrls: [uploadedVehicleUrl],
        location: {
          type: 'Point',
          coordinates,
        },
      };

      const endpoint = editingBike ? `/vehicles/${editingBike._id || editingBike.id}` : '/vehicles';
      const method = editingBike ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(bodyPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        const serverErr = Array.isArray(result.errors) && result.errors.length > 0
          ? result.errors.join('\n')
          : (result.error || result.message || '');

        if (serverErr.toLowerCase().includes('duplicate') || serverErr.includes('E11000') || serverErr.toLowerCase().includes('licenseplate')) {
          throw new Error('Biển số xe đã tồn tại trong hệ thống');
        }
        throw new Error(serverErr || (editingBike ? 'Lỗi cập nhật xe.' : 'Lỗi đăng ký xe.'));
      }

      Alert.alert('Thành Công', editingBike ? 'Cập nhật thông tin xe thành công!' : 'Đăng ký xe mới thành công! Vui lòng chờ Phê duyệt.');
      setModalVisible(false);
      fetchMyBikes();
      
      // Clear Form Fields
      setVehicleModel('');
      setLicensePlate('');
      setRentalPrice('');
      setAddress('');
      setVehicleImageUri(null);
      setRegCertUri(null);
      setDescription('');
    } catch (err: any) {
      Alert.alert('Lỗi Đăng Ký', err.message || 'Lỗi không xác định.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Tab Switcher */}
      {setActiveTab && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15, marginTop: 10 }}>
          <TouchableOpacity 
            onPress={() => setActiveTab('owner_dashboard')} 
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 12 }}>Doanh thu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              flex: 1,
              backgroundColor: COLORS.accent,
              borderWidth: 1,
              borderColor: COLORS.accent,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: COLORS.accentDark, fontWeight: 'bold', fontSize: 12 }}>Xe của tôi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setActiveTab('owner_bookings')} 
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 12 }}>Yêu cầu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Xe Của Tôi</Text>
        <Text style={styles.pageSubtitle}>Quản lý thông tin và trạng thái xe đăng ký cho thuê</Text>
      </View>

      {/* Add Bike Button */}
      <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
        <Feather name="plus-circle" size={16} color={COLORS.accentDark} style={{ marginRight: 6 }} />
        <Text style={styles.addBtnText}>ĐĂNG KÝ XE MỚI</Text>
      </TouchableOpacity>

      {/* Bikes list */}
      <View style={styles.bikesList}>
        {loadingBikes ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 12 }}>
              Đang tải danh sách xe của bạn...
            </Text>
          </View>
        ) : myBikes.length === 0 ? (
          <View style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            padding: 30,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10,
          }}>
            <Feather name="shield" size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>
              Bạn chưa đăng ký chiếc xe nào
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              Bấm vào nút "+ ĐĂNG KÝ XE MỚI" ở trên để bắt đầu đăng ký xe cho thuê và tạo thu nhập cùng Motov.
            </Text>
          </View>
        ) : (
          myBikes.map(bike => {
            const bikeId = bike._id || bike.id;
            const modelName = bike.vehicleModel || bike.name || 'Xe chưa đặt tên';
            const imageUrl = (bike.imageUrls && bike.imageUrls.length > 0)
              ? bike.imageUrls[0]
              : (bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400');
            const categoryName = bike.category?.name || (bike.transmissionType === 'Manual' ? 'Xe số' : bike.transmissionType === 'Automatic' ? 'Xe ga' : 'Xe côn') || bike.type || 'Xe máy';
            const formattedPrice = Number(bike.rentalPrice || bike.price || 0).toLocaleString('vi-VN');

            return (
              <View key={bikeId} style={styles.bikeCard}>
                <Image source={{ uri: imageUrl }} style={styles.bikeImage} />
                <View style={styles.bikeInfo}>
                  <View>
                    <View style={styles.bikeHeader}>
                      <Text style={styles.bikeName}>{modelName}</Text>
                      {renderStatusBadge(bike.status)}
                    </View>
                    <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                      Biển số: {bike.licensePlate || 'N/A'}
                    </Text>
                    <Text style={styles.bikeType}>{categoryName}</Text>
                  </View>
                  <View style={styles.bikeFooter}>
                    <Text style={styles.price}>{formattedPrice} đ/ngày</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(bike)}>
                      <Feather name="edit-2" size={12} color={COLORS.accent} />
                      <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Registration Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBike ? 'Chỉnh Sửa Thông Tin Xe' : 'Đăng Ký Xe Mới'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={formLoading}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
              {/* Form Input fields */}
              <Text style={styles.label}>Tên / Mẫu xe *</Text>
              <TextInput
                style={[styles.input, touched.vehicleModel && !vehicleModel.trim() ? styles.inputError : null]}
                placeholder="Ví dụ: Honda Vision 2023"
                placeholderTextColor={COLORS.textMuted}
                value={vehicleModel}
                onChangeText={(val) => {
                  setVehicleModel(val);
                  setTouched(prev => ({ ...prev, vehicleModel: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, vehicleModel: true }))}
                editable={!formLoading}
              />
              {touched.vehicleModel && !vehicleModel.trim() ? (
                <Text style={styles.errorText}>⚠️ Vui lòng nhập Tên/Mẫu xe</Text>
              ) : null}

              <Text style={styles.label}>Biển số xe *</Text>
              <TextInput
                style={[styles.input, touched.licensePlate && !!validatePlateError(licensePlate) ? styles.inputError : null]}
                placeholder="Ví dụ: 43-C1 123.45 hoặc 43C1-12345"
                placeholderTextColor={COLORS.textMuted}
                value={licensePlate}
                onChangeText={(val) => {
                  setLicensePlate(val);
                  setTouched(prev => ({ ...prev, licensePlate: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, licensePlate: true }))}
                autoCapitalize="characters"
                editable={!formLoading}
              />
              {touched.licensePlate && !!validatePlateError(licensePlate) ? (
                <Text style={styles.errorText}>⚠️ {validatePlateError(licensePlate)}</Text>
              ) : null}

              <Text style={styles.label}>Giá thuê / ngày (VNĐ) *</Text>
              <TextInput
                style={[styles.input, touched.rentalPrice && !!validatePriceError(rentalPrice) ? styles.inputError : null]}
                placeholder="Ví dụ: 120000"
                placeholderTextColor={COLORS.textMuted}
                value={rentalPrice}
                onChangeText={(val) => {
                  setRentalPrice(val);
                  setTouched(prev => ({ ...prev, rentalPrice: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, rentalPrice: true }))}
                keyboardType="numeric"
                editable={!formLoading}
              />
              {touched.rentalPrice && !!validatePriceError(rentalPrice) ? (
                <Text style={styles.errorText}>⚠️ {validatePriceError(rentalPrice)}</Text>
              ) : null}

              <Text style={styles.label}>Địa chỉ xe thực tế *</Text>
              <TextInput
                style={[styles.input, touched.address && !address.trim() ? styles.inputError : null]}
                placeholder="Ví dụ: 120 Ngô Quyền, Sơn Trà, Đà Nẵng"
                placeholderTextColor={COLORS.textMuted}
                value={address}
                onChangeText={handleAddressChange}
                onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                editable={!formLoading}
              />
              {touched.address && !address.trim() ? (
                <Text style={styles.errorText}>⚠️ Vui lòng nhập Địa chỉ nơi để xe</Text>
              ) : null}

              {/* Quick Preset Location Chips */}
              <Text style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 6 }}>
                CHỌN NHANH VỊ TRÍ PHỔ BIẾN:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { label: '📍 Sơn Trà (120 Ngô Quyền)', addr: '120 Ngô Quyền, Sơn Trà, Đà Nẵng', lat: 16.0820, lng: 108.2350 },
                    { label: '📍 Hải Châu (48 Cao Thắng)', addr: '48 Cao Thắng, Hải Châu, Đà Nẵng', lat: 16.0730, lng: 108.2180 },
                    { label: '📍 Sân Bay Đà Nẵng', addr: 'Sân bay Quốc tế Đà Nẵng, Hải Châu, Đà Nẵng', lat: 16.0540, lng: 108.1970 },
                    { label: '📍 Thanh Khê (254 Nguyễn Văn Linh)', addr: '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', lat: 16.0610, lng: 108.2050 },
                    { label: '📍 Ngũ Hành Sơn (Mỹ Khê)', addr: 'Bãi biển Mỹ Khê, Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng', lat: 16.0480, lng: 108.2450 },
                  ].map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        backgroundColor: address === preset.addr ? 'rgba(204,255,0,0.15)' : COLORS.card,
                        borderWidth: 1,
                        borderColor: address === preset.addr ? COLORS.accent : COLORS.border,
                        borderRadius: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                      onPress={() => {
                        setAddress(preset.addr);
                        setMapCoords({ lat: preset.lat, lng: preset.lng });
                        setTouched(prev => ({ ...prev, address: true }));
                      }}
                    >
                      <Text style={{ color: address === preset.addr ? COLORS.accent : COLORS.textMuted, fontSize: 10, fontWeight: 'bold' }}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Real OpenStreetMap Tile View */}
              <View style={styles.mapPickerCard}>
                <View style={styles.mapPickerHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Feather name="map-pin" size={13} color={COLORS.accent} />
                    <Text style={styles.mapPickerTitle}>BẢN ĐỒ OPENSTREETMAP (CHẠM ĐỂ GHIM VỊ TRÍ)</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.expandMapBtn}
                    onPress={() => setFullscreenMapVisible(true)}
                  >
                    <Feather name="maximize-2" size={12} color={COLORS.accent} />
                    <Text style={styles.expandMapBtnText}>Phóng to</Text>
                  </TouchableOpacity>
                </View>

                {/* Real Leaflet OpenStreetMap WebView Canvas */}
                <View style={styles.mapCanvas}>
                  {Platform.OS === 'web' ? (
                    <iframe
                      srcDoc={generateLeafletHTML(mapCoords.lat, mapCoords.lng, address)}
                      style={{ width: '100%', height: '100%', border: 'none', borderRadius: 10 } as any}
                    />
                  ) : (
                    <WebView
                      originWhitelist={['*']}
                      source={{ html: generateLeafletHTML(mapCoords.lat, mapCoords.lng, address) }}
                      style={{ flex: 1 }}
                      onMessage={handleMapMessage}
                      scrollEnabled={false}
                    />
                  )}
                </View>

                <View style={styles.mapPickerFooter}>
                  <Text style={styles.gpsCoordsText}>
                    📍 GPS: {mapCoords.lat.toFixed(4)}° N, {mapCoords.lng.toFixed(4)}° E • OpenStreetMap Đà Nẵng
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Loại xe (Hộp số) *</Text>
              <View style={styles.typeSelector}>
                {(['Manual', 'Automatic', 'Semi-Automatic'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      transmissionType === type && styles.typeOptionActive,
                    ]}
                    onPress={() => setTransmissionType(type)}
                    disabled={formLoading}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      transmissionType === type && styles.typeOptionTextActive,
                    ]}>
                      {type === 'Manual' ? 'Xe số' : type === 'Automatic' ? 'Xe ga' : 'Xe côn'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Danh mục *</Text>
              <View style={styles.categorySelector}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.catOption,
                      selectedCategory === cat._id && styles.catOptionActive,
                    ]}
                    onPress={() => setSelectedCategory(cat._id)}
                    disabled={formLoading}
                  >
                    <Text style={[
                      styles.catOptionText,
                      selectedCategory === cat._id && styles.catOptionTextActive,
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Mô tả xe</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả hiện trạng xe, phụ kiện kèm theo..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!formLoading}
              />

              {/* Photo selection section */}
              <View style={styles.photoRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Ảnh thực tế xe *</Text>
                  <TouchableOpacity style={styles.photoPicker} onPress={() => selectImage('vehicle')} disabled={formLoading}>
                    {vehicleImageUri ? (
                      <Image source={{ uri: vehicleImageUri }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPickerPlaceholder}>
                        <Feather name="camera" size={20} color={COLORS.textMuted} />
                        <Text style={styles.photoPickerText}>Chọn ảnh xe</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>Ảnh cà vẹt (Cần chọn)</Text>
                  <TouchableOpacity style={styles.photoPicker} onPress={() => selectImage('cert')} disabled={formLoading}>
                    {regCertUri ? (
                      <Image source={{ uri: regCertUri }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPickerPlaceholder}>
                        <Feather name="file-text" size={20} color={COLORS.textMuted} />
                        <Text style={styles.photoPickerText}>Chọn ảnh</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {formLoading ? (
                <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 25 }} />
              ) : (
                <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterBike}>
                  <Text style={styles.submitBtnText}>{editingBike ? 'LƯU THAY ĐỔI' : 'GỬI YÊU CẦU ĐĂNG KÝ'}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Map Modal */}
      <Modal visible={fullscreenMapVisible} animationType="slide" transparent>
        <View style={styles.fullscreenModalContainer}>
          <View style={styles.fullscreenModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="map-pin" size={18} color={COLORS.accent} />
              <Text style={styles.fullscreenModalTitle}>Phóng To Bản Đồ OpenStreetMap</Text>
            </View>
            <TouchableOpacity onPress={() => setFullscreenMapVisible(false)}>
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, padding: 16 }}>
            {/* Presets Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 38, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: '📍 Sơn Trà (120 Ngô Quyền)', addr: '120 Ngô Quyền, Sơn Trà, Đà Nẵng', lat: 16.0820, lng: 108.2350 },
                  { label: '📍 Hải Châu (48 Cao Thắng)', addr: '48 Cao Thắng, Hải Châu, Đà Nẵng', lat: 16.0730, lng: 108.2180 },
                  { label: '📍 Sân Bay Đà Nẵng', addr: 'Sân bay Quốc tế Đà Nẵng, Hải Châu, Đà Nẵng', lat: 16.0540, lng: 108.1970 },
                  { label: '📍 Thanh Khê (254 Nguyễn Văn Linh)', addr: '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', lat: 16.0610, lng: 108.2050 },
                  { label: '📍 Ngũ Hành Sơn (Mỹ Khê)', addr: 'Bãi biển Mỹ Khê, Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng', lat: 16.0480, lng: 108.2450 },
                ].map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      backgroundColor: address === preset.addr ? 'rgba(204,255,0,0.15)' : COLORS.card,
                      borderWidth: 1,
                      borderColor: address === preset.addr ? COLORS.accent : COLORS.border,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                    onPress={() => {
                      setAddress(preset.addr);
                      setMapCoords({ lat: preset.lat, lng: preset.lng });
                    }}
                  >
                    <Text style={{ color: address === preset.addr ? COLORS.accent : COLORS.textMuted, fontSize: 11, fontWeight: 'bold' }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Large Fullscreen Real OpenStreetMap WebView */}
            <View style={styles.largeMapCanvas}>
              {Platform.OS === 'web' ? (
                <iframe
                  srcDoc={generateLeafletHTML(mapCoords.lat, mapCoords.lng, address)}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 } as any}
                />
              ) : (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: generateLeafletHTML(mapCoords.lat, mapCoords.lng, address) }}
                  style={{ flex: 1 }}
                  onMessage={handleMapMessage}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.confirmMapBtn}
              onPress={() => setFullscreenMapVisible(false)}
            >
              <Text style={styles.confirmMapBtnText}>XÁC NHẬN VỊ TRÍ XE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bikesList: {
    gap: 15,
  },
  bikeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  bikeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  bikeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
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
    marginTop: 8,
  },
  price: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 13,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  formScroll: {
    paddingBottom: 40,
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: COLORS.accent,
  },
  typeOptionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: COLORS.accent,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catOption: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  catOptionActive: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: COLORS.accent,
  },
  catOptionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  catOptionTextActive: {
    color: COLORS.accent,
  },
  photoRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  photoPicker: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 10,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  photoPickerText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 25,
  },
  submitBtnText: {
    color: COLORS.accentDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
  },
  /* Map Picker Styles */
  expandMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  expandMapBtnText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },
  mapPickerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  mapPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mapPickerTitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapCanvas: {
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  mapPickerFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  gpsCoordsText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullscreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  fullscreenModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  largeMapCanvas: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  confirmMapBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmMapBtnText: {
    color: COLORS.accentDark,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
