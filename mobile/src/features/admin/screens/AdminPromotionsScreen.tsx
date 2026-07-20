import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { API_BASE_URL } from '../../../constants/api';

interface Promotion {
  _id: string;
  discountName: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  voucherCode: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  discountCategory?: string;
}

export const AdminPromotionsScreen: React.FC = () => {
  const token = useAppSelector(s => s.user.token);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [discountName, setDiscountName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'FixedAmount'>('Percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/promotions/admin`, { headers });
      const data = await res.json();
      setPromotions(data.promotions || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách khuyến mãi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setDiscountName('');
    setDescription('');
    setDiscountType('Percentage');
    setDiscountValue('');
    setVoucherCode('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setMinOrderAmount('');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setModalVisible(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setDiscountName(p.discountName);
    setDescription(p.description || '');
    setDiscountType(p.discountType);
    setDiscountValue(String(p.discountValue));
    setVoucherCode(p.voucherCode);
    setStartDate(p.startDate.slice(0, 10));
    setEndDate(p.endDate.slice(0, 10));
    setIsActive(p.isActive);
    setMinOrderAmount(p.minOrderAmount ? String(p.minOrderAmount) : '');
    setMaxDiscountAmount(p.maxDiscountAmount ? String(p.maxDiscountAmount) : '');
    setUsageLimit(p.usageLimit !== undefined ? String(p.usageLimit) : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!discountName || !voucherCode || !discountValue) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ: Tên, Mã voucher, Giá trị giảm.');
      return;
    }
    setFormLoading(true);
    try {
      const body: any = {
        discountName,
        description,
        discountType,
        discountValue: Number(discountValue),
        voucherCode,
        isActive,
      };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      if (minOrderAmount) body.minOrderAmount = Number(minOrderAmount);
      if (maxDiscountAmount) body.maxDiscountAmount = Number(maxDiscountAmount);
      if (usageLimit) body.usageLimit = Number(usageLimit);

      const url = editingPromo
        ? `${API_BASE_URL}/promotions/${editingPromo._id}`
        : `${API_BASE_URL}/promotions`;
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu');

      Alert.alert('Thành Công', editingPromo ? 'Đã cập nhật khuyến mãi!' : 'Đã tạo khuyến mãi mới!');
      setModalVisible(false);
      fetchPromotions();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu khuyến mãi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Xóa Khuyến Mãi', `Bạn có chắc muốn xóa "${name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/promotions/${id}`, { method: 'DELETE', headers });
            Alert.alert('Thành Công', 'Đã xóa khuyến mãi!');
            fetchPromotions();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  const handleToggle = async (p: Promotion) => {
    try {
      await fetch(`${API_BASE_URL}/promotions/${p._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      setPromotions(prev => prev.map(x => x._id === p._id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Quản Lý Khuyến Mãi</Text>
          <Text style={styles.pageSubtitle}>{promotions.length} chương trình</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Feather name="plus" size={16} color={COLORS.accentDark} />
          <Text style={styles.addBtnText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={24} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : promotions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="tag" size={36} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Chưa có chương trình khuyến mãi nào.</Text>
        </View>
      ) : (
        promotions.map(p => (
          <View key={p._id} style={[styles.card, !p.isActive && styles.cardInactive]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{p.discountName}</Text>
                <Text style={styles.cardCode}>{p.voucherCode}</Text>
              </View>
              <View style={styles.cardValueBox}>
                <Text style={styles.cardValue}>
                  {p.discountType === 'Percentage' ? `${p.discountValue}%` : `${(p.discountValue / 1000).toFixed(0)}K`}
                </Text>
                <Text style={styles.cardValueLabel}>GIẢM</Text>
              </View>
            </View>

            {p.description ? <Text style={styles.cardDesc}>{p.description}</Text> : null}

            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>
                <Feather name="calendar" size={10} color={COLORS.textMuted} /> {formatDate(p.startDate)} - {formatDate(p.endDate)}
              </Text>
              <Text style={styles.metaText}>
                Đã dùng: {p.usedCount}{p.usageLimit !== undefined ? `/${p.usageLimit}` : ''}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleToggle(p)} style={styles.toggleRow}>
                <View style={[styles.toggleDot, p.isActive ? styles.toggleActive : styles.toggleInactive]} />
                <Text style={[styles.toggleText, p.isActive ? { color: COLORS.approved } : { color: COLORS.danger }]}>
                  {p.isActive ? 'Đang chạy' : 'Tắt'}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => openEditModal(p)} style={styles.iconBtn}>
                  <Feather name="edit-2" size={14} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(p._id, p.discountName)} style={styles.iconBtn}>
                  <Feather name="trash-2" size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingPromo ? 'Chỉnh Sửa' : 'Tạo Mới'} Khuyến Mãi</Text>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên khuyến mãi *</Text>
              <TextInput style={styles.formInput} value={discountName} onChangeText={setDiscountName} placeholder="VD: Giảm giá hè 2026" placeholderTextColor="#555" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mã voucher *</Text>
              <TextInput style={styles.formInput} value={voucherCode} onChangeText={setVoucherCode} placeholder="VD: SUMMER2026" placeholderTextColor="#555" autoCapitalize="characters" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Loại giảm giá</Text>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, discountType === 'Percentage' && styles.typeBtnActive]}
                  onPress={() => setDiscountType('Percentage')}
                >
                  <Text style={[styles.typeBtnText, discountType === 'Percentage' && styles.typeBtnTextActive]}>Phần trăm (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, discountType === 'FixedAmount' && styles.typeBtnActive]}
                  onPress={() => setDiscountType('FixedAmount')}
                >
                  <Text style={[styles.typeBtnText, discountType === 'FixedAmount' && styles.typeBtnTextActive]}>Số tiền (VNĐ)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Giá trị giảm *</Text>
              <TextInput style={styles.formInput} value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" placeholder={discountType === 'Percentage' ? 'VD: 20' : 'VD: 50000'} placeholderTextColor="#555" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput style={[styles.formInput, { minHeight: 60 }]} value={description} onChangeText={setDescription} multiline placeholder="Mô tả chương trình..." placeholderTextColor="#555" />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Bắt đầu (YYYY-MM-DD)</Text>
                <TextInput style={styles.formInput} value={startDate} onChangeText={setStartDate} placeholder="2026-07-01" placeholderTextColor="#555" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Kết thúc (YYYY-MM-DD)</Text>
                <TextInput style={styles.formInput} value={endDate} onChangeText={setEndDate} placeholder="2026-08-01" placeholderTextColor="#555" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Đơn tối thiểu</Text>
                <TextInput style={styles.formInput} value={minOrderAmount} onChangeText={setMinOrderAmount} keyboardType="numeric" placeholder="0" placeholderTextColor="#555" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Giới hạn dùng</Text>
                <TextInput style={styles.formInput} value={usageLimit} onChangeText={setUsageLimit} keyboardType="numeric" placeholder="∞" placeholderTextColor="#555" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.formLabel}>Kích hoạt</Text>
                <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: COLORS.accent, false: '#333' }} />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={formLoading}>
              {formLoading ? (
                <ActivityIndicator color={COLORS.accentDark} />
              ) : (
                <Text style={styles.saveBtnText}>{editingPromo ? 'Cập Nhật' : 'Tạo Mới'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  pageTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  pageSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: COLORS.accentDark, fontWeight: 'bold', fontSize: 12 },
  errorBox: { alignItems: 'center', padding: 30, gap: 10 },
  errorText: { color: COLORS.textMuted, fontSize: 13 },
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
  cardCode: { color: COLORS.accent, fontSize: 12, fontWeight: '600', fontFamily: 'monospace', marginTop: 2 },
  cardValueBox: { alignItems: 'flex-end' },
  cardValue: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  cardValueLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  cardDesc: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaText: { color: COLORS.textMuted, fontSize: 11 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleActive: { backgroundColor: COLORS.approved },
  toggleInactive: { backgroundColor: COLORS.danger },
  toggleText: { fontSize: 11, fontWeight: 'bold' },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.bg },
  modalScroll: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 10 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  formGroup: { marginBottom: 16 },
  formLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.3 },
  formInput: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14 },
  typeToggle: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: 'rgba(204,255,0,0.1)', borderColor: COLORS.accent },
  typeBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  typeBtnTextActive: { color: COLORS.accent },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.accentDark, fontSize: 14, fontWeight: '900' },
});
