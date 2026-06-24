import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBookingTracking, TrackingEvent } from '../../../hooks/useBookingTracking';
import { COLORS } from '../../../theme/colors';

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

const getStatusColorHex = (status: string, completed: boolean) => {
  if (!completed) return '#9CA3AF'; // text-gray-400
  switch (status) {
    case 'Pending': return '#F97316'; // text-orange-500
    case 'Confirmed': return '#3B82F6'; // text-blue-500
    case 'Rented': return '#6366F1'; // text-indigo-500
    case 'Completed': return '#10B981'; // text-green-500
    case 'Cancelled': return '#EF4444'; // text-red-500
    default: return '#6B7280'; // text-gray-500
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
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Booking Timeline</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary || '#374151'} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading tracking data...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {timeline.length === 0 ? (
                <Text style={styles.emptyText}>No tracking events found.</Text>
              ) : (
                timeline.map((event: TrackingEvent, index: number) => {
                  const isLast = index === timeline.length - 1;
                  const colorHex = getStatusColorHex(event.status, event.completed);
                  return (
                    <View key={index} style={styles.item}>
                      <View style={styles.leftCol}>
                        <Ionicons 
                          name={getStatusIcon(event.status, event.completed)} 
                          size={28} 
                          color={colorHex}
                        />
                        {!isLast && (
                          <View style={[
                            styles.line, 
                            event.completed ? styles.lineCompleted : styles.linePending
                          ]} />
                        )}
                      </View>
                      <View style={styles.rightCol}>
                        <Text style={[
                          styles.eventDesc, 
                          event.completed ? styles.textActive : styles.textInactive
                        ]}>
                          {event.description}
                        </Text>
                        <Text style={styles.eventTime}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
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
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  scroll: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 16,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  lineCompleted: {
    backgroundColor: '#C7D2FE', // bg-indigo-200
  },
  linePending: {
    backgroundColor: '#E5E7EB', // bg-gray-200
  },
  rightCol: {
    flex: 1,
    paddingBottom: 8,
  },
  eventDesc: {
    fontSize: 16,
    fontWeight: '600',
  },
  textActive: {
    color: '#1F2937', // text-gray-800
  },
  textInactive: {
    color: '#9CA3AF', // text-gray-400
  },
  eventTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
