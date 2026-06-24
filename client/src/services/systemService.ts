import axios from 'axios';

const API_URL = 'http://localhost:5000/api/system/settings';

// Helper to get authorization token
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

export interface SystemSetting {
  _id?: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

export const systemService = {
  // Get all settings
  getSettings: async (): Promise<SystemSetting[]> => {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });
    return response.data.settings || [];
  },

  // Update or create setting
  updateSetting: async (key: string, value: string, description?: string): Promise<SystemSetting> => {
    const response = await axios.put(
      API_URL,
      { key, value, description },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data.setting;
  },
};
