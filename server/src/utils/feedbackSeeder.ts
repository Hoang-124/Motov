import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback.js';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

// Pool of Vietnamese names and corresponding avatars for diverse reviewers
const REVIEWER_PROFILES = [
  { firstName: 'Thành', lastName: 'Nguyễn Tiến', username: 'thanh.nguyen', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Lan', lastName: 'Phạm Thị', username: 'lan.pham', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Nam', lastName: 'Trần Hoài', username: 'nam.tran', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Hương', lastName: 'Lê Mai', username: 'huong.le', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Dũng', lastName: 'Hoàng Quốc', username: 'dung.hoang', avatarUrl: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Vy', lastName: 'Đỗ Thảo', username: 'vy.do', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Tuấn', lastName: 'Bùi Anh', username: 'tuan.bui', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120' },
  { firstName: 'Trang', lastName: 'Nguyễn Huyền', username: 'trang.nguyen', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' }
];

// Contextual review comments based on vehicle style
const REVIEWS_BY_TYPE: Record<string, Array<{ rating: number; content: string }>> = {
  electric: [
    { rating: 5, content: 'Xe điện đi cực kỳ êm và mượt, không hề có tiếng ồn động cơ. Hệ thống pin còn rất mới, đi cả ngày quanh Đà Nẵng không lo hết điện. Rất đáng trải nghiệm!' },
    { rating: 5, content: 'Xe sạch sẽ, được sạc đầy 100% pin khi bàn giao. Nhân viên của Motov nhiệt tình hướng dẫn cách sạc pin và vận hành xe rất chu đáo.' },
    { rating: 4, content: 'Xe chạy êm và tiết kiệm. Tuy nhiên cốp xe hơi nhỏ hơn mong đợi một chút, bù lại trải nghiệm lái xe điện rất hiện đại.' }
  ],
  scooter: [
    { rating: 5, content: 'Xe tay ga đi rất tiện lợi, cốp siêu rộng tha hồ đựng balo và đồ mua sắm. Xe chạy đầm, máy êm và tiết kiệm xăng cực kỳ.' },
    { rating: 5, content: 'Giá thuê xe rất tốt so với chất lượng. Xe chạy rất mượt, phanh và lốp xe còn rất mới, đi lại cực kỳ an tâm.' },
    { rating: 4, content: 'Xe chạy tốt, mẫu mã đẹp và thời trang. Thủ tục nhận xe và trả xe của hệ thống rất nhanh chóng và chuyên nghiệp.' }
  ],
  manual: [
    { rating: 5, content: 'Xe số chạy bốc, máy khỏe đi rất tiết kiệm nhiên liệu. Rất thích hợp để đi phượt đèo Hải Vân hay các địa điểm xa thành phố.' },
    { rating: 5, content: 'Phuộc nhún xe êm, xích xe đã được tra dầu đầy đủ chạy rất mượt mà. Xe khỏe leo dốc rất tốt.' },
    { rating: 4, content: 'Xe đi ổn định, máy khỏe, tuy nhiên ngoại hình xe hơi xước nhẹ một chút. Tổng quan dịch vụ vẫn rất tốt, hỗ trợ chu đáo.' }
  ],
  sport: [
    { rating: 5, content: 'Xe côn tay chạy cực kỳ bốc, tiếng máy giòn giã nghe rất thích. Hệ thống phanh ABS hoạt động nhạy, xe bảo dưỡng tốt.' },
    { rating: 5, content: 'Trải nghiệm lái tuyệt vời, dáng xe thể thao mạnh mẽ. Xe đi đầm và đè cua rất vững vàng. Dịch vụ tuyệt vời từ Motov!' },
    { rating: 4, content: 'Xe rất bốc và ngầu, máy móc hoạt động hoàn hảo. Phù hợp cho những ai đam mê tốc độ và thích trải nghiệm cảm giác mạnh.' }
  ]
};

export async function seedFeedbacks() {
  try {
    console.log('🌱 Đang bắt đầu kiểm tra và seed dữ liệu mẫu feedbacks...');

    // 1. Tạo hoặc tìm các tài khoản người đánh giá đa dạng
    const passwordHash = await bcrypt.hash('customer123', 10);
    const reviewers: any[] = [];
    
    for (const profile of REVIEWER_PROFILES) {
      const email = `${profile.username}@motov-reviewer.com`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          username: profile.username,
          email,
          passwordHash,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: `0987${Math.floor(100000 + Math.random() * 900000)}`,
          roles: ['Customer'],
          status: 'Active',
          identityStatus: 'Verified',
          avatarUrl: profile.avatarUrl
        });
        console.log(`👤 Đã tạo tài khoản reviewer: ${user.username}`);
      }
      reviewers.push(user);
    }

    // Lấy thêm các user mặc định sẵn có
    const defaultCustomer = await User.findOne({ email: 'khachhang@motov.com' });
    const defaultAdmin = await User.findOne({ email: 'admin@motov.com' });
    if (defaultCustomer) reviewers.push(defaultCustomer);
    if (defaultAdmin) reviewers.push(defaultAdmin);

    // 2. Lấy danh sách xe
    const vehicles = await Vehicle.find({ isDeleted: { $ne: true } });
    if (vehicles.length === 0) {
      console.log('⚠️ Không tìm thấy xe nào trong hệ thống để tạo review.');
      return;
    }

    // 3. Quét qua TẤT CẢ các xe để đảm bảo mỗi xe đều có ít nhất 1-2 reviews mẫu
    let totalBookingsSeeded = 0;
    let totalFeedbacksSeeded = 0;

    for (const vehicle of vehicles) {
      // Đếm số feedback hiện có của xe này
      const currentFbCount = await Feedback.countDocuments({ vehicleId: vehicle._id });
      
      // Nếu xe chưa có review, hãy tạo 1 đến 2 reviews mẫu cho nó
      if (currentFbCount === 0) {
        const numReviewsToCreate = Math.floor(Math.random() * 2) + 1; // 1 hoặc 2 reviews
        
        for (let r = 0; r < numReviewsToCreate; r++) {
          // Lấy ngẫu nhiên reviewer
          const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
          
          // Tạo booking code độc nhất
          const randomStr = Math.floor(1000 + Math.random() * 9000);
          const bookingCode = `BK-SEED-${vehicle.vehicleModel.substring(0, 3).toUpperCase()}-${randomStr}`;
          
          // Xác định ngày thuê
          const pickupDate = new Date();
          pickupDate.setDate(pickupDate.getDate() - 10 - r * 5); // Đã kết thúc nhiều ngày trước
          const returnDate = new Date(pickupDate);
          returnDate.setDate(returnDate.getDate() + 2); // Thuê 2 ngày
          
          // Tạo đơn đặt xe đã hoàn thành (Completed Booking)
          const booking = await Booking.create({
            userId: reviewer._id,
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
          totalBookingsSeeded++;

          // Xác định nhóm review dựa trên loại xe
          let reviewPool = REVIEWS_BY_TYPE.scooter; // Mặc định là xe ga
          
          const modelLower = vehicle.vehicleModel.toLowerCase();
          const transmission = vehicle.transmissionType;
          
          if (modelLower.includes('vinfast') || modelLower.includes('klara') || modelLower.includes('evo') || modelLower.includes('feliz')) {
            reviewPool = REVIEWS_BY_TYPE.electric;
          } else if (transmission === 'Manual' && (modelLower.includes('exciter') || modelLower.includes('nvx') || modelLower.includes('winner') || modelLower.includes('cb150') || modelLower.includes('r15'))) {
            reviewPool = REVIEWS_BY_TYPE.sport;
          } else if (transmission === 'Manual' || transmission === 'Semi-Automatic') {
            reviewPool = REVIEWS_BY_TYPE.manual;
          }

          const reviewTemplate = reviewPool[Math.floor(Math.random() * reviewPool.length)];
          
          // Tạo nội dung đánh giá cụ thể hơn bằng cách ghép tên xe
          let content = reviewTemplate.content;
          if (content.includes('xe điện') && !modelLower.includes('vinfast')) {
            content = content.replace('xe điện', `xe ${vehicle.vehicleModel}`);
          }
          
          await Feedback.create({
            userId: reviewer._id,
            vehicleId: vehicle._id,
            bookingId: booking._id,
            rating: reviewTemplate.rating,
            content: `[Dữ liệu mẫu] ${content}`,
            createdAt: returnDate, // Đánh giá ngay sau khi trả xe
            updatedAt: returnDate
          });
          totalFeedbacksSeeded++;
        }
      }
    }

    if (totalFeedbacksSeeded > 0) {
      console.log(`✅ Đã tạo thành công ${totalBookingsSeeded} đơn hàng và ${totalFeedbacksSeeded} đánh giá mẫu cho toàn bộ các xe chưa có review!`);
    } else {
      console.log('ℹ️ Tất cả các xe trong hệ thống đã có đánh giá mẫu. Không cần tạo thêm.');
    }
  } catch (error) {
    console.error('❌ Lỗi khi seed feedbacks:', error);
  }
}
