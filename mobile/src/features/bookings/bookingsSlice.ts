import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, OwnerRequest } from '../../types';

interface BookingsState {
  bookings: Booking[];
  ownerRequests: OwnerRequest[];
}

const mockBookings: Booking[] = [
  {
    id: "BKG-9843",
    bikeId: "honda-vision-smartkey",
    bikeName: "Honda Vision Smartkey",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    price: "90.000",
    date: "16/06/2026 - 18/06/2026",
    location: "Sân bay Đà Nẵng",
    fullName: "Nguyễn Văn An",
    phone: "0905123456",
    status: "Chờ duyệt",
    statusLabel: "Chờ duyệt",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    pickupDateTime: "2026-06-16T08:00:00.000Z",
    returnDateTime: "2026-06-18T08:00:00.000Z",
    pickupLocation: { address: "Sân bay Đà Nẵng" },
    returnLocation: { address: "Sân bay Đà Nẵng" },
    rentalDays: 2,
    totalAmount: 180000,
    surcharges: [],
  },
  {
    id: "BKG-7654",
    bikeId: "honda-air-blade",
    bikeName: "Honda Air Blade",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    price: "130.000",
    date: "14/06/2026 - 16/06/2026",
    location: "Ga Đà Nẵng",
    fullName: "Trần Thị Bình",
    phone: "0905987654",
    status: "Đang thuê",
    statusLabel: "Đang thuê",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    pickupDateTime: "2026-06-14T08:00:00.000Z",
    returnDateTime: "2026-06-16T08:00:00.000Z",
    pickupLocation: { address: "Ga Đà Nẵng" },
    returnLocation: { address: "Ga Đà Nẵng" },
    rentalDays: 2,
    totalAmount: 260000,
    surcharges: [],
  },
  {
    id: "BKG-1209",
    bikeId: "vespa-sprint-primavera",
    bikeName: "Vespa Sprint / Primavera",
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    price: "220.000",
    date: "10/06/2026 - 12/06/2026",
    location: "Sân bay Đà Nẵng",
    fullName: "Lê Văn Cường",
    phone: "0905555666",
    status: "Đã trả",
    statusLabel: "Hoàn thành",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pickupDateTime: "2026-06-10T08:00:00.000Z",
    returnDateTime: "2026-06-12T08:00:00.000Z",
    pickupLocation: { address: "Sân bay Đà Nẵng" },
    returnLocation: { address: "Sân bay Đà Nẵng" },
    rentalDays: 2,
    totalAmount: 440000,
    surcharges: [],
  }
];

const mockOwnerRequests: OwnerRequest[] = [
  {
    id: "REQ-001",
    username: "tranthim",
    email: "tranthim@gmail.com",
    name: "Trần Thị Mơ",
    phoneNumber: "0905112233",
    status: "Pending",
    ownerRequestStatus: "Pending",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "REQ-002",
    username: "lethanhn",
    email: "lethanhn@gmail.com",
    name: "Lê Thanh Nghị",
    phoneNumber: "0905445566",
    status: "Pending",
    ownerRequestStatus: "Pending",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }
];

const initialState: BookingsState = {
  bookings: mockBookings,
  ownerRequests: mockOwnerRequests,
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings = [action.payload, ...state.bookings];
    },
    cancelBooking(state, action: PayloadAction<string>) {
      state.bookings = state.bookings.map(b => 
        b.id === action.payload 
          ? { ...b, status: 'Đã hủy', statusLabel: 'Đã hủy' } 
          : b
      );
    },
    updateBookingStatus(state, action: PayloadAction<{ id: string; status: string; statusLabel: string }>) {
      const { id, status, statusLabel } = action.payload;
      state.bookings = state.bookings.map(b => 
        b.id === id 
          ? { ...b, status, statusLabel } 
          : b
      );
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
    },
    approveOwnerRequest(state, action: PayloadAction<string>) {
      state.ownerRequests = state.ownerRequests.filter(r => r.id !== action.payload);
    },
    rejectOwnerRequest(state, action: PayloadAction<string>) {
      state.ownerRequests = state.ownerRequests.filter(r => r.id !== action.payload);
    }
  },
});

export const { 
  addBooking, 
  cancelBooking, 
  updateBookingStatus, 
  submitFeedback, 
  returnBookingWithFees,
  approveOwnerRequest,
  rejectOwnerRequest
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
