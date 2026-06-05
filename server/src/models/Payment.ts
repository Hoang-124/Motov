import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'VNPAY' | 'MOMO' | 'Cash' | 'Stripe';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  transactionId?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['VNPAY', 'MOMO', 'Cash', 'Stripe'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending', index: true },
  transactionId: { type: String },
  paymentDate: { type: Date }
}, {
  timestamps: true
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
