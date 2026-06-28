import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { BookingReminder } from '../models/BookingReminder.js';
import { Notification } from '../models/Notification.js';
import {
  sendPickupReminderEmail,
  sendReturnReminderEmail,
  sendPickupReminderSms,
  sendReturnReminderSms
} from './emailService.js';

// Quét nhắc nhở từ collection BookingReminder và thực hiện gửi
export const checkAndSendBookingReminders = async () => {
  console.log('[Scheduler] Đang quét các bản ghi nhắc nhở trong BookingReminder...');
  try {
    const now = new Date();
    
    // Tìm các nhắc nhở chưa gửi, đã đến giờ gửi và chưa vượt quá số lần thử lại tối đa (3 lần)
    const pendingReminders = await BookingReminder.find({
      status: 'Pending',
      scheduledTime: { $lte: now },
      retryCount: { $lt: 3 }
    }).populate({
      path: 'bookingId',
      populate: { path: 'userId' }
    });

    console.log(`[Scheduler] Tìm thấy ${pendingReminders.length} nhắc nhở cần xử lý.`);

    for (const reminder of pendingReminders) {
      try {
        const booking: any = reminder.bookingId;
        if (!booking) {
          // Booking không tồn tại nữa, hủy nhắc nhở
          reminder.status = 'Cancelled';
          await reminder.save();
          continue;
        }

        // Kiểm tra xem đơn đặt xe có bị hủy hoặc đã hoàn tất hay không
        if (booking.status === 'Cancelled' || booking.status === 'Completed') {
          reminder.status = 'Cancelled';
          await reminder.save();
          continue;
        }

        // Kiểm tra tính hợp lệ của trạng thái đơn hàng so với loại nhắc nhở
        // Nhắc nhở nhận xe chỉ gửi khi đơn hàng đã Confirmed
        if (
          (reminder.reminderType === '24h_before_pickup' || reminder.reminderType === '2h_before_pickup') &&
          booking.status !== 'Confirmed'
        ) {
          // Trạng thái đơn không còn khớp, chuyển thành Cancelled để không gửi sai thời điểm
          reminder.status = 'Cancelled';
          await reminder.save();
          continue;
        }

        // Nhắc nhở trả xe chỉ gửi khi đơn hàng đã Ongoing
        if (
          (reminder.reminderType === '24h_before_return' || reminder.reminderType === '2h_before_return') &&
          booking.status !== 'Ongoing'
        ) {
          reminder.status = 'Cancelled';
          await reminder.save();
          continue;
        }

        const customer = booking.userId;
        if (!customer) {
          reminder.status = 'Failed';
          await reminder.save();
          continue;
        }

        // Tính số ngày thuê
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
          discountAmount: booking.discountAmount,
          customerName: `${customer.lastName} ${customer.firstName}`.trim()
        };

        const isPickupType = reminder.reminderType === '24h_before_pickup' || reminder.reminderType === '2h_before_pickup';
        let emailSent = false;
        let smsSent = false;

        // 1. Gửi Email (nếu channel là Email hoặc Both)
        if ((reminder.channel === 'Email' || reminder.channel === 'Both') && customer.email) {
          if (isPickupType) {
            await sendPickupReminderEmail(customer.email, emailDetails);
          } else {
            await sendReturnReminderEmail(customer.email, emailDetails);
          }
          emailSent = true;
        }

        // 2. Gửi SMS (nếu channel là SMS hoặc Both)
        if ((reminder.channel === 'SMS' || reminder.channel === 'Both') && customer.phoneNumber) {
          if (isPickupType) {
            await sendPickupReminderSms(customer.phoneNumber, emailDetails);
          } else {
            await sendReturnReminderSms(customer.phoneNumber, emailDetails);
          }
          smsSent = true;
        }

        // 3. Tạo thông báo in-app (chỉ gửi 1 lần kèm theo nhắc nhở đầu tiên thành công)
        try {
          const timeLabel = isPickupType ? 'nhận xe' : 'trả xe';
          const timeVal = isPickupType ? booking.pickupDateTime : booking.returnDateTime;
          const formattedTime = new Date(timeVal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const formattedDate = new Date(timeVal).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          
          await Notification.create({
            userId: customer._id,
            title: isPickupType ? 'Sắp đến giờ nhận xe máy' : 'Sắp đến hạn trả xe máy',
            message: `Đơn hàng ${booking.bookingCode} (${booking.vehicleSnapshot.name}) sắp đến giờ ${timeLabel} lúc ${formattedTime} ngày ${formattedDate}. Vui lòng chuẩn bị.`,
            type: 'System',
            relatedId: booking._id
          });
        } catch (notiErr) {
          console.error('[Scheduler] Lỗi khi tạo thông báo in-app:', notiErr);
        }

        // 4. Cập nhật trạng thái thành công
        reminder.status = 'Sent';
        reminder.sentTime = new Date();
        await reminder.save();
        console.log(`[Scheduler] Đã gửi thành công nhắc nhở ${reminder.reminderType} cho đơn ${booking.bookingCode}`);

      } catch (err: any) {
        console.error(`[Scheduler] Lỗi khi gửi nhắc nhở ID ${reminder._id}:`, err.message);
        reminder.retryCount += 1;
        if (reminder.retryCount >= 3) {
          reminder.status = 'Failed';
        }
        await reminder.save();
      }
    }

  } catch (error: any) {
    console.error('[Scheduler] Lỗi trong quá trình quét nhắc nhở từ DB:', error.message);
  }
};

