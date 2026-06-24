import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  price: number;
  location?: string;
  description?: string;
  lastRestockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>({
  name: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  minQuantity: { type: Number, required: true, min: 0, default: 5 },
  price: { type: Number, required: true, min: 0 },
  location: { type: String },
  description: { type: String },
  lastRestockedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
