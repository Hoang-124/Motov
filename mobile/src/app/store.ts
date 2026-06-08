import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import bikesReducer from '../features/bikes/bikesSlice';
import bookingsReducer from '../features/bookings/bookingsSlice';
import userReducer from '../features/profile/userSlice';

export const store = configureStore({
  reducer: {
    bikes: bikesReducer,
    bookings: bookingsReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom typed hooks for use throughout the application
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
