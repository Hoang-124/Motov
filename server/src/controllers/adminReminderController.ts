import { Request, Response } from 'express';
import { BookingReminder } from '../models/BookingReminder.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { 
  sendPickupReminderEmail, 
  sendReturnReminderEmail,
  sendPickupReminderSms,
  sendReturnReminderSms
} from '../utils/emailService.js';
import mongoose from 'mongoose';

export const getBookingReminders = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Booking ID không hợp lệ' });
    }

    const reminders = await BookingReminder.find({ bookingId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách nhắc nhở' });
  }
};

export const sendManualReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Booking ID không hợp lệ' });
    }

    const booking = await Booking.findById(id).populate('userId');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn đặt xe' });
    }

    const customer: any = booking.userId;
    if (!customer) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy thông tin khách hàng của đơn này' });
    }

    // Determine reminder type based on current booking status
    let reminderType: '24h_before_pickup' | '2h_before_pickup' | '24h_before_return' | '2h_before_return';
    
    if (booking.status === 'Confirmed') {
      // Pick 2h_before_pickup as default manual trigger type for confirmed booking
      reminderType = '2h_before_pickup';
    } else if (booking.status === 'Ongoing') {
      // Pick 2h_before_return as default manual trigger type for ongoing booking
      reminderType = '2h_before_return';
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `Đơn đặt xe đang ở trạng thái ${booking.status}. Chỉ có thể gửi nhắc nhở cho đơn Đã xác nhận (Confirmed) hoặc Đang thuê (Ongoing).` 
      });
    }

    // Calculate rental days
    const pickupDate = new Date(booking.pickupDateTime);
    const returnDate = new Date(booking.returnDateTime);
    const rentalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

    const emailDetails = {
      bookingCode: booking.bookingCode,
      vehicleName: booking.vehicleSnapshot.name,
      pickupDateTime: booking.pickupDateTime,
      returnDateTime: booking.returnDateTime,
      pickupLocation: booking.pickupLocation?.address || 'Nhận tại cửa hàng',
      totalAmount: booking.totalAmount,
      rentalDays,
      discountAmount: booking.discountAmount
    };

    let emailSent = false;
    let smsSent = false;
    const channel = customer.phoneNumber ? 'Both' : 'Email';

    try {
      if (booking.status === 'Confirmed') {
        if (customer.email) {
          await sendPickupReminderEmail(customer.email, emailDetails);
          emailSent = true;
        }
        if (customer.phoneNumber) {
          await sendPickupReminderSms(customer.phoneNumber, emailDetails);
          smsSent = true;
        }
      } else {
        if (customer.email) {
          await sendReturnReminderEmail(customer.email, emailDetails);
          emailSent = true;
        }
        if (customer.phoneNumber) {
          await sendReturnReminderSms(customer.phoneNumber, emailDetails);
          smsSent = true;
        }
      }

      // Save a reminder log to DB
      await BookingReminder.create({
        bookingId: booking._id,
        reminderType,
        scheduledTime: new Date(),
        sentTime: new Date(),
        status: 'Sent',
        channel,
        retryCount: 0
      });

      res.json({
        success: true,
        message: 'Gửi nhắc nhở thành công!',
        details: { emailSent, smsSent }
      });
    } catch (sendError: any) {
      console.error('Error sending manual reminder:', sendError);
      
      // Save failed attempt to DB
      await BookingReminder.create({
        bookingId: booking._id,
        reminderType,
        scheduledTime: new Date(),
        status: 'Failed',
        channel,
        retryCount: 1
      });

      res.status(500).json({
        success: false,
        error: `Lỗi khi gửi nhắc nhở: ${sendError.message || sendError}`
      });
    }
  } catch (error: any) {
    console.error('Error in sendManualReminder:', error);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ nội bộ khi thực hiện gửi nhắc nhở' });
  }
};
