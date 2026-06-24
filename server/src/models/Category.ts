import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String }
}, {
  timestamps: true
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
