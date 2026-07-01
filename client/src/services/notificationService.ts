import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
const API_URL = `${API_BASE_URL}/notifications`;

const getAuthHeaders = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.token) {
        return {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
      }
    } catch (e) {
      console.error('Lỗi phân giải thông tin user trong localStorage:', e);
    }
  }
  return {};
};

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BookingPending' | 'BookingConfirmed' | 'BookingCancelled' | 'System' | 'IdentityVerified';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
}

export const notificationService = {
  // 1. Lấy danh sách thông báo và số lượng chưa đọc của user
  getMyNotifications: async (): Promise<NotificationsResponse> => {
    const headers = getAuthHeaders();
    const res = await axios.get(API_URL, headers);
    return res.data;
  },

  // 2. Đánh dấu một thông báo là đã đọc
  markAsRead: async (id: string): Promise<NotificationsResponse> => {
    const headers = getAuthHeaders();
    const res = await axios.put(`${API_URL}/${id}/read`, {}, headers);
    return res.data;
  },

  // 3. Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async (): Promise<NotificationsResponse> => {
    const headers = getAuthHeaders();
    const res = await axios.put(`${API_URL}/read-all`, {}, headers);
    return res.data;
  },

  // 4. Xóa thông báo
  deleteNotification: async (id: string): Promise<NotificationsResponse> => {
    const headers = getAuthHeaders();
    const res = await axios.delete(`${API_URL}/${id}`, headers);
    return res.data;
  },

  // 5. Xóa toàn bộ thông báo
  deleteAllNotifications: async (): Promise<NotificationsResponse> => {
    const headers = getAuthHeaders();
    const res = await axios.delete(API_URL, headers);
    return res.data;
  }
};
