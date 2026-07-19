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
  rejectOwnerRequest,
  submitIdentityVerification,
  getIdentityRequests,
  approveIdentityRequest,
  rejectIdentityRequest,
  refreshAccessToken
} from '../controllers/authController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validateRequest(registerSchema) as any, register);
router.post('/login', validateRequest(loginSchema) as any, login);
router.post('/google', googleLogin);
router.post('/logout', authMiddleware as any, logout as any);
router.post('/refresh', refreshAccessToken);
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
router.get('/owner-requests', authMiddleware as any, restrictTo('Admin', 'Staff') as any, getOwnerRequests as any);
router.put('/owner-requests/:id/approve', authMiddleware as any, restrictTo('Admin', 'Staff') as any, approveOwnerRequest as any);
router.put('/owner-requests/:id/reject', authMiddleware as any, restrictTo('Admin', 'Staff') as any, rejectOwnerRequest as any);

// Xác minh danh tính khách hàng (eKYC)
router.post('/verify-identity', authMiddleware as any, submitIdentityVerification as any);
router.get('/identity-requests', authMiddleware as any, restrictTo('Admin', 'Staff') as any, getIdentityRequests as any);
router.put('/identity-requests/:id/approve', authMiddleware as any, restrictTo('Admin', 'Staff') as any, approveIdentityRequest as any);
router.put('/identity-requests/:id/reject', authMiddleware as any, restrictTo('Admin', 'Staff') as any, rejectIdentityRequest as any);

export default router;

