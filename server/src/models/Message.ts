import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, maxlength: 5000 },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Optimize query for fetching conversation messages ordered by time
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Real-time broadcasting is handled by Socket.io in chatService.sendMessage()
// to avoid dual notification channels

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
