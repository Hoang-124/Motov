import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
const BASE_URL = `${API_URL}/feedbacks`;

// Automatically attach Token from localStorage
axios.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  if (!token) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        token = user?.token;
      } catch (e) {
        console.error('Lỗi phân giải thông tin user trong localStorage:', e);
      }
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FeedbackUser {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  strikes?: number;
  avatarUrl?: string;
}

export interface FeedbackVehicle {
  _id: string;
  vehicleModel: string;
  licensePlate: string;
  category: string;
}

export interface FeedbackItem {
  _id: string;
  userId: FeedbackUser;
  vehicleId: FeedbackVehicle;
  bookingId: string;
  rating: number;
  content: string;
  isBlocked?: boolean;
  blockReason?: string;
  blockedBy?: string;
  blockedAt?: string;
  isSuspected?: boolean;
  detectedBadWords?: string[];
  createdAt: string;
  updatedAt: string;
}

export const feedbackService = {
  // 1. Submit a new review (Customer)
  createFeedback: async (data: { bookingId: string; rating: number; content: string }) => {
    const res = await axios.post(BASE_URL, data);
    return res.data;
  },

  // 2. Get public reviews for a specific vehicle
  getVehicleFeedbacks: async (vehicleId: string): Promise<FeedbackItem[]> => {
    const res = await axios.get(`${BASE_URL}/vehicle/${vehicleId}`);
    return res.data.data || [];
  },

  // 3. Get all reviews for admin moderation (Admin only)
  getAllFeedbacksForAdmin: async (filters?: { status?: string; search?: string }): Promise<FeedbackItem[]> => {
    const res = await axios.get(`${BASE_URL}/admin`, { params: filters });
    return res.data.data || [];
  },

  // 4. Block a review (Admin only)
  blockFeedback: async (id: string, blockReason: string) => {
    const res = await axios.put(`${BASE_URL}/${id}/block`, { blockReason });
    return res.data;
  },

  // 5. Restore/Unblock a review (Admin only)
  unblockFeedback: async (id: string) => {
    const res = await axios.put(`${BASE_URL}/${id}/unblock`);
    return res.data;
  },

  // 6. Delete a review completely (Admin only)
  deleteFeedback: async (id: string) => {
    const res = await axios.delete(`${BASE_URL}/${id}`);
    return res.data;
  }
};
