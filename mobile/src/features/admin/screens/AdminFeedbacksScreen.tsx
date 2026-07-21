import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';

interface FeedbackItem {
  _id: string;
  userId: { _id: string; username: string; email?: string; firstName?: string; lastName?: string; avatarUrl?: string };
  vehicleId: { _id: string; vehicleModel: string; licensePlate: string };
  bookingId: string;
  rating: number;
  content: string;
  isBlocked?: boolean;
  blockReason?: string;
  isSuspected?: boolean;
  detectedBadWords?: string[];
  createdAt: string;
}

export const AdminFeedbacksScreen: React.FC = () => {
  const token = useAppSelector(s => s.user.token);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'suspected'>('all');

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await apiFetch(`/feedbacks/admin${params}`);
      const data = await res.json();
      setFeedbacks(data.data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, [filterStatus]);

  const handleBlock = (id: string) => {
    Alert.alert('Chặn Đánh Giá', 'Bạn có muốn chặn đánh giá này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chặn',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/feedbacks/${id}/block`, {
              method: 'PUT',
              body: JSON.stringify({ blockReason: 'Vi phạm quy tắc cộng đồng' }),
            });
            Alert.alert('Thành Công', 'Đã chặn đánh giá!');
            fetchFeedbacks();
          } catch { Alert.alert('Lỗi', 'Không thể chặn.'); }
        },
      },
    ]);
  };

  const handleUnblock = async (id: string) => {
    try {
      await apiFetch(`/feedbacks/${id}/unblock`, { method: 'PUT' });
      Alert.alert('Thành Công', 'Đã bỏ chặn đánh giá!');
      fetchFeedbacks();
    } catch { Alert.alert('Lỗi', 'Không thể bỏ chặn.'); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xóa Đánh Giá', 'Xóa vĩnh viễn đánh giá này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/feedbacks/${id}`, { method: 'DELETE' });
            Alert.alert('Thành Công', 'Đã xóa đánh giá!');
            fetchFeedbacks();
          } catch { Alert.alert('Lỗi', 'Không thể xóa.'); }
        },
      },
    ]);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Feather key={i} name="star" size={12} color={i < rating ? '#f59e0b' : '#333'} />
    ));
  };

  const filters: { key: typeof filterStatus; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'active', label: 'Hiển thị' },
    { key: 'blocked', label: 'Bị chặn' },
    { key: 'suspected', label: 'Nghi ngờ' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Quản Lý Đánh Giá</Text>
        <Text style={styles.pageSubtitle}>{feedbacks.length} đánh giá</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filterStatus === f.key && styles.filterTabActive]}
            onPress={() => setFilterStatus(f.key)}
          >
            <Text style={[styles.filterText, filterStatus === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : feedbacks.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="message-square" size={36} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Không có đánh giá nào.</Text>
        </View>
      ) : (
        feedbacks.map(fb => {
          const userName = fb.userId?.firstName
            ? `${fb.userId.firstName} ${fb.userId.lastName || ''}`
            : fb.userId?.username || 'Ẩn danh';

          return (
            <View key={fb._id} style={[styles.card, fb.isBlocked && styles.cardBlocked]}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.vehicleName}>{fb.vehicleId?.vehicleModel || 'N/A'} • {fb.vehicleId?.licensePlate || ''}</Text>
                </View>
                <View style={styles.starsRow}>{renderStars(fb.rating)}</View>
              </View>

              {/* Content */}
              <Text style={[styles.contentText, fb.isBlocked && { textDecorationLine: 'line-through' }]}>{fb.content}</Text>

              {/* Badges */}
              <View style={styles.badgesRow}>
                {fb.isBlocked && (
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.dangerBorder }]}>
                    <Text style={[styles.badgeText, { color: COLORS.danger }]}>Bị chặn</Text>
                  </View>
                )}
                {fb.isSuspected && (
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.warningBg, borderColor: COLORS.warningBorder }]}>
                    <Text style={[styles.badgeText, { color: COLORS.warning }]}>Nghi ngờ</Text>
                  </View>
                )}
                <Text style={styles.dateText}>{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</Text>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                {fb.isBlocked ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnblock(fb._id)}>
                    <Feather name="eye" size={13} color={COLORS.approved} />
                    <Text style={[styles.actionText, { color: COLORS.approved }]}>Bỏ chặn</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleBlock(fb._id)}>
                    <Feather name="eye-off" size={13} color={COLORS.warning} />
                    <Text style={[styles.actionText, { color: COLORS.warning }]}>Chặn</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(fb._id)}>
                  <Feather name="trash-2" size={13} color={COLORS.danger} />
                  <Text style={[styles.actionText, { color: COLORS.danger }]}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 40 },
  header: { marginTop: 10, marginBottom: 16 },
  pageTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  pageSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  filterRow: { marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterTabActive: { backgroundColor: 'rgba(204,255,0,0.1)', borderColor: COLORS.accent },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: COLORS.accent },
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardBlocked: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  userName: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  vehicleName: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },
  contentText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { color: COLORS.textMuted, fontSize: 10, marginLeft: 'auto' },
  actionsRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600' },
});
