import mongoose, { Schema, Document } from 'mongoose';

export interface ISurcharge {
  surchargeType: string;
  amount: number;
  description?: string;
  isPaid: boolean;
  createdAt: Date;
}

export interface IVehicleSnapshot {
  name: string;
  image: string;
  rentalPrice: number;
}

export interface ILocationDetails {
  address?: string;
  coordinates: number[]; // [Longitude, Latitude]
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleSnapshot: IVehicleSnapshot;
  pickupDateTime: Date;
  returnDateTime: Date;
  pickupLocation?: ILocationDetails;
  returnLocation?: ILocationDetails;
  totalAmount: number;
  depositAmount?: number;
  remainingAmount?: number;
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';
  bookingCode: string;
  surcharges: ISurcharge[];
  cancelReason?: string;
  returnReason?: string;
  paymentMethod?: 'Cash' | 'Banking';
  deliveryMethod?: 'StorePickup' | 'HomeDelivery';
  isPaid?: boolean;
  discountId?: mongoose.Types.ObjectId;
  discountAmount?: number;
  promoCodeUsed?: string;
  isPickupReminded?: boolean;
  isReturnReminded?: boolean;
  startOdometer: number;
  endOdometer?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SurchargeSchema = new Schema<ISurcharge>({
  surchargeType: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  isPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const VehicleSnapshotSchema = new Schema<IVehicleSnapshot>({
  name: { type: String, required: true },
  image: { type: String, required: true },
  rentalPrice: { type: Number, required: true }
}, { _id: false });

const LocationDetailsSchema = new Schema<ILocationDetails>({
  address: { type: String },
  coordinates: { type: [Number], default: [0, 0] } // [Lng, Lat]
}, { _id: false });

const BookingSchema = new Schema<IBooking>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  vehicleSnapshot: { type: VehicleSnapshotSchema, required: true },
  pickupDateTime: { type: Date, required: true },
  returnDateTime: { type: Date, required: true },
  pickupLocation: LocationDetailsSchema,
  returnLocation: LocationDetailsSchema,
  totalAmount: { type: Number, required: true },
  depositAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'], default: 'Pending', index: true },
  bookingCode: { type: String, required: true, unique: true, index: true },
  surcharges: [SurchargeSchema],
  cancelReason: { type: String },
  returnReason: { type: String },
  paymentMethod: { type: String, enum: ['Cash', 'Banking'], default: 'Banking' },
  deliveryMethod: { type: String, enum: ['StorePickup', 'HomeDelivery'], default: 'StorePickup' },
  isPaid: { type: Boolean, default: false },
  discountId: { type: Schema.Types.ObjectId, ref: 'Discount' },
  discountAmount: { type: Number, default: 0 },
  promoCodeUsed: { type: String },
  isPickupReminded: { type: Boolean, default: false, index: true },
  isReturnReminded: { type: Boolean, default: false, index: true },
  startOdometer: { type: Number, default: 0 },
  endOdometer: { type: Number }
}, {
  timestamps: true
});

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
