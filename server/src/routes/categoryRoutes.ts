import { Router } from 'express';
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected routes (Only Admin and Staff)
router.post('/', authMiddleware as any, createCategory as any);
router.put('/:id', authMiddleware as any, updateCategory as any);
router.delete('/:id', authMiddleware as any, deleteCategory as any);

export default router;
