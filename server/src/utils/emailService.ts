import nodemailer from 'nodemailer';

export const sendPasswordReset = async (email: string, token: string): Promise<string | boolean> => {
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
    // Dynamic fallback to Ethereal Mail in development
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

  const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3001';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Motov System" <noreply@motov.com>',
    to: email,
    subject: 'Khôi phục mật khẩu - Motov',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #09090b; color: #fff;">
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
