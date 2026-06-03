import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  name: string;
  email: string;
  memberTag: string;
  role: 'guest' | 'customer' | 'owner' | 'staff' | 'admin';
}

const initialState: UserState = {
  name: 'Khách vãng lai',
  email: 'khach@motov.com',
  memberTag: 'Thành viên mới',
  role: 'guest',
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
