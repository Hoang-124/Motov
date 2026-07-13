import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as chatController from '../controllers/chatController.js';
import * as chatService from '../services/chatService.js';

vi.mock('../services/chatService.js');

const createMockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('chatController - Unit Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversationController', () => {
    it('should return 401 if user is not authenticated', async () => {
      const req: any = { body: {} };
      const res = createMockRes();

      await chatController.createConversationController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
      const req: any = { user: { id: 'u1' }, body: {} };
      const res = createMockRes();

      await chatController.createConversationController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing required fields' });
    });

    it('should return 200 and conversation if successful', async () => {
      const req: any = { user: { id: 'u1' }, body: { partnerId: 'u2', relatedBookingId: 'b1', type: 'customer-owner' } };
      const res = createMockRes();
      const mockConv = { _id: 'c1' };

      vi.mocked(chatService.createOrGetConversation).mockResolvedValue(mockConv as any);

      await chatController.createConversationController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockConv });
    });

    it('should return 400 on service error', async () => {
      const req: any = { user: { id: 'u1' }, body: { partnerId: 'u2', relatedBookingId: 'b1', type: 'customer-owner' } };
      const res = createMockRes();
      
      vi.mocked(chatService.createOrGetConversation).mockRejectedValue(new Error('Service Error'));

      await chatController.createConversationController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Service Error' });
    });
  });

  describe('sendMessageController', () => {
    it('should return 401 if unauthorized', async () => {
      const req: any = { body: {} };
      const res = createMockRes();
      await chatController.sendMessageController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if missing content', async () => {
      const req: any = { user: { id: 'u1' }, body: { conversationId: 'c1' } };
      const res = createMockRes();
      await chatController.sendMessageController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 201 on success', async () => {
      const req: any = { user: { id: 'u1' }, body: { conversationId: 'c1', content: 'hello' } };
      const res = createMockRes();
      const mockMessage = { _id: 'm1', content: 'hello' };
      vi.mocked(chatService.sendMessage).mockResolvedValue(mockMessage as any);

      await chatController.sendMessageController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMessage });
    });
  });

  describe('getUserConversationsController', () => {
    it('should return 401 if unauthorized', async () => {
      const req: any = { query: {} };
      const res = createMockRes();
      await chatController.getUserConversationsController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 200 with conversations', async () => {
      const req: any = { user: { id: 'u1' }, query: { skip: '0', limit: '10' } };
      const res = createMockRes();
      const mockConvs = [{ _id: 'c1' }];
      vi.mocked(chatService.getUserConversations).mockResolvedValue(mockConvs as any);

      await chatController.getUserConversationsController(req, res);

      expect(chatService.getUserConversations).toHaveBeenCalledWith('u1', 0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockConvs });
    });
  });

  describe('getConversationMessagesController', () => {
    it('should return 401 if unauthorized', async () => {
      const req: any = { params: { conversationId: 'c1' }, query: {} };
      const res = createMockRes();
      await chatController.getConversationMessagesController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 200 with messages', async () => {
      const req: any = { user: { id: 'u1' }, params: { conversationId: 'c1' }, query: { skip: '0', limit: '10' } };
      const res = createMockRes();
      const mockMsgs = [{ _id: 'm1' }];
      vi.mocked(chatService.getConversationMessages).mockResolvedValue(mockMsgs as any);

      await chatController.getConversationMessagesController(req, res);

      expect(chatService.getConversationMessages).toHaveBeenCalledWith('u1', 'c1', 0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMsgs });
    });
  });

  describe('markMessagesAsReadController', () => {
    it('should return 401 if unauthorized', async () => {
      const req: any = { params: { conversationId: 'c1' } };
      const res = createMockRes();
      await chatController.markMessagesAsReadController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 200 on success', async () => {
      const req: any = { user: { id: 'u1' }, params: { conversationId: 'c1' } };
      const res = createMockRes();
      vi.mocked(chatService.markMessagesAsRead).mockResolvedValue(undefined as any);

      await chatController.markMessagesAsReadController(req, res);

      expect(chatService.markMessagesAsRead).toHaveBeenCalledWith('c1', 'u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Messages marked as read' });
    });
  });

});