// Khởi chạy lập lịch nhắc nhở
export const initBookingReminderScheduler = () => {
  // Quét ngay lần đầu sau 15 giây khi khởi động server
  setTimeout(() => {
    checkAndSendBookingReminders();
  }, 15000);

  // Quét định kỳ mỗi 5 phút (5 * 60 * 1000 milliseconds) theo Admin Requirements
  const intervalTime = 5 * 60 * 1000;
  setInterval(() => {
    checkAndSendBookingReminders();
  }, intervalTime);

  console.log('[Scheduler] Đã khởi tạo hệ thống nhắc nhở tự động (Booking Reminder) thành công (chu kỳ 5 phút).');
};

// Hàm helper tự động tạo hoặc hủy lập lịch nhắc nhở khi booking chuyển trạng thái
export const handleBookingStatusTransitionReminders = async (
  bookingId: string | any,
  newStatus: string,
  pickupDateTime: Date,
  returnDateTime: Date
) => {
  try {
    const bookingObjectId = new BookingReminder.base.Types.ObjectId(bookingId.toString());

    if (newStatus === 'Confirmed') {
      // 1. Tạo nhắc nhở Nhận xe (Pickup Reminders)
      const time24h = new Date(new Date(pickupDateTime).getTime() - 24 * 60 * 60 * 1000);
      const time2h = new Date(new Date(pickupDateTime).getTime() - 2 * 60 * 60 * 1000);

      const remindersToCreate = [];

      if (time24h > new Date()) {
        remindersToCreate.push({
          bookingId: bookingObjectId,
          reminderType: '24h_before_pickup',
          scheduledTime: time24h,
          status: 'Pending',
          channel: 'Email'
        });
      }

      if (time2h > new Date()) {
        remindersToCreate.push({
          bookingId: bookingObjectId,
          reminderType: '2h_before_pickup',
          scheduledTime: time2h,
          status: 'Pending',
          channel: 'Both'
        });
      }

      if (remindersToCreate.length > 0) {
        await BookingReminder.deleteMany({
          bookingId: bookingObjectId,
          reminderType: { $in: ['24h_before_pickup', '2h_before_pickup'] },
          status: 'Pending'
        });
        await BookingReminder.insertMany(remindersToCreate);
        console.log(`[ReminderHelper] Đã tạo nhắc nhở nhận xe cho đơn ${bookingId}`);
      }
    } 
    else if (newStatus === 'Ongoing') {
      // 2. Tạo nhắc nhở Trả xe (Return Reminders)
      const time24h = new Date(new Date(returnDateTime).getTime() - 24 * 60 * 60 * 1000);
      const time2h = new Date(new Date(returnDateTime).getTime() - 2 * 60 * 60 * 1000);

      const remindersToCreate = [];

      if (time24h > new Date()) {
        remindersToCreate.push({
          bookingId: bookingObjectId,
          reminderType: '24h_before_return',
          scheduledTime: time24h,
          status: 'Pending',
          channel: 'Email'
        });
      }

      if (time2h > new Date()) {
        remindersToCreate.push({
          bookingId: bookingObjectId,
          reminderType: '2h_before_return',
          scheduledTime: time2h,
          status: 'Pending',
          channel: 'Both'
        });
      }

      if (remindersToCreate.length > 0) {
        await BookingReminder.deleteMany({
          bookingId: bookingObjectId,
          reminderType: { $in: ['24h_before_return', '2h_before_return'] },
          status: 'Pending'
        });
        await BookingReminder.insertMany(remindersToCreate);
        console.log(`[ReminderHelper] Đã tạo nhắc nhở trả xe cho đơn ${bookingId}`);
      }
    } 
    else if (newStatus === 'Cancelled' || newStatus === 'Completed') {
      // 3. Hủy toàn bộ nhắc nhở chưa gửi (Pending) của đơn này
      await BookingReminder.updateMany(
        { bookingId: bookingObjectId, status: 'Pending' },
        { status: 'Cancelled' }
      );
      console.log(`[ReminderHelper] Đã hủy các nhắc nhở chưa gửi của đơn ${bookingId}`);
    }
  } catch (err: any) {
    console.error(`[ReminderHelper] Lỗi khi xử lý nhắc nhở cho đơn ${bookingId}:`, err.message);
  }
};
