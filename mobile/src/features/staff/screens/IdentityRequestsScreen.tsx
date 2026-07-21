import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Modal, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiFetch } from '../../../utils/api';
import { COLORS } from '../../../theme/colors';

export interface EkycRequest {
  id: string;
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  status: string;
  identityStatus: string;
  identitySubmittedAt?: string;
  citizenIdInfo?: {
    idNumber: string;
    fullName: string;
    dob: string;
    homeTown: string;
    address: string;
    cardFrontUrl: string;
    cardBackUrl: string;
    selfieUrl: string;
    faceMatchConfidence?: number;
  };
}

export const IdentityRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<EkycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<EkycRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/identity-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch identity requests:', err);
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
      const res = await apiFetch(`/auth/identity-requests/${id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Phê duyệt thất bại');
      }
      Alert.alert('Thành Công', `Đã phê duyệt hồ sơ eKYC của ${name}!`);
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
      const res = await apiFetch(`/auth/identity-requests/${selectedReq.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Từ chối thất bại');
      }
      Alert.alert('Thành Công', `Đã từ chối hồ sơ eKYC của ${selectedReq.name}.`);
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

  const openDetail = (req: EkycRequest) => {
    setSelectedReq(req);
    setDetailModalVisible(true);
  };

  const renderItem = ({ item }: { item: EkycRequest }) => {
    const info = item.citizenIdInfo;
    const timeStr = item.identitySubmittedAt
      ? new Date(item.identitySubmittedAt).toLocaleDateString('vi-VN')
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email} {item.phoneNumber ? `• ${item.phoneNumber}` : ''}</Text>
          </View>
          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>Chờ duyệt eKYC</Text>
          </View>
        </View>

        {info && (
          <View style={styles.cardInfoBox}>
            <Text style={styles.infoLine}>Số CCCD: <Text style={styles.whiteBold}>{info.idNumber || 'Chưa trích xuất'}</Text></Text>
            <Text style={styles.infoLine}>Họ tên CCCD: <Text style={styles.whiteBold}>{info.fullName || item.name}</Text></Text>
            {info.faceMatchConfidence !== undefined && (
              <Text style={styles.infoLine}>Độ khớp khuôn mặt: <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}>{info.faceMatchConfidence}% Match</Text></Text>
            )}
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.btnDetail} onPress={() => openDetail(item)}>
            <Feather name="eye" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.btnDetailText}>Xem Ảnh Giấy Tờ & Phê Duyệt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Duyệt eKYC Khách Hàng</Text>
        <Text style={styles.subtitle}>Thẩm định ảnh CCCD và đối sánh khuôn mặt tài khoản thuê xe</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Đang tải hồ sơ eKYC cần duyệt...</Text>
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
              <Text style={styles.emptyTitle}>Tuyệt vời! Không có hồ sơ eKYC nào đang chờ duyệt</Text>
              <Text style={styles.emptySubtitle}>Tất cả tài khoản khách hàng đăng ký đã được xác minh hoàn tất.</Text>
            </View>
          }
        />
      )}

      {/* Detail Inspection Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thẩm Định Hồ Sơ eKYC</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} disabled={submitting}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedReq && selectedReq.citizenIdInfo && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Face Matching Confidence */}
                {selectedReq.citizenIdInfo.faceMatchConfidence !== undefined && (
                  <View style={styles.matchScoreBox}>
                    <Feather name="shield" size={18} color={COLORS.accent} />
                    <Text style={styles.matchScoreText}>
                      Độ khớp khuôn mặt AI: <Text style={{ color: COLORS.accent, fontWeight: '900', fontSize: 16 }}>{selectedReq.citizenIdInfo.faceMatchConfidence}% Match</Text>
                    </Text>
                  </View>
                )}

                {/* 1. Selfie Image */}
                <Text style={styles.sectionLabel}>1. ẢNH CHÂN DUNG (SELFIE)</Text>
                {selectedReq.citizenIdInfo.selfieUrl ? (
                  <Image source={{ uri: selectedReq.citizenIdInfo.selfieUrl }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.noImagePlaceholder}><Text style={{ color: COLORS.textMuted }}>⚠️ Không có ảnh selfie</Text></View>
                )}

                {/* 2. CCCD Front */}
                <Text style={styles.sectionLabel}>2. MẶT TRƯỚC CCCD</Text>
                {selectedReq.citizenIdInfo.cardFrontUrl ? (
                  <Image source={{ uri: selectedReq.citizenIdInfo.cardFrontUrl }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.noImagePlaceholder}><Text style={{ color: COLORS.textMuted }}>⚠️ Không có ảnh mặt trước</Text></View>
                )}

                {/* 3. CCCD Back */}
                <Text style={styles.sectionLabel}>3. MẶT SAU CCCD</Text>
                {selectedReq.citizenIdInfo.cardBackUrl ? (
                  <Image source={{ uri: selectedReq.citizenIdInfo.cardBackUrl }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.noImagePlaceholder}><Text style={{ color: COLORS.textMuted }}>⚠️ Không có ảnh mặt sau</Text></View>
                )}

                {/* 4. Extracted OCR Information */}
                <Text style={styles.sectionLabel}>4. THÔNG TIN TRÍCH XUẤT OCR</Text>
                <View style={styles.ocrBox}>
                  <Text style={styles.infoLine}>Số CCCD: <Text style={styles.whiteBold}>{selectedReq.citizenIdInfo.idNumber}</Text></Text>
                  <Text style={styles.infoLine}>Họ và tên: <Text style={styles.whiteBold}>{selectedReq.citizenIdInfo.fullName}</Text></Text>
                  <Text style={styles.infoLine}>Quê quán: <Text style={styles.whiteBold}>{selectedReq.citizenIdInfo.homeTown || 'N/A'}</Text></Text>
                  <Text style={styles.infoLine}>Thường trú: <Text style={styles.whiteBold}>{selectedReq.citizenIdInfo.address || 'N/A'}</Text></Text>
                </View>

                {/* Approve / Reject Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 25 }}>
                  <TouchableOpacity
                    style={[styles.btnRejectAction, { flex: 1 }]}
                    onPress={() => setRejectModalVisible(true)}
                    disabled={submitting}
                  >
                    <Text style={styles.btnRejectActionText}>TỪ CHỐI eKYC</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnApproveAction, { flex: 1 }]}
                    onPress={() => handleApprove(selectedReq.id, selectedReq.name)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={COLORS.accentDark} />
                    ) : (
                      <Text style={styles.btnApproveActionText}>PHÊ DUYỆT eKYC</Text>
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
            <Text style={styles.rejectModalTitle}>Từ Chối Hồ Sơ eKYC</Text>
            <Text style={styles.rejectModalSubtitle}>Nhập lý do chi tiết để thông báo cho khách hàng:</Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Ví dụ: Ảnh CCCD bị mờ, ảnh selfie không trùng khớp..."
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
  matchScoreBox: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  matchScoreText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 15,
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 6,
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
