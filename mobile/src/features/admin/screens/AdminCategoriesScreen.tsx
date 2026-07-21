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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { API_BASE_URL } from '../../../constants/api';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export const AdminCategoriesScreen: React.FC = () => {
  const token = useAppSelector(s => s.user.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      setCategories(data.data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setModalVisible(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên danh mục không được để trống.');
      return;
    }
    setFormLoading(true);
    try {
      const url = editing ? `${API_BASE_URL}/categories/${editing._id}` : `${API_BASE_URL}/categories`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || d.errors?.[0] || 'Lỗi');
      }
      Alert.alert('Thành Công', editing ? 'Đã cập nhật danh mục!' : 'Đã tạo danh mục mới!');
      setModalVisible(false);
      fetchCategories();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: string, catName: string) => {
    Alert.alert('Xóa Danh Mục', `Xóa danh mục "${catName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error();
            Alert.alert('Thành Công', 'Đã xóa danh mục!');
            fetchCategories();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa danh mục.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Quản Lý Danh Mục</Text>
          <Text style={styles.pageSubtitle}>{categories.length} danh mục</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Feather name="plus" size={16} color={COLORS.accentDark} />
          <Text style={styles.addBtnText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : categories.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="folder" size={36} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Chưa có danh mục nào.</Text>
        </View>
      ) : (
        categories.map(c => (
          <View key={c._id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{c.name}</Text>
              {c.description ? <Text style={styles.cardDesc}>{c.description}</Text> : null}
              <Text style={styles.cardSlug}>slug: {c.slug}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(c)} style={styles.iconBtn}>
                <Feather name="edit-2" size={14} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(c._id, c.name)} style={styles.iconBtn}>
                <Feather name="trash-2" size={14} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="x" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editing ? 'Chỉnh Sửa' : 'Tạo Mới'} Danh Mục</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tên danh mục *</Text>
            <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="VD: Xe Ga" placeholderTextColor="#555" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Mô tả</Text>
            <TextInput style={[styles.formInput, { minHeight: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Mô tả danh mục..." placeholderTextColor="#555" />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={formLoading}>
            {formLoading ? <ActivityIndicator color={COLORS.accentDark} /> : <Text style={styles.saveBtnText}>{editing ? 'Cập Nhật' : 'Tạo Mới'}</Text>}
          </TouchableOpacity>
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
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  cardName: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
  cardDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  cardSlug: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, fontFamily: 'monospace' },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1, backgroundColor: COLORS.bg, padding: 20, paddingTop: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 10 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  formGroup: { marginBottom: 16 },
  formLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  formInput: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14 },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: COLORS.accentDark, fontSize: 14, fontWeight: '900' },
});
