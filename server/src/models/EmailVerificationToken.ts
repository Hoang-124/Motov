import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingUserData {
  username: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles: string[];
}

export interface IEmailVerificationToken extends Document {
  token: string;
  userId?: mongoose.Types.ObjectId;
  pendingUserData?: IPendingUserData;
  expiryTime: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  pendingUserData: {
    username: { type: String },
    email: { type: String },
    passwordHash: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber: { type: String },
    roles: [{ type: String }]
  },
  expiryTime: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// TTL index to automatically delete expired tokens after their expiry time
EmailVerificationTokenSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationToken = mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema);
export default EmailVerificationToken;
