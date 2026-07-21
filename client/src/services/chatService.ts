import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
const API_URL = `${API_BASE_URL}/chats`;

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

export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatarUrl?: string;
  roles?: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
  phoneNumber?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string | ChatUser;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  _id: string;
  participants: ChatUser[];
  type: string;
  relatedBooking?: string | {
    _id: string;
    bookingCode: string;
    status: string;
    pickupDateTime: string;
    returnDateTime: string;
    vehicleSnapshot?: {
      name: string;
      image: string;
      rentalPrice: number;
    };
  };
  relatedVehicle?: {
    _id: string;
    vehicleModel: string;
    licensePlate: string;
    imageUrls: string[];
  };
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  getUserBasicInfo: async (userId: string): Promise<{ success: boolean; data: ChatUser }> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/users/${userId}/basic-info`, headers);
    return res.data;
  },

  createConversation: async (partnerId: string, relatedBookingId: string | null, type: string, relatedVehicleId?: string | null): Promise<{ success: boolean; data: ConversationItem }> => {
    const headers = getAuthHeaders();
    const payload: any = { partnerId, type };
    if (relatedBookingId) {
      payload.relatedBookingId = relatedBookingId;
    }
    if (relatedVehicleId) {
      payload.relatedVehicleId = relatedVehicleId;
    }
    const res = await axios.post(`${API_URL}/conversations`, payload, headers);
    return res.data;
  },

  getConversations: async (skip = 0, limit = 20): Promise<{ success: boolean; data: ConversationItem[] }> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/conversations`, { ...headers, params: { skip, limit } });
    return res.data;
  },

  getMessages: async (conversationId: string, skip = 0, limit = 50): Promise<{ success: boolean; data: ChatMessage[] }> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, { ...headers, params: { skip, limit } });
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<{ success: boolean; data: ChatMessage }> => {
    const headers = getAuthHeaders();
    const res = await axios.post(`${API_URL}/messages`, { conversationId, content }, headers);
    return res.data;
  },

  markAsRead: async (conversationId: string): Promise<{ success: boolean; message: string }> => {
    const headers = getAuthHeaders();
    const res = await axios.patch(`${API_URL}/conversations/${conversationId}/read`, {}, headers);
    return res.data;
  }
};
