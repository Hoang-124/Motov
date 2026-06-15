import nodemailer from 'nodemailer';

// Helper tạo SMTP Transporter dùng chung
const getTransporter = async () => {
  const useSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (useSMTP) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dynamic fallback to Ethereal Mail in development
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

// Log thông báo test nếu dùng Ethereal Mail
const logEtherealMail = (info: any, email: string) => {
  const useSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!useSMTP) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('---------------------------------------------------------');
    console.log(`✉️ Ethereal Test Mail Sent to: ${email}`);
    console.log(`🔗 Preview URL: ${previewUrl}`);
    console.log('---------------------------------------------------------');
    return previewUrl || false;
  }
  return true;
};

// Interface cho chi tiết Booking phục vụ gửi email
export interface EmailBookingDetails {
  bookingCode: string;
  vehicleName: string;
  pickupDateTime: Date;
  returnDateTime: Date;
  pickupLocation: string;
  totalAmount: number;
  rentalDays: number;
  discountAmount?: number;
  cancelReason?: string;
}

// 1. Gửi email Reset mật khẩu (Đã có sẵn)
export const sendPasswordReset = async (email: string, token: string): Promise<string | boolean> => {
  const transporter = await getTransporter();
  const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: 'Khôi phục mật khẩu - Motov',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #27272a; border-radius: 8px; background-color: #09090b; color: #fff;">
        <h2 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 10px; text-align: center; font-weight: 900; letter-spacing: 1px;">MOTOV</h2>
        <p style="color: #e4e4e7; font-size: 15px;">Xin chào,</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Bạn nhận được email này vì bạn (hoặc ai đó) đã gửi yêu cầu đặt lại mật khẩu cho tài khoản tại hệ thống cho thuê xe máy Motov.</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Vui lòng nhấn vào liên kết dưới đây để thiết lập lại mật khẩu mới cho tài khoản của bạn (liên kết này có giá trị trong vòng 30 phút):</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" style="background-color: #ccff00; color: #000; padding: 14px 28px; font-weight: bold; border-radius: 50px; text-decoration: none; display: inline-block; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 0 15px rgba(204, 255, 0, 0.4);">ĐẶT LẠI MẬT KHẨU</a>
        </div>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center;">Hệ thống cho thuê xe máy cao cấp Motov - Đà Nẵng</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return logEtherealMail(info, email);
};

// Helper format hiển thị tiền tệ VNĐ
const formatCurrency = (val: number) => {
  return val.toLocaleString('vi-VN') + ' VNĐ';
};

