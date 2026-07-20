import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { API_BASE_URL } from '../../../constants/api';

const { width } = Dimensions.get('window');

interface CompareBikesModalProps {
  visible: boolean;
  onClose: () => void;
  bikes: Bike[];
}

interface CompareVehicle {
  _id: string;
  vehicleModel: string;
  licensePlate: string;
  rentalPrice: number;
  transmissionType: string;
  seats: number;
  odometer: number;
  status: string;
  imageUrls: string[];
  features: string[];
  category?: { name: string } | string;
  completedBookings?: number;
  createdAt?: string;
}

const TRANSMISSION_MAP: Record<string, string> = {
  Manual: 'Xe Côn Tay',
  Automatic: 'Xe Ga',
  'Semi-Automatic': 'Xe Số',
};

interface CompareRow {
  label: string;
  icon: string;
  getValue: (v: CompareVehicle) => string;
  higherIsBetter?: boolean;
  highlight?: boolean;
}

const ROWS: CompareRow[] = [
  { label: 'Giá thuê / ngày', icon: 'dollar-sign', getValue: v => `${(v.rentalPrice || 0).toLocaleString()}đ`, highlight: true, higherIsBetter: false },
  { label: 'Hạng xe', icon: 'sliders', getValue: v => typeof v.category === 'object' && v.category?.name ? v.category.name : (v.category as string) || '—' },
  { label: 'Hộp số', icon: 'zap', getValue: v => TRANSMISSION_MAP[v.transmissionType] || v.transmissionType || '—' },
  { label: 'Số ghế', icon: 'users', getValue: v => `${v.seats || 2} chỗ`, highlight: true, higherIsBetter: true },
  { label: 'Số km đã đi', icon: 'navigation', getValue: v => `${(v.odometer || 0).toLocaleString()} km`, highlight: true, higherIsBetter: false },
  { label: 'Booking thành công', icon: 'star', getValue: v => `${v.completedBookings || 0} lần`, highlight: true, higherIsBetter: true },
  { label: 'Tình trạng', icon: 'check-circle', getValue: v => v.status === 'Available' ? '✅ Sẵn sàng' : '❌ Không có sẵn' },
];

