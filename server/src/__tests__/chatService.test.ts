import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createOrGetConversation, getUserConversations, getConversationMessages, sendMessage, markMessagesAsRead } from '../services/chatService.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import * as socketUtils from '../socket.js';

let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  } catch (err) {
    console.warn('Could not start MongoMemoryServer. Falling back to local MongoDB test database.');
    await mongoose.connect('mongodb://localhost:27017/Motov_chatService_test');
  }

  // Mock socket to avoid errors during test
  vi.spyOn(socketUtils, 'getIO').mockReturnValue({
    to: () => ({ emit: vi.fn() })
  } as any);

  // Ensure Vehicle is registered
  if (!Vehicle) console.warn('Vehicle model not found');

  // Clear junk state from previous runs
  await Promise.all([
    Vehicle.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Booking.deleteMany({}),
    User.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
  vi.restoreAllMocks();
});

afterEach(async () => {
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  await Booking.deleteMany({});
  await User.deleteMany({});
  await Vehicle.deleteMany({});
});

describe('chatService - Unit Tests', () => {

  describe('createOrGetConversation', () => {
    it('should throw an error if booking does not exist', async () => {
      const u1 = new mongoose.Types.ObjectId().toString();
      const u2 = new mongoose.Types.ObjectId().toString();
      const fakeBookingId = new mongoose.Types.ObjectId().toString();

      await expect(createOrGetConversation([u1, u2], 'customer-owner', fakeBookingId)).rejects.toThrow('Booking not found');
    });

    it('should create a new conversation if one does not exist', async () => {
      const user1 = await User.create({ username: 'user1', email: 'user1@test.com', status: 'Active' });
      const user2 = await User.create({ username: 'user2', email: 'user2@test.com', status: 'Active' });
      const u1 = user1._id;
      const u2 = user2._id;
      const vehicle = await Vehicle.create({
        ownerId: u2,
        vehicleModel: 'Wave',
        licensePlate: '29A-12345',
        rentalPrice: 50,
        category: new mongoose.Types.ObjectId(),
        transmissionType: 'Manual',
      });

      const booking = await Booking.create({
        bookingCode: 'BK123', status: 'Pending',

        userId: u1, vehicleId: vehicle._id, ownerId: u2,
        totalPrice: 100, totalAmount: 100, returnDateTime: new Date(), pickupDateTime: new Date(),
        vehicleSnapshot: { brand: 'Honda', model: 'Wave', year: 2020, name: 'Honda Wave', rentalPrice: 50, image: 'img.jpg' },
        pickupLocation: { type: 'Point', coordinates: [0, 0], address: 'test' }
      });

      const conv = await createOrGetConversation([u1.toString(), u2.toString()], 'customer-owner', booking._id.toString());
      expect(conv).toBeDefined();
      expect(conv.participants.length).toBe(2);
      expect(conv.type).toBe('customer-owner');
      expect((conv.relatedBooking as any)?._id?.toString()).toBe(booking._id.toString());
    });

    it('should return existing conversation if one exists', async () => {
      const user1 = await User.create({ username: 'user1', email: 'user1@test.com', status: 'Active' });
      const user2 = await User.create({ username: 'user2', email: 'user2@test.com', status: 'Active' });
      const u1 = user1._id;
      const u2 = user2._id;
      const vehicle = await Vehicle.create({
        ownerId: u2,
        vehicleModel: 'Wave',
        licensePlate: '29A-67890',
        rentalPrice: 50,
        category: new mongoose.Types.ObjectId(),
        transmissionType: 'Manual',
      });

      const booking = await Booking.create({
        bookingCode: 'BK123', status: 'Pending',

        userId: u1, vehicleId: vehicle._id, ownerId: u2,
        totalPrice: 100, totalAmount: 100, returnDateTime: new Date(), pickupDateTime: new Date(),
        vehicleSnapshot: { brand: 'Honda', model: 'Wave', year: 2020, name: 'Honda Wave', rentalPrice: 50, image: 'img.jpg' },
        pickupLocation: { type: 'Point', coordinates: [0, 0], address: 'test' }
      });

      const conv1 = await createOrGetConversation([u1.toString(), u2.toString()], 'customer-owner', booking._id.toString());
      const conv2 = await createOrGetConversation([u2.toString(), u1.toString()], 'customer-owner', booking._id.toString()); // Order might matter depending on `$all`, `$all` doesn't care about order

      expect(conv1?._id.toString()).toBe(conv2?._id.toString());
    });

    it('should merge conversation and update/clear context when switching between booking and vehicle', async () => {
      const user1 = await User.create({ username: 'user1', email: 'user1@test.com', status: 'Active' });
      const user2 = await User.create({ username: 'user2', email: 'user2@test.com', status: 'Active' });
      const u1 = user1._id;
      const u2 = user2._id;
      
      const vehicle1 = await Vehicle.create({
        ownerId: u2,
        vehicleModel: 'Wave',
        licensePlate: '29A-11111',
        rentalPrice: 50,
        category: new mongoose.Types.ObjectId(),
        transmissionType: 'Manual',
      });

      const vehicle2 = await Vehicle.create({
        ownerId: u2,
        vehicleModel: 'SH',
        licensePlate: '29A-22222',
        rentalPrice: 100,
        category: new mongoose.Types.ObjectId(),
        transmissionType: 'Automatic',
      });

      const booking = await Booking.create({
        bookingCode: 'BK123', status: 'Pending',
        userId: u1, vehicleId: vehicle1._id, ownerId: u2,
        totalPrice: 100, totalAmount: 100, returnDateTime: new Date(), pickupDateTime: new Date(),
        vehicleSnapshot: { brand: 'Honda', model: 'Wave', year: 2020, name: 'Honda Wave', rentalPrice: 50, image: 'img.jpg' },
        pickupLocation: { type: 'Point', coordinates: [0, 0], address: 'test' }
      });

      // Start conversation from vehicle1 detail page
      const convVehicle = await createOrGetConversation([u1.toString(), u2.toString()], 'customer-owner', undefined, vehicle1._id.toString());
      expect(convVehicle.relatedVehicle?._id.toString()).toBe(vehicle1._id.toString());
      expect(convVehicle.relatedBooking).toBeUndefined();

      // Switch context to booking
      const convBooking = await createOrGetConversation([u1.toString(), u2.toString()], 'customer-owner', booking._id.toString());
      expect(convBooking._id.toString()).toBe(convVehicle._id.toString()); // Merged thread
      expect(convBooking.relatedBooking?._id.toString()).toBe(booking._id.toString());
      expect(convBooking.relatedVehicle).toBeUndefined(); // Cleared vehicle context

      // Switch context to vehicle2
      const convVehicle2 = await createOrGetConversation([u1.toString(), u2.toString()], 'customer-owner', undefined, vehicle2._id.toString());
      expect(convVehicle2._id.toString()).toBe(convVehicle._id.toString()); // Merged thread
      expect(convVehicle2.relatedVehicle?._id.toString()).toBe(vehicle2._id.toString());
      expect(convVehicle2.relatedBooking).toBeUndefined(); // Cleared booking context
    });
  });

  describe('sendMessage', () => {
    it('should throw if payload exceeds limit', async () => {
      const longText = 'a'.repeat(5001);
      await expect(sendMessage(new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString(), longText)).rejects.toThrow('Message payload exceeds the limit of 5000 characters');
    });

    it('should throw if sender is not participant', async () => {
      const conv = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });
      const maliciousUserId = new mongoose.Types.ObjectId().toString();

      await expect(sendMessage(conv._id.toString(), maliciousUserId, 'Hello')).rejects.toThrow('Forbidden: You are not a participant in this conversation');
    });

    it('should send a message successfully', async () => {
      const u1 = await User.create({ username: 'u1', email: 'u1@test.com', status: 'Active' });
      const u2 = await User.create({ username: 'u2', email: 'u2@test.com', status: 'Active' });
      const conv = await Conversation.create({
        participants: [u1._id, u2._id],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });

      const message = await sendMessage(conv._id.toString(), u1._id.toString(), 'Hello World');
      expect(message.content).toBe('Hello World');
      expect(message.senderId._id.toString()).toBe(u1._id.toString());

      // Should update conversation lastMessage
      const updatedConv = await Conversation.findById(conv._id);
      expect(updatedConv?.lastMessage?.toString()).toBe(message._id.toString());
    });
  });

  describe('getConversationMessages', () => {
    it('should throw if user is not participant', async () => {
      const conv = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });
      const maliciousUserId = new mongoose.Types.ObjectId().toString();

      await expect(getConversationMessages(maliciousUserId, conv._id.toString())).rejects.toThrow('Forbidden: You are not a participant in this conversation');
    });

    it('should return messages', async () => {
      const u1 = await User.create({ username: 'u1', email: 'u1@test.com', status: 'Active' });
      const conv = await Conversation.create({
        participants: [u1._id, new mongoose.Types.ObjectId()],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });

      await Message.create({ conversationId: conv._id, senderId: u1._id, content: 'msg1', readBy: [] });
      await Message.create({ conversationId: conv._id, senderId: u1._id, content: 'msg2', readBy: [] });

      const messages = await getConversationMessages(u1._id.toString(), conv._id.toString());
      expect(messages.length).toBe(2);
    });
  });

  describe('getUserConversations', () => {
    it('should return user conversations with unread counts', async () => {
      const u1 = await User.create({ username: 'u1', email: 'u1@test.com', status: 'Active' });
      const u2 = await User.create({ username: 'u2', email: 'u2@test.com', status: 'Active' });

      const conv = await Conversation.create({
        participants: [u1._id, u2._id],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });

      await Message.create({ conversationId: conv._id, senderId: u2._id, content: 'unread1', readBy: [u2._id] });
      await Message.create({ conversationId: conv._id, senderId: u2._id, content: 'unread2', readBy: [u2._id] });
      await Message.create({ conversationId: conv._id, senderId: u2._id, content: 'read1', readBy: [u1._id, u2._id] });

      const conversations = await getUserConversations(u1._id.toString());
      expect(conversations.length).toBe(1);
      expect((conversations[0] as any).unreadCount).toBe(2);
    });
  });

  describe('markMessagesAsRead', () => {
    it('should throw if user is not a participant', async () => {
      const conv = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });
      const maliciousUserId = new mongoose.Types.ObjectId().toString();

      await expect(markMessagesAsRead(conv._id.toString(), maliciousUserId)).rejects.toThrow('Forbidden: You are not a participant in this conversation');
    });

    it('should mark unread messages as read', async () => {
      const u1 = await User.create({ username: 'u1', email: 'u1@test.com', status: 'Active' });
      const u2 = await User.create({ username: 'u2', email: 'u2@test.com', status: 'Active' });

      const conv = await Conversation.create({
        participants: [u1._id, u2._id],
        type: 'customer-owner',
        relatedBooking: new mongoose.Types.ObjectId()
      });

      const msg1 = await Message.create({ conversationId: conv._id, senderId: u2._id, content: 'unread1', readBy: [u2._id] });

      await markMessagesAsRead(conv._id.toString(), u1._id.toString());

      const updatedMsg1 = await Message.findById(msg1._id);
      expect(updatedMsg1?.readBy.map(id => id.toString())).toContain(u1._id.toString());
    });
  });

});
