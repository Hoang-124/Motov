import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';

interface InventoryItem {
  _id?: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  price: number;
  location?: string;
  description?: string;
  lastRestockedAt?: string;
}

export const InventoryScreen: React.FC = () => {
  const token = useAppSelector(s => s.user.token);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Form modal
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('5');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Stock modal
  const [stockVisible, setStockVisible] = useState(false);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [stockAction, setStockAction] = useState<'in' | 'out'>('in');
  const [stockDelta, setStockDelta] = useState('1');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (lowStockOnly) params.set('lowStock', 'true');
      const res = await apiFetch(`/inventory?${params}`);
      const data = await res.json();
      setItems(data.data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải kho phụ tùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [search, lowStockOnly]);

  // Form handlers
  const openCreate = () => {
    setEditing(null);
    setName(''); setSku(''); setQuantity('0'); setMinQuantity('5');
    setPrice(''); setLocation(''); setDescription('');
    setFormVisible(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setName(item.name); setSku(item.sku);
    setQuantity(item.quantity.toString()); setMinQuantity(item.minQuantity.toString());
    setPrice(item.price.toString()); setLocation(item.location || '');
    setDescription(item.description || '');
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !sku.trim()) { Alert.alert('Lỗi', 'Tên và mã SKU bắt buộc.'); return; }
    setFormLoading(true);
    try {
      const body = { name: name.trim(), sku: sku.trim().toUpperCase(), quantity: Number(quantity) || 0, minQuantity: Number(minQuantity) || 5, price: Number(price) || 0, location: location.trim(), description: description.trim() };
      const endpoint = editing?._id ? `/inventory/${editing._id}` : '/inventory';
      const method = editing?._id ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Lỗi'); }
      Alert.alert('Thành Công', editing ? 'Đã cập nhật!' : 'Đã thêm mới!');
      setFormVisible(false);
      fetchItems();
    } catch (err: any) { Alert.alert('Lỗi', err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert('Xóa Phụ Tùng', `Xóa "${item.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiFetch(`/inventory/${item._id}`, { method: 'DELETE' });
          Alert.alert('Thành Công', 'Đã xóa!');
          fetchItems();
        } catch { Alert.alert('Lỗi', 'Không thể xóa.'); }
      }},
    ]);
  };

  // Stock handlers
  const openStock = (item: InventoryItem, action: 'in' | 'out') => {
    setStockItem(item); setStockAction(action); setStockDelta('1'); setStockVisible(true);
  };

  const handleStockUpdate = async () => {
    if (!stockItem?._id) return;
    const delta = stockAction === 'in' ? Number(stockDelta) : -Number(stockDelta);
    if (isNaN(delta) || Number(stockDelta) <= 0) { Alert.alert('Lỗi', 'Số lượng phải > 0.'); return; }
    try {
      const res = await apiFetch(`/inventory/${stockItem._id}/stock`, {
        method: 'PATCH', body: JSON.stringify({ delta }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Lỗi'); }
      Alert.alert('Thành Công', `${stockAction === 'in' ? 'Nhập' : 'Xuất'} kho thành công!`);
      setStockVisible(false);
      fetchItems();
    } catch (err: any) { Alert.alert('Lỗi', err.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Kho Phụ Tùng</Text>
            <Text style={styles.pageSubtitle}>{items.length} phụ tùng</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Feather name="plus" size={16} color={COLORS.accentDark} />
            <Text style={styles.addBtnText}>Thêm mới</Text>
          </TouchableOpacity>
        </View>

        {/* Search + filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={14} color="#666" />
            <TextInput style={styles.searchInput} placeholder="Tìm phụ tùng..." placeholderTextColor="#555" value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, lowStockOnly && styles.filterBtnActive]}
            onPress={() => setLowStockOnly(!lowStockOnly)}
          >
            <Feather name="alert-triangle" size={12} color={lowStockOnly ? COLORS.warning : COLORS.textMuted} />
            <Text style={[styles.filterText, lowStockOnly && { color: COLORS.warning }]}>Sắp hết</Text>
          </TouchableOpacity>
        </View>

        {/* Items list */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="package" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có phụ tùng nào.</Text>
          </View>
        ) : (
          items.map(item => {
            const isLow = item.quantity <= item.minQuantity;
            return (
              <View key={item._id} style={[styles.card, isLow && styles.cardLow]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  </View>
                  <View style={styles.qtyBox}>
                    <Text style={[styles.qtyNum, isLow && { color: COLORS.danger }]}>{item.quantity}</Text>
                    <Text style={styles.qtyLabel}>Tồn kho</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  {item.price > 0 && <Text style={styles.metaText}>💰 {item.price.toLocaleString()}đ</Text>}
                  {item.location ? <Text style={styles.metaText}>📍 {item.location}</Text> : null}
                  <Text style={styles.metaText}>⚠️ Min: {item.minQuantity}</Text>
                </View>

                {isLow && (
                  <View style={styles.lowWarning}>
                    <Feather name="alert-circle" size={11} color={COLORS.warning} />
                    <Text style={styles.lowWarningText}>Sắp hết hàng! Cần nhập thêm.</Text>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.stockBtn} onPress={() => openStock(item, 'in')}>
                    <Feather name="plus-circle" size={13} color={COLORS.approved} />
                    <Text style={[styles.stockText, { color: COLORS.approved }]}>Nhập</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stockBtn} onPress={() => openStock(item, 'out')}>
                    <Feather name="minus-circle" size={13} color="#f97316" />
                    <Text style={[styles.stockText, { color: '#f97316' }]}>Xuất</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stockBtn} onPress={() => openEdit(item)}>
                    <Feather name="edit-2" size={13} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stockBtn} onPress={() => handleDelete(item)}>
                    <Feather name="trash-2" size={13} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFormVisible(false)}><Feather name="x" size={22} color={COLORS.text} /></TouchableOpacity>
            <Text style={styles.modalTitle}>{editing ? 'Sửa' : 'Thêm'} Phụ Tùng</Text>
            <View style={{ width: 22 }} />
          </View>

          {[
            { label: 'Tên phụ tùng *', val: name, set: setName, ph: 'VD: Bugi NGK' },
            { label: 'Mã SKU *', val: sku, set: setSku, ph: 'VD: BG-001' },
            { label: 'Số lượng', val: quantity, set: setQuantity, ph: '0', kb: 'numeric' as const },
            { label: 'Tồn kho tối thiểu', val: minQuantity, set: setMinQuantity, ph: '5', kb: 'numeric' as const },
            { label: 'Đơn giá (VNĐ)', val: price, set: setPrice, ph: '0', kb: 'numeric' as const },
            { label: 'Vị trí kho', val: location, set: setLocation, ph: 'VD: Kệ A3' },
            { label: 'Mô tả', val: description, set: setDescription, ph: 'Ghi chú...', multi: true },
          ].map((f, i) => (
            <View key={i} style={styles.formGroup}>
              <Text style={styles.formLabel}>{f.label}</Text>
              <TextInput
                style={[styles.formInput, f.multi && { minHeight: 70 }]}
                value={f.val} onChangeText={f.set}
                placeholder={f.ph} placeholderTextColor="#555"
                keyboardType={f.kb || 'default'}
                multiline={f.multi}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={formLoading}>
            {formLoading ? <ActivityIndicator color={COLORS.accentDark} /> : <Text style={styles.saveBtnText}>{editing ? 'Cập Nhật' : 'Thêm Mới'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Stock Modal */}
      <Modal visible={stockVisible} transparent animationType="fade" onRequestClose={() => setStockVisible(false)}>
        <View style={styles.stockOverlay}>
          <View style={styles.stockModal}>
            <Text style={styles.stockModalTitle}>{stockAction === 'in' ? 'Nhập Kho' : 'Xuất Kho'}</Text>
            <Text style={styles.stockModalSub}>{stockItem?.name} (Hiện có: {stockItem?.quantity})</Text>
            <TextInput style={styles.stockDeltaInput} value={stockDelta} onChangeText={setStockDelta} keyboardType="numeric" placeholder="Số lượng" placeholderTextColor="#555" />
            <View style={styles.stockModalActions}>
              <TouchableOpacity style={styles.stockCancelBtn} onPress={() => setStockVisible(false)}>
                <Text style={styles.stockCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.stockConfirmBtn, stockAction === 'out' && { backgroundColor: '#f97316' }]} onPress={handleStockUpdate}>
                <Text style={styles.stockConfirmText}>{stockAction === 'in' ? 'Nhập' : 'Xuất'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  pageTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  pageSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: COLORS.accentDark, fontWeight: 'bold', fontSize: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: COLORS.text, paddingVertical: 10, fontSize: 13 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { borderColor: COLORS.warningBorder, backgroundColor: COLORS.warningBg },
  filterText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardLow: { borderColor: COLORS.warningBorder },
  cardTop: { flexDirection: 'row', marginBottom: 8 },
  itemName: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
  itemSku: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, fontFamily: 'monospace' },
  qtyBox: { alignItems: 'center', backgroundColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, marginLeft: 12 },
  qtyNum: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  qtyLabel: { color: COLORS.textMuted, fontSize: 8, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 6, flexWrap: 'wrap' },
  metaText: { color: COLORS.textSecondary, fontSize: 11 },
  lowWarning: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warningBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  lowWarningText: { color: COLORS.warning, fontSize: 10, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  stockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  stockText: { fontSize: 11, fontWeight: '600' },
  // Form modal
  modalContainer: { backgroundColor: COLORS.bg, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 10 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  formGroup: { marginBottom: 14 },
  formLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  formInput: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14 },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.accentDark, fontSize: 14, fontWeight: '900' },
  // Stock modal
  stockOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  stockModal: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 24, width: '100%' },
  stockModalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  stockModalSub: { color: COLORS.textMuted, fontSize: 12, marginBottom: 16 },
  stockDeltaInput: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  stockModalActions: { flexDirection: 'row', gap: 10 },
  stockCancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  stockCancelText: { color: COLORS.textMuted, fontWeight: 'bold', fontSize: 13 },
  stockConfirmBtn: { flex: 1, backgroundColor: COLORS.approved, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  stockConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
