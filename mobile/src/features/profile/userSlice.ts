import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'guest' | 'customer' | 'owner' | 'staff' | 'admin';

export interface UserState {
  token: string | null;
  id: string | null;
  username: string | null;
  name: string;
  email: string;
  memberTag: string;
  role: UserRole;
  phoneNumber: string;
  avatarUrl: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  identityStatus: 'Unverified' | 'NotSubmitted' | 'Pending' | 'Verified' | 'Rejected' | null;
  identityRejectReason?: string | null;
}

export const getMemberTag = (role: UserRole): string => {
  switch (role) {
    case 'admin': return 'Quản trị hệ thống';
    case 'staff': return 'Nhân viên Hỗ trợ';
    case 'owner': return 'Đối tác Chủ xe';
    case 'customer': return 'Thành viên Vàng';
    default: return 'Thành viên mới';
  }
};

const initialState: UserState = {
  token: null,
  id: null,
  username: null,
  name: 'Khách vãng lai',
  email: 'khach@motov.com',
  memberTag: 'Thành viên mới',
  role: 'guest',
  phoneNumber: '',
  avatarUrl: '',
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  identityStatus: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser(state, action: PayloadAction<Partial<UserState>>) {
      const updated = { ...state, ...action.payload };
      if (action.payload.role) {
        updated.memberTag = getMemberTag(action.payload.role);
      }
      return updated;
    },
    logout() {
      return initialState;
    }
  },
});

export const { updateUser, logout } = userSlice.actions;
export default userSlice.reducer;
