import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';

const getAuthHeaders = () => {
  let token = localStorage.getItem('token');
  if (!token) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        token = user?.token;
      } catch (e) {
        console.error('Error parsing user token:', e);
      }
    }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface BookingReminder {
  _id: string;
  bookingId: string;
  reminderType: '24h_before_pickup' | '2h_before_pickup' | '24h_before_return' | '2h_before_return';
  scheduledTime: string;
  sentTime?: string;
  status: 'Pending' | 'Sent' | 'Failed' | 'Cancelled';
  channel: 'Email' | 'SMS' | 'Both';
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export const reminderService = {
  getBookingReminders: async (bookingId: string): Promise<BookingReminder[]> => {
    const response = await axios.get(`${API_BASE_URL}/admin/bookings/${bookingId}/reminders`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  },

  sendManualReminder: async (bookingId: string): Promise<{ success: boolean; message: string; details: { emailSent: boolean; smsSent: boolean } }> => {
    const response = await axios.post(`${API_BASE_URL}/admin/bookings/${bookingId}/send-reminder`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
};
