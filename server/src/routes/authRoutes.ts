import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  getMe,
  becomeOwner,
  updateProfile,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  resetPasswordPhone,
  verifyEmail,
  checkVerificationStatus,
  getOwnerRequests,
  approveOwnerRequest,
  rejectOwnerRequest
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password-phone', resetPasswordPhone);
router.post('/verify-email', verifyEmail);
router.get('/check-verification-status', checkVerificationStatus);

router.get('/me', authMiddleware as any, getMe as any);
router.put('/profile', authMiddleware as any, updateProfile as any);
router.post('/change-password', authMiddleware as any, changePassword as any);
router.post('/become-owner', authMiddleware as any, becomeOwner as any);

// Tuyển dụng & Phê duyệt Đối tác (Owner Requests)
router.get('/owner-requests', authMiddleware as any, getOwnerRequests as any);
router.put('/owner-requests/:id/approve', authMiddleware as any, approveOwnerRequest as any);
router.put('/owner-requests/:id/reject', authMiddleware as any, rejectOwnerRequest as any);

export default router;
