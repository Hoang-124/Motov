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
  getBookingTracking,
  returnMotorbike
} from '../controllers/bookingController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes require authentication
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
router.get('/my-bookings', getMyBookings as any);

/**
 * GET /api/bookings/:id
 * Get booking by ID
 * Access: Booking owner, Vehicle owner, Admin, Staff
 */
router.get('/:id', getBookingById as any);

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
router.put('/:id/return', restrictTo('Admin', 'Staff') as any, returnMotorbike as any);

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

export default router;
