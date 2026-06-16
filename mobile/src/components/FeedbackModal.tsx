import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string | null;
  onSubmit: (bookingId: string, rating: number, content: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  bookingId,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>('');

  const handleRatingSubmit = () => {
    if (!bookingId) return;
    if (!content.trim()) {
      Alert.alert('Cảnh Báo', 'Vui lòng nhập ý kiến phản hồi của bạn!');
      return;
    }

    onSubmit(bookingId, rating, content);
    Alert.alert('Thành Công', 'Cảm ơn phản hồi quý báu của bạn về chuyến đi!');
    setContent('');
    setRating(5);
    onClose();
  };

  const getRatingLabel = (num: number) => {
    switch (num) {
      case 5: return '🚀 Rất hài lòng';
      case 4: return '✨ Hài lòng';
      case 3: return '👌 Bình thường';
      case 2: return '⚠️ Chưa hài lòng';
      default: return '👎 Rất tệ';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Feather name="star" size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Đánh Giá Chuyến Đi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Stars Selector */}
            <View style={styles.ratingBox}>
              <Text style={styles.ratingBoxLabel}>Mức độ hài lòng của bạn</Text>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setRating(num)}
                    style={styles.starBtn}
                  >
                    <Feather
                      name="star"
                      size={28}
                      color={num <= rating ? COLORS.accent : COLORS.border}
                      style={num <= rating && styles.starActive}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.ratingTextLabel}>{getRatingLabel(rating)}</Text>
            </View>

            {/* Input Feedback Content */}
            <Text style={styles.inputLabel}>Ý kiến phản hồi của bạn</Text>
            <TextInput
              style={styles.textInput}
              value={content}
              onChangeText={setContent}
              placeholder="Chia sẻ trải nghiệm của bạn về xe máy, thái độ phục vụ của chủ xe..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Footer actions */}
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSubmit} onPress={handleRatingSubmit}>
              <Text style={styles.btnSubmitText}>Gửi đánh giá</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  ratingBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  ratingBoxLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  starActive: {
    // Glow effect
    textShadowColor: 'rgba(190, 242, 100, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  ratingTextLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 13,
    height: 100,
  },
  footerContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  btnCancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  btnSubmit: {
    flex: 1.2,
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  btnSubmitText: {
    color: COLORS.accentDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
