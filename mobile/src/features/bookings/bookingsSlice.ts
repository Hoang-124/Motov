import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Booking, OwnerRequest } from '../../types';
import { API_BASE_URL } from '../../constants/api';
import { apiFetch } from '../../utils/api';

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
    case 'Rented': case 'Ongoing': return 'Đang thuê';
    case 'Returning': return 'Chờ duyệt trả xe';
    case 'Completed': return 'Hoàn thành';
    case 'Cancelled': return 'Đã hủy';
    default: return status;
  }
};

import { resolveImageUrl } from '../../utils/image';

const normaliseBooking = (b: any): Booking => {
  const bikeName = b.vehicleSnapshot?.name || b.vehicleModel || b.vehicleId?.vehicleModel || '';
  const rawImage = b.vehicleSnapshot?.image || b.vehicleId?.imageUrls?.[0] || b.vehicleId?.image || b.image;

  return {
    id: b._id || b.id,
    bookingCode: b.bookingCode || '',
    bikeId: b.vehicleId || '',
    bikeName: bikeName,
    image: resolveImageUrl(rawImage, bikeName),
    price: String(b.vehicleSnapshot?.rentalPrice || b.totalAmount || ''),
    date: b.pickupDateTime ? new Date(b.pickupDateTime).toLocaleDateString('vi-VN') : '',
    location: b.pickupLocation?.address || '',
    fullName: b.fullName || '',
    phone: b.phone || '',
    status: b.status || 'Pending',
    statusLabel: getStatusLabel(b.status || 'Pending'),
    createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '',
    pickupDateTime: b.pickupDateTime,
    returnDateTime: b.returnDateTime,
    totalAmount: b.totalAmount,
    rentalDays: b.rentalDays,
    depositAmount: b.depositAmount,
    remainingAmount: b.remainingAmount,
    paymentMethod: b.paymentMethod,
    deliveryMethod: b.deliveryMethod,
    isPaid: b.isPaid,
    surcharges: b.surcharges || [],
  };
};

export const fetchBookings = createAsyncThunk('bookings/fetchBookings', async (_, { getState, rejectWithValue }) => {
  try {
    const state: any = getState();
    const role = state.user?.role;

    const endpoint = (role === 'staff' || role === 'admin') 
      ? '/bookings' 
      : '/bookings/my-bookings';

    const res = await apiFetch(endpoint);
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return (data.bookings as any[]).map(normaliseBooking);
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchOwnerRequests = createAsyncThunk('bookings/fetchOwnerRequests', async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/auth/owner-requests');
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return data.requests as OwnerRequest[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const approveOwnerRequest = createAsyncThunk('bookings/approveOwnerRequest', async (id: string, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`/auth/owner-requests/${id}/approve`, {
      method: 'PUT',
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const rejectOwnerRequest = createAsyncThunk('bookings/rejectOwnerRequest', async (id: string, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`/auth/owner-requests/${id}/reject`, {
      method: 'PUT',
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const updateBookingStatus = createAsyncThunk('bookings/updateBookingStatus', async ({ id, status, notes }: { id: string; status: string; notes?: string; statusLabel?: string }, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`/bookings/${id}`, {
      method: 'PUT',
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
      paymentMethod?: 'Cash' | 'Banking';
      deliveryMethod?: 'StorePickup' | 'HomeDelivery';
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch('/bookings', {
        method: 'POST',
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

export const cancelBooking = createAsyncThunk('bookings/cancelBooking', async (id: string, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancelReason: 'Người dùng yêu cầu hủy' })
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const returnBookingApi = createAsyncThunk('bookings/returnBooking', async (id: string, { rejectWithValue }) => {
  try {
    const res = await apiFetch(`/bookings/${id}/request-return`, {
      method: 'POST',
      body: JSON.stringify({ returnReason: 'Khách hàng gửi yêu cầu trả xe' })
    });
    const data = await res.json();
    if (!data.success) return rejectWithValue(data.message);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const submitFeedback = createAsyncThunk(
  'bookings/submitFeedback',
  async ({ id, rating, content }: { id: string; rating: number; content: string }, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/feedbacks', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: id,
          rating,
          content: content.trim() || 'Chuyến đi tuyệt vời! Xe rất tốt.'
        })
      });
      const data = await res.json();
      if (!data.success) return rejectWithValue(data.message);
      return { id, rating, content };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings = [action.payload, ...state.bookings];
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
      .addCase(submitFeedback.fulfilled, (state, action) => {
        const { id, rating, content } = action.payload;
        state.bookings = state.bookings.map(b => 
          b.id === id 
            ? { ...b, status: 'Đã đánh giá', statusLabel: 'Đã đánh giá', feedback: { rating, content } } 
            : b
        );
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
      })
      .addCase(returnBookingApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(returnBookingApi.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(b => 
          b.id === action.payload 
            ? { ...b, status: 'Completed' as any, statusLabel: 'Hoàn thành' } 
            : b
        );
      })
      .addCase(returnBookingApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  addBooking, 
  returnBookingWithFees
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
