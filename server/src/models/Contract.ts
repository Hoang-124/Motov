import mongoose, { Schema, Document } from 'mongoose';

export interface ISignatures {
  customerSignatureUrl?: string;
  ownerSignatureUrl?: string;
}

export interface IIDCardImages {
  front?: string;
  back?: string;
}

export interface IContract extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  contractCode: string;
  signedDate?: Date;
  concludeDate?: Date;
  status: 'Draft' | 'Signed' | 'Terminated' | 'Expired';
  terms?: string;
  signatures: ISignatures;
  idCardImages: IIDCardImages;
  createdAt: Date;
  updatedAt: Date;
}

const SignaturesSchema = new Schema<ISignatures>({
  customerSignatureUrl: { type: String },
  ownerSignatureUrl: { type: String }
}, { _id: false });

const IDCardImagesSchema = new Schema<IIDCardImages>({
  front: { type: String },
  back: { type: String }
}, { _id: false });

const ContractSchema = new Schema<IContract>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contractCode: { type: String, required: true, unique: true, index: true },
  signedDate: { type: Date },
  concludeDate: { type: Date },
  status: { type: String, enum: ['Draft', 'Signed', 'Terminated', 'Expired'], default: 'Draft', index: true },
  terms: { type: String },
  signatures: { type: SignaturesSchema, default: {} },
  idCardImages: { type: IDCardImagesSchema, default: {} }
}, {
  timestamps: true
});

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
