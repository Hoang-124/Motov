import { Router } from 'express';
import { 
  createConversationController, 
  getUserConversationsController, 
  getConversationMessagesController, 
  sendMessageController, 
  markMessagesAsReadController,
  getUserBasicInfoController
} from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Tất cả các route chat đều yêu cầu xác thực người dùng (Authentication)
router.use(authMiddleware as any);

router.get('/users/:userId/basic-info', getUserBasicInfoController as any);
router.post('/conversations', createConversationController as any);
router.get('/conversations', getUserConversationsController as any);
router.get('/conversations/:conversationId/messages', getConversationMessagesController as any);
router.patch('/conversations/:conversationId/read', markMessagesAsReadController as any);
router.post('/messages', sendMessageController as any);

export default router;
