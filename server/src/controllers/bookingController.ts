import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking, IBooking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { Discount } from '../models/Discount.js';
import { Notification } from '../models/Notification.js';
import {
  sendBookingCreatedEmail,
  sendNewBookingAlertToOwnerEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail
} from '../utils/emailService.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import {
  validateBookingInput,
  validateUpdateBooking,
  validateCancellation,
  checkVehicleAvailability,
  generateBookingCode,
  calculateTotalAmount
} from '../validators/bookingValidation.js';
import { checkLowAvailabilityAlert } from './vehicleController.js';

// ============================================
// 1. CREATE BOOKING
// ============================================
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập trước khi đặt chỗ' });
    }

    const { vehicleId, pickupDateTime, returnDateTime, pickupLocation, returnLocation, promoCode } = req.body;

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
    let initialTotalAmount = calculateTotalAmount(vehicle.rentalPrice, rentalDays);

    let discountId = undefined;
    let discountAmount = 0;
    let promoCodeUsed = undefined;

    // Áp dụng promo code nếu có
    if (promoCode) {
      const cleanCode = promoCode.trim().toUpperCase().replace(/\s+/g, '');
      const discount = await Discount.findOne({ voucherCode: cleanCode });
      
      if (!discount) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá không tồn tại' });
      }

      if (!discount.isActive) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá hiện không hoạt động' });
      }

      const now = new Date();
      if (now < discount.startDate) {
        return res.status(400).json({ 
          success: false, 
          message: `Mã giảm giá chưa bắt đầu (Bắt đầu từ: ${discount.startDate.toLocaleDateString('vi-VN')})` 
        });
      }
      if (now > discount.endDate) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn sử dụng' });
      }

      if (discount.usageLimit !== undefined && discount.usedCount >= discount.usageLimit) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
      }

      const alreadyUsed = user.usedVouchers.some(v => v.discountId.toString() === discount._id.toString());
      if (alreadyUsed) {
        return res.status(400).json({ success: false, message: 'Tài khoản của bạn đã sử dụng mã giảm giá này' });
      }

      if (discount.minOrderAmount && initialTotalAmount < discount.minOrderAmount) {
        return res.status(400).json({ 
          success: false, 
          message: `Mã giảm giá yêu cầu đơn hàng tối thiểu ${discount.minOrderAmount.toLocaleString()} VNĐ` 
        });
      }

      // Tính toán tiền giảm
      if (discount.discountType === 'FixedAmount') {
        discountAmount = discount.discountValue;
      } else if (discount.discountType === 'Percentage') {
        discountAmount = Math.floor((initialTotalAmount * discount.discountValue) / 100);
        if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
          discountAmount = discount.maxDiscountAmount;
        }
      }

      if (discountAmount > initialTotalAmount) {
        discountAmount = initialTotalAmount;
      }

      discountId = discount._id as any;
      promoCodeUsed = discount.voucherCode;
    }

    const totalAmount = initialTotalAmount - discountAmount;

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
      surcharges: [],
      discountId,
      discountAmount,
      promoCodeUsed
    });

    const savedBooking = await newBooking.save();

    // Ghi nhận lượt sử dụng khuyến mãi
    if (discountId) {
      await Discount.findByIdAndUpdate(discountId, { $inc: { usedCount: 1 } });
      await User.findByIdAndUpdate(userId, {
        $push: {
          usedVouchers: {
            discountId,
            usedAt: new Date(),
            bookingId: savedBooking._id
          }
        }
      });
    }

    // Populate references
    await savedBooking.populate('userId', 'firstName lastName email phoneNumber');
    await savedBooking.populate('vehicleId', 'vehicleModel licensePlate rentalPrice');

    // Gửi thông báo & email (In-app & SMTP)
    try {
      const emailDetails = {
        bookingCode: savedBooking.bookingCode,
        vehicleName: savedBooking.vehicleSnapshot.name,
        pickupDateTime: savedBooking.pickupDateTime,
        returnDateTime: savedBooking.returnDateTime,
        pickupLocation: savedBooking.pickupLocation?.address || 'Nhận tại cửa hàng',
        totalAmount: savedBooking.totalAmount,
        rentalDays,
        discountAmount: savedBooking.discountAmount
      };

      // 1. Tạo thông báo in-app cho khách hàng
      await Notification.create({
        userId: userId,
        title: 'Đơn đặt xe mới đang chờ duyệt',
        message: `Đơn đặt xe ${savedBooking.bookingCode} của bạn đã được tạo thành công và đang chờ duyệt.`,
        type: 'BookingPending',
        relatedId: savedBooking._id
      });

      // 2. Tìm chủ xe để tạo thông báo in-app & gửi email
      const owner = await User.findById(vehicle.ownerId);
      if (owner) {
        await Notification.create({
          userId: owner._id,
          title: 'Yêu cầu duyệt đơn đặt xe mới',
          message: `Bạn có đơn đặt xe mới ${savedBooking.bookingCode} đang chờ duyệt.`,
          type: 'BookingPending',
          relatedId: savedBooking._id
        });

        if (owner.email) {
          sendNewBookingAlertToOwnerEmail(owner.email, emailDetails).catch(err => 
            console.error('Lỗi khi gửi email thông báo cho chủ xe:', err)
          );
        }
      }

      // 3. Gửi email xác nhận cho khách hàng
      if (savedBooking.userId && (savedBooking.userId as any).email) {
        sendBookingCreatedEmail((savedBooking.userId as any).email, emailDetails).catch(err =>
          console.error('Lỗi khi gửi email xác nhận cho khách hàng:', err)
        );
      }
    } catch (notiError) {
      console.error('Lỗi khi tạo thông báo đặt xe:', notiError);
    }

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
        discountAmount: savedBooking.discountAmount,
        promoCodeUsed: savedBooking.promoCodeUsed,
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
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];
    const isAdminOrStaff = userRoles.includes('Admin') || userRoles.includes('Staff');
    const isOwner = userRoles.includes('Owner');
    
    // Allow Admin, Staff, and Owner to view bookings
    if (!isAdminOrStaff && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem danh sách đơn hàng'
      });
    }

    const { status, vehicleId, userId: queryUserId, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    let query: any = {};
    if (status) query.status = status;
    if (vehicleId) query.vehicleId = vehicleId;
    if (queryUserId) query.userId = queryUserId;

    // For Owner: Restrict to bookings associated with the Owner's vehicles
    if (isOwner && !isAdminOrStaff) {
      const myVehicles = await Vehicle.find({ ownerId: userId }, '_id');
      const myVehicleIds = myVehicles.map(v => v._id);
      
      if (vehicleId) {
        // If owner requests a specific vehicle, ensure they own it
        const hasAccess = myVehicleIds.some(id => id.toString() === vehicleId.toString());
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem thông tin của xe này'
          });
        }
      } else {
        query.vehicleId = { $in: myVehicleIds };
      }
    }

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
      // Check low availability alert in background (non-blocking)
      checkLowAvailabilityAlert(booking.vehicleSnapshot.name, (booking.vehicleId as any).ownerId).catch(err => 
        console.error('Error running checkLowAvailabilityAlert in booking confirmed:', err)
      );
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

    // Gửi thông báo & email sau khi cập nhật trạng thái (In-app & SMTP)
    try {
      const customer = await User.findById(updatedBooking.userId);
      if (customer) {
        const pickupDate = new Date(updatedBooking.pickupDateTime);
        const returnDate = new Date(updatedBooking.returnDateTime);
        const rentalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

        const emailDetails = {
          bookingCode: updatedBooking.bookingCode,
          vehicleName: updatedBooking.vehicleSnapshot?.name || 'Xe máy',
          pickupDateTime: updatedBooking.pickupDateTime,
          returnDateTime: updatedBooking.returnDateTime,
          pickupLocation: updatedBooking.pickupLocation?.address || 'Nhận tại cửa hàng',
          totalAmount: updatedBooking.totalAmount,
          rentalDays,
          discountAmount: updatedBooking.discountAmount,
          cancelReason: notes || 'Đã bị hủy bởi Chủ xe / Quản trị viên'
        };

        if (status === 'Confirmed') {
          // Tạo thông báo in-app
          await Notification.create({
            userId: customer._id,
            title: 'Đơn đặt xe được phê duyệt',
            message: `Chúc mừng! Đơn đặt xe ${updatedBooking.bookingCode} của bạn đã được phê duyệt thành công.`,
            type: 'BookingConfirmed',
            relatedId: updatedBooking._id
          });

          // Gửi email
          if (customer.email) {
            sendBookingConfirmedEmail(customer.email, emailDetails).catch(err => 
              console.error('Lỗi khi gửi email xác nhận duyệt xe:', err)
            );
          }
        } else if (status === 'Cancelled') {
          // Tạo thông báo in-app
          await Notification.create({
            userId: customer._id,
            title: 'Đơn đặt xe bị hủy',
            message: `Rất tiếc! Đơn đặt xe ${updatedBooking.bookingCode} của bạn đã bị hủy bỏ. Lý do: ${notes || 'Chủ xe từ chối duyệt'}`,
            type: 'BookingCancelled',
            relatedId: updatedBooking._id
          });

          // Gửi email
          if (customer.email) {
            sendBookingCancelledEmail(customer.email, emailDetails).catch(err =>
              console.error('Lỗi khi gửi email hủy đặt xe:', err)
            );
          }
        }
      }
    } catch (notiError) {
      console.error('Lỗi khi gửi thông báo cập nhật booking:', notiError);
    }

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

    // Gửi thông báo & email sau khi hủy booking (In-app & SMTP)
    try {
      const customer = await User.findById(cancelledBooking.userId);
      const owner = await User.findById((booking.vehicleId as any).ownerId);

      const pickupDate = new Date(cancelledBooking.pickupDateTime);
      const returnDate = new Date(cancelledBooking.returnDateTime);
      const rentalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

      const emailDetails = {
        bookingCode: cancelledBooking.bookingCode,
        vehicleName: cancelledBooking.vehicleSnapshot?.name || 'Xe máy',
        pickupDateTime: cancelledBooking.pickupDateTime,
        returnDateTime: cancelledBooking.returnDateTime,
        pickupLocation: cancelledBooking.pickupLocation?.address || 'Nhận tại cửa hàng',
        totalAmount: cancelledBooking.totalAmount,
        rentalDays,
        discountAmount: cancelledBooking.discountAmount,
        cancelReason: cancelReason || 'Đã bị hủy bởi khách hàng hoặc quản trị viên'
      };

      // 1. Thông báo cho khách hàng
      if (customer) {
        await Notification.create({
          userId: customer._id,
          title: 'Hủy đơn đặt xe thành công',
          message: `Đơn đặt xe ${cancelledBooking.bookingCode} của bạn đã được hủy thành công. Lý do: ${cancelReason || 'Người dùng yêu cầu hủy'}`,
          type: 'BookingCancelled',
          relatedId: cancelledBooking._id
        });

        if (customer.email) {
          sendBookingCancelledEmail(customer.email, emailDetails).catch(err =>
            console.error('Lỗi khi gửi email hủy đơn cho khách hàng:', err)
          );
        }
      }

      // 2. Thông báo cho chủ xe
      if (owner) {
        await Notification.create({
          userId: owner._id,
          title: 'Đơn đặt xe đã bị hủy',
          message: `Đơn đặt xe ${cancelledBooking.bookingCode} liên quan đến xe của bạn đã bị hủy. Lý do: ${cancelReason || 'Khách hàng yêu cầu hủy'}`,
          type: 'BookingCancelled',
          relatedId: cancelledBooking._id
        });
      }
    } catch (notiError) {
      console.error('Lỗi khi gửi thông báo hủy booking:', notiError);
    }

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
