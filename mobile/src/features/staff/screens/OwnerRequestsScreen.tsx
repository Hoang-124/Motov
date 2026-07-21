import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Modal, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiFetch } from '../../../utils/api';
import { COLORS } from '../../../theme/colors';

export interface OwnerRequestItem {
  id: string;
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  status: string;
  ownerRequestStatus: string;
  createdAt: string;
  ownerContractText?: string;
  ownerContractSignedAt?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountOwner?: string;
  ownerSignature?: string;
  ownerRejectReason?: string;
}

export const OwnerRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<OwnerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<OwnerRequestItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/owner-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch owner requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    setSubmitting(true);
    try {
      const res = await apiFetch(`/auth/owner-requests/${id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Phê duyệt thất bại');
      }
      Alert.alert('Thành Công', `Đã phê duyệt tài khoản ${name} thành Chủ xe đối tác!`);
      setDetailModalVisible(false);
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Lỗi Phê Duyệt', err.message || 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq || !rejectReason.trim()) {
      return Alert.alert('Thông Báo', 'Vui lòng nhập lý do từ chối.');
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`/auth/owner-requests/${selectedReq.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ rejectReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Từ chối thất bại');
      }
      Alert.alert('Thành Công', `Đã từ chối yêu cầu Chủ xe của ${selectedReq.name}.`);
      setRejectModalVisible(false);
      setDetailModalVisible(false);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Lỗi Từ Chối', err.message || 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (req: OwnerRequestItem) => {
    setSelectedReq(req);
    setDetailModalVisible(true);
  };

  const renderItem = ({ item }: { item: OwnerRequestItem }) => {
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email} {item.phoneNumber ? `• ${item.phoneNumber}` : ''}</Text>
          </View>
          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>Chờ duyệt Chủ xe</Text>
          </View>
        </View>

        <View style={styles.cardInfoBox}>
          <Text style={styles.infoLine}>Tài khoản ngân hàng: <Text style={styles.whiteBold}>{item.bankName ? `${item.bankName} - ${item.bankAccountNumber}` : 'Chưa nhập'}</Text></Text>
          <Text style={styles.infoLine}>Chủ tài khoản: <Text style={styles.whiteBold}>{item.bankAccountOwner || 'Chưa nhập'}</Text></Text>
          <Text style={styles.infoLine}>Ngày đăng ký: <Text style={styles.whiteBold}>{dateStr}</Text></Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.btnDetail} onPress={() => openDetail(item)}>
            <Feather name="file-text" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.btnDetailText}>Xem Hợp Đồng & Chữ Ký Số</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Duyệt Đối Tác Chủ Xe</Text>
        <Text style={styles.subtitle}>Kiểm tra thông tin ngân hàng, văn bản hợp đồng & chữ ký số</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Đang tải yêu cầu đăng ký Chủ xe...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Feather name="check-circle" size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Không có yêu cầu Chủ xe nào đang chờ duyệt</Text>
              <Text style={styles.emptySubtitle}>Tất cả đăng ký trở thành đối tác chủ xe đã được xử lý.</Text>
            </View>
          }
        />
      )}

      {/* Contract & Signature Inspection Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hợp Đồng Ký Kết Đối Tác</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} disabled={submitting}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedReq && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Bank Info */}
                <Text style={styles.sectionLabel}>1. THÔNG TIN NGÂN HÀNG THỤ HƯỞNG</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.infoLine}>Ngân hàng: <Text style={styles.whiteBold}>{selectedReq.bankName || 'Chưa cung cấp'}</Text></Text>
                  <Text style={styles.infoLine}>Số tài khoản: <Text style={styles.whiteBold}>{selectedReq.bankAccountNumber || 'Chưa cung cấp'}</Text></Text>
                  <Text style={styles.infoLine}>Tên chủ tài khoản: <Text style={styles.whiteBold}>{selectedReq.bankAccountOwner || 'Chưa cung cấp'}</Text></Text>
                </View>

                {/* Contract Text */}
                <Text style={styles.sectionLabel}>2. NỘI DUNG HỢP ĐỒNG ĐỐI TÁC</Text>
                <View style={styles.contractBox}>
                  <Text style={styles.contractText}>
                    {selectedReq.ownerContractText || `HỢP ĐỒNG HỢP TÁC CHO THUÊ XE MÁY TỰ LÁI MOTOV\n\nBên A (Nền tảng): Công ty Cổ phần Motov Vietnam.\nBên B (Đối tác Chủ xe): ${selectedReq.name} (${selectedReq.email})\n\nBên B cam kết cung cấp xe máy chính chủ, đảm bảo tình trạng an toàn kỹ thuật, đầy đủ giấy tờ hợp lệ. Doanh thu cho thuê sẽ được đối soát và thanh toán định kỳ vào tài khoản ngân hàng của Bên B.`}
                  </Text>
                  {selectedReq.ownerContractSignedAt && (
                    <Text style={styles.signedAtText}>
                      Thời gian ký kết: {new Date(selectedReq.ownerContractSignedAt).toLocaleString('vi-VN')}
                    </Text>
                  )}
                </View>

                {/* Digital Signature */}
                <Text style={styles.sectionLabel}>3. CHỮ KÝ SỐ VẼ TAY CỦA CHỦ XE</Text>
                {selectedReq.ownerSignature ? (
                  <View style={styles.signatureBox}>
                    <Image source={{ uri: selectedReq.ownerSignature }} style={styles.signatureImage} resizeMode="contain" />
                    <Text style={styles.signatureLabel}>Đã ký điện tử bởi {selectedReq.name}</Text>
                  </View>
                ) : (
                  <View style={styles.noSignaturePlaceholder}>
                    <Text style={{ color: COLORS.textMuted }}>⚠️ Chưa có hình ảnh chữ ký số</Text>
                  </View>
                )}

                {/* Approve / Reject Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 25 }}>
                  <TouchableOpacity
                    style={[styles.btnRejectAction, { flex: 1 }]}
                    onPress={() => setRejectModalVisible(true)}
                    disabled={submitting}
                  >
                    <Text style={styles.btnRejectActionText}>TỪ CHỐI ĐĂNG KÝ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnApproveAction, { flex: 1 }]}
                    onPress={() => handleApprove(selectedReq.id, selectedReq.name)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={COLORS.accentDark} />
                    ) : (
                      <Text style={styles.btnApproveActionText}>PHÊ DUYỆT CHỦ XE</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} animationType="fade" transparent>
        <View style={styles.rejectModalBg}>
          <View style={styles.rejectModalBox}>
            <Text style={styles.rejectModalTitle}>Từ Chối Đăng Ký Chủ Xe</Text>
            <Text style={styles.rejectModalSubtitle}>Nhập lý do từ chối gửi tới đối tác:</Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Ví dụ: Thông tin tài khoản ngân hàng không trùng khớp..."
              placeholderTextColor={COLORS.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 }}
                onPress={() => setRejectModalVisible(false)}
                disabled={submitting}
              >
                <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 'bold' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.danger, borderRadius: 8 }}
                onPress={handleReject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>XÁC NHẬN TỪ CHỐI</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  userEmail: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  badgePending: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: COLORS.pending,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePendingText: {
    color: COLORS.pending,
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfoBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginBottom: 12,
  },
  infoLine: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  whiteBold: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
  },
  btnDetail: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDetailText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 15,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 15,
    marginBottom: 8,
  },
  detailBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 6,
  },
  contractBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  contractText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  signedAtText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
  },
  signatureBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 120,
  },
  signatureLabel: {
    color: '#333333',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 6,
  },
  noSignaturePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRejectAction: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnRejectActionText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnApproveAction: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnApproveActionText: {
    color: COLORS.accentDark,
    fontSize: 13,
    fontWeight: '900',
  },
  rejectModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectModalBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    width: '100%',
    padding: 20,
  },
  rejectModalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  rejectModalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  reasonInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 13,
    height: 80,
    textAlignVertical: 'top',
  },
});
