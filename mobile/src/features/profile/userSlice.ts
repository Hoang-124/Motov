import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  name: string;
  email: string;
  memberTag: string;
}

const initialState: UserState = {
  name: 'Khách Hàng Motov',
  email: 'khachhang@motov.com',
  memberTag: 'Thành viên Bạc',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser(state, action: PayloadAction<Partial<UserState>>) {
      return { ...state, ...action.payload };
    },
  },
});

export const { updateUser } = userSlice.actions;
export default userSlice.reducer;