export const CompareBikesModal: React.FC<CompareBikesModalProps> = ({ visible, onClose, bikes }) => {
  // Step 1: Select bikes to compare
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Step 2: Show comparison
  const [compareData, setCompareData] = useState<CompareVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'compare'>('select');

  // Reset when opening
  useEffect(() => {
    if (visible) {
      setSelectedIds([]);
      setCompareData([]);
      setError(null);
      setStep('select');
    }
  }, [visible]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/vehicles/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleIds: selectedIds }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCompareData(data.data);
        setStep('compare');
      } else {
        throw new Error(data.message || 'Lỗi');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể so sánh xe.');
    } finally {
      setLoading(false);
    }
  };

  const getBestIdx = (row: CompareRow): number | null => {
    if (!row.highlight || compareData.length < 2) return null;
    const vals = compareData.map(v => {
      const raw = row.getValue(v);
      const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    });
    if (vals.some(v => v === null)) return null;
    const nums = vals as number[];
    return row.higherIsBetter ? nums.indexOf(Math.max(...nums)) : nums.indexOf(Math.min(...nums));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 'compare' ? () => setStep('select') : onClose} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>So Sánh Xe Máy</Text>
            <Text style={styles.headerSub}>{step === 'select' ? 'Chọn 2-3 xe để so sánh' : `${compareData.length} xe đang so sánh`}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Feather name="x" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {step === 'select' ? (
          <>
            <ScrollView contentContainerStyle={styles.selectList} showsVerticalScrollIndicator={false}>
              {bikes.map(bike => {
                const selected = selectedIds.includes(bike.id);
                return (
                  <TouchableOpacity
                    key={bike.id}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => toggleSelect(bike.id)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: bike.image }} style={styles.selectImage} />
                    <View style={styles.selectInfo}>
                      <Text style={styles.selectName}>{bike.name}</Text>
                      <Text style={styles.selectPrice}>{bike.price} VNĐ/ngày</Text>
                      <Text style={styles.selectType}>{bike.type}</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                      {selected && <Feather name="check" size={14} color={COLORS.accentDark} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom bar */}
            <View style={styles.bottomBar}>
              <Text style={styles.selectedCount}>{selectedIds.length}/3 xe đã chọn</Text>
              <TouchableOpacity
                style={[styles.compareBtn, selectedIds.length < 2 && styles.compareBtnDisabled]}
                onPress={handleCompare}
                disabled={selectedIds.length < 2 || loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.accentDark} />
                ) : (
                  <Text style={styles.compareBtnText}>SO SÁNH NGAY</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.compareScroll} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={24} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                {/* Vehicle header cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleHeaders}>
                  {compareData.map((v, idx) => (
                    <View key={v._id} style={styles.vehicleCard}>
                      {idx === 0 && <View style={styles.suggestBadge}><Text style={styles.suggestText}>⭐ Gợi ý</Text></View>}
                      <Image
                        source={{ uri: v.imageUrls?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400' }}
                        style={styles.vehicleImage}
                      />
                      <Text style={styles.vehicleName} numberOfLines={2}>{v.vehicleModel}</Text>
                      <Text style={styles.vehiclePrice}>{(v.rentalPrice || 0).toLocaleString()}đ/ngày</Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Comparison rows */}
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>THÔNG SỐ SO SÁNH</Text>
                  </View>
                  {ROWS.map((row, ri) => {
                    const bestIdx = getBestIdx(row);
                    return (
                      <View key={ri} style={[styles.tableRow, ri % 2 === 0 && styles.tableRowAlt]}>
                        <View style={styles.rowLabel}>
                          <Feather name={row.icon as any} size={12} color={COLORS.accent} />
                          <Text style={styles.rowLabelText}>{row.label}</Text>
                        </View>
                        <View style={styles.rowValues}>
                          {compareData.map((v, vi) => {
                            const isBest = bestIdx === vi;
                            const val = row.getValue(v);
                            return (
                              <View key={v._id} style={styles.rowValueCell}>
                                <Text style={[styles.rowValueText, isBest && styles.rowValueBest]}>
                                  {val}{isBest ? ' ✓' : ''}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}

                  {/* Features row */}
                  <View style={styles.tableRow}>
                    <View style={styles.rowLabel}>
                      <Feather name="settings" size={12} color={COLORS.accent} />
                      <Text style={styles.rowLabelText}>Tính năng</Text>
                    </View>
                    <View style={styles.rowValues}>
                      {compareData.map(v => (
                        <View key={v._id} style={styles.rowValueCell}>
                          {v.features?.length > 0 ? (
                            v.features.slice(0, 3).map((f, i) => (
                              <View key={i} style={styles.featureItem}>
                                <View style={styles.featureDot} />
                                <Text style={styles.featureText} numberOfLines={1}>{f}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.rowValueText}>—</Text>
                          )}
                          {(v.features?.length || 0) > 3 && (
                            <Text style={styles.moreFeatures}>+{v.features.length - 3} khác</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const cardW = (width - 64) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  headerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  // Select step
  selectList: { padding: 16, paddingBottom: 100 },
  selectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden' },
  selectCardActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(204,255,0,0.05)' },
  selectImage: { width: 80, height: 70, backgroundColor: COLORS.border },
  selectInfo: { flex: 1, padding: 12 },
  selectName: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  selectPrice: { color: COLORS.accent, fontSize: 12, fontWeight: '600', marginTop: 2 },
  selectType: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, padding: 16, paddingBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  compareBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  compareBtnDisabled: { opacity: 0.4 },
  compareBtnText: { color: COLORS.accentDark, fontSize: 13, fontWeight: '900' },
  // Compare step
  compareScroll: { padding: 16, paddingBottom: 40 },
  errorBox: { alignItems: 'center', padding: 30, gap: 10 },
  errorText: { color: COLORS.textMuted, fontSize: 13 },
  vehicleHeaders: { gap: 12, paddingBottom: 16 },
  vehicleCard: { width: cardW, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 10, alignItems: 'center' },
  suggestBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, zIndex: 1 },
  suggestText: { color: COLORS.accentDark, fontSize: 9, fontWeight: 'bold' },
  vehicleImage: { width: '100%', height: 80, borderRadius: 8, backgroundColor: COLORS.border, marginBottom: 8 },
  vehicleName: { color: COLORS.text, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  vehiclePrice: { color: COLORS.accent, fontSize: 12, fontWeight: '600', marginTop: 2 },
  // Table
  tableContainer: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  tableHeader: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeaderText: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  tableRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.01)' },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabelText: { color: COLORS.textMuted, fontSize: 12 },
  rowValues: { flexDirection: 'row' },
  rowValueCell: { flex: 1, paddingHorizontal: 8, paddingVertical: 8, borderRightWidth: 1, borderRightColor: COLORS.border },
  rowValueText: { color: COLORS.text, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  rowValueBest: { color: COLORS.accent, fontWeight: 'bold' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  featureDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
  featureText: { color: COLORS.textSecondary, fontSize: 10, flex: 1 },
  moreFeatures: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
});
