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
  lastMaintenanceOdometer: number;
  maintenanceInterval: number;
  requiresMaintenance: boolean;
  isDeleted?: boolean;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
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
  features: [{ type: String }],
  lastMaintenanceOdometer: { type: Number, default: 0 },
  maintenanceInterval: { type: Number, default: 2000 },
  requiresMaintenance: { type: Boolean, default: false, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [108.22, 16.068] } // [longitude, latitude] (Da Nang center)
  }
}, {
  timestamps: true
});

VehicleSchema.index({ location: '2dsphere' });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
