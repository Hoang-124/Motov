import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = `${API_URL}/inventory`;

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

export interface InventoryItem {
  _id?: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  price: number;
  location?: string;
  description?: string;
  lastRestockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const inventoryService = {
  // 1. Get all inventory items (with optional filters)
  getAllInventory: async (filters?: { search?: string; lowStock?: string }): Promise<InventoryItem[]> => {
    const res = await axios.get(BASE_URL, { params: filters });
    return res.data.data || [];
  },

  // 2. Get item by ID
  getInventoryById: async (id: string): Promise<InventoryItem> => {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data.data;
  },

  // 3. Create new inventory item
  createInventory: async (data: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const res = await axios.post(BASE_URL, data);
    return res.data.data;
  },

  // 4. Update inventory item details
  updateInventory: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const res = await axios.put(`${BASE_URL}/${id}`, data);
    return res.data.data;
  },

  // 5. Delete inventory item
  deleteInventory: async (id: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },

  // 6. Quick update stock quantity (delta or quantity)
  updateStock: async (id: string, updateData: { delta?: number; quantity?: number }): Promise<InventoryItem> => {
    const res = await axios.patch(`${BASE_URL}/${id}/stock`, updateData);
    return res.data.data;
  }
};
