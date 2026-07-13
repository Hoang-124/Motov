import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Booking } from '../models/Booking.js';

export async function seedChats() {
  try {
    const conversationCount = await Conversation.countDocuments();
    if (conversationCount > 0) {
      console.log('ℹ️ Chats đã tồn tại trong database. Bỏ qua seeding.');
      return;
    }

    console.log('🌱 Đang bắt đầu seeding chats...');

    // 1. Tìm các user mẫu
    const customerUser = await User.findOne({ email: 'khachhang@motov.com' });
    const ownerUser = await User.findOne({ email: 'owner@motov.com' });
    const staffUser = await User.findOne({ email: 'nhanvien@motov.com' });

    if (!customerUser || !ownerUser || !staffUser) {
      console.log('⚠️ Không tìm thấy người dùng mẫu. Không thể seed chats.');
      return;
    }

    // 2. Tìm một xe để tạo liên kết
    const vehicle = await Vehicle.findOne({ ownerId: ownerUser._id });

    // 3. Tìm một booking nếu có
    const booking = await Booking.findOne({ userId: customerUser._id, status: 'Completed' });

    let seededCount = 0;

    // --- Conversation 1: Khách hàng & Nhân viên (Hỗ trợ chung) ---
    const conv1 = await Conversation.create({
      participants: [customerUser._id, staffUser._id],
      type: 'customer-staff'
    });

    const msg1_1 = await Message.create({
      conversationId: conv1._id,
      senderId: customerUser._id,
      content: 'Chào admin, mình cần tư vấn về thủ tục thuê xe ạ.',
      readBy: [customerUser._id, staffUser._id] // Staff đã đọc
    });

    const msg1_2 = await Message.create({
      conversationId: conv1._id,
      senderId: staffUser._id,
      content: 'Chào bạn, thủ tục thuê xe tại Motov rất đơn giản. Bạn chỉ cần CCCD/CMND và bằng lái xe hợp lệ nhé. Bạn cần hỗ trợ thêm thông tin gì không ạ?',
      readBy: [customerUser._id] // Khách chưa đọc
    });

    // Cập nhật lastMessage
    await Conversation.findByIdAndUpdate(conv1._id, { lastMessage: msg1_2._id });
    seededCount++;

    // --- Conversation 2: Khách hàng & Chủ xe (Hỏi về xe cụ thể) ---
    if (vehicle) {
      const conv2 = await Conversation.create({
        participants: [customerUser._id, ownerUser._id],
        type: 'customer-owner',
        relatedVehicle: vehicle._id
      });

      const msg2_1 = await Message.create({
        conversationId: conv2._id,
        senderId: customerUser._id,
        content: `Chào anh/chị, em thấy chiếc ${vehicle.vehicleModel} của mình còn trống. Xe này có hỗ trợ giao tận nơi không ạ?`,
        readBy: [customerUser._id, ownerUser._id]
      });

      const msg2_2 = await Message.create({
        conversationId: conv2._id,
        senderId: ownerUser._id,
        content: 'Chào bạn, bên mình có hỗ trợ giao xe trong bán kính 5km nhé.',
        readBy: [customerUser._id, ownerUser._id]
      });

      const msg2_3 = await Message.create({
        conversationId: conv2._id,
        senderId: customerUser._id,
        content: 'Tuyệt vời, để em đặt lịch trên app ạ. Cảm ơn anh/chị.',
        readBy: [customerUser._id]
      });

      // Cập nhật lastMessage
      await Conversation.findByIdAndUpdate(conv2._id, { lastMessage: msg2_3._id });
      seededCount++;
    }

    // --- Conversation 3: Khách hàng & Chủ xe (Trao đổi về một Booking cụ thể) ---
    if (booking) {
      // Find the vehicle related to the booking to get its owner
      const bookedVehicle = await Vehicle.findById(booking.vehicleId);
      if (bookedVehicle) {
        const conv3 = await Conversation.create({
          participants: [customerUser._id, bookedVehicle.ownerId],
          type: 'customer-owner',
          relatedBooking: booking._id,
          relatedVehicle: bookedVehicle._id
        });

        const msg3_1 = await Message.create({
          conversationId: conv3._id,
          senderId: customerUser._id,
          content: 'Em đã đặt thuê xe thành công. Cảm ơn anh/chị nhé!',
          readBy: [customerUser._id, bookedVehicle.ownerId]
        });

        await Conversation.findByIdAndUpdate(conv3._id, { lastMessage: msg3_1._id });
        seededCount++;
      }
    }

    console.log(`✅ Đã tạo thành công ${seededCount} conversations mẫu!`);
  } catch (error) {
    console.error('❌ Lỗi khi seed chats:', error);
  }
}
