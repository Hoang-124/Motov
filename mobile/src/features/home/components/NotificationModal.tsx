import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { API_BASE_URL } from '../../../constants/api';
import { apiFetch } from '../../../utils/api';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  token: string | null;
  onUpdateCount: (count: number) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  token,
  onUpdateCount,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/notifications');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        onUpdateCount(data.unreadCount);
      }
    } catch (e) {
      console.error('Lỗi khi lấy thông báo:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && token) {
      fetchNotifications();
    }
  }, [visible, token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await apiFetch(`/notifications/${id}/read`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(item => (item._id === id ? { ...item, isRead: true } : item))
        );
        onUpdateCount(data.unreadCount);
      }
    } catch (e) {
      console.error('Lỗi khi đánh dấu đọc thông báo:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiFetch('/notifications/read-all', {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
        onUpdateCount(0);
        Alert.alert('Thành công', 'Đã đánh dấu đọc tất cả thông báo.');
      }
    } catch (e) {
      console.error('Lỗi khi đánh dấu đọc tất cả:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiFetch(`/notifications/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.filter(item => item._id !== id));
        onUpdateCount(data.unreadCount);
      }
    } catch (e) {
      console.error('Lỗi khi xóa thông báo:', e);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Xóa toàn bộ thông báo',
      'Bạn có chắc chắn muốn xóa tất cả thông báo không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa sạch',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiFetch('/notifications', {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                setNotifications([]);
                onUpdateCount(0);
                Alert.alert('Thành công', 'Đã xóa toàn bộ thông báo.');
              }
            } catch (e) {
              console.error('Lỗi khi xóa sạch thông báo:', e);
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thông Báo</Text>
            
            <View style={styles.headerActions}>
              {notifications.length > 0 && (
                <>
                  <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.actionBtn}>
                    <Feather name="check" size={18} color={COLORS.approved} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteAll} style={[styles.actionBtn, { marginRight: 15 }]}>
                    <Feather name="trash-2" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Bạn không có thông báo nào</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {notifications.map(item => (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.notiItem, !item.isRead && styles.notiItemUnread]}
                  onPress={() => handleMarkAsRead(item._id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.notiIconWrapper}>
                    <Feather
                      name="info"
                      size={16}
                      color={item.isRead ? COLORS.textMuted : COLORS.accent}
                    />
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>

                  <View style={styles.notiContent}>
                    <Text style={[styles.notiTitle, !item.isRead && styles.notiTitleUnread]}>
                      {item.title}
                    </Text>
                    <Text style={styles.notiMessage}>{item.message}</Text>
                    <Text style={styles.notiTime}>{formatTimeAgo(item.createdAt)}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    style={styles.deleteSingleBtn}
                  >
                    <Feather name="x" size={14} color="#555" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  modalScroll: {
    marginTop: 10,
  },
  notiItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
    borderRadius: 8,
    marginVertical: 2,
  },
  notiItemUnread: {
    backgroundColor: 'rgba(190, 242, 100, 0.03)',
  },
  notiIconWrapper: {
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  notiContent: {
    flex: 1,
    paddingRight: 15,
  },
  notiTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  notiTitleUnread: {
    color: '#fff',
    fontWeight: '700',
  },
  notiMessage: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  notiTime: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 6,
  },
  deleteSingleBtn: {
    position: 'absolute',
    top: 14,
    right: 8,
    padding: 4,
  },
});
