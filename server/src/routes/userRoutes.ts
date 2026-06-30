import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  banUser,
  unbanUser,
  getFavoriteVehicles, 
  addFavoriteVehicle, 
  removeFavoriteVehicle
} from '../controllers/userController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use('/favorites', authMiddleware as any); 

router.route('/favorites')
  .get(getFavoriteVehicles as any)   // Lấy danh sách xe yêu thích cá nhân
  .post(addFavoriteVehicle as any);   // Thêm một xe vào danh sách yêu thích

router.delete('/favorites/:vehicleId', removeFavoriteVehicle as any); // Xóa xe khỏi danh sách yêu thích

// Secure all userRoutes - only Admin role can access
router.use(authMiddleware as any, restrictTo('Admin') as any);

router.route('/')
  .get(getAllUsers as any)
  .post(createUser as any);

router.route('/:id')
  .get(getUserById as any)
  .put(updateUser as any);

router.put('/:id/ban', banUser as any);
router.put('/:id/unban', unbanUser as any);


export default router;
