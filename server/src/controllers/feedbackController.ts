import { Response } from 'express';
import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { detectBadWords } from '../utils/badWordsFilter.js';

// [POST] /api/feedbacks - Create a new feedback for a booking (Customer only)
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, rating, content } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Mã đơn thuê xe (bookingId) là bắt buộc'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi không được để trống'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt xe này'
      });
    }

    // Verify ownership
    if (booking.userId.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh giá đơn đặt xe của người khác'
      });
    }

    // Verify status
    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sau khi chuyến đi đã hoàn thành'
      });
    }

    // Check duplicate feedback
    const existingFeedback = await Feedback.findOne({ bookingId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này đã được đánh giá trước đó'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId: req.user.id,
      vehicleId: booking.vehicleId,
      bookingId,
      rating,
      content
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công! Cảm ơn phản hồi của bạn.',
      data: feedback
    });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi gửi đánh giá',
      error: error.message
    });
  }
};

// [GET] /api/feedbacks/vehicle/:vehicleId - Get public feedbacks for a vehicle (Public)
export const getVehicleFeedbacks = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã xe không hợp lệ'
      });
    }

    const feedbacks = await Feedback.find({
      vehicleId,
      isBlocked: { $ne: true } // Only return active, non-blocked reviews
    })
      .populate('userId', 'firstName lastName avatarUrl username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedbacks
    });
  } catch (error: any) {
    console.error('Error fetching vehicle feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải đánh giá của xe',
      error: error.message
    });
  }
};

// [GET] /api/feedbacks/admin - Get all feedbacks with search and filters (Admin only)
export const getAllFeedbacksForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const query: any = {};

    // Filter by block status
    if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'active') {
      query.isBlocked = { $ne: true };
    }

    // Filter by search text (searching feedback content)
    if (search) {
      query.content = { $regex: String(search), $options: 'i' };
    }

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'username email firstName lastName status strikes')
      .populate('vehicleId', 'vehicleModel licensePlate category')
      .sort({ createdAt: -1 });

    const formattedFeedbacks = feedbacks.map(item => {
      const doc = item.toObject();
      const detected = detectBadWords(doc.content);
      return {
        ...doc,
        isSuspected: detected.length > 0,
        detectedBadWords: detected
      };
    });

    res.status(200).json({
      success: true,
      data: formattedFeedbacks
    });
  } catch (error: any) {
    console.error('Error fetching feedbacks for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

// [PUT] /api/feedbacks/:id/block - Block feedback (violate language guidelines)
export const blockFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { blockReason } = req.body;

    if (!blockReason || !blockReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do vi phạm ngôn từ'
      });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá cần gỡ'
      });
    }

    if (feedback.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá này đã bị ẩn/chặn từ trước'
      });
    }

    // 1. Update feedback state
    feedback.isBlocked = true;
    feedback.blockReason = blockReason;
    feedback.blockedBy = new mongoose.Types.ObjectId(req.user?.id);
    feedback.blockedAt = new Date();
    await feedback.save();

    // 2. Increment user strikes
    const user = await User.findById(feedback.userId);
    if (user) {
      user.strikes = (user.strikes || 0) + 1;

      // Automatically suspend user if they reach 3 strikes
      let isSuspendedNow = false;
      if (user.strikes >= 3) {
        user.status = 'Suspended';
        isSuspendedNow = true;
      }
      await user.save();

      // 3. Create warning Notification
      const displayStrikes = user.strikes;
      const notiMessage = `Đánh giá của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng (Lý do: ${blockReason}). Đây là lần cảnh cáo thứ ${displayStrikes}/3. ${
        isSuspendedNow 
          ? 'Tài khoản của bạn đã bị tạm khóa do vi phạm quá 3 lần.' 
          : 'Lưu ý: Nếu vi phạm đủ 3 lần, tài khoản của bạn sẽ bị tạm khóa.'
      }`;

      await Notification.create({
        userId: user._id,
        title: 'Cảnh báo vi phạm nội dung',
        message: notiMessage,
        type: 'System'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Gỡ đánh giá và cảnh cáo thành viên thành công',
      data: feedback
    });
  } catch (error: any) {
    console.error('Error blocking feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi ẩn đánh giá',
      error: error.message
    });
  }
};

// [PUT] /api/feedbacks/:id/unblock - Restore blocked feedback
export const unblockFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá cần khôi phục'
      });
    }

    if (!feedback.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá này đang hoạt động bình thường'
      });
    }

    // 1. Restore feedback state
    feedback.isBlocked = false;
    feedback.blockReason = undefined;
    feedback.blockedBy = undefined;
    feedback.blockedAt = undefined;
    await feedback.save();

    // 2. Decrement user strikes
    const user = await User.findById(feedback.userId);
    if (user) {
      user.strikes = Math.max(0, (user.strikes || 0) - 1);

      // Automatically reactivate user if strikes fell below 3 and status was Suspended
      let isReactivated = false;
      if (user.strikes < 3 && user.status === 'Suspended') {
        user.status = 'Active';
        isReactivated = true;
      }
      await user.save();

      // 3. Create Notification
      const displayStrikes = user.strikes;
      const notiMessage = `Đánh giá của bạn đã được xem xét và khôi phục hoạt động. Số lần cảnh cáo của bạn đã được giảm xuống còn ${displayStrikes}/3. ${
        isReactivated 
          ? 'Tài khoản của bạn đã được kích hoạt hoạt động trở lại.' 
          : ''
      }`;

      await Notification.create({
        userId: user._id,
        title: 'Khôi phục đánh giá',
        message: notiMessage,
        type: 'System'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Khôi phục đánh giá thành công',
      data: feedback
    });
  } catch (error: any) {
    console.error('Error unblocking feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi khôi phục đánh giá',
      error: error.message
    });
  }
};
