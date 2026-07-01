import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Thêm index kép để tối ưu truy vấn lịch sử chat
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
