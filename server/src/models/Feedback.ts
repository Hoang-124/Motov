import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffReply {
  content: string;
  staffId: mongoose.Types.ObjectId;
  repliedAt: Date;
}

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  content: string;
  staffReply?: IStaffReply;
  createdAt: Date;
  updatedAt: Date;
}

const StaffReplySchema = new Schema<IStaffReply>({
  content: { type: String, required: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  repliedAt: { type: Date, default: Date.now }
}, { _id: false });

const FeedbackSchema = new Schema<IFeedback>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true }, // 1 booking only gets 1 review
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true },
  staffReply: StaffReplySchema
}, {
  timestamps: true
});

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
