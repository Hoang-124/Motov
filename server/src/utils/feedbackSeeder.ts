import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';

// Predefined realistic feedback reviews for each bike type/name
const REVIEWS_POOL = [
  {
    rating: 5,
    content: 'Xe chạy êm ru, sạc đầy pin đi thoải mái cả ngày. Nhân viên hỗ trợ giao xe siêu nhanh và thân thiện!'
  },
  {
    rating: 5,
    content: 'Xe mới tinh, phanh ABS hoạt động nhạy bén, cảm giác lái an tâm. Sẽ tiếp tục thuê khi quay lại Đà Nẵng.'
  },
  {
    rating: 4,
    content: 'Dịch vụ tốt, xe đi mượt mà. Tuy nhiên cốp xe hơi nhỏ một chút nhưng bù lại xe rất tiết kiệm xăng.'
  },
  {
    rating: 5,
    content: 'Thiết kế xe rất thời thượng, máy bốc, chụp ảnh sống ảo siêu đẹp. Các bạn hỗ trợ thủ tục vô cùng nhanh gọn.'
  },
  {
    rating: 5,
    content: 'Xe côn đi cực bốc, phuộc nhún êm ái, chạy đường dài không mỏi. Giá cả thuê xe rất hợp lý so với chất lượng.'
  },
  {
    rating: 4,
    content: 'Xe đi rất đầm máy và ổn định. Giao xe đúng giờ, bình xăng đầy ắp. Rất hài lòng với trải nghiệm này.'
  },
  {
    rating: 5,
    content: 'Dịch vụ của Motov làm mình rất ấn tượng. Ứng dụng mượt mà, xe sạch đẹp như mới. 10 điểm không có nhưng!'
  }
];

