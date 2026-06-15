import { Router } from 'express';
import { confirmCODPaymentByStaff } from '../controllers/paymentController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Bắt buộc tất cả các request đi qua route này đều phải thực hiện authenticate trước
router.use(authMiddleware as any);

/**
 * PUT /api/staff/payments/:id/confirm
 * Staff xác nhận đã thu tiền mặt (Cash) trực tiếp từ khách hàng
 * Access: Staff, Admin
 */
router.put(
  '/staff/payments/:id/confirm', 
  restrictTo('Staff', 'Admin') as any, 
  confirmCODPaymentByStaff as any
);

export default router;