import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBookingTracking, TrackingEvent } from '../../../hooks/useBookingTracking';

interface BookingTrackingModalProps {
  bookingId: string | null;
  visible: boolean;
  onClose: () => void;
}

const getStatusIcon = (status: string, completed: boolean) => {
  if (!completed) return 'time-outline';
  switch (status) {
    case 'Pending': return 'hourglass-outline';
    case 'Confirmed': return 'checkmark-circle-outline';
    case 'Rented': return 'bicycle-outline';
    case 'Completed': return 'checkmark-done-circle-outline';
    case 'Cancelled': return 'close-circle-outline';
    default: return 'ellipse-outline';
  }
};

const getStatusColor = (status: string, completed: boolean) => {
  if (!completed) return 'text-gray-400';
  switch (status) {
    case 'Pending': return 'text-orange-500';
    case 'Confirmed': return 'text-blue-500';
    case 'Rented': return 'text-indigo-500';
    case 'Completed': return 'text-green-500';
    case 'Cancelled': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

export const BookingTrackingModal: React.FC<BookingTrackingModalProps> = ({ bookingId, visible, onClose }) => {
  const { timeline: rawTimeline, isLoading, error } = useBookingTracking(bookingId);
  // Guard: ensure timeline is always an array even if the API returns unexpected shape
  const timeline: TrackingEvent[] = Array.isArray(rawTimeline) ? rawTimeline : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 w-full max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-800">Booking Timeline</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-4 text-gray-500">Loading tracking data...</Text>
            </View>
          ) : error ? (
            <View className="py-10 items-center justify-center">
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text className="mt-4 text-red-500 text-center">{error}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {timeline.length === 0 ? (
                <Text className="text-center text-gray-500 py-4">No tracking events found.</Text>
              ) : (
                timeline.map((event: TrackingEvent, index: number) => {
                  const isLast = index === timeline.length - 1;
                  return (
                    <View key={index} className="flex-row mb-6">
                      <View className="items-center mr-4">
                        <Ionicons 
                          name={getStatusIcon(event.status, event.completed)} 
                          size={28} 
                          className={getStatusColor(event.status, event.completed)}
                        />
                        {!isLast && (
                          <View className={`w-0.5 h-full mt-1 ${event.completed ? 'bg-indigo-200' : 'bg-gray-200'}`} />
                        )}
                      </View>
                      <View className="flex-1 pb-2">
                        <Text className={`font-semibold text-lg ${event.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                          {event.description}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                          {event.time ? new Date(event.time).toLocaleString() : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
