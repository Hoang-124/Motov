import { Router } from 'express';
import { sendMessage, getMessages, getConversations, getUserBasicInfo } from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Tất cả các route chat đều yêu cầu xác thực người dùng (Authentication)
router.use(authMiddleware as any);

router.post('/', sendMessage as any);
router.get('/conversations', getConversations as any);
router.get('/user/:id', getUserBasicInfo as any);
router.get('/:partnerId', getMessages as any);

export default router;
