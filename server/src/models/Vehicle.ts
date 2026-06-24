import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  ownerId: mongoose.Types.ObjectId;
  vehicleModel: string;
  licensePlate: string;
  seats: number;
  odometer: number;
  rentalPrice: number;
  status: 'Available' | 'Rented' | 'Maintenance' | 'PendingApproval';
  description?: string;
  category: mongoose.Types.ObjectId | string;
  transmissionType: 'Manual' | 'Automatic' | 'Semi-Automatic';
  regCertificateUrl?: string;
  imageUrls: string[];
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleModel: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true, index: true },
  seats: { type: Number, default: 2 },
  odometer: { type: Number, default: 0 },
  rentalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Rented', 'Maintenance', 'PendingApproval'], default: 'PendingApproval' },
  description: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  transmissionType: { type: String, enum: ['Manual', 'Automatic', 'Semi-Automatic'], required: true },
  regCertificateUrl: { type: String },
  imageUrls: [{ type: String }],
  features: [{ type: String }]
}, {
  timestamps: true
});

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
