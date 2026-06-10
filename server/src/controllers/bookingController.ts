import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking, IBooking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import {
  validateBookingInput,
  validateUpdateBooking,
  validateCancellation,
  checkVehicleAvailability,
  generateBookingCode,
  calculateTotalAmount
} from '../validators/bookingValidation.js';

// ============================================
// 1. CREATE BOOKING
// ============================================
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập trước khi đặt chỗ' });
    }

    const { vehicleId, pickupDateTime, returnDateTime, pickupLocation, returnLocation } = req.body;

    // Validate input
    const validation = validateBookingInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Check vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Xe không tồn tại' });
    }

    // Check vehicle is available
    const isAvailable = await checkVehicleAvailability(vehicleId, pickupDateTime, returnDateTime);
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Xe này không có sẵn trong khoảng thời gian được chọn. Vui lòng chọn thời gian khác.' 
      });
    }

    // Check vehicle status
    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Xe hiện không khả dụng (Trạng thái: ${vehicle.status})`
      });
    }

    // Calculate total amount
    const pickupDate = new Date(pickupDateTime);
    const returnDate = new Date(returnDateTime);
    const rentalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = calculateTotalAmount(vehicle.rentalPrice, rentalDays);

    // Create vehicle snapshot
    const vehicleSnapshot = {
      name: vehicle.vehicleModel,
      image: vehicle.imageUrls?.[0] || '',
      rentalPrice: vehicle.rentalPrice
    };

    // Generate booking code
    const bookingCode = generateBookingCode();

    // Create booking document
    const newBooking = new Booking({
      userId,
      vehicleId,
      vehicleSnapshot,
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
      pickupLocation: pickupLocation || { coordinates: [0, 0] },
      returnLocation: returnLocation || { coordinates: [0, 0] },
      totalAmount,
      status: 'Pending',
      bookingCode,
      surcharges: []
    });

    const savedBooking = await newBooking.save();

    // Populate references
    await savedBooking.populate('userId', 'firstName lastName email phoneNumber');
    await savedBooking.populate('vehicleId', 'vehicleModel licensePlate rentalPrice');

    res.status(201).json({
      success: true,
      message: 'Đặt chỗ thành công. Vui lòng chờ xác nhận từ chủ xe.',
      booking: {
        id: savedBooking._id,
        bookingCode: savedBooking.bookingCode,
        vehicleModel: savedBooking.vehicleSnapshot.name,
        pickupDateTime: savedBooking.pickupDateTime,
        returnDateTime: savedBooking.returnDateTime,
        totalAmount: savedBooking.totalAmount,
        status: savedBooking.status,
        rentalDays,
        message: '⏳ Đợi chủ xe xác nhận. Bạn sẽ nhận được thông báo khi được phê duyệt.'
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi tạo booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi tạo đặt chỗ',
      error: error.message
    });
  }
};

// ============================================
// 2. GET BOOKING BY ID
// ============================================
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    const booking = await Booking.findById(id)
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl')
      .populate('vehicleId', 'vehicleModel licensePlate rentalPrice category');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }

    // Authorization: only owner, admin, staff, or vehicle owner can view
    const isOwner = booking.userId._id.toString() === userId;
    const userRoles = req.user?.roles || [];
    const isStaffOrAdmin = userRoles.includes('Staff') || userRoles.includes('Admin');
    const isVehicleOwner = await checkIfVehicleOwner(booking.vehicleId._id as any, userId);

    if (!isOwner && !isStaffOrAdmin && !isVehicleOwner) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem booking này' });
    }

    res.status(200).json({
      success: true,
      booking: formatBookingResponse(booking)
    });

  } catch (error: any) {
    console.error('Lỗi khi lấy booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi lấy thông tin booking',
      error: error.message
    });
  }
};

// ============================================
// 3. GET ALL BOOKINGS BY USER
// ============================================
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    let query: any = { userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'vehicleModel licensePlate rentalPrice category imageUrls')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings: bookings.map(formatBookingResponse),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalBookings: total,
        bookingsPerPage: limitNum
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi lấy bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi lấy danh sách booking',
      error: error.message
    });
  }
};

// ============================================
// 4. GET ALL BOOKINGS (ADMIN/STAFF)
// ============================================
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userRoles = req.user?.roles || [];
    
    // Only Admin and Staff can view all bookings
    if (!userRoles.includes('Admin') && !userRoles.includes('Staff')) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem tất cả bookings'
      });
    }

    const { status, vehicleId, userId, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    let query: any = {};
    if (status) query.status = status;
    if (vehicleId) query.vehicleId = vehicleId;
    if (userId) query.userId = userId;

    const bookings = await Booking.find(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('vehicleId', 'vehicleModel licensePlate rentalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings: bookings.map(formatBookingResponse),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalBookings: total,
        bookingsPerPage: limitNum
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi lấy tất cả bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      error: error.message
    });
  }
};

// ============================================
// 5. UPDATE BOOKING (Status Changes)
// ============================================
export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    // Get booking
    const booking = await Booking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking không tồn tại' });
    }

    // Authorization: Owner, Admin, or Staff
    const isVehicleOwner = await checkIfVehicleOwner(booking.vehicleId._id as any, userId);
    const isAdmin = userRoles.includes('Admin');
    const isStaff = userRoles.includes('Staff');

    if (!isVehicleOwner && !isAdmin && !isStaff) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật booking này' });
    }

    // Validate status transition
    const validation = validateUpdateBooking(booking.status, status);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Update vehicle status based on booking status
    if (status === 'Confirmed') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, { status: 'Rented' });
    } else if (status === 'Completed' || status === 'Cancelled') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, { status: 'Available' });
    }

    // Update booking
    booking.status = status as any;
    if (notes) {
      booking.surcharges.push({
        surchargeType: 'Ghi chú từ chủ xe',
        amount: 0,
        description: notes,
        isPaid: true,
        createdAt: new Date()
      });
    }

    const updatedBooking = await booking.save();

    res.status(200).json({
      success: true,
      message: `Cập nhật booking sang trạng thái "${getStatusLabel(status)}" thành công`,
      booking: formatBookingResponse(updatedBooking)
    });

  } catch (error: any) {
    console.error('Lỗi khi cập nhật booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi cập nhật booking',
      error: error.message
    });
  }
};

// ============================================
// 6. CANCEL BOOKING
// ============================================
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    const userId = req.user?.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    const booking = await Booking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking không tồn tại' });
    }

    // Authorization: Only booking owner or admin can cancel
    const isOwner = booking.userId.toString() === userId;
    const isAdmin = req.user?.roles?.includes('Admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy booking này' });
    }

    // Validate cancellation
    const validation = validateCancellation(booking.status);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    // Update booking
    booking.status = 'Cancelled';
    booking.cancelReason = cancelReason || 'Người dùng yêu cầu hủy';

    // Release vehicle
    await Vehicle.findByIdAndUpdate(booking.vehicleId._id, { status: 'Available' });

    const cancelledBooking = await booking.save();

    res.status(200).json({
      success: true,
      message: '❌ Booking đã bị hủy thành công',
      booking: formatBookingResponse(cancelledBooking)
    });

  } catch (error: any) {
    console.error('Lỗi khi hủy booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi hủy booking',
      error: error.message
    });
  }
};

// ============================================
// 7. DELETE BOOKING (Admin only)
// ============================================
export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRoles = req.user?.roles || [];

    // Only Admin can delete
    if (!userRoles.includes('Admin')) {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có thể xóa booking' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking không tồn tại' });
    }

    // Release vehicle if needed
    if (booking.status === 'Confirmed' || booking.status === 'Ongoing') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, { status: 'Available' });
    }

    await Booking.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: '✓ Booking đã bị xóa khỏi hệ thống'
    });

  } catch (error: any) {
    console.error('Lỗi khi xóa booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi xóa booking',
      error: error.message
    });
  }
};

// ============================================
// 8. GET BOOKINGS BY VEHICLE
// ============================================
export const getBookingsByVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

    // Check authorization
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Xe không tồn tại' });
    }

    const isOwner = vehicle.ownerId.toString() === userId;
    const isAdmin = userRoles.includes('Admin');
    const isStaff = userRoles.includes('Staff');

    if (!isOwner && !isAdmin && !isStaff) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bookings của xe này' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    let query: any = { vehicleId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings: bookings.map(formatBookingResponse),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalBookings: total,
        bookingsPerPage: limitNum
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi lấy bookings theo vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Kiểm tra xem user có phải chủ sở hữu xe không
 */
async function checkIfVehicleOwner(vehicleId: any, userId?: string): Promise<boolean> {
  if (!userId) return false;
  const vehicle = await Vehicle.findById(vehicleId);
  return vehicle?.ownerId.toString() === userId;
}

/**
 * Format response booking
 */
function formatBookingResponse(booking: any) {
  const pickupDate = new Date(booking.pickupDateTime);
  const returnDate = new Date(booking.returnDateTime);
  const rentalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: booking._id,
    bookingCode: booking.bookingCode,
    userId: booking.userId?._id || booking.userId,
    userName: booking.userId?.firstName ? `${booking.userId.lastName} ${booking.userId.firstName}` : 'N/A',
    userEmail: booking.userId?.email,
    userPhone: booking.userId?.phoneNumber,
    vehicleId: booking.vehicleId?._id || booking.vehicleId,
    vehicleModel: booking.vehicleSnapshot?.name || 'N/A',
    vehicleImage: booking.vehicleSnapshot?.image,
    pickupDateTime: booking.pickupDateTime,
    returnDateTime: booking.returnDateTime,
    pickupLocation: booking.pickupLocation,
    returnLocation: booking.returnLocation,
    rentalDays,
    totalAmount: booking.totalAmount,
    status: booking.status,
    statusLabel: getStatusLabel(booking.status),
    surcharges: booking.surcharges,
    cancelReason: booking.cancelReason,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
}

/**
 * Get Vietnamese label for status
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'Pending': '⏳ Chờ xác nhận',
    'Confirmed': '✓ Đã xác nhận',
    'Ongoing': '🚴 Đang cho thuê',
    'Completed': '✓ Hoàn tất',
    'Cancelled': '❌ Đã hủy'
  };
  return labels[status] || status;
}

export default {
  createBooking,
  getBookingById,
  getMyBookings,
  getAllBookings,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getBookingsByVehicle
};
