import { Router } from 'express';
import { register, login, googleLogin, getMe, becomeOwner, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authMiddleware as any, getMe as any);
router.put('/profile', authMiddleware as any, updateProfile as any);
router.post('/become-owner', authMiddleware as any, becomeOwner as any);

export default router;
