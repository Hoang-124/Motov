import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  value: string;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
