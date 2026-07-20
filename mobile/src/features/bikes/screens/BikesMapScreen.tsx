import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { API_BASE_URL } from '../../../constants/api';
import { Bike } from '../../../types';
import { useAppSelector } from '../../../app/store';

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

  const fetchNearby = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/vehicles/nearby?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&radius=10000`);
      const data = await res.json();
      if (res.ok && data.success) {
        setNearbyBikes(data.data || []);
      } else {
        // fallback: just use redux bikes
        setNearbyBikes([]);
      }
    } catch {
      setNearbyBikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNearby(); }, []);

  const displayBikes = nearbyBikes.length > 0 ? nearbyBikes : [];

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

      {/* Map placeholder with SVG */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          {/* Simple visual map representation */}
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapGrid}>
              {/* Grid lines */}
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 14}%` }]} />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 14}%` }]} />
              ))}
            </View>

            {/* River representation */}
            <View style={styles.river} />
            <Text style={styles.riverLabel}>SÔNG HÀN</Text>

            {/* User location */}
            <View style={styles.userPin}>
              <View style={styles.userPinPulse} />
              <View style={styles.userPinDot} />
            </View>
            <Text style={styles.userPinLabel}>Bạn</Text>

            {/* Bike pins - spread around */}
            {displayBikes.slice(0, 8).map((bike, i) => {
              const positions = [
                { top: '20%', left: '60%' },
                { top: '35%', left: '25%' },
                { top: '15%', left: '75%' },
                { top: '55%', left: '70%' },
                { top: '40%', left: '45%' },
                { top: '65%', left: '30%' },
                { top: '25%', left: '40%' },
                { top: '50%', left: '55%' },
              ];
              const pos = positions[i];
              const isSelected = selectedBike?._id === bike._id;
              return (
                <TouchableOpacity
                  key={bike._id}
                  style={[styles.bikePin, pos as any, isSelected && styles.bikePinSelected]}
                  onPress={() => setSelectedBike(isSelected ? null : bike)}
                >
                  <MaterialCommunityIcons name="motorbike" size={10} color={isSelected ? COLORS.accentDark : COLORS.accent} />
                </TouchableOpacity>
              );
            })}

            {/* Map labels */}
            <Text style={[styles.areaLabel, { top: '10%', right: '5%' }]}>Sơn Trà</Text>
            <Text style={[styles.areaLabel, { bottom: '15%', left: '10%' }]}>Hải Châu</Text>
            <Text style={[styles.areaLabel, { top: '50%', right: '10%' }]}>Ngũ Hành Sơn</Text>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Bạn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.legendText}>Xe máy ({displayBikes.length})</Text>
            </View>
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
              <Text style={styles.popupName} numberOfLines={1}>{selectedBike.vehicleModel}</Text>
              <Text style={styles.popupPrice}>{(selectedBike.rentalPrice || 0).toLocaleString()} VNĐ/ngày</Text>
              <Text style={styles.popupMeta}>{getCategoryName(selectedBike.category)} • {selectedBike.licensePlate}</Text>
              {selectedBike.distance > 0 && (
                <Text style={styles.popupDistance}>📍 {(selectedBike.distance / 1000).toFixed(1)} km</Text>
              )}
            </View>
            <TouchableOpacity style={styles.popupBookBtn} onPress={() => handleBookFromMap(selectedBike)}>
              <Text style={styles.popupBookText}>ĐẶT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
              <Image source={{ uri: bike.imageUrls?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200' }} style={styles.bikeCardImage} />
              <View style={styles.bikeCardInfo}>
                <Text style={styles.bikeCardName} numberOfLines={1}>{bike.vehicleModel}</Text>
                <Text style={styles.bikeCardPrice}>{(bike.rentalPrice || 0).toLocaleString()} đ/ngày</Text>
                <View style={styles.bikeCardMeta}>
                  <Text style={styles.bikeCardType}>{getCategoryName(bike.category)}</Text>
                  {bike.distance > 0 && <Text style={styles.bikeCardDist}>{(bike.distance / 1000).toFixed(1)} km</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  mapContainer: { backgroundColor: '#0a1628', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  mapPlaceholder: { height: 200, position: 'relative' },
  mapGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  river: { position: 'absolute', left: '28%', top: 0, bottom: 0, width: 12, backgroundColor: 'rgba(59,130,246,0.12)', borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  riverLabel: { position: 'absolute', left: '24%', bottom: '8%', color: 'rgba(59,130,246,0.3)', fontSize: 7, fontWeight: 'bold', transform: [{ rotate: '-90deg' }] },
  userPin: { position: 'absolute', top: '45%', left: '35%', alignItems: 'center', justifyContent: 'center' },
  userPinPulse: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)' },
  userPinDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  userPinLabel: { position: 'absolute', top: '52%', left: '37%', color: '#3b82f6', fontSize: 8, fontWeight: 'bold' },
  bikePin: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(204,255,0,0.15)', borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  bikePinSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent, transform: [{ scale: 1.3 }] },
  areaLabel: { position: 'absolute', color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 'bold' },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 10 },
  // Popup
  popupCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accent, padding: 10, marginTop: 8, alignItems: 'center' },
  popupImage: { width: 56, height: 48, borderRadius: 8, backgroundColor: COLORS.border },
  popupInfo: { flex: 1, marginLeft: 10 },
  popupName: { color: COLORS.text, fontSize: 13, fontWeight: 'bold' },
  popupPrice: { color: COLORS.accent, fontSize: 12, fontWeight: '600', marginTop: 1 },
  popupMeta: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  popupDistance: { color: COLORS.textSecondary, fontSize: 10, marginTop: 1 },
  popupBookBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  popupBookText: { color: COLORS.accentDark, fontSize: 11, fontWeight: '900' },
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
