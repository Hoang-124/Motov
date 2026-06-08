import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  banUser,
  unbanUser
} from '../controllers/userController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

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
