import { Router } from 'express';
import {
  createBooking,
  getBookingById,
  getMyBookings,
  getAllBookings,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getBookingsByVehicle,
  confirmBookingByStaff,
  confirmBikePickupByStaff,
  getBookingTracking,
  returnMotorbike,
  createVNPayUrl,
  processVNPayIPN
} from '../controllers/bookingController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// VNPAY IPN webhook endpoints (No auth required for VNPAY server call)
router.get('/vnpay-ipn', processVNPayIPN as any);
router.post('/vnpay-ipn', processVNPayIPN as any);

// All other routes require authentication
router.use(authMiddleware as any);

// ============================================
// Customer Routes
// ============================================

/**
 * POST /api/bookings
 * Create new booking
 * Access: Customer, Owner
 */
router.post('/', createBooking as any);

/**
 * GET /api/bookings/my-bookings
 * Get all bookings of current user
 * Access: All authenticated users
 */
router.get('/my-bookings', getMyBookings as any); // Thằng này phải nằm TRÊN thằng /:id

/**
 * GET /api/bookings/:id
 * Get booking by ID
 * Access: Booking owner, Vehicle owner, Admin, Staff
 */
router.get('/:id', getBookingById as any); // Thằng động nhận ID này nằm dưới cùng của cụm GET

/**
 * PUT /api/bookings/:id
 * Update booking status (Confirm, Start, Complete)
 * Access: Vehicle owner, Admin, Staff
 */
router.put('/:id', updateBooking as any);

/**
 * POST /api/bookings/:id/cancel
 * Cancel booking
 * Access: Booking owner, Admin
 */
router.post('/:id/cancel', cancelBooking as any);

/**
 * GET /api/bookings/:id/tracking
 * Get tracking timeline for a booking
 * Access: Booking owner, Vehicle owner, Admin, Staff
 */
router.get('/:id/tracking', getBookingTracking as any);

/**
 * PUT /api/bookings/:id/return
 * Return motorbike and calculate late fees
 * Access: Admin, Staff
 */
router.put('/:id/return', restrictTo('Admin', 'Staff', 'Customer') as any, returnMotorbike as any);

/**
 * POST /api/bookings/:id/vnpay-url
 * Generate VNPAY payment URL
 */
router.post('/:id/vnpay-url', createVNPayUrl as any);

// ============================================
// Owner Routes
// ============================================

/**
 * GET /api/bookings/vehicle/:vehicleId
 * Get bookings for specific vehicle
 * Access: Vehicle owner, Admin, Staff
 */
router.get('/vehicle/:vehicleId', getBookingsByVehicle as any);

// ============================================
// Admin/Staff Routes
// ============================================

/**
 * GET /api/bookings (with filters)
 * Get all bookings (with optional filters)
 * Access: Admin, Staff
 * Query: status, vehicleId, userId, page, limit
 */
router.get('/', getAllBookings as any);

/**
 * DELETE /api/bookings/:id
 * Delete booking permanently
 * Access: Admin only
 */
router.delete('/:id', restrictTo('Admin') as any, deleteBooking as any);

/**
 * PUT /api/staff/bookings/:id/confirm
 * Staff thực hiện duyệt đơn đặt chỗ
 * Access: Staff, Admin
 */
router.put('/staff/bookings/:id/confirm', restrictTo('Staff', 'Admin') as any, confirmBookingByStaff as any);

/**
 * PUT /api/staff/bookings/:id/pickup
 * Staff xác nhận khách đã đến lấy xe thành công
 * Access: Staff, Admin
 */
// THÊM ĐOẠN NÀY:
router.put('/staff/bookings/:id/pickup', restrictTo('Staff', 'Admin') as any, confirmBikePickupByStaff as any);

export default router;
