import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { getIO } from '../socket.js';
import mongoose from 'mongoose';

export const getUserBasicInfo = async (userId: string) => {
  return await User.findById(userId).select('firstName lastName username email avatarUrl roles phoneNumber').lean();
};

export const createOrGetConversation = async (participantIds: string[], type: 'customer-owner' | 'customer-staff', relatedBookingId?: string, relatedVehicleId?: string) => {
  const participantsObjIds = participantIds.map(id => new mongoose.Types.ObjectId(id));

  // Validation: Check if the related booking exists if provided
  if (relatedBookingId) {
    const booking = await Booking.findById(relatedBookingId).populate('vehicleId');
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Authorization: Ensure participants are actually the ones involved in the booking.
    const customerId = booking.userId.toString();
    const ownerId = (booking.vehicleId as any).ownerId.toString();

    const strParticipants = participantIds.map(id => id.toString());

    if (type === 'customer-owner') {
      if (!strParticipants.includes(customerId) || !strParticipants.includes(ownerId)) {
        throw new Error('Forbidden: Participants do not match the booking customer and owner');
      }
    }
  }

  const query: any = {
    participants: { $all: participantsObjIds, $size: participantsObjIds.length },
    type
  };

  let conversation = await Conversation.findOne(query);

  if (conversation) {
    let needsUpdate = false;
    if (relatedBookingId) {
      const bookingObjId = new mongoose.Types.ObjectId(relatedBookingId);
      if (conversation.relatedBooking?.toString() !== relatedBookingId) {
        conversation.relatedBooking = bookingObjId;
        needsUpdate = true;
      }
      if (conversation.relatedVehicle) {
        conversation.relatedVehicle = undefined;
        needsUpdate = true;
      }
    } else if (relatedVehicleId) {
      const vehicleObjId = new mongoose.Types.ObjectId(relatedVehicleId);
      if (conversation.relatedVehicle?.toString() !== relatedVehicleId) {
        conversation.relatedVehicle = vehicleObjId;
        needsUpdate = true;
      }
      if (conversation.relatedBooking) {
        conversation.relatedBooking = undefined;
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      await conversation.save();
    }
  } else {
    const createData: any = {
      participants: participantsObjIds,
      type
    };
    if (relatedBookingId) {
      createData.relatedBooking = new mongoose.Types.ObjectId(relatedBookingId);
    }
    if (relatedVehicleId) {
      createData.relatedVehicle = new mongoose.Types.ObjectId(relatedVehicleId);
    }
    conversation = await Conversation.create(createData);

    // Populate before emitting so clients receive full conversation data
    await conversation.populate([
      { path: 'participants', select: 'firstName lastName email username' },
      { path: 'relatedBooking', select: 'bookingCode status pickupDateTime returnDateTime vehicleSnapshot' },
      { path: 'relatedVehicle', select: 'vehicleModel imageUrls licensePlate' },
      { path: 'lastMessage' }
    ]);

    // Emit new_conversation event to all participants so their chat list updates in real-time
    try {
      const io = getIO();
      participantsObjIds.forEach(pId => {
        io.to(`user_${pId.toString()}`).emit('new_conversation', conversation);
      });
    } catch (e) {
      // Socket may not be initialized in tests
    }

    return conversation;
  }

  // Populate conversation fields to match client-side expectations
  await conversation.populate([
    { path: 'participants', select: 'firstName lastName email username' },
    { path: 'relatedBooking', select: 'bookingCode status pickupDateTime returnDateTime vehicleSnapshot' },
    { path: 'relatedVehicle', select: 'vehicleModel imageUrls licensePlate' },
    { path: 'lastMessage' }
  ]);

  return conversation;
};

export const getUserConversations = async (userId: string, skip: number = 0, limit: number = 20) => {
  const conversations = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId) })
    .populate('participants', 'firstName lastName email username')
    .populate('relatedBooking', 'bookingCode status pickupDateTime returnDateTime vehicleSnapshot')
    .populate('relatedVehicle', 'vehicleModel imageUrls licensePlate')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (conversations.length === 0) return conversations;

  const conversationIds = conversations.map(c => c._id);
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        readBy: { $ne: new mongoose.Types.ObjectId(userId) }
      }
    },
    {
      $group: {
        _id: '$conversationId',
        count: { $sum: 1 }
      }
    }
  ]);

  const unreadMap = new Map(unreadCounts.map(item => [item._id.toString(), item.count]));

  for (const conv of conversations) {
    (conv as any).unreadCount = unreadMap.get(conv._id.toString()) || 0;
  }

  return conversations;
};

export const getConversationMessages = async (userId: string, conversationId: string, skip: number = 0, limit: number = 50) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Authorization: Ensure the requester is a participant
  if (!conversation.participants.some(p => p.toString() === userId)) {
    throw new Error('Forbidden: You are not a participant in this conversation');
  }

  return await Message.find({ conversationId: new mongoose.Types.ObjectId(conversationId) })
    .populate('senderId', 'firstName lastName avatarUrl')
    .sort({ createdAt: -1 }) // Usually fetch newest first, client can reverse
    .skip(skip)
    .limit(limit);
};

export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
  if (!content || content.trim() === '') {
    throw new Error('Message content cannot be empty');
  }
  if (content.length > 5000) {
    throw new Error('Message payload exceeds the limit of 5000 characters');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Authorization: Ensure the sender is a participant
  if (!conversation.participants.some(p => p.toString() === senderId)) {
    throw new Error('Forbidden: You are not a participant in this conversation');
  }

  const message = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    senderId: new mongoose.Types.ObjectId(senderId),
    content: content.trim(),
    readBy: [new mongoose.Types.ObjectId(senderId)]
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    updatedAt: new Date()
  });

  // Populate sender info for real-time broadcast
  const populatedMessage = await message.populate('senderId', 'firstName lastName avatarUrl');

  // Emit real-time message via socket.io
  const io = getIO();
  // Emit to the conversation room (for clients currently viewing this conversation)
  io.to(conversationId.toString()).emit('new_message', populatedMessage);
  // Also emit to personal rooms of all participants (for header unread count / conversation list updates)
  // This is separate from the conversation room event to update the sidebar even when not in chat
  if (conversation && conversation.participants) {
    conversation.participants.forEach(p => {
      io.to(`user_${p.toString()}`).emit('conversation_updated', {
        conversationId: conversationId.toString(),
        lastMessage: populatedMessage
      });
    });
  }

  return populatedMessage;
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Authorization: Ensure the requester is a participant
  if (!conversation.participants.some(p => p.toString() === userId)) {
    throw new Error('Forbidden: You are not a participant in this conversation');
  }

  await Message.updateMany(
    {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      readBy: { $ne: new mongoose.Types.ObjectId(userId) }
    },
    { $push: { readBy: new mongoose.Types.ObjectId(userId) } }
  );
};
