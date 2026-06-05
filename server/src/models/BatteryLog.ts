import mongoose, { Schema, Document } from 'mongoose';

export interface IGPSLocation {
  type: 'Point';
  coordinates: number[]; // [Longitude, Latitude]
}

export interface IBatteryLog extends Document {
  vehicleId: mongoose.Types.ObjectId;
  timestamp: Date;
  batteryLevel: number;
  odometer?: number;
  gpsLocation?: IGPSLocation;
}

const GPSLocationSchema = new Schema<IGPSLocation>({
  type: { type: String, enum: ['Point'], default: 'Point', required: true },
  coordinates: { type: [Number], required: true } // [Lng, Lat]
}, { _id: false });

const BatteryLogSchema = new Schema<IBatteryLog>({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  timestamp: { type: Date, default: Date.now, required: true, index: true },
  batteryLevel: { type: Number, required: true, min: 0, max: 100 },
  odometer: { type: Number },
  gpsLocation: GPSLocationSchema
}, {
  // If your MongoDB cluster supports native Timeseries collections, Mongoose supports passing timeseries options:
  timeseries: {
    timeField: 'timestamp',
    metaField: 'vehicleId',
    granularity: 'seconds'
  }
});

// Create spatial index for GPS queries
BatteryLogSchema.index({ gpsLocation: '2dsphere' });

export const BatteryLog = mongoose.model<IBatteryLog>('BatteryLog', BatteryLogSchema);
