import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Booking, OwnerRequest } from '../../types';
import { API_BASE_URL } from '../../constants/api';

interface BookingsState {
  bookings: Booking[];
  ownerRequests: OwnerRequest[];
  loading: boolean;
  error: string | null;
}


const initialState: BookingsState = {
  bookings: [],
  ownerRequests: [],
  loading: false,
  error: null,
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Pending': return 'Chờ duyệt';
    case 'Confirmed': return 'Đã duyệt';
    case 'Rented': return 'Đang thuê';
    case 'Completed': return 'Hoàn thành';
    case 'Cancelled': return 'Đã hủy';
    default: return status;
  }
};

const normaliseBooking = (b: any): Booking => ({
  id: b._id || b.id,
  bookingCode: b.bookingCode || '',
  bikeId: b.vehicleId || '',
  bikeName: b.vehicleSnapshot?.name || b.vehicleModel || '',
  image: b.vehicleSnapshot?.image || '',
  price: String(b.vehicleSnapshot?.rentalPrice || b.totalAmount || ''),
  date: b.pickupDateTime ? new Date(b.pickupDateTime).toLocaleDateString('vi-VN') : '',
  location: b.pickupLocation?.address || '',
  fullName: '',
  phone: '',
  status: b.status || 'Pending',
  statusLabel: getStatusLabel(b.status || 'Pending'),
  createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '',
  pickupDateTime: b.pickupDateTime,
  returnDateTime: b.returnDateTime,
  totalAmount: b.totalAmount,
  rentalDays: b.rentalDays,
  surcharges: b.surcharges || [],
});

export const fetchBookings = createAsyncThunk('bookings/fetchBookings', async (_, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const token = state.user?.token;
    const role = state.user?.role;
    if (!token) return rejectWithValue('No token found');

    const endpoint = (role === 'staff' || role === 'admin') 
      ? `${API_BASE_URL}/bookings` 
      : `${API_BASE_URL}/bookings/my-bookings`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return (data.bookings as any[]).map(normaliseBooking);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchOwnerRequests = createAsyncThunk('bookings/fetchOwnerRequests', async (_, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const token = state.user?.token;
    if (!token) return rejectWithValue('No token found');

    const res = await fetch(`${API_BASE_URL}/auth/owner-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return data.requests as OwnerRequest[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const approveOwnerRequest = createAsyncThunk('bookings/approveOwnerRequest', async (id: string, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const token = state.user?.token;
    const res = await fetch(`${API_BASE_URL}/auth/owner-requests/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const rejectOwnerRequest = createAsyncThunk('bookings/rejectOwnerRequest', async (id: string, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const token = state.user?.token;
    const res = await fetch(`${API_BASE_URL}/auth/owner-requests/${id}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const updateBookingStatus = createAsyncThunk('bookings/updateBookingStatus', async ({ id, status, notes }: { id: string; status: string; notes?: string; statusLabel?: string }, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const token = state.user?.token;
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return { id, status, statusLabel: getStatusLabel(status) };
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const createBookingApi = createAsyncThunk(
  'bookings/createBooking',
  async (
    payload: {
      vehicleId: string;
      pickupDateTime: string;
      returnDateTime: string;
      pickupLocation?: string | { address: string; coordinates: number[] };
      returnLocation?: string | { address: string; coordinates: number[] };
      promoCode?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state: any = getState();
      const token = state.user?.token;
      if (!token) return rejectWithValue('Chưa đăng nhập');

      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) return rejectWithValue(data.message);
      return data.booking;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelBooking = createAsyncThunk('bookings/cancelBooking', async (id: string, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const token = state.user?.token;
    // Tạm thời gọi POST /cancel nếu backend hỗ trợ, nếu không thì dùng update status.
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ cancelReason: 'Người dùng yêu cầu hủy' })
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings = [action.payload, ...state.bookings];
    },

    submitFeedback(state, action: PayloadAction<{ id: string; rating: number; content: string }>) {
      const { id, rating, content } = action.payload;
      state.bookings = state.bookings.map(b => 
        b.id === id 
          ? { ...b, status: 'Đã đánh giá', statusLabel: 'Đã đánh giá', feedback: { rating, content } } 
          : b
      );
    },
    returnBookingWithFees(state, action: PayloadAction<{ id: string; lateFee: number; returnTime: string }>) {
      const { id, lateFee } = action.payload;
      state.bookings = state.bookings.map(b => {
        if (b.id !== id) return b;
        const currentAmount = b.totalAmount || 0;
        const newSurcharges = [...(b.surcharges || [])];
        if (lateFee > 0) {
          newSurcharges.push({
            surchargeType: 'Late Return',
            amount: lateFee,
            description: `Phí trả trễ xe máy. Phạt tính vào đơn.`
          });
        }
        return {
          ...b,
          status: 'Đã trả',
          statusLabel: 'Hoàn thành',
          totalAmount: currentAmount + lateFee,
          surcharges: newSurcharges
        };
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOwnerRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerRequests = action.payload;
      })
      .addCase(fetchOwnerRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(approveOwnerRequest.fulfilled, (state, action) => {
        state.ownerRequests = state.ownerRequests.filter(r => r.id !== action.payload);
      })
      .addCase(rejectOwnerRequest.fulfilled, (state, action) => {
        state.ownerRequests = state.ownerRequests.filter(r => r.id !== action.payload);
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const { id, status, statusLabel } = action.payload;
        state.bookings = state.bookings.map(b => 
          b.id === id 
            ? { ...b, status: status as any, statusLabel } 
            : b
        );
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.bookings = state.bookings.map(b => 
          b.id === action.payload 
            ? { ...b, status: 'Cancelled' as any, statusLabel: 'Đã hủy' } 
            : b
        );
      })
      .addCase(createBookingApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBookingApi.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.bookings = [normaliseBooking(action.payload), ...state.bookings];
        }
      })
      .addCase(createBookingApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  addBooking, 
  submitFeedback, 
  returnBookingWithFees
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
