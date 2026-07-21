import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';

const { width, height } = Dimensions.get('window');

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

interface PromotionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PromotionsModal: React.FC<PromotionsModalProps> = ({ visible, onClose }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/promotions');
      const data = await res.json();
      if (res.ok && data.success) {
        setPromotions(data.promotions || []);
      } else {
        throw new Error(data.message || 'Không thể tải danh sách khuyến mãi.');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải khuyến mãi:', err);
      setError('Không thể kết nối máy chủ để tải khuyến mãi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchPromotions();
    }
  }, [visible]);

  const handleCopyCode = (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code);
      } else {
        Clipboard.setString(code);
      }
      setCopiedCode(code);
      Alert.alert('Đã Sao Chép 📋', `Mã giảm giá "${code}" đã được sao chép vào bộ nhớ tạm!`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
      Alert.alert('Lỗi', 'Không thể sao chép mã giảm giá.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="gift" size={20} color={COLORS.accent} style={styles.headerIcon} />
              <Text style={styles.title}>Mã Giảm Giá & Ưu Đãi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Đang tải khuyến mãi...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-triangle" size={32} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchPromotions}>
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : promotions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có khuyến mãi nào</Text>
              <Text style={styles.emptySubtitle}>Các chương trình ưu đãi mới sẽ được cập nhật sớm nhất.</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
              {promotions.map((promo) => {
                const isPercentage = promo.discountType === 'Percentage';
                const isCopied = copiedCode === promo.voucherCode;
                const remaining = promo.usageLimit !== undefined ? (promo.usageLimit - promo.usedCount) : null;

                return (
                  <View key={promo._id} style={styles.card}>
                    {/* Top neon indicator */}
                    <View style={styles.neonStrip} />

                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.iconWrapper}>
                          {isPercentage ? (
                            <MaterialCommunityIcons name="percent" size={16} color={COLORS.accentDark} />
                          ) : (
                            <Feather name="tag" size={14} color={COLORS.accentDark} />
                          )}
                        </View>
                        <View>
                          <Text style={styles.promoCategory}>{promo.discountCategory || 'ƯU ĐÃI THUÊ XE'}</Text>
                          {remaining !== null && (
                            <Text style={styles.promoRemaining}>Còn lại: {remaining} lượt</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.discountValueContainer}>
                        <Text style={styles.discountValue}>
                          {isPercentage ? `${promo.discountValue}%` : `${promo.discountValue / 1000}K`}
                        </Text>
                        <Text style={styles.discountLabel}>GIẢM</Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.promoName}>{promo.discountName}</Text>
                      {promo.description ? (
                        <Text style={styles.promoDesc}>{promo.description}</Text>
                      ) : null}
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.conditions}>
                        {promo.minOrderAmount ? (
                          <Text style={styles.conditionText}>
                            • Đơn tối thiểu: <Text style={styles.whiteText}>{formatCurrency(promo.minOrderAmount)}</Text>
                          </Text>
                        ) : null}
                        {isPercentage && promo.maxDiscountAmount ? (
                          <Text style={styles.conditionText}>
                            • Giảm tối đa: <Text style={styles.whiteText}>{formatCurrency(promo.maxDiscountAmount)}</Text>
                          </Text>
                        ) : null}
                        <Text style={styles.conditionText}>
                          • Hạn dùng: <Text style={styles.whiteText}>{formatDate(promo.endDate)}</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionContainer}>
                      <View style={styles.codeWrapper}>
                        <Text style={styles.codeText}>{promo.voucherCode}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                        onPress={() => handleCopyCode(promo.voucherCode)}
                      >
                        <Feather name={isCopied ? "check" : "copy"} size={13} color={isCopied ? "#fff" : COLORS.accentDark} style={{ marginRight: 4 }} />
                        <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextSuccess]}>
                          {isCopied ? "ĐÃ SAO CHÉP" : "COPY MÃ"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: height * 0.8,
    minHeight: height * 0.5,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 18,
  },
  scrollList: {
    flex: 1,
  },
  card: {
    backgroundColor: '#09090b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  neonStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCategory: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  promoRemaining: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  discountValueContainer: {
    alignItems: 'flex-end',
  },
  discountValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  discountLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  cardBody: {
    marginBottom: 12,
  },
  promoName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 10,
    marginBottom: 12,
  },
  conditions: {
    gap: 4,
  },
  conditionText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  whiteText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  codeWrapper: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  copyBtnSuccess: {
    backgroundColor: '#22c55e',
  },
  copyBtnText: {
    color: COLORS.accentDark,
    fontSize: 11,
    fontWeight: '900',
  },
  copyBtnTextSuccess: {
    color: '#fff',
  },
});
