import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReturnMotorbike } from '../../../hooks/useReturnMotorbike';

interface ReturnMotorbikeModalProps {
  bookingId: string | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnMotorbikeModal: React.FC<ReturnMotorbikeModalProps> = ({ bookingId, visible, onClose, onSuccess }) => {
  const [returnTime, setReturnTime] = useState('');
  const { executeReturn, isSubmitting, error } = useReturnMotorbike();

  const handleReturn = async () => {
    if (!bookingId) return;
    
    if (!returnTime.trim()) {
      Alert.alert('Validation Error', 'Please enter a return time.');
      return;
    }

    // Basic regex validation for YYYY-MM-DD HH:mm format
    const timeRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/;
    if (!timeRegex.test(returnTime)) {
      Alert.alert('Validation Error', 'Please enter time in YYYY-MM-DD HH:mm format.');
      return;
    }

    const result = await executeReturn(bookingId, returnTime);
    if (result.success) {
      Alert.alert(
        'Success', 
        `Motorbike returned successfully! ${result.lateFee ? `\nLate fee applied: ${result.lateFee.toLocaleString()} VND` : ''}`,
        [{ text: 'OK', onPress: () => {
            setReturnTime('');
            onSuccess();
            onClose();
        }}]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to return motorbike.');
    }
  };

  const handleClose = () => {
    setReturnTime('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Return Motorbike</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Actual Return Time</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:mm"
              value={returnTime}
              onChangeText={setReturnTime}
              editable={!isSubmitting}
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting ? styles.submitBtnDisabled : styles.submitBtnActive]}
            onPress={handleReturn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.submitBtnContent}>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Confirm Return</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 8,
  },
  label: {
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    fontSize: 14,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnActive: {
    backgroundColor: '#4F46E5', // bg-indigo-600
  },
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC', // bg-indigo-300
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
});