// Helper format ngày giờ
const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 2. Gửi email xác nhận đặt xe thành công (chờ duyệt) cho khách hàng
export const sendBookingCreatedEmail = async (email: string, booking: EmailBookingDetails): Promise<string | boolean> => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: `[Motov] Yêu cầu đặt xe ${booking.bookingCode} đang chờ duyệt`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #27272a; border-radius: 12px; background-color: #09090b; color: #fff;">
        <h2 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 12px; text-align: center; font-weight: 900; letter-spacing: 1px; margin-top: 0;">MOTOV BOOKING</h2>
        
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Mã Đơn Đặt Chỗ</p>
          <p style="color: #ccff00; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px; font-family: monospace;">${booking.bookingCode}</p>
          <p style="color: #fbbf24; font-size: 13px; margin: 10px 0 0 0; font-weight: bold;">⏳ Trạng thái: Đang chờ chủ xe duyệt</p>
        </div>

        <p style="color: #e4e4e7; font-size: 14px;">Xin chào,</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Yêu cầu đặt thuê xe máy của bạn đã được tiếp nhận thành công. Chủ xe đang tiến hành kiểm tra và duyệt đơn. Chi tiết đơn đặt xe:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #e4e4e7;">
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Dòng xe đặt:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${booking.vehicleName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Thời gian thuê:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${booking.rentalDays} Ngày</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Nhận xe lúc:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${formatDateTime(booking.pickupDateTime)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Trả xe lúc:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${formatDateTime(booking.returnDateTime)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Địa điểm giao nhận:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${booking.pickupLocation}</td>
          </tr>
          ${booking.discountAmount && booking.discountAmount > 0 ? `
          <tr style="border-bottom: 1px solid #27272a; color: #22c55e;">
            <td style="padding: 10px 0;">Giảm giá khuyến mãi:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold;">-${formatCurrency(booking.discountAmount)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 15px 0 10px 0; font-size: 15px; font-weight: bold; color: #ccff00;">Tổng thanh toán:</td>
            <td style="padding: 15px 0 10px 0; text-align: right; font-size: 16px; font-weight: bold; color: #ccff00;">${formatCurrency(booking.totalAmount)}</td>
          </tr>
        </table>

        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; font-style: italic; background-color: #18181b; padding: 12px; border-left: 3px solid #ccff00; border-radius: 4px;">
          * Lưu ý: Khi chủ xe phê duyệt thành công, hệ thống sẽ gửi một email xác nhận kèm thông tin liên lạc của chủ xe để bạn chủ động nhận bàn giao xe.
        </p>

        <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">Hệ thống cho thuê xe máy cao cấp Motov - Đà Nẵng</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return logEtherealMail(info, email);
};

// 3. Gửi email cảnh báo có đơn đặt xe mới cho Chủ xe
export const sendNewBookingAlertToOwnerEmail = async (email: string, booking: EmailBookingDetails): Promise<string | boolean> => {
  const transporter = await getTransporter();
  const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  const dashboardLink = `${frontendUrl}/owner/bookings`;

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: `[Motov] Yêu cầu duyệt đơn đặt xe mới: ${booking.bookingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #27272a; border-radius: 12px; background-color: #09090b; color: #fff;">
        <h2 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 12px; text-align: center; font-weight: 900; letter-spacing: 1px; margin-top: 0;">YÊU CẦU DUYỆT ĐƠN</h2>
        
        <p style="color: #e4e4e7; font-size: 14px;">Xin chào Chủ xe đối tác,</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Xe máy của bạn vừa nhận được một yêu cầu đặt chỗ mới từ khách hàng trên hệ thống Motov. Vui lòng kiểm tra thông tin và tiến hành phê duyệt hoặc từ chối đơn đặt:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #e4e4e7; background-color: #18181b; padding: 15px; border-radius: 8px; border: 1px solid #27272a;">
          <tr>
            <td style="padding: 10px 15px; color: #71717a;">Mã đơn đặt:</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #ccff00; font-family: monospace;">${booking.bookingCode}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #71717a;">Xe được đặt:</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #fff;">${booking.vehicleName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #71717a;">Thời gian thuê:</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #fff;">${booking.rentalDays} Ngày</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #71717a;">Nhận xe lúc:</td>
            <td style="padding: 10px 15px; color: #fff;">${formatDateTime(booking.pickupDateTime)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #71717a;">Trả xe lúc:</td>
            <td style="padding: 10px 15px; color: #fff;">${formatDateTime(booking.returnDateTime)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #71717a;">Địa điểm giao nhận:</td>
            <td style="padding: 10px 15px; color: #fff;">${booking.pickupLocation}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; color: #71717a; font-weight: bold;">Tổng doanh thu (tạm tính):</td>
            <td style="padding: 10px 15px; font-weight: bold; color: #ccff00; font-size: 14px;">${formatCurrency(booking.totalAmount)}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background-color: #ccff00; color: #000; padding: 14px 28px; font-weight: bold; border-radius: 50px; text-decoration: none; display: inline-block; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 0 15px rgba(204, 255, 0, 0.4);">ĐI ĐẾN TRANG DUYỆT ĐƠN</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">Hệ thống cho thuê xe máy cao cấp Motov - Đà Nẵng</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return logEtherealMail(info, email);
};

// 4. Gửi email thông báo đơn đặt xe được duyệt thành công cho khách hàng
export const sendBookingConfirmedEmail = async (email: string, booking: EmailBookingDetails): Promise<string | boolean> => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: `🎉 [Motov] Đơn đặt xe ${booking.bookingCode} đã được phê duyệt thành công!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #27272a; border-radius: 12px; background-color: #09090b; color: #fff;">
        <h2 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 12px; text-align: center; font-weight: 900; letter-spacing: 1px; margin-top: 0;">ĐƠN HÀNG ĐÃ ĐƯỢC PHÊ DUYỆT!</h2>
        
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Mã Đơn Đặt Chỗ</p>
          <p style="color: #22c55e; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px; font-family: monospace;">${booking.bookingCode}</p>
          <p style="color: #22c55e; font-size: 13px; margin: 10px 0 0 0; font-weight: bold;">✓ Trạng thái: Đã xác nhận thành công</p>
        </div>

        <p style="color: #e4e4e7; font-size: 14px;">Xin chào,</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Chúc mừng bạn! Yêu cầu đặt thuê xe máy của bạn đã được Chủ xe phê duyệt và chuẩn bị đầy đủ các điều kiện bàn giao xe. Chi tiết đơn đặt xe:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #e4e4e7;">
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Dòng xe thuê:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${booking.vehicleName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Thời gian thuê:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${booking.rentalDays} Ngày</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Nhận xe lúc:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${formatDateTime(booking.pickupDateTime)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Trả xe lúc:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${formatDateTime(booking.returnDateTime)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Địa điểm giao nhận:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${booking.pickupLocation}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0 10px 0; font-size: 15px; font-weight: bold; color: #22c55e;">Tổng thanh toán:</td>
            <td style="padding: 15px 0 10px 0; text-align: right; font-size: 16px; font-weight: bold; color: #22c55e;">${formatCurrency(booking.totalAmount)}</td>
          </tr>
        </table>

        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 15px; margin: 25px 0;">
          <h4 style="color: #22c55e; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">ℹ️ Hướng dẫn bàn giao nhận xe</h4>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
            1. Vui lòng chuẩn bị sẵn **Căn cước công dân (CCCD)** và **Giấy phép lái xe (GPLX)** hợp lệ để đối chiếu khi nhận xe.
          </p>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0;">
            2. Đại diện của Motov hoặc Chủ xe sẽ liên hệ trực tiếp với bạn qua số điện thoại đăng ký trong ít phút để sắp xếp điểm giao xe cụ thể.
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">Hệ thống cho thuê xe máy cao cấp Motov - Đà Nẵng</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return logEtherealMail(info, email);
};

// 5. Gửi email thông báo đơn đặt xe bị hủy (thất bại) cho khách hàng
export const sendBookingCancelledEmail = async (email: string, booking: EmailBookingDetails): Promise<string | boolean> => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: `❌ [Motov] Thông báo hủy đơn đặt xe: ${booking.bookingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #27272a; border-radius: 12px; background-color: #09090b; color: #fff;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 12px; text-align: center; font-weight: 900; letter-spacing: 1px; margin-top: 0;">HỦY ĐƠN ĐẶT XE</h2>
        
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Mã Đơn Đặt Chỗ</p>
          <p style="color: #ef4444; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px; font-family: monospace;">${booking.bookingCode}</p>
          <p style="color: #ef4444; font-size: 13px; margin: 10px 0 0 0; font-weight: bold;">❌ Trạng thái: Đã bị hủy</p>
        </div>

        <p style="color: #e4e4e7; font-size: 14px;">Xin chào,</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Rất tiếc, đơn đặt thuê xe máy của bạn đã bị hủy bỏ trên hệ thống Motov. Thông tin chi tiết:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #e4e4e7;">
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Dòng xe:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${booking.vehicleName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Lý do hủy đơn:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ef4444;">${booking.cancelReason || 'Người dùng yêu cầu hủy hoặc Chủ xe từ chối duyệt'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 10px 0; color: #71717a;">Giá trị đơn đặt:</td>
            <td style="padding: 10px 0; text-align: right; color: #fff;">${formatCurrency(booking.totalAmount)}</td>
          </tr>
        </table>

        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; font-style: italic;">
          Nếu bạn có bất kỳ câu hỏi nào hoặc muốn chọn một dòng xe thay thế khác, vui lòng truy cập trang chủ của Motov hoặc liên hệ tổng đài hỗ trợ của chúng tôi để được xử lý nhanh chóng.
        </p>

        <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">Hệ thống cho thuê xe máy cao cấp Motov - Đà Nẵng</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return logEtherealMail(info, email);
};

export const sendEmailVerification = async (email: string, token: string): Promise<string | boolean> => {
  let transporter;

  const useSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (useSMTP) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: 'Kích hoạt tài khoản - Motov',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #09090b; color: #fff;">
        <h2 style="color: #ccff00; border-bottom: 2px solid #ccff00; padding-bottom: 10px; text-align: center; font-weight: 900; letter-spacing: 1px;">MOTOV</h2>
        <p style="color: #e4e4e7; font-size: 15px;">Xin chào,</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản tại hệ thống cho thuê xe máy Motov.</p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Vui lòng nhấn vào liên kết dưới đây để kích hoạt tài khoản của bạn (liên kết này có giá trị trong vòng 24 giờ):</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verifyLink}" style="background-color: #ccff00; color: #000; padding: 14px 28px; font-weight: bold; border-radius: 50px; text-decoration: none; display: inline-block; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 0 15px rgba(204, 255, 0, 0.4);">KÍCH HOẠT TÀI KHOẢN</a>
        </div>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Nếu bạn không thực hiện đăng ký trên hệ thống của chúng tôi, bạn có thể yên tâm bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;" />
        <p style="font-size: 11px; color: #52525b; text-align: center;">Hệ thống cho thuê xe máy cao cấp Motov - Đà Nẵng</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!useSMTP) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('---------------------------------------------------------');
    console.log(`✉️ Ethereal Test Mail Sent (Verification) to: ${email}`);
    console.log(`🔗 Preview URL: ${previewUrl}`);
    console.log('---------------------------------------------------------');
    return previewUrl || false;
  }
  return true;
};
