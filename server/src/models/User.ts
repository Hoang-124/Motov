import mongoose, { Schema, Document } from 'mongoose';

export interface IUserVoucher extends Document {
  discountId: mongoose.Types.ObjectId;
  usedAt: Date;
  bookingId?: mongoose.Types.ObjectId;
}

export interface IUser extends Document {
  username: string;
  email?: string;
  passwordHash?: string;
  googleId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: Date;
  roles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
  status: 'Active' | 'Suspended' | 'Unverified';
  strikes: number;
  favoriteVehicles: mongoose.Types.ObjectId[];
  usedVouchers: IUserVoucher[];
  ownerRequestStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const UserVoucherSchema = new Schema<IUserVoucher>({
  discountId: { type: Schema.Types.ObjectId, ref: 'Discount', required: true },
  usedAt: { type: Date, default: Date.now },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true, index: true },
  passwordHash: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  phoneNumber: { type: String },
  avatarUrl: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date },
  roles: [{ type: String, enum: ['Admin', 'Staff', 'Owner', 'Customer'], default: ['Customer'] }],
  status: { type: String, enum: ['Active', 'Suspended', 'Unverified'], default: 'Active' },
  strikes: { type: Number, default: 0 },
  ownerRequestStatus: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
  favoriteVehicles: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],
  usedVouchers: [UserVoucherSchema]
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
