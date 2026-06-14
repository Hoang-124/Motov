import { Router } from 'express';
import {
  createPromotion,
  getAllPromotionsForAdmin,
  getActivePromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromoCode
} from '../controllers/promotionController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Public route: Lấy khuyến mãi đang chạy
router.get('/', getActivePromotions);

// Authenticated route: Kiểm tra tính hợp lệ của mã
router.post('/validate', authMiddleware as any, validatePromoCode as any);

// Admin-only routes: CRUD quản lý khuyến mãi
router.use(authMiddleware as any, restrictTo('Admin') as any);

router.get('/admin', getAllPromotionsForAdmin as any);

router.post('/', createPromotion as any);

router.route('/:id')
  .get(getPromotionById as any)
  .put(updatePromotion as any)
  .delete(deletePromotion as any);

export default router;
