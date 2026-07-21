import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';

interface ScheduleBooking {
  _id: string;
  bookingCode: string;
  pickupDateTime: string;
  returnDateTime: string;
  status: string;
  totalAmount: number;
  userId: { firstName: string; lastName: string; phoneNumber: string };
  vehicleId: { _id: string; vehicleModel: string; licensePlate: string };
}

export const StaffScheduleScreen: React.FC = () => {
  const token = useAppSelector(s => s.user.token);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pickup' | 'return'>('pickup');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải lịch trình.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const todayStr = new Date().toDateString();
  const pickupsToday = bookings.filter(b =>
    new Date(b.pickupDateTime).toDateString() === todayStr && b.status !== 'Cancelled'
  );
  const returnsToday = bookings.filter(b =>
    new Date(b.returnDateTime).toDateString() === todayStr && b.status !== 'Cancelled'
  );

  const handleConfirmPickup = (id: string) => {
    Alert.alert('Xác nhận giao xe', 'Bàn giao xe và chìa khóa cho khách hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            const res = await apiFetch(`/bookings/staff/bookings/${id}/pickup`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
              Alert.alert('Thành Công', 'Đã gán trạng thái xe thành Đang thuê!');
              fetchBookings();
            } else {
              Alert.alert('Lỗi', data.error || 'Thao tác thất bại.');
            }
          } catch { Alert.alert('Lỗi', 'Lỗi kết nối hệ thống.'); }
        },
      },
    ]);
  };

  const displayList = activeTab === 'pickup' ? pickupsToday : returnsToday;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="calendar" size={20} color={COLORS.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Lịch Trình Hôm Nay</Text>
          <Text style={styles.pageSubtitle}>{new Date().toLocaleDateString('vi-VN')}</Text>
        </View>
        <TouchableOpacity onPress={fetchBookings} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Pickup/Return tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pickup' && styles.tabPickupActive]}
          onPress={() => setActiveTab('pickup')}
        >
          <Feather name="truck" size={16} color={activeTab === 'pickup' ? '#f97316' : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'pickup' && { color: '#f97316' }]}>Lấy Xe</Text>
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'pickup' ? 'rgba(249,115,22,0.2)' : COLORS.border }]}>
            <Text style={[styles.tabBadgeText, activeTab === 'pickup' && { color: '#f97316' }]}>{pickupsToday.length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'return' && styles.tabReturnActive]}
          onPress={() => setActiveTab('return')}
        >
          <Feather name="flag" size={16} color={activeTab === 'return' ? COLORS.approved : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'return' && { color: COLORS.approved }]}>Trả Xe</Text>
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'return' ? COLORS.approvedBg : COLORS.border }]}>
            <Text style={[styles.tabBadgeText, activeTab === 'return' && { color: COLORS.approved }]}>{returnsToday.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : displayList.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="inbox" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            {activeTab === 'pickup' ? 'Không có lịch nhận xe hôm nay.' : 'Không có lịch trả xe hôm nay.'}
          </Text>
        </View>
      ) : (
        displayList.map(b => (
          <View key={b._id} style={styles.card}>
            {/* Badge row */}
            <View style={styles.cardBadgeRow}>
              <View style={styles.codeBadge}><Text style={styles.codeText}>#{b.bookingCode}</Text></View>
              <View style={[styles.statusBadge, b.status === 'Ongoing' ? styles.badgeOngoing : styles.badgePending]}>
                <Text style={styles.statusText}>{b.status === 'Ongoing' ? 'Đang đi' : 'Chờ lấy xe'}</Text>
              </View>
            </View>

            {/* Vehicle */}
            <View style={styles.vehicleRow}>
              <MaterialCommunityIcons name="motorbike" size={16} color={COLORS.textMuted} />
              <Text style={styles.vehicleName}>{b.vehicleId?.vehicleModel}</Text>
              <Text style={styles.vehiclePlate}>{b.vehicleId?.licensePlate}</Text>
            </View>

            {/* Customer */}
            <View style={styles.infoRow}>
              <Feather name="user" size={12} color={COLORS.textMuted} />
              <Text style={styles.infoText}>{b.userId?.lastName} {b.userId?.firstName} ({b.userId?.phoneNumber})</Text>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <Feather name="clock" size={12} color={activeTab === 'pickup' ? '#f97316' : COLORS.approved} />
              <Text style={[styles.infoText, { color: activeTab === 'pickup' ? '#f97316' : COLORS.approved }]}>
                {activeTab === 'pickup' ? 'Giờ hẹn lấy' : 'Giờ hẹn trả'}: {new Date(activeTab === 'pickup' ? b.pickupDateTime : b.returnDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {/* Action */}
            {activeTab === 'pickup' ? (
              b.status !== 'Ongoing' ? (
                <TouchableOpacity style={styles.pickupBtn} onPress={() => handleConfirmPickup(b._id)}>
                  <Feather name="check" size={14} color="#fff" />
                  <Text style={styles.pickupBtnText}>Xác nhận giao xe</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.doneRow}>
                  <Feather name="check-circle" size={14} color={COLORS.approved} />
                  <Text style={styles.doneText}>Đã giao xe</Text>
                </View>
              )
            ) : (
              <View style={styles.returnInfo}>
                <Text style={styles.returnLabel}>Cần thu:</Text>
                <Text style={styles.returnAmount}>{(b.totalAmount || 0).toLocaleString('vi-VN')}đ</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 20 },
  pageTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  pageSubtitle: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  refreshBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabPickupActive: { backgroundColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.3)' },
  tabReturnActive: { backgroundColor: COLORS.approvedBg, borderColor: COLORS.approvedBorder },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: 'bold' },
  tabBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '900' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  codeBadge: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  codeText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeOngoing: { backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  badgePending: { backgroundColor: COLORS.pendingBg, borderWidth: 1, borderColor: COLORS.pendingBorder },
  statusText: { fontSize: 10, fontWeight: 'bold', color: COLORS.text },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vehicleName: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', flex: 1 },
  vehiclePlate: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { color: COLORS.textSecondary, fontSize: 12 },
  pickupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f97316', borderRadius: 10, paddingVertical: 10, marginTop: 10 },
  pickupBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  doneText: { color: COLORS.approved, fontSize: 13, fontWeight: 'bold' },
  returnInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  returnLabel: { color: COLORS.textMuted, fontSize: 12 },
  returnAmount: { color: COLORS.danger, fontSize: 16, fontWeight: '900' },
});
