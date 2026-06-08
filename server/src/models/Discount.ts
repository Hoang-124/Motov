import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscount extends Document {
  discountName: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  voucherCode: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  discountCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>({
  discountName: { type: String, required: true },
  description: { type: String },
  discountType: { type: String, enum: ['Percentage', 'FixedAmount'], required: true },
  discountValue: { type: Number, required: true }, // percent or cash amount
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true, index: true },
  voucherCode: { type: String, required: true, unique: true, index: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  discountCategory: { type: String }
}, {
  timestamps: true
});

export const Discount = mongoose.model<IDiscount>('Discount', DiscountSchema);
