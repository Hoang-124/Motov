import { Router } from 'express';
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  updateStock
} from '../controllers/inventoryController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all inventory routes (Admin and Staff only)
router.use(authMiddleware as any);
router.use(restrictTo('Admin', 'Staff') as any);

router.get('/', getAllInventory as any);
router.get('/:id', getInventoryById as any);
router.post('/', createInventory as any);
router.put('/:id', updateInventory as any);
router.delete('/:id', deleteInventory as any);
router.patch('/:id/stock', updateStock as any);

export default router;
