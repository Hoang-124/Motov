import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
  senderId: string | ChatUser;
  receiverId: string | ChatUser;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  _id: string; // ID đối tác chat
  unreadCount: number;
  lastMessage: ChatMessage;
  partnerInfo: ChatUser & { phoneNumber?: string };
}

export const chatService = {
  // Gửi tin nhắn mới
  sendMessage: async (receiverId: string, message: string): Promise<{ success: boolean; data: ChatMessage }> => {
    const headers = getAuthHeaders();
    const res = await axios.post(API_URL, { receiverId, message }, headers);
    return res.data;
  },

  // Lấy lịch sử tin nhắn với đối tác
  getMessages: async (partnerId: string): Promise<{ success: boolean; data: ChatMessage[] }> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/${partnerId}`, headers);
    return res.data;
  },

  // Lấy danh sách các cuộc hội thoại
  getConversations: async (): Promise<{ success: boolean; data: ConversationItem[] }> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/conversations`, headers);
    return res.data;
  },

  // Lấy thông tin cơ bản của người dùng để phục vụ chat
  getUserBasicInfo: async (userId: string): Promise<{ success: boolean; data: ChatUser & { phoneNumber?: string } }> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/user/${userId}`, headers);
    return res.data;
  }
};
