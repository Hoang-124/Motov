import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  streamNotifications
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Yêu cầu đăng nhập cho tất cả các endpoint thông báo
router.use(authMiddleware as any);

router.get('/stream', streamNotifications as any);
router.get('/', getMyNotifications as any);
router.put('/read-all', markAllAsRead as any);
router.delete('/', deleteAllNotifications as any);
router.put('/:id/read', markAsRead as any);
router.delete('/:id', deleteNotification as any);

export default router;
