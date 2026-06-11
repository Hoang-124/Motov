import axios from 'axios';

const API_URL = 'http://localhost:5000/api/promotions';

// Tự động đính kèm Token lưu trong localStorage.user vào Header
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

export interface Promotion {
  _id: string;
  discountName: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  voucherCode: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  discountCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export const promotionService = {
  // 1. Lấy danh sách khuyến mãi đang chạy (Public)
  getActivePromotions: async (): Promise<Promotion[]> => {
    const res = await axios.get(API_URL);
    return res.data.promotions || [];
  },

  // 2. Lấy toàn bộ danh sách khuyến mãi (Dành cho Admin)
  getAdminPromotions: async (filters?: { search?: string; status?: string; type?: string }): Promise<Promotion[]> => {
    const headers = getAuthHeaders();
    const res = await axios.get(`${API_URL}/admin`, {
      ...headers,
      params: filters
    });
    return res.data.promotions || [];
  },

  // 3. Tạo mới chương trình khuyến mãi (Admin)
  createPromotion: async (data: Partial<Promotion>): Promise<Promotion> => {
    const headers = getAuthHeaders();
    const res = await axios.post(API_URL, data, headers);
    return res.data.promotion;
  },

  // 4. Cập nhật chương trình khuyến mãi (Admin)
  updatePromotion: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
    const headers = getAuthHeaders();
    const res = await axios.put(`${API_URL}/${id}`, data, headers);
    return res.data.promotion;
  },

  // 5. Xóa/Ẩn chương trình khuyến mãi (Admin)
  deletePromotion: async (id: string): Promise<any> => {
    const headers = getAuthHeaders();
    const res = await axios.delete(`${API_URL}/${id}`, headers);
    return res.data;
  },

  // 6. Kiểm tra mã giảm giá (Khách hàng)
  validatePromoCode: async (promoCode: string, totalAmount: number): Promise<{
    id: string;
    voucherCode: string;
    discountName: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountValue: number;
    discountAmount: number;
  }> => {
    const headers = getAuthHeaders();
    const res = await axios.post(`${API_URL}/validate`, { promoCode, totalAmount }, headers);
    return res.data.promotion;
  }
};
