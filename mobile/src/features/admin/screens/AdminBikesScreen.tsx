import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { addBike, updateBike, deleteBike } from '../../bikes/bikesSlice';
import { Bike } from '../../../types';

export const AdminBikesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const bikes = useAppSelector(state => state.bikes.bikes);

  // Form Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('Scooter');
  const [image, setImage] = useState('');
  const [specsInput, setSpecsInput] = useState('');
  const [featured, setFeatured] = useState(false);

  const openAddModal = () => {
    setEditingBike(null);
    setName('');
    setPrice('150.000');
    setType('Scooter');
    setImage('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800');
    setSpecsInput('Bảo hiểm dân sự, Smartkey, Cốp rộng');
    setFeatured(false);
    setModalVisible(true);
  };

  const openEditModal = (bike: Bike) => {
    setEditingBike(bike);
    setName(bike.name);
    setPrice(bike.price);
    setType(bike.type);
    setImage(bike.image);
    setSpecsInput(bike.specs.join(', '));
    setFeatured(bike.featured);
    setModalVisible(true);
  };

  const handleDelete = (id: string, bikeName: string) => {
    Alert.alert(
      'Xóa Dòng Xe',
      `Bạn có chắc muốn xóa xe: ${bikeName} khỏi hệ thống không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteBike(id));
            Alert.alert('Thành Công', `Đã xóa xe: ${bikeName}!`);
          }
        }
      ]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên dòng xe');
      return;
    }
    const parsedSpecs = specsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (editingBike) {
      // Edit
      const updated: Bike = {
        ...editingBike,
        name,
        price,
        type,
        image,
        specs: parsedSpecs,
        featured,
      };
      dispatch(updateBike(updated));
      Alert.alert('Thành Công', `Đã cập nhật thông tin xe: ${name}`);
    } else {
      // Add
      const newBike: Bike = {
        id: 'bk-' + Math.floor(1000 + Math.random() * 9000),
        name,
        price,
        type,
        image: image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
        specs: parsedSpecs,
        featured,
      };
      dispatch(addBike(newBike));
      Alert.alert('Thành Công', `Đã thêm dòng xe mới: ${name}`);
    }
    setModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Quản Lý Dòng Xe</Text>
        <Text style={styles.pageSubtitle}>Thêm mới, chỉnh sửa thông tin xe trong toàn hệ thống</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.btnAdd} onPress={openAddModal}>
        <Feather name="plus" size={16} color={COLORS.accentDark} style={{ marginRight: 6 }} />
        <Text style={styles.btnAddText}>THÊM XE MỚI</Text>
      </TouchableOpacity>

      {/* Bikes list */}
      <View style={styles.listContainer}>
        {bikes.map(bike => (
          <View key={bike.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: bike.image }} style={styles.bikeImage} />
              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.bikeName}>{bike.name}</Text>
                  {bike.featured && <Feather name="star" size={14} color={COLORS.accent} style={styles.starIcon} />}
                </View>
                <Text style={styles.bikeType}>{bike.type}</Text>
                <Text style={styles.bikePrice}>{bike.price} VNĐ/ngày</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.specsRow}>
                {bike.specs.slice(0, 3).map((spec, i) => (
                  <View key={i} style={styles.specBadge}>
                    <Text style={styles.specText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.btnEdit} onPress={() => openEditModal(bike)}>
                <Feather name="edit-2" size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                <Text style={styles.btnEditText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(bike.id, bike.name)}>
                <Feather name="trash-2" size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
                <Text style={styles.btnDeleteText}>Xóa xe</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Edit/Create Form Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBike ? 'Chỉnh Sửa Dòng Xe' : 'Thêm Dòng Xe Mới'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tên Dòng Xe</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ví dụ: Honda SH 150i"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.label}>Giá Thuê Ngày (VNĐ)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Ví dụ: 150.000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Phân Loại</Text>
              <TextInput
                style={styles.input}
                value={type}
                onChangeText={setType}
                placeholder="Ví dụ: Scooter"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.label}>Link Hình Ảnh (URL)</Text>
              <TextInput
                style={styles.input}
                value={image}
                onChangeText={setImage}
                placeholder="https://..."
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.label}>Đặc Tả (Cách nhau bằng dấu phẩy)</Text>
              <TextInput
                style={styles.input}
                value={specsInput}
                onChangeText={setSpecsInput}
                placeholder="Phanh ABS, Smartkey, Cốp rộng"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Đánh dấu xe Nổi Bật (Featured)</Text>
                <Switch
                  value={featured}
                  onValueChange={setFeatured}
                  trackColor={{ false: '#3f3f46', true: COLORS.accent }}
                  thumbColor={featured ? COLORS.accentDark : '#a1a1aa'}
                />
              </View>

              <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
                <Text style={styles.btnSubmitText}>LƯU THAY ĐỔI</Text>
              </TouchableOpacity>
            </ScrollView>
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
  btnAdd: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  btnAddText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  bikeImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#000',
    resizeMode: 'cover',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  starIcon: {
    marginTop: 1,
  },
  bikeType: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  bikePrice: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardBody: {
    marginTop: 12,
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  btnEdit: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEditText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnDelete: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeleteText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalForm: {
    gap: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  switchLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  btnSubmit: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  btnSubmitText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
