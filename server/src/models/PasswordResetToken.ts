import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiryTime: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiryTime: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// TTL index to automatically delete expired tokens after their expiry time
PasswordResetTokenSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
