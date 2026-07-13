import axios from 'axios';

// API URL chính xác theo Backend của bạn
const API_URL = `${import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api'}/bookings`; 

// Tự động đính kèm Token lưu trong localStorage vào Header cho mọi request
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

// Định nghĩa Interface khớp chính xác với Dữ liệu trả về từ bookingController.ts của bạn
export interface Booking {
  id: string;            // Ánh xạ từ booking._id ở BE
  bookingCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vehicleId: string;
  vehicleModel: string;  // Tên xe từ snapshot (vehicleSnapshot.name)
  vehicleImage: string;  // Ảnh xe từ snapshot
  pickupDateTime: string;
  returnDateTime: string;
  pickupLocation: {
    address?: string;
    coordinates?: number[];
  };
  returnLocation: {
    address?: string;
    coordinates?: number[];
  };
  rentalDays: number;
  totalAmount: number;
  depositAmount?: number;
  remainingAmount?: number;
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Returning' | 'Completed' | 'Cancelled'; // Đúng Enum viết hoa chữ cái đầu của bạn
  statusLabel: string;   // Nhãn tiếng Việt có icon do BE tạo sẵn (ví dụ: "⏳ Chờ xác nhận")
  cancelReason?: string;
  returnReason?: string;
  returnReasonReply?: string;
  startOdometer?: number;
  endOdometer?: number;
  createdAt: string;
}

export const bookingService = {
  // 1. Lấy tất cả đơn đặt xe (Dành cho Admin / Staff / Owner) -> GET /api/bookings
  getAllBookings: async (filters?: { status?: string }) => {
    const res = await axios.get(API_URL, { params: filters });
    return res.data.bookings || res.data.data || res.data;
  },

  // 2. Lấy đơn đặt xe của cá nhân người dùng đang login -> GET /api/bookings/my-bookings
  getMyBookings: async () => {
    const res = await axios.get(`${API_URL}/my-bookings`);
    return res.data.bookings || res.data.data || res.data;
  },

  // 3. Tạo mới một đơn đặt xe -> POST /api/bookings
  createBooking: async (data: {
    vehicleId: string;
    pickupDateTime: string;
    returnDateTime: string;
    pickupLocation: { address: string };
    returnLocation: { address: string };
    promoCode?: string;
    paymentMethod?: 'Cash' | 'Banking';
    deliveryMethod?: 'StorePickup' | 'HomeDelivery';
  }) => {
    const res = await axios.post(API_URL, data);
    return res.data;
  },

  // 4. Cập nhật trạng thái đơn (Phê duyệt/Thu xe) -> PUT /api/bookings/:id
  updateStatus: async (
    id: string, 
    status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Returning' | 'Completed' | 'Cancelled', 
    notes?: string
  ) => {
    const res = await axios.put(`${API_URL}/${id}`, { status, notes });
    return res.data;
  },

  // 5. Hủy đơn đặt xe -> POST /api/bookings/:id/cancel
  cancelBooking: async (id: string, cancelReason: string = 'Khách hàng yêu cầu hủy') => {
    const res = await axios.post(`${API_URL}/${id}/cancel`, { cancelReason });
    return res.data;
  },

  // 6. Lấy lịch trình tracking của đơn đặt xe -> GET /api/bookings/:id/tracking
  getBookingTracking: async (id: string) => {
    const res = await axios.get(`${API_URL}/${id}/tracking`);
    return res.data.tracking || res.data.data || res.data;
  },

  // 7. Hoàn trả xe -> PUT /api/bookings/:id/return
  returnMotorbike: async (id: string, actualReturnTime: string, endOdometer?: number, returnReason?: string) => {
    const res = await axios.put(`${API_URL}/${id}/return`, { actualReturnTime, endOdometer, returnReason });
    return res.data;
  },

  // 8. Xóa đơn đặt xe -> DELETE /api/bookings/:id
  deleteBooking: async (id: string) => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  },

  // 9. Lấy link thanh toán VNPAY -> POST /api/bookings/:id/vnpay-url
  getVNPayUrl: async (id: string) => {
    const res = await axios.post(`${API_URL}/${id}/vnpay-url`);
    return res.data;
  },

  // 10. Gửi IPN VNPAY thật -> GET /api/bookings/vnpay-ipn
  verifyVNPayPayment: async (queryParams: string) => {
    const res = await axios.get(`${API_URL}/vnpay-ipn${queryParams}`);
    return res.data;
  },

  // 11. Admin/Staff phản hồi lý do trả xe và cảnh cáo
  replyToReturnReason: async (id: string, replyText: string, warnUser: boolean) => {
    const res = await axios.put(`${API_URL}/${id}/return-response`, { replyText, warnUser });
    return res.data;
  }
};