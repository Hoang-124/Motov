import { Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import { Booking, IBooking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { Discount } from '../models/Discount.js';
import { Notification } from '../models/Notification.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { handleBookingStatusTransitionReminders } from '../utils/bookingReminderScheduler.js';

// Helper to get system setting value by key with fallback to env
const getSettingVal = async (key: string, fallback: string): Promise<string> => {
  try {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value : fallback;
  } catch (e) {
    return fallback;
  }
};

export const refundVNPayPayment = async (booking: IBooking, amount: number, creatorEmail: string) => {
  try {
    const tmnCode = await getSettingVal('vnp_TmnCode', process.env.VNP_TMNCODE || '');
    const secretKey = await getSettingVal('vnp_HashSecret', process.env.VNP_HASHSECRET || '');
    const vnpUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    if (!tmnCode || !secretKey) {
      console.warn('[VNPAY Refund] Chưa cấu hình tmnCode hoặc secretKey, không thể hoàn tiền tự động');
      return false;
    }

    const date = new Date();
    const createDate = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');

    const originalDate = new Date(booking.updatedAt || booking.createdAt);
    const originalTxnDate = originalDate.getFullYear().toString() +
      (originalDate.getMonth() + 1).toString().padStart(2, '0') +
      originalDate.getDate().toString().padStart(2, '0') +
      originalDate.getHours().toString().padStart(2, '0') +
      originalDate.getMinutes().toString().padStart(2, '0') +
      originalDate.getSeconds().toString().padStart(2, '0');

    const requestId = `${booking._id.toString()}_${Date.now()}`;
    const txnRef = `${booking._id.toString()}`;

    const vnp_Params: any = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: tmnCode,
      vnp_TransactionType: '02',
      vnp_TxnRef: txnRef,
      vnp_Amount: amount * 100,
      vnp_OrderInfo: `Hoan tien coc don hang ${booking.bookingCode}`,
      vnp_TransactionNo: '0',
      vnp_TransactionDate: originalTxnDate,
      vnp_CreateBy: creatorEmail,
      vnp_CreateDate: createDate,
      vnp_IpAddr: '127.0.0.1',
    };

    const signData = [
      vnp_Params.vnp_RequestId,
      vnp_Params.vnp_Version,
      vnp_Params.vnp_Command,
      vnp_Params.vnp_TmnCode,
      vnp_Params.vnp_TransactionType,
      vnp_Params.vnp_TxnRef,
      vnp_Params.vnp_Amount,
      vnp_Params.vnp_TransactionNo,
      vnp_Params.vnp_TransactionDate,
      vnp_Params.vnp_CreateBy,
      vnp_Params.vnp_CreateDate,
      vnp_Params.vnp_IpAddr,
      vnp_Params.vnp_OrderInfo
    ].join('|');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    console.log('[VNPAY Refund] Đang gửi yêu cầu hoàn tiền tới VNPAY...', vnp_Params);
    const response = await axios.post(vnpUrl, vnp_Params);
    console.log('[VNPAY Refund] Kết quả từ VNPAY:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[VNPAY Refund] Lỗi khi gọi API hoàn tiền VNPAY:', error.message);
    return false;
  }
};

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
  calculateTotalAmount,
  calculateLateFees
} from '../validators/bookingValidation.js';
import { checkLowAvailabilityAlert } from './vehicleController.js';

// ============================================
// 1. CREATE BOOKING
// ============================================
/**
 * Create a new booking
 * @route POST /api/bookings
 * @param {AuthRequest} req - Express request object containing user and body
 * @param {Response} res - Express response object
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập trước khi đặt chỗ' });
    }

    const { vehicleId, pickupDateTime, returnDateTime, pickupLocation, returnLocation, promoCode, paymentMethod, deliveryMethod } = req.body;

    // Validate input
    const validation = validateBookingInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const pMethod = paymentMethod || 'Banking';
    const dMethod = deliveryMethod || 'StorePickup';

    if (pMethod === 'Cash' && dMethod !== 'StorePickup') {
      return res.status(400).json({
        success: false,
        message: 'Nếu thanh toán bằng tiền mặt, bạn bắt buộc phải nhận xe trực tiếp tại cửa hàng.'
      });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Kiểm tra xem người dùng đã xác minh danh tính chưa
    if (user.identityStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn chưa được xác minh danh tính (eKYC). Vui lòng xác thực danh tính tại trang cá nhân để đặt xe máy.'
      });
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
    const diffTime = returnDate.getTime() - pickupDate.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    // Nếu lố dưới 1 tiếng (hoặc số phút nhất định) thì không tính thêm ngày, tùy quy định của bạn
    const rentalDays = diffHours <= 24 ? 1 : Math.ceil(diffHours / 24);
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
    const depositAmount = Math.round(totalAmount * 0.3);
    const remainingAmount = totalAmount - depositAmount;

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
      depositAmount,
      remainingAmount,
      status: 'Pending',
      bookingCode,
      surcharges: [],
      paymentMethod: pMethod,
      deliveryMethod: dMethod,
      isPaid: false,
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

      // 2.5 Tìm tất cả Admin và Staff hoạt động để tạo thông báo in-app
      const adminsAndStaffs = await User.find({
        roles: { $in: ['Admin', 'Staff'] },
        status: 'Active'
      }, '_id');
      
      if (adminsAndStaffs && adminsAndStaffs.length > 0) {
        const notiPromises = adminsAndStaffs.map(userObj => {
          // Tránh gửi trùng cho chủ xe nếu chủ xe có cả role Admin/Staff
          if (owner && owner._id.toString() === userObj._id.toString()) return Promise.resolve();
          // Tránh gửi trùng cho khách hàng nếu họ có role Admin/Staff đang test
          if (userId.toString() === userObj._id.toString()) return Promise.resolve();
          
          return Notification.create({
            userId: userObj._id,
            title: 'Đơn đặt xe mới chờ duyệt',
            message: `Hệ thống nhận được đơn đặt xe mới ${savedBooking.bookingCode} đang chờ duyệt.`,
            type: 'BookingPending',
            relatedId: savedBooking._id
          });
        });
        await Promise.all(notiPromises).catch(err => 
          console.error('Lỗi khi tạo thông báo cho Admin/Staff:', err)
        );
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
        depositAmount: savedBooking.depositAmount,
        remainingAmount: savedBooking.remainingAmount,
        paymentMethod: savedBooking.paymentMethod,
        deliveryMethod: savedBooking.deliveryMethod,
        isPaid: savedBooking.isPaid,
        status: savedBooking.status,
        rentalDays,
        discountAmount: savedBooking.discountAmount,
        promoCodeUsed: savedBooking.promoCodeUsed,
        message: 'Đợi chủ xe xác nhận. Bạn sẽ nhận được thông báo khi được phê duyệt.'
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
/**
 * Get booking details by ID
 * @route GET /api/bookings/:id
 * @param {AuthRequest} req - Express request object containing params and user
 * @param {Response} res - Express response object
 */
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
    const bookingUserId = (booking.userId as any)._id?.toString() || booking.userId.toString();
    const isOwner = bookingUserId === userId;
    const userRoles = req.user?.roles || [];
    const isStaffOrAdmin = userRoles.includes('Staff') || userRoles.includes('Admin');
    const vehicleId = (booking.vehicleId as any)._id || booking.vehicleId;
    const isVehicleOwner = await checkIfVehicleOwner(vehicleId, userId);

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

    // Cho phép Admin, Staff và Owner truy cập
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

    // Lọc riêng cho dữ liệu của Owner: Chỉ hiển thị đơn của những xe do user này làm chủ
    if (isOwner && !isAdminOrStaff) {
      const myVehicles = await Vehicle.find({ ownerId: userId }, '_id');
      const myVehicleIds = myVehicles.map(v => v._id);

      if (vehicleId) {
        // Nếu Owner chủ động truyền lên một ID xe cụ thể, cần đảm bảo họ thực sự sở hữu xe đó
        const hasAccess = myVehicleIds.some(id => id.toString() === vehicleId.toString());
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem thông tin đơn hàng của chiếc xe này'
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

    const vehicleId = (booking.vehicleId as any)._id || booking.vehicleId;
    // Update vehicle status based on booking status
    if (status === 'Ongoing') {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: 'Rented' });
      await handleBookingStatusTransitionReminders(
        booking._id,
        'Ongoing',
        booking.pickupDateTime,
        booking.returnDateTime
      );
    } else if (status === 'Confirmed') {
      await handleBookingStatusTransitionReminders(
        booking._id,
        'Confirmed',
        booking.pickupDateTime,
        booking.returnDateTime
      );
      // Check low availability alert in background (non-blocking)
      checkLowAvailabilityAlert(booking.vehicleSnapshot.name, (booking.vehicleId as any).ownerId).catch(err => 
        console.error('Error running checkLowAvailabilityAlert in booking confirmed:', err)
      );
    } else if (status === 'Completed' || status === 'Cancelled') {
      // Kết thúc chuyến hoặc Huỷ đơn -> Xe rảnh lại
      await Vehicle.findByIdAndUpdate(vehicleId, { status: 'Available' });
      await handleBookingStatusTransitionReminders(
        booking._id,
        status,
        booking.pickupDateTime,
        booking.returnDateTime
      );
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
          // HOÀN TRẢ VOUCHER NẾU CÓ
          if (booking.discountId) {
            await Discount.findByIdAndUpdate(booking.discountId, { $inc: { usedCount: -1 } });
            await User.findByIdAndUpdate(booking.userId, {
              $pull: { usedVouchers: { bookingId: booking._id } }
            });
          }

          // Tự động hoàn cọc VNPAY nếu đã thanh toán
          if (updatedBooking.isPaid && updatedBooking.depositAmount && updatedBooking.depositAmount > 0) {
            const creatorEmail = req.user?.email || 'staff@motov.com';
            refundVNPayPayment(updatedBooking, updatedBooking.depositAmount, creatorEmail).catch(err => 
              console.error('Lỗi khi gọi API VNPAY Refund từ updateBooking:', err)
            );
          }

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

    // BỔ SUNG: Chặn khách hàng (isOwner) huỷ đơn sát giờ (dưới 6 tiếng)
    if (isOwner && !isAdmin) {
      const now = new Date();
      const pickupTime = new Date(booking.pickupDateTime);
      const hoursRemaining = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursRemaining < 6) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy đơn đặt xe do đã sát giờ nhận xe (Yêu cầu hủy trước tối thiểu 6 tiếng).'
        });
      }
    }

    // HOÀN TRẢ VOUCHER NẾU KHÁCH TỰ HỦY
    if (booking.discountId) {
      await Discount.findByIdAndUpdate(booking.discountId, { $inc: { usedCount: -1 } });
      await User.findByIdAndUpdate(booking.userId, {
        $pull: { usedVouchers: { bookingId: booking._id } }
      });
    }

    // Update booking
    booking.status = 'Cancelled';
    booking.cancelReason = cancelReason || 'Người dùng yêu cầu hủy';

    // Release vehicle (Sửa lỗi ép kiểu tài liệu đã populate)
    const vehicleId = (booking.vehicleId as any)._id || booking.vehicleId;
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'Available' });

    const cancelledBooking = await booking.save();

    // Tự động hoàn cọc VNPAY nếu khách hàng đã thanh toán
    if (cancelledBooking.isPaid && cancelledBooking.depositAmount && cancelledBooking.depositAmount > 0) {
      const creatorEmail = req.user?.email || 'customer@motov.com';
      refundVNPayPayment(cancelledBooking, cancelledBooking.depositAmount, creatorEmail).catch(err =>
        console.error('Lỗi khi gọi API VNPAY Refund từ cancelBooking:', err)
      );
    }

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
      message: 'Booking đã bị hủy thành công',
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
      message: 'Booking đã bị xóa khỏi hệ thống'
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
// 9. GET BOOKING TRACKING
// ============================================
/**
 * Get tracking timeline for a booking
 * @route GET /api/bookings/:id/tracking
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 */
export const getBookingTracking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    const booking = await Booking.findById(id).populate('vehicleId', 'ownerId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }

    const isOwner = booking.userId.toString() === userId;
    const userRoles = req.user?.roles || [];
    const isStaffOrAdmin = userRoles.includes('Staff') || userRoles.includes('Admin');
    
    // Type assert vehicle to access ownerId
    const vehicle = booking.vehicleId as any;
    const isVehicleOwner = vehicle?.ownerId?.toString() === userId;

    if (!isOwner && !isStaffOrAdmin && !isVehicleOwner) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin booking này' });
    }

    const timeline = [
      {
        title: 'Booking Created',
        time: booking.createdAt,
        status: 'Pending',
        completed: true
      },
      {
        title: 'Scheduled Pickup',
        time: booking.pickupDateTime,
        status: booking.status === 'Cancelled' ? 'Cancelled' : 'Ongoing',
        completed: booking.status === 'Ongoing' || booking.status === 'Completed'
      },
      {
        title: 'Scheduled Return',
        time: booking.returnDateTime,
        status: 'Completed',
        completed: booking.status === 'Completed'
      }
    ];

    res.status(200).json({
      success: true,
      tracking: {
        bookingId: booking._id,
        currentStatus: booking.status,
        updatedAt: booking.updatedAt,
        surcharges: booking.surcharges,
        cancelReason: booking.cancelReason,
        timeline
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy tracking:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

// ============================================
// 10. RETURN MOTORBIKE
// ============================================
/**
 * Return motorbike and calculate late fees if any
 * @route PUT /api/bookings/:id/return
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 */
export const returnMotorbike = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { actualReturnTime, returnReason, endOdometer } = req.body;
    const userId = req.user?.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    const booking = await Booking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }

    // Verify role or ownership
    const userRoles = req.user?.roles || [];
    const isStaffOrAdmin = userRoles.includes('Staff') || userRoles.includes('Admin');
    const isBookingOwner = booking.userId.toString() === userId;

    if (!isStaffOrAdmin && !isBookingOwner) {
      return res.status(403).json({ success: false, message: 'Chỉ nhân viên, quản trị viên hoặc chính khách hàng thuê mới có thể xác nhận trả xe' });
    }

    if (booking.status !== 'Ongoing' && booking.status !== 'Confirmed') {
      return res.status(400).json({ success: false, message: `Không thể trả xe cho booking đang ở trạng thái ${booking.status}` });
    }

    // Bắt buộc nhập số Odometer kết thúc
    if (endOdometer === undefined || endOdometer === null) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số Odometer hiện tại (endOdometer) của xe máy khi trả.' });
    }

    const endOdoVal = Number(endOdometer);
    if (isNaN(endOdoVal) || endOdoVal < 0) {
      return res.status(400).json({ success: false, message: 'Số Odometer không hợp lệ (phải là số không âm).' });
    }

    const vehicle = booking.vehicleId as any;
    const startOdoVal = booking.startOdometer || (vehicle ? vehicle.odometer : 0);

    if (endOdoVal < startOdoVal) {
      return res.status(400).json({ success: false, message: `Số Odometer khi trả (${endOdoVal} km) không thể nhỏ hơn số Odometer lúc nhận xe (${startOdoVal} km).` });
    }

    const returnedTime = actualReturnTime ? new Date(actualReturnTime) : new Date();
    
    if (isNaN(returnedTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Định dạng thời gian trả xe (actualReturnTime) không hợp lệ.' });
    }

    if (returnedTime < new Date(booking.pickupDateTime)) {
      return res.status(400).json({ success: false, message: 'Thời gian trả xe không thể trước thời gian lấy xe.' });
    }

    const scheduledReturnTime = new Date(booking.returnDateTime);
    const pickupTime = new Date(booking.pickupDateTime);
    
    // Vehicle rental price for fee calculation
    const dailyRate = vehicle?.rentalPrice || 0;
    const hourlyRate = dailyRate / 24;

    // Calculate late fees or early return
    const lateFee = calculateLateFees(returnedTime, scheduledReturnTime, hourlyRate);
    let earlyRefund = 0;
    
    const deposit = booking.depositAmount || 0;
    
    if (lateFee > 0) {
      booking.surcharges.push({
        surchargeType: 'Late Return',
        amount: lateFee,
        description: `Phí trả trễ xe. Đã trả lúc ${returnedTime.toLocaleString('vi-VN')}`,
        isPaid: false,
        createdAt: new Date()
      });
      booking.totalAmount += lateFee;
      booking.remainingAmount = (booking.remainingAmount || 0) + lateFee;
    } else {
      // Calculate early return (returned earlier than scheduled by 2 hours or more)
      const earlyHours = Math.floor((scheduledReturnTime.getTime() - returnedTime.getTime()) / (1000 * 60 * 60));
      if (earlyHours >= 2) {
        // Số giờ thực tế đã sử dụng
        const actualHours = Math.ceil((returnedTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60));
        // Tiền thuê thực tế đã đi
        const actualRentalFee = Math.round(actualHours * hourlyRate);
        
        // Mất cọc, khách hàng phải thanh toán thêm số tiền bằng đúng tiền thuê thực tế
        booking.totalAmount = deposit + actualRentalFee;
        booking.remainingAmount = actualRentalFee;
        
        booking.surcharges.push({
          surchargeType: 'Early Return Penalty (Lost Deposit)',
          amount: deposit,
          description: `Phạt trả xe sớm (Mất tiền cọc giữ xe đã đóng trước).`,
          isPaid: true,
          createdAt: new Date()
        });
        
        booking.surcharges.push({
          surchargeType: 'Actual Rental Usage',
          amount: actualRentalFee,
          description: `Tiền thuê xe tính theo số giờ thực tế đã đi (${actualHours} giờ).`,
          isPaid: false,
          createdAt: new Date()
        });
      } else {
        // Trả đúng hẹn, khách thanh toán nốt số tiền remainingAmount còn lại
        booking.remainingAmount = booking.remainingAmount || 0;
      }
    }

    booking.status = 'Completed';
    booking.endOdometer = endOdoVal;
    if (returnReason) {
      booking.returnReason = returnReason;
    }
    await booking.save();

    // Set vehicle status to Available, update odometer and check maintenance
    if (vehicle) {
      const dbVehicle = await Vehicle.findById(vehicle._id);
      if (dbVehicle) {
        dbVehicle.odometer = endOdoVal;
        dbVehicle.status = 'Available';

        // Tính toán khoảng cách kể từ lần bảo dưỡng gần nhất
        const mileageSinceLast = dbVehicle.odometer - dbVehicle.lastMaintenanceOdometer;
        if (mileageSinceLast >= dbVehicle.maintenanceInterval) {
          dbVehicle.requiresMaintenance = true;

          // Gửi thông báo in-app cho chủ xe và nhân viên
          try {
            // 1. Tạo thông báo cho chủ xe
            await Notification.create({
              userId: dbVehicle.ownerId,
              title: `Cảnh báo bảo dưỡng xe máy ${dbVehicle.licensePlate} 🚨`,
              message: `Xe ${dbVehicle.vehicleModel} (Biển số: ${dbVehicle.licensePlate}) đã đi được ${mileageSinceLast} km kể từ lần bảo dưỡng gần nhất (ngưỡng: ${dbVehicle.maintenanceInterval} km). Vui lòng mang xe đi thay dầu, bảo dưỡng.`,
              type: 'System',
              relatedId: dbVehicle._id,
              createdAt: new Date()
            });

            // 2. Tạo thông báo cho Admin/Staff
            const staffList = await User.find({
              roles: { $in: ['Admin', 'Staff'] },
              status: 'Active'
            }, '_id');

            const notiPromises = staffList.map(st => {
              // Tránh gửi trùng nếu chủ xe có cả role Admin/Staff
              if (st._id.toString() === dbVehicle.ownerId.toString()) return Promise.resolve();
              return Notification.create({
                userId: st._id,
                title: `Cảnh báo bảo dưỡng xe máy ${dbVehicle.licensePlate} 🚨`,
                message: `Xe ${dbVehicle.vehicleModel} (Biển số: ${dbVehicle.licensePlate}) cần được mang đi bảo dưỡng do đã vượt chu kỳ Odometer ${dbVehicle.maintenanceInterval} km.`,
                type: 'System',
                relatedId: dbVehicle._id,
                createdAt: new Date()
              });
            });
            await Promise.all(notiPromises);
          } catch (notiError) {
            console.error('Lỗi khi gửi thông báo bảo dưỡng xe:', notiError);
          }
        }
        await dbVehicle.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Đã xác nhận trả xe thành công',
      lateFeeApplied: lateFee > 0,
      lateFeeAmount: lateFee,
      earlyRefundApplied: earlyRefund > 0,
      earlyRefundAmount: earlyRefund,
      booking: formatBookingResponse(booking)
    });

  } catch (error: any) {
    console.error('Lỗi khi trả xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ', error: error.message });
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
  
  // Đồng bộ cách tính block 24h
  const diffTime = returnDate.getTime() - pickupDate.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  const rentalDays = diffHours <= 24 ? 1 : Math.ceil(diffHours / 24);

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
    returnReason: booking.returnReason,
    depositAmount: booking.depositAmount,
    remainingAmount: booking.remainingAmount,
    paymentMethod: booking.paymentMethod,
    deliveryMethod: booking.deliveryMethod,
    isPaid: booking.isPaid,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
}

/**
 * Get Vietnamese label for status
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'Pending': 'Chờ xác nhận',
    'Confirmed': 'Đã xác nhận',
    'Ongoing': 'Đang cho thuê',
    'Completed': 'Hoàn tất',
    'Cancelled': 'Đã hủy'
  };
  return labels[status] || status;
}

// ============================================
// STAFF: CONFIRM BOOKING
// ============================================
export const confirmBookingByStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body; // Ghi chú từ staff nếu có

    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    // 2. Tìm booking và nạp thông tin xe
    const booking = await Booking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    // 3. Kiểm tra xem trạng thái đơn có hợp lệ để duyệt không (Phải là Pending)
    if (booking.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể duyệt đơn hàng này (Trạng thái hiện tại: ${booking.status})` 
      });
    }

    // 4. Cập nhật trạng thái sang Confirmed
    booking.status = 'Confirmed';
    if (notes) {
      booking.surcharges.push({
        surchargeType: 'Ghi chú từ nhân viên duyệt',
        amount: 0,
        description: notes,
        isPaid: true,
        createdAt: new Date()
      });
    }

    const updatedBooking = await booking.save();

    // 5. Gửi thông báo & email cho khách hàng (Bọc trong try-catch để tránh crash đơn)
    try {
      const customer = await User.findById(updatedBooking.userId);
      if (customer && customer.email) {
        const pickupDate = new Date(updatedBooking.pickupDateTime);
        const returnDate = new Date(updatedBooking.returnDateTime);
        
        // Tính số ngày (Đồng bộ block 24h)
        const diffHours = (returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60);
        const rentalDays = diffHours <= 24 ? 1 : Math.ceil(diffHours / 24);

        const emailDetails = {
          bookingCode: updatedBooking.bookingCode,
          vehicleName: updatedBooking.vehicleSnapshot?.name || 'Xe',
          pickupDateTime: updatedBooking.pickupDateTime,
          returnDateTime: updatedBooking.returnDateTime,
          pickupLocation: updatedBooking.pickupLocation?.address || 'Nhận tại cửa hàng',
          totalAmount: updatedBooking.totalAmount,
          rentalDays,
          discountAmount: updatedBooking.discountAmount
        };

        // Gửi thông báo in-app
        await Notification.create({
          userId: customer._id,
          title: 'Đơn đặt xe được phê duyệt',
          message: `Đơn đặt xe ${updatedBooking.bookingCode} của bạn đã được nhân viên hệ thống phê duyệt.`,
          type: 'BookingConfirmed',
          relatedId: updatedBooking._id
        });

        // Gửi Email
        sendBookingConfirmedEmail(customer.email, emailDetails).catch(err =>
          console.error('Lỗi gửi email xác nhận từ Staff:', err)
        );
      }
    } catch (notiError) {
      console.error('Lỗi tạo thông báo khi Staff duyệt đơn:', notiError);
    }

    res.status(200).json({
      success: true,
      message: 'Duyệt đơn đặt xe thành công!',
      booking: formatBookingResponse(updatedBooking)
    });

  } catch (error: any) {
    console.error('Lỗi khi staff duyệt booking:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi duyệt đơn',
      error: error.message
    });
  }
};

// ============================================
// STAFF: CONFIRM BIKE PICKUP (Khách nhận xe)
// ============================================
export const confirmBikePickupByStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body; // Ghi chú tình trạng xe lúc bàn giao nếu có

    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID booking không hợp lệ' });
    }

    // 2. Tìm đơn hàng
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    // Tìm xe tương ứng để lấy Odometer hiện tại
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Xe liên quan đến đơn hàng không tồn tại' });
    }

    // 3. Kiểm tra điều kiện: Đơn hàng phải ở trạng thái 'Confirmed' thì mới được pickup
    if (booking.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: `Không thể xác nhận nhận xe. Đơn hàng phải ở trạng thái "Đã xác nhận" (Trạng thái hiện tại: ${booking.status})`
      });
    }

    // 4. Cập nhật trạng thái Đơn hàng sang 'Ongoing' (Đang đi)
    booking.status = 'Ongoing'; // Hoặc 'Renting' tùy thuộc vào Enum trong Model Booking của bạn
    booking.startOdometer = vehicle.odometer; // Ghi nhận số km lúc nhận xe
    await handleBookingStatusTransitionReminders(booking._id, 'Ongoing', booking.pickupDateTime, booking.returnDateTime);
    
    if (notes) {
      booking.surcharges.push({
        surchargeType: 'Ghi chú bàn giao xe',
        amount: 0,
        description: notes,
        isPaid: true,
        createdAt: new Date()
      });
    }
    const updatedBooking = await booking.save();

    // 5. Cập nhật trạng thái Xe sang 'Rented' (Đang cho thuê) để đồng bộ hệ thống
    vehicle.status = 'Rented';
    await vehicle.save();

    // 6. Tạo thông báo in-app cho Khách hàng biết xe đã được bàn giao
    try {
      await Notification.create({
        userId: booking.userId,
        title: 'Chuyến đi của bạn đã bắt đầu',
        message: `Nhân viên đã xác nhận bàn giao xe cho đơn hàng ${booking.bookingCode}. Chúc bạn có một chuyến đi an toàn!`,
        type: 'BookingConfirmed',
        relatedId: booking._id
      });
    } catch (notiError) {
      console.error('Lỗi tạo thông báo khi staff xác nhận pickup:', notiError);
    }

    res.status(200).json({
      success: true,
      message: 'Xác nhận khách lấy xe thành công! Trạng thái xe đã chuyển sang Đang cho thuê.',
      booking: formatBookingResponse(updatedBooking)
    });

  } catch (error: any) {
    console.error('Lỗi khi staff xác nhận pickup:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi xác nhận nhận xe',
      error: error.message
    });
  }
};

/**
 * Helper to sort object by key alphabetically (VNPAY requirement)
 */
const sortObject = (obj: any) => {
  let sorted: any = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
};

/**
 * Generate VNPAY payment URL (Real VNPAY Sandbox)
 * POST /api/bookings/:id/vnpay-url
 */
export const createVNPayUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }

    // Amount to pay is the depositAmount (30%)
    const amount = booking.depositAmount || Math.round(booking.totalAmount * 0.3);

    const tmnCode = await getSettingVal('vnp_TmnCode', process.env.VNP_TMNCODE || '');
    const secretKey = await getSettingVal('vnp_HashSecret', process.env.VNP_HASHSECRET || '');
    let vnpUrl = await getSettingVal('vnp_Url', process.env.VNP_URL || '');
    const returnUrl = await getSettingVal('vnp_ReturnUrl', process.env.VNP_RETURNURL || '');

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      return res.status(500).json({
        success: false,
        message: 'Chưa cấu hình đầy đủ biến môi trường VNPAY (VNP_TMNCODE, VNP_HASHSECRET, VNP_URL, VNP_RETURNURL)'
      });
    }

    const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const date = new Date();
    const createDate = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');

    // TxnRef must be unique per request to avoid "Duplicate transaction" error on VNPAY.
    // Format: bookingId_timestamp
    const txnRef = `${booking._id.toString()}_${Date.now()}`;

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = `Thanh toan dat coc don hang ${booking.bookingCode}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPAY amount is in cents
    const isMobile = req.body.origin === 'mobile' || req.query.origin === 'mobile';
    vnp_Params['vnp_ReturnUrl'] = isMobile ? `${returnUrl}?origin=mobile` : returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort params
    const sortedParams = sortObject(vnp_Params);
    
    // Create query string
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Append secure hash
    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;

    res.status(200).json({
      success: true,
      paymentUrl
    });
  } catch (error: any) {
    console.error('Lỗi tạo URL VNPAY:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * Process VNPAY IPN webhook (Real VNPAY Sandbox verification)
 * GET/POST /api/bookings/vnpay-ipn
 */
export const processVNPayIPN = async (req: any, res: Response) => {
  try {
    let vnp_Params = req.query;
    if (!vnp_Params || Object.keys(vnp_Params).length === 0) {
      vnp_Params = req.body;
    }

    const secureHash = vnp_Params['vnp_SecureHash'];
    
    // Delete hash params
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];
    delete vnp_Params['origin'];

    // Sort params
    const sortedParams = sortObject(vnp_Params);
    
    const secretKey = await getSettingVal('vnp_HashSecret', process.env.VNP_HASHSECRET || '');
    if (!secretKey) {
      return res.status(500).json({ RspCode: '99', Message: 'Internal server error' });
    }

    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // Valid signature
      const txnRef = vnp_Params['vnp_TxnRef'] as string;
      if (!txnRef) {
        return res.status(200).json({ RspCode: '01', Message: 'TxnRef not found' });
      }

      const bookingId = txnRef.split('_')[0];
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      // Check amount
      const amount = Number(vnp_Params['vnp_Amount']) / 100;
      const expectedAmount = booking.depositAmount || Math.round(booking.totalAmount * 0.3);
      
      if (Math.abs(amount - expectedAmount) > 100) { // Small tolerance
        return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
      }

      // Check payment status
      if (booking.isPaid) {
        return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      const responseCode = vnp_Params['vnp_ResponseCode'];
      if (responseCode === '00') {
        // Payment success
        booking.isPaid = true;
        booking.status = 'Confirmed';
        await booking.save();

        // Create notification
        try {
          await Notification.create({
            userId: booking.userId,
            title: 'Thanh toán đặt cọc thành công 🎉',
            message: `Đơn thuê xe ${booking.bookingCode} đã đặt cọc thành công qua VNPAY. Đơn hàng hiện đã được tự động xác nhận!`,
            type: 'BookingConfirmed',
            relatedId: booking._id,
            createdAt: new Date()
          });
        } catch (notiError) {
          console.error('Lỗi tạo thông báo khi thanh toán VNPAY:', notiError);
        }

        return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
      } else {
        // Payment failed
        booking.status = 'Cancelled';
        booking.cancelReason = `Thanh toán đặt cọc qua VNPAY thất bại hoặc bị hủy (Mã lỗi: ${responseCode})`;
        await booking.save();

        // Create notification for cancellation
        try {
          await Notification.create({
            userId: booking.userId,
            title: 'Đơn đặt xe đã bị hủy ❌',
            message: `Đơn thuê xe ${booking.bookingCode} đã tự động hủy do giao dịch thanh toán đặt cọc qua VNPAY không thành công hoặc bị khách hàng hủy bỏ.`,
            type: 'BookingCancelled',
            relatedId: booking._id,
            createdAt: new Date()
          });
        } catch (notiError) {
          console.error('Lỗi tạo thông báo hủy khi thanh toán VNPAY thất bại:', notiError);
        }

        return res.status(200).json({ RspCode: '00', Message: 'Payment failed. Booking cancelled.' });
      }
    } else {
      // Signature error
      console.warn('Sai signature VNPAY. Gửi secureHash:', secureHash, 'Tính toán:', signed);
      return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
    }
  } catch (error: any) {
    console.error('Lỗi xử lý IPN VNPAY:', error);
    res.status(500).json({ RspCode: '99', Message: 'Internal server error', error: error.message });
  }
};

export default {
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
};
