import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  type: 'customer-owner' | 'customer-staff';
  relatedBooking?: Types.ObjectId;
  relatedVehicle?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  type: { type: String, enum: ['customer-owner', 'customer-staff'], required: true },
  relatedBooking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  relatedVehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }
}, {
  timestamps: true
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
