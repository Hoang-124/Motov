import { Router, Request } from 'express';
import { 
  getAllVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  getOwnerVehicles,
  updateVehicleStatus,
  resetMaintenance,
  getRecommendations,
  getNearbyVehicles
} from '../controllers/vehicleController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

interface AuthRequest extends Request {
  userId?: string;
}

const router = Router();

// Public routes (no auth required)
router.get('/recommendations', getRecommendations as any);
router.get('/nearby', getNearbyVehicles as any);
router.get('/', getAllVehicles as any);
router.get('/:id', getVehicleById as any);

// Owner-specific routes
router.get('/owner/:ownerId', getOwnerVehicles as any);

// Protected routes (authentication required)
router.post('/', authMiddleware as any, createVehicle as any);
router.put('/:id', authMiddleware as any, updateVehicle as any);
router.put('/:id/maintenance-reset', authMiddleware as any, resetMaintenance as any);
router.delete('/:id', authMiddleware as any, deleteVehicle as any);
router.patch('/:id/status', authMiddleware as any, updateVehicleStatus as any);

export default router;
