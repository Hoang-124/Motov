import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as chatService from '../services/chatService.js';

export const createConversationController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { partnerId, relatedBookingId, relatedVehicleId, type } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!partnerId || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const conversation = await chatService.createOrGetConversation([userId, partnerId], type, relatedBookingId, relatedVehicleId);

    return res.status(200).json({ success: true, data: conversation });
  } catch (error: any) {
    console.error('Error in createConversationController:', error);
    return res.status(400).json({ success: false, message: error.message || 'Lỗi máy chủ nội bộ' });
  }
};

export const getUserBasicInfoController = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await chatService.getUserBasicInfo(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('Error in getUserBasicInfoController:', error);
    return res.status(400).json({ success: false, message: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
};

export const getUserConversationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const conversations = await chatService.getUserConversations(userId, skip, limit);

    return res.status(200).json({ success: true, data: conversations });
  } catch (error: any) {
    console.error('Error in getUserConversationsController:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getConversationMessagesController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await chatService.getConversationMessages(userId, conversationId, skip, limit);

    return res.status(200).json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Error in getConversationMessagesController:', error);
    return res.status(400).json({ success: false, message: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
};

export const sendMessageController = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { conversationId, content } = req.body;

    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!conversationId || !content) {
      return res.status(400).json({ success: false, message: 'Missing conversationId or content' });
    }

    const message = await chatService.sendMessage(conversationId, senderId, content);

    return res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    console.error('Error in sendMessageController:', error);
    return res.status(400).json({ success: false, message: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
};

export const markMessagesAsReadController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await chatService.markMessagesAsRead(conversationId, userId);

    return res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error: any) {
    console.error('Error in markMessagesAsReadController:', error);
    return res.status(400).json({ success: false, message: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
};
