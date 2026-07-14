import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { Payment } from '../models/Payment.js'; 
import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';

// ============================================
// STAFF: CONFIRM CASH PAYMENT (Xác nhận thu tiền mặt)
// ============================================
export const confirmCODPaymentByStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Đây là ID của bản ghi Payment

    // 1. Validate ObjectId của Payment
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    // 2. Tìm bản ghi Payment trong database
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin thanh toán' });
    }

    // 3. Kiểm tra phương thức thanh toán phải là 'Cash' chuẩn theo Model
    if (payment.paymentMethod !== 'Cash') {
      return res.status(400).json({ 
        success: false, 
        message: `Hóa đơn này sử dụng phương thức ${payment.paymentMethod}, không phải Tiền mặt (Cash)` 
      });
    }

    // 4. Kiểm tra xem hóa đơn đã được thanh toán từ trước chưa (paymentStatus)
    if (payment.paymentStatus === 'Paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Hóa đơn tiền mặt này đã được xác nhận thanh toán thành công trước đó' 
      });
    }

    // 5. Cập nhật các trường dữ liệu chuẩn theo Model IPayment
    payment.paymentStatus = 'Paid';
    payment.paymentDate = new Date();
    // Tạo transactionId giả định nội bộ cho việc thu tiền mặt nếu cần thiết (ví dụ: CASH_171845...)
    payment.transactionId = `CASH_${Date.now()}`; 
    
    await payment.save();

    // 6. Đồng bộ trạng thái thanh toán sang Booking nếu có liên kết
    if (payment.bookingId) {
      // Cập nhật trường paymentStatus (hoặc trường tương đương bên Booking Model của bạn)
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'Paid' 
      });

      // 7. Tạo thông báo In-app cho khách hàng biết tiền đã thu thành công
      try {
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
          await Notification.create({
            userId: booking.userId,
            title: 'Thanh toán thành công',
            message: `Nhân viên đã xác nhận hóa đơn tiền mặt trị giá ${payment.amount.toLocaleString('vi-VN')} VNĐ cho đơn hàng ${booking.bookingCode} đã thanh toán thành công.`,
            type: 'BookingConfirmed', // Sử dụng Enum an toàn có sẵn trong hệ thống của bạn
            relatedId: booking._id
          });
        }
      } catch (notiError) {
        console.error('Lỗi tạo thông báo khi staff xác nhận thanh toán tiền mặt:', notiError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Xác nhận hóa đơn thanh toán tiền mặt (Cash) thành công!',
      payment
    });

  } catch (error: any) {
    console.error('Lỗi khi staff xác nhận thanh toán Cash:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ khi xác nhận thanh toán',
    });
  }
};

export default {
  confirmCODPaymentByStaff
};