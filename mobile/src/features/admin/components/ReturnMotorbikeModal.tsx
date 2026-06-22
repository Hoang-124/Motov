import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
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
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-800">Return Motorbike</Text>
            <TouchableOpacity onPress={handleClose} className="p-2" disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-2 font-medium">Actual Return Time</Text>
          <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" className="mr-2" />
            <TextInput
              className="flex-1 text-base text-gray-800 ml-2"
              placeholder="YYYY-MM-DD HH:mm"
              value={returnTime}
              onChangeText={setReturnTime}
              editable={!isSubmitting}
            />
          </View>

          {error && (
            <Text className="text-red-500 mb-4 text-sm">{error}</Text>
          )}

          <TouchableOpacity
            className={`w-full py-4 rounded-xl flex-row justify-center items-center ${isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600'}`}
            onPress={handleReturn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">Confirm Return</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
