import { Router } from 'express';
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected routes (Only Admin and Staff)
const staffOrAdmin = [authMiddleware, restrictTo('Admin', 'Staff')];
router.post('/', staffOrAdmin as any, createCategory as any);
router.put('/:id', staffOrAdmin as any, updateCategory as any);
router.delete('/:id', staffOrAdmin as any, deleteCategory as any);

export default router;
