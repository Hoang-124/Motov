import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { sendPickupReminderEmail, sendReturnReminderEmail } from './emailService.js';

// Quét nhắc nhở nhận xe và trả xe
export const checkAndSendBookingReminders = async () => {
  console.log('[Scheduler] Đang quét các đơn hàng cần gửi nhắc nhở...');
  try {
    const now = new Date();
    // 2 hours from now
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // ==============================================================
    // 1. NHẮC NHỞ NHẬN XE (PICKUP REMINDER)
    // Booking status = Confirmed, isPickupReminded = false, pickupDateTime between now and 2 hours later
    // ==============================================================
    const pendingPickupBookings = await Booking.find({
      status: 'Confirmed',
      isPickupReminded: { $ne: true },
      pickupDateTime: { $gt: now, $lte: twoHoursLater }
    }).populate('userId', 'firstName lastName email username');

    console.log(`[Scheduler] Tìm thấy ${pendingPickupBookings.length} đơn hàng sắp đến giờ nhận xe.`);

    for (const booking of pendingPickupBookings) {
      try {
        const customer: any = booking.userId;
        if (!customer) continue;

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
          discountAmount: booking.discountAmount
        };

        // A. Gửi email nhắc nhở
        if (customer.email) {
          await sendPickupReminderEmail(customer.email, emailDetails);
          console.log(`[Scheduler] Đã gửi email nhắc nhở nhận xe cho: ${customer.email} (Đơn: ${booking.bookingCode})`);
        }

        // B. Tạo thông báo in-app
        const formattedTime = new Date(booking.pickupDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        await Notification.create({
          userId: customer._id,
          title: '⏰ Sắp đến giờ nhận xe máy',
          message: `Đơn đặt xe ${booking.bookingCode} cho dòng xe ${booking.vehicleSnapshot.name} của bạn sắp đến giờ nhận bàn giao (${formattedTime} hôm nay). Vui lòng đến điểm giao nhận xe đúng giờ.`,
          type: 'System',
          relatedId: booking._id
        });

        // C. Cập nhật trạng thái đã nhắc nhở
        booking.isPickupReminded = true;
        await booking.save();
        
      } catch (bookingErr: any) {
        console.error(`[Scheduler] Lỗi khi xử lý nhắc nhở nhận xe cho đơn ${booking.bookingCode}:`, bookingErr.message);
      }
    }

    // ==============================================================
    // 2. NHẮC NHỞ TRẢ XE (RETURN REMINDER)
    // Booking status = Ongoing, isReturnReminded = false, returnDateTime between now and 2 hours later
    // ==============================================================
    const pendingReturnBookings = await Booking.find({
      status: 'Ongoing',
      isReturnReminded: { $ne: true },
      returnDateTime: { $gt: now, $lte: twoHoursLater }
    }).populate('userId', 'firstName lastName email username');

    console.log(`[Scheduler] Tìm thấy ${pendingReturnBookings.length} đơn hàng sắp đến giờ trả xe.`);

    for (const booking of pendingReturnBookings) {
      try {
        const customer: any = booking.userId;
        if (!customer) continue;

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
          discountAmount: booking.discountAmount
        };

        // A. Gửi email nhắc nhở
        if (customer.email) {
          await sendReturnReminderEmail(customer.email, emailDetails);
          console.log(`[Scheduler] Đã gửi email nhắc nhở trả xe cho: ${customer.email} (Đơn: ${booking.bookingCode})`);
        }

        // B. Tạo thông báo in-app
        const formattedTime = new Date(booking.returnDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        await Notification.create({
          userId: customer._id,
          title: '⏳ Sắp đến hạn trả xe máy',
          message: `Lượt thuê xe máy ${booking.vehicleSnapshot.name} thuộc đơn ${booking.bookingCode} của bạn sắp hết hạn vào lúc ${formattedTime} hôm nay. Vui lòng di chuyển về địa điểm giao xe để trả xe đúng giờ, tránh phát sinh phí trễ hạn.`,
          type: 'System',
          relatedId: booking._id
        });

        // C. Cập nhật trạng thái đã nhắc nhở
        booking.isReturnReminded = true;
        await booking.save();

      } catch (bookingErr: any) {
        console.error(`[Scheduler] Lỗi khi xử lý nhắc nhở trả xe cho đơn ${booking.bookingCode}:`, bookingErr.message);
      }
    }

  } catch (error: any) {
    console.error('[Scheduler] Lỗi trong quá trình quét nhắc nhở đơn hàng:', error.message);
  }
};

// Khởi chạy lập lịch nhắc nhở
export const initBookingReminderScheduler = () => {
  // Quét ngay lần đầu sau 15 giây khi khởi động server
  setTimeout(() => {
    checkAndSendBookingReminders();
  }, 15000);

  // Quét định kỳ mỗi 15 phút (15 * 60 * 1000 milliseconds)
  const intervalTime = 15 * 60 * 1000;
  setInterval(() => {
    checkAndSendBookingReminders();
  }, intervalTime);

  console.log('⏰ [Scheduler] Đã khởi tạo hệ thống nhắc nhở tự động (Booking Reminder) thành công (chu kỳ 15 phút).');
};
