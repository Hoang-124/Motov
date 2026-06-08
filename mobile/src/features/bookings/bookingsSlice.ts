import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking } from '../../types';

interface BookingsState {
  bookings: Booking[];
}

const initialState: BookingsState = {
  bookings: [],
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings = [action.payload, ...state.bookings];
    },
    cancelBooking(state, action: PayloadAction<string>) {
      state.bookings = state.bookings.filter(b => b.id !== action.payload);
    },
  },
});

export const { addBooking, cancelBooking } = bookingsSlice.actions;
export default bookingsSlice.reducer;