export async function seedFeedbacks() {
  try {
    const feedbackCount = await Feedback.countDocuments();
    if (feedbackCount > 0) {
      console.log('ℹ️ Feedbacks đã tồn tại trong database. Bỏ qua seeding.');
      return;
    }

    console.log('🌱 Đang bắt đầu seeding feedbacks...');

    // 1. Tìm các user mẫu
    const customerUser = await User.findOne({ email: 'khachhang@motov.com' });
    const adminUser = await User.findOne({ email: 'admin@motov.com' });
    
    if (!customerUser || !adminUser) {
      console.log('⚠️ Không tìm thấy người dùng mẫu khachhang@motov.com hoặc admin@motov.com. Không thể seed.');
      return;
    }

    // 2. Lấy danh sách xe trong hệ thống
    const vehicles = await Vehicle.find({ isDeleted: { $ne: true } });
    if (vehicles.length === 0) {
      console.log('⚠️ Không tìm thấy xe nào trong hệ thống để tạo đơn và feedback.');
      return;
    }

    // 3. Xử lý các đơn hàng hiện có ở trạng thái Completed nhưng chưa có feedback
    const existingCompletedBookings = await Booking.find({ status: 'Completed' });
    console.log(`Tìm thấy ${existingCompletedBookings.length} đơn hàng Completed sẵn có.`);
    
    let seededCount = 0;
    for (const booking of existingCompletedBookings) {
      const fbExists = await Feedback.findOne({ bookingId: booking._id });
      if (!fbExists) {
        const review = REVIEWS_POOL[seededCount % REVIEWS_POOL.length];
        
        await Feedback.create({
          userId: booking.userId,
          vehicleId: booking.vehicleId,
          bookingId: booking._id,
          rating: review.rating,
          content: review.content
        });
        seededCount++;
      }
    }
    console.log(`✅ Đã tạo feedback cho ${seededCount} đơn hàng Completed sẵn có.`);

    // 4. Nếu số lượng feedback tạo ra vẫn ít (ví dụ dưới 5), tự động tạo thêm đơn Completed mẫu và feedback tương ứng
    // Điều này đảm bảo khi khởi động dự án từ đầu, hệ thống sẽ có sẵn dữ liệu review phong phú.
    const desiredTotal = 6;
    const needed = desiredTotal - await Feedback.countDocuments();
    
    if (needed > 0) {
      console.log(`Hệ thống cần thêm ${needed} feedback để làm phong phú giao diện. Đang tạo đơn và review mẫu...`);
      
      // Chọn ra các xe khác nhau để tạo feedback phong phú
      const vehiclesToReview = vehicles.slice(0, Math.min(needed, vehicles.length));
      
      for (let i = 0; i < vehiclesToReview.length; i++) {
        const vehicle = vehiclesToReview[i];
        
        // Tạo booking code độc nhất
        const randomStr = Math.floor(1000 + Math.random() * 9000);
        const bookingCode = `BK-SEED-${vehicle.vehicleModel.substring(0, 3).toUpperCase()}-${randomStr}`;
        
        // Xác định thông tin ngày thuê
        const pickupDate = new Date();
        pickupDate.setDate(pickupDate.getDate() - 5 - i); // Đã đi 5 ngày trước
        const returnDate = new Date(pickupDate);
        returnDate.setDate(returnDate.getDate() + 2); // Thuê 2 ngày
        
        // Tạo đơn Completed
        const booking = await Booking.create({
          userId: customerUser._id,
          vehicleId: vehicle._id,
          vehicleSnapshot: {
            name: vehicle.vehicleModel,
            image: vehicle.imageUrls[0] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
            rentalPrice: vehicle.rentalPrice
          },
          pickupDateTime: pickupDate,
          returnDateTime: returnDate,
          pickupLocation: { address: 'Trụ sở Motov Đà Nẵng', coordinates: [108.22, 16.068] },
          returnLocation: { address: 'Trụ sở Motov Đà Nẵng', coordinates: [108.22, 16.068] },
          totalAmount: vehicle.rentalPrice * 2,
          depositAmount: Math.round(vehicle.rentalPrice * 2 * 0.3),
          remainingAmount: Math.round(vehicle.rentalPrice * 2 * 0.7),
          status: 'Completed',
          bookingCode,
          startOdometer: vehicle.odometer - 150,
          endOdometer: vehicle.odometer,
          isPaid: true
        });

        // Tạo feedback tương ứng cho đơn hàng này
        const review = REVIEWS_POOL[(seededCount + i) % REVIEWS_POOL.length];
        
        // Tạo lời bình cụ thể hơn nếu khớp tên xe
        let customizedContent = review.content;
        if (vehicle.vehicleModel.includes('VinFast')) {
          customizedContent = `Thuê chiếc ${vehicle.vehicleModel} này đi siêu sướng, chạy cực êm không tiếng ồn. Pin trạm sạc quanh thành phố Đà Nẵng cũng rất tiện lợi!`;
        } else if (vehicle.vehicleModel.includes('Vision') || vehicle.vehicleModel.includes('Lead') || vehicle.vehicleModel.includes('Grande')) {
          customizedContent = `Xe ${vehicle.vehicleModel} nhỏ gọn, thích hợp cho các bạn nữ đi lại trong phố. Xe rất tiết kiệm xăng và cốp rộng thoải mái đựng đồ.`;
        } else if (vehicle.vehicleModel.includes('Vespa')) {
          customizedContent = `Chiếc Vespa ${vehicle.vehicleModel} này chụp hình check-in cực kỳ sang xịn mịn luôn nha. Xe chạy êm, chủ xe hỗ trợ siêu nhiệt tình.`;
        } else if (vehicle.vehicleModel.includes('Exciter') || vehicle.vehicleModel.includes('NVX') || vehicle.vehicleModel.includes('Winner')) {
          customizedContent = `Máy bốc, ga nhẹ, phanh đĩa trước sau ăn. Đi đường trường hay phượt đèo Hải Vân bằng xe ${vehicle.vehicleModel} này thì đúng bài!`;
        }

        await Feedback.create({
          userId: customerUser._id,
          vehicleId: vehicle._id,
          bookingId: booking._id,
          rating: i % 3 === 0 ? 4 : 5, // Trộn lẫn đánh giá 4 và 5 sao
          content: customizedContent
        });
      }
      
      console.log(`✅ Đã tạo thêm đơn hàng và feedback mẫu thành công!`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi seed feedbacks:', error);
  }
}
