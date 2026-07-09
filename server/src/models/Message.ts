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

// Post-save hook to trigger real-time chat messages via SSE
MessageSchema.post('save', async function(doc) {
  try {
    const service = await import('../services/realtimeService.js');
    const { Conversation } = await import('./Conversation.js');
    
    const conversation = await Conversation.findById(doc.conversationId);
    if (conversation) {
      conversation.participants.forEach(p => {
        // Send SSE event to other participants (not the sender)
        if (p.toString() !== doc.senderId.toString()) {
          service.sendRealtimeMessage(p.toString(), doc);
        }
      });
    }
  } catch (err) {
    console.error('Lỗi trong post-save hook của Message:', err);
  }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
