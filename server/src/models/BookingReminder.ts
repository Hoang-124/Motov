import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingReminder extends Document {
  bookingId: mongoose.Types.ObjectId;
  reminderType: '24h_before_pickup' | '2h_before_pickup' | '24h_before_return' | '2h_before_return';
  scheduledTime: Date;
  sentTime?: Date;
  status: 'Pending' | 'Sent' | 'Failed' | 'Cancelled';
  channel: 'Email' | 'SMS' | 'Both';
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingReminderSchema = new Schema<IBookingReminder>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  reminderType: { 
    type: String, 
    enum: ['24h_before_pickup', '2h_before_pickup', '24h_before_return', '2h_before_return'], 
    required: true 
  },
  scheduledTime: { type: Date, required: true },
  sentTime: { type: Date },
  status: { type: String, enum: ['Pending', 'Sent', 'Failed', 'Cancelled'], default: 'Pending', index: true },
  channel: { type: String, enum: ['Email', 'SMS', 'Both'], default: 'Email' },
  retryCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const BookingReminder = mongoose.model<IBookingReminder>('BookingReminder', BookingReminderSchema);
