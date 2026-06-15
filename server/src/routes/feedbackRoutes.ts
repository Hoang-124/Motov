import { Router } from 'express';
import {
  createFeedback,
  getVehicleFeedbacks,
  getAllFeedbacksForAdmin,
  blockFeedback,
  unblockFeedback
} from '../controllers/feedbackController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Public route to get vehicle reviews
router.get('/vehicle/:vehicleId', getVehicleFeedbacks as any);

// Protected route to write review (requires authentication)
router.post('/', authMiddleware as any, createFeedback as any);

// Admin moderation routes (requires authentication & Admin role)
router.get('/admin', authMiddleware as any, restrictTo('Admin') as any, getAllFeedbacksForAdmin as any);
router.put('/:id/block', authMiddleware as any, restrictTo('Admin') as any, blockFeedback as any);
router.put('/:id/unblock', authMiddleware as any, restrictTo('Admin') as any, unblockFeedback as any);

export default router;
