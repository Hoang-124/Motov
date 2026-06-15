import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'BookingPending' | 'BookingConfirmed' | 'BookingCancelled' | 'System';
  relatedId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['BookingPending', 'BookingConfirmed', 'BookingCancelled', 'System'], 
    default: 'System' 
  },
  relatedId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  isRead: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
