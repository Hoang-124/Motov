import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { EmailVerificationToken } from '../models/EmailVerificationToken.js';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { mapBackendRoleToFrontend, mapFrontendRoleToBackend } from '../utils/roleMapper.js';
import { sendPasswordReset, sendEmailVerification, sendOwnerRequestNotification } from '../utils/emailService.js';
import firebaseAdmin from '../config/firebase.js';

import dotenv from 'dotenv';
import path from 'path';

// Tell dotenv to look one folder up from the current working directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// FIX [SEC-1]: Throw at startup if JWT_SECRET is not configured — never use a fallback literal
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Đăng ký tài khoản
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber, role } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Username, Email, Mật khẩu)' });
    }

    // 1. Validate Username
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập phải dài từ 3 đến 30 ký tự.' });
    }
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập chỉ được chứa các ký tự chữ cái không dấu, số, dấu gạch dưới (_) hoặc gạch ngang (-).' });
    }

    // 2. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Địa chỉ email không đúng định dạng.' });
    }

    // 3. Validate Password
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải chứa ít nhất 8 ký tự.' });
    }
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[\W_]/.test(password);
    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt.'
      });
    }

    // 4. Validate First Name & Last Name if provided
    const nameRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
    if (firstName && nameRegex.test(firstName)) {
      return res.status(400).json({ success: false, message: 'Tên không được chứa số hoặc ký tự đặc biệt.' });
    }
    if (lastName && nameRegex.test(lastName)) {
      return res.status(400).json({ success: false, message: 'Họ không được chứa số hoặc ký tự đặc biệt.' });
    }

    // 5. Validate Phone Number if provided
    if (phoneNumber && phoneNumber.trim() !== '') {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không đúng định dạng Việt Nam.' });
      }
    }

    // Kiểm tra trùng lặp email hoặc username
    const query: any[] = [{ username }];
    const hasEmail = email && typeof email === 'string' && email.trim() !== "";
    if (hasEmail) {
      query.push({ email: email.trim() });
    }

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: hasEmail && existingUser.email === email.trim()
          ? 'Email này đã được sử dụng bởi một tài khoản khác' 
          : 'Tên đăng nhập này đã được sử dụng'
      });
    }

    // Kiểm tra trùng lặp trong các yêu cầu đăng ký chưa xác thực (đang chờ kích hoạt)
    if (hasEmail) {
      const pendingUser = await EmailVerificationToken.findOne({
        isUsed: false,
        expiryTime: { $gt: new Date() },
        $or: [
          { 'pendingUserData.username': username },
          { 'pendingUserData.email': email.trim() }
        ]
      });
      if (pendingUser) {
        return res.status(400).json({
          success: false,
          message: pendingUser.pendingUserData?.email === email.trim()
            ? 'Email này đã được đăng ký và đang chờ xác minh.' 
            : 'Tên đăng nhập này đã được đăng ký và đang chờ xác minh.'
        });
      }
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // FIX [SEC-4]: Whitelist public registration roles — only 'customer' and 'owner' are allowed
    const allowedPublicRoles = ['customer', 'owner'];
    const safeRole = allowedPublicRoles.includes(role) ? role : 'customer';
    const backendRole = mapFrontendRoleToBackend(safeRole);
    const assignedRoles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[] = [backendRole];

    if (hasEmail) {
      // Luồng cần xác thực Email: Lưu thông tin tạm thời và gửi link xác nhận (Không tạo User ngay)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await EmailVerificationToken.create({
        token: verificationToken,
        pendingUserData: {
          username,
          email: email.trim(),
          passwordHash,
          firstName: firstName || '',
          lastName: lastName || '',
          phoneNumber: phoneNumber || '',
          roles: assignedRoles
        },
        expiryTime,
        isUsed: false
      });

      const previewUrl = await sendEmailVerification(email.trim(), verificationToken);

      const displayName = firstName && lastName
        ? `${lastName} ${firstName}`
        : (firstName || lastName || username);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
        needsVerification: true,
        previewUrl: typeof previewUrl === 'string' ? previewUrl : undefined,
        user: {
          username,
          email: email.trim(),
          name: displayName,
          role: mapBackendRoleToFrontend(assignedRoles),
          phoneNumber: phoneNumber || '',
          avatarUrl: '',
          status: 'Unverified'
        }
      });
    }

    // Sinh token JWT trực tiếp nếu không điền email (đăng nhập trực tiếp)
    const newUser = new User({
      username,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || '',
      roles: assignedRoles,
      status: 'Active'
    });

    const savedUser = await newUser.save();

    const displayName = savedUser.firstName && savedUser.lastName
      ? `${savedUser.lastName} ${savedUser.firstName}`
      : (savedUser.firstName || savedUser.lastName || savedUser.username);

    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, roles: savedUser.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        name: displayName,
        role: mapBackendRoleToFrontend(savedUser.roles),
        phoneNumber: savedUser.phoneNumber,
        avatarUrl: savedUser.avatarUrl || '',
        status: savedUser.status
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ khi đăng ký tài khoản', error: error.message });
  }
};

// Đăng nhập tài khoản
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Email/Tên đăng nhập và Mật khẩu' });
    }

    // Tìm user bằng email hoặc tên đăng nhập
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên' });
    }

    if (user.status === 'Unverified') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.' });
    }

    // So sánh mật khẩu
    if (!user.passwordHash) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tài khoản này được đăng ký thông qua Google. Vui lòng chọn đăng nhập bằng Google.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // Sinh token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const displayName = user.firstName && user.lastName
      ? `${user.lastName} ${user.firstName}`
      : (user.firstName || user.lastName || user.username);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: displayName,
        role: mapBackendRoleToFrontend(user.roles),
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        dob: user.dob || '',
        status: user.status,
        identityStatus: user.identityStatus || null,
        ownerRequestStatus: user.ownerRequestStatus || 'None',
        ownerContractSigned: user.ownerContractSigned || false,
        ownerContractSignedAt: user.ownerContractSignedAt || null,
        ownerContractText: user.ownerContractText || null,
        ownerRejectReason: user.ownerRejectReason || '',
        bankName: user.bankName || '',
        bankAccountNumber: user.bankAccountNumber || '',
        bankAccountOwner: user.bankAccountOwner || '',
        ownerSignature: user.ownerSignature || ''
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ khi đăng nhập', error: error.message });
  }
};

// Lấy thông tin user hiện tại qua token
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    const displayName = user.firstName && user.lastName
      ? `${user.lastName} ${user.firstName}`
      : (user.firstName || user.lastName || user.username);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: displayName,
        role: mapBackendRoleToFrontend(user.roles),
        phoneNumber: user.phoneNumber || '',
        avatarUrl: user.avatarUrl || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        dob: user.dob || '',
        status: user.status,
        identityStatus: user.identityStatus || 'Unverified',
        identityRejectReason: user.identityRejectReason || '',
        citizenIdInfo: user.citizenIdInfo,
        ownerRequestStatus: user.ownerRequestStatus || 'None',
        ownerContractSigned: user.ownerContractSigned || false,
        ownerContractSignedAt: user.ownerContractSignedAt || null,
        ownerContractText: user.ownerContractText || null,
        ownerRejectReason: user.ownerRejectReason || '',
        bankName: user.bankName || '',
        bankAccountNumber: user.bankAccountNumber || '',
        bankAccountOwner: user.bankAccountOwner || '',
        ownerSignature: user.ownerSignature || ''
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ khi lấy thông tin người dùng', error: error.message });
  }
};

// Nâng cấp tài khoản lên Chủ xe đối tác (Gửi yêu cầu chờ duyệt)
export const becomeOwner = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    // Kiểm tra trạng thái eKYC
    if (user.identityStatus !== 'Verified') {
      return res.status(400).json({
        success: false,
        message: 'Bạn phải hoàn thành xác thực danh tính (eKYC) và được phê duyệt trước khi ký hợp đồng đối tác chủ xe!'
      });
    }

    // FIX [BUG-8]: Idempotency guard — don't re-process if already an Owner
    if (user.roles.includes('Owner')) {
      return res.status(400).json({ success: false, message: 'Tài khoản của bạn đã là Chủ xe đối tác' });
    }

    if (user.ownerRequestStatus === 'Pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu đăng ký làm Chủ xe của bạn đang chờ phê duyệt.' });
    }

    const { bankName, bankAccountNumber, bankAccountOwner, ownerSignature } = req.body;

    if (!bankName || !bankAccountNumber || !bankAccountOwner) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin tài khoản ngân hàng để nhận doanh thu.' });
    }

    if (!ownerSignature) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp chữ ký điện tử của bạn.' });
    }

    const displayName = user.firstName && user.lastName
      ? `${user.lastName} ${user.firstName}`
      : (user.firstName || user.lastName || user.username);

    // Biên soạn hợp đồng đối tác điện tử dựa trên thông tin cá nhân hiện tại và thông tin ngân hàng
    const contractText = `HỢP ĐỒNG HỢP TÁC KINH DOANH (ĐỐI TÁC CHỦ XE)
Số: MOTOV-OWNER-${user._id.toString().slice(-6).toUpperCase()}/${new Date().getFullYear()}

Hợp đồng này được ký kết vào ngày ${new Date().toLocaleDateString('vi-VN')} giữa các bên:

BÊN A: CÔNG TY CỔ PHẦN DỊCH VỤ MOTOV (MOTOV INC.)
- Đại diện: Ban Giám Đốc
- Địa chỉ: Tòa nhà Motov, số 124 Đường 3/2, Quận Hải Châu, Đà Nẵng
- Điện thoại: 1900 8198
- Email: partner@motov.com

BÊN B: ĐỐI TÁC CHỦ XE
- Họ và tên: ${user.citizenIdInfo?.fullName || displayName}
- Số CCCD/CMND: ${user.citizenIdInfo?.idNumber || 'N/A'}
- Số điện thoại: ${user.phoneNumber || 'N/A'}
- Email: ${user.email || 'N/A'}
- Địa chỉ thường trú: ${user.citizenIdInfo?.address || 'N/A'}

THÔNG TIN TÀI KHOẢN THANH TOÁN (BÊN B):
- Ngân hàng: ${bankName}
- Số tài khoản: ${bankAccountNumber}
- Chủ tài khoản: ${bankAccountOwner}

ĐIỀU KHOẢN HỢP TÁC:
1. Bên B đồng ý đưa các phương tiện xe máy thuộc quyền sở hữu/sử dụng hợp pháp của mình lên hệ thống Motov để thực hiện dịch vụ cho thuê xe máy tự lái.
2. Bên B cam kết các phương tiện cung cấp luôn trong tình trạng hoạt động tốt, được bảo dưỡng định kỳ và có đầy đủ giấy tờ pháp lý (Đăng ký xe, Bảo hiểm trách nhiệm dân sự còn hiệu lực).
3. Doanh thu từ hoạt động cho thuê xe sẽ được phân chia theo tỷ lệ: Bên B nhận 85%, Bên A nhận 15% phí dịch vụ nền tảng.
4. Bên A chịu trách nhiệm vận hành nền tảng kết nối, quảng bá dịch vụ và thu hộ tiền thuê xe từ khách hàng.
5. Bên B cam kết tuân thủ nghiêm ngặt quy trình bàn giao, nhận lại xe và xử lý sự cố theo đúng quy định của Motov.
6. Hợp đồng có hiệu lực kể từ ngày Bên A (Admin hoặc Nhân viên đại diện) phê duyệt tài khoản của Bên B thành trạng thái Chủ xe (Owner).

BÊN B ĐÃ ĐỌC, HIỂU RÕ VÀ CAM KẾT ĐỒNG Ý KÝ KẾT HỢP ĐỒNG ĐIỆN TỬ NÀY.`;

    // Cập nhật thông tin yêu cầu và lưu hợp đồng
    user.ownerRequestStatus = 'Pending';
    user.ownerContractSigned = true;
    user.ownerContractSignedAt = new Date();
    user.ownerContractText = contractText;
    user.bankName = bankName;
    user.bankAccountNumber = bankAccountNumber;
    user.bankAccountOwner = bankAccountOwner;
    user.ownerSignature = ownerSignature;
    user.ownerRejectReason = '';
    
    const savedUser = await user.save();

    // Gửi email và thông báo cho tất cả Admin
    try {
      const admins = await User.find({ roles: 'Admin' });
      for (const admin of admins) {
        // Tạo thông báo in-app
        await Notification.create({
          userId: admin._id,
          title: 'Có yêu cầu duyệt đối tác Chủ xe mới',
          message: `Đối tác ${displayName} đã ký hợp đồng đối tác chủ xe và đang chờ phê duyệt.`,
          type: 'System'
        });

        // Gửi email thông báo
        if (admin.email) {
          await sendOwnerRequestNotification(admin.email, {
            name: displayName,
            email: user.email || 'N/A',
            phoneNumber: user.phoneNumber || 'N/A',
            bankName
          });
        }
      }
    } catch (notiErr) {
      console.error('Lỗi khi tạo thông báo/gửi mail cho Admin khi đối tác đăng ký chủ xe:', notiErr);
    }

    res.status(200).json({
      success: true,
      message: 'Ký hợp đồng đối tác và gửi đăng ký thành công! Vui lòng chờ nhân viên phê duyệt.',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        name: displayName,
        role: mapBackendRoleToFrontend(savedUser.roles),
        phoneNumber: savedUser.phoneNumber,
        status: savedUser.status,
        ownerRequestStatus: savedUser.ownerRequestStatus,
        ownerContractSigned: savedUser.ownerContractSigned,
        ownerContractSignedAt: savedUser.ownerContractSignedAt,
        ownerContractText: savedUser.ownerContractText,
        ownerRejectReason: savedUser.ownerRejectReason,
        bankName: savedUser.bankName,
        bankAccountNumber: savedUser.bankAccountNumber,
        bankAccountOwner: savedUser.bankAccountOwner,
        ownerSignature: savedUser.ownerSignature
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi nâng cấp lên chủ xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký làm chủ xe đối tác', error: error.message });
  }
};

// Lấy danh sách yêu cầu đăng ký làm chủ xe (Staff/Admin)
export const getOwnerRequests = async (req: AuthRequest, res: Response) => {
  try {
    // Chỉ cho phép Staff hoặc Admin
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem các yêu cầu này' });
    }

    const requests = await User.find({ ownerRequestStatus: 'Pending' })
      .select('username email firstName lastName phoneNumber status ownerRequestStatus createdAt ownerContractText ownerContractSignedAt bankName bankAccountNumber bankAccountOwner ownerSignature ownerRejectReason')
      .sort('-updatedAt');

    const formattedRequests = requests.map(u => {
      const displayName = u.firstName && u.lastName
        ? `${u.lastName} ${u.firstName}`
        : (u.firstName || u.lastName || u.username);
      return {
        id: u._id,
        username: u.username,
        email: u.email,
        name: displayName,
        phoneNumber: u.phoneNumber,
        status: u.status,
        ownerRequestStatus: u.ownerRequestStatus,
        createdAt: u.createdAt,
        ownerContractText: u.ownerContractText,
        ownerContractSignedAt: u.ownerContractSignedAt,
        bankName: u.bankName || '',
        bankAccountNumber: u.bankAccountNumber || '',
        bankAccountOwner: u.bankAccountOwner || '',
        ownerSignature: u.ownerSignature || '',
        ownerRejectReason: u.ownerRejectReason || ''
      };
    });

    res.status(200).json({
      success: true,
      data: formattedRequests
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách yêu cầu làm chủ xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Phê duyệt yêu cầu nâng cấp lên Owner (Staff/Admin)
export const approveOwnerRequest = async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    if (user.roles.includes('Owner')) {
      user.ownerRequestStatus = 'Approved';
      await user.save();
      return res.status(400).json({ success: false, message: 'Người dùng này đã là Chủ xe đối tác' });
    }

    // Nâng cấp lên Owner và cập nhật trạng thái
    user.set('roles', ['Owner']);
    user.ownerRequestStatus = 'Approved';
    await user.save();

    // Tạo thông báo in-app cho đối tác
    try {
      await Notification.create({
        userId: user._id,
        title: 'Yêu cầu làm đối tác Chủ xe đã được phê duyệt',
        message: 'Chúc mừng! Yêu cầu đăng ký làm đối tác Chủ xe của bạn đã được phê duyệt thành công. Bạn đã có quyền đăng tải xe mới và theo dõi doanh thu.',
        type: 'System'
      });
    } catch (notiErr) {
      console.error('Lỗi tạo thông báo duyệt chủ xe:', notiErr);
    }

    res.status(200).json({
      success: true,
      message: `Đã phê duyệt yêu cầu làm chủ xe của ${user.username} thành công.`
    });
  } catch (error: any) {
    console.error('Lỗi phê duyệt yêu cầu làm chủ xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Từ chối yêu cầu nâng cấp lên Owner (Staff/Admin)
export const rejectOwnerRequest = async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    const { id } = req.params;
    const { rejectReason } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
    }

    user.ownerRequestStatus = 'Rejected';
    user.ownerRejectReason = rejectReason || 'Không có lý do cụ thể';
    await user.save();

    // Tạo thông báo in-app cho đối tác
    try {
      await Notification.create({
        userId: user._id,
        title: 'Yêu cầu làm đối tác Chủ xe bị từ chối',
        message: `Rất tiếc, yêu cầu đăng ký làm đối tác Chủ xe của bạn đã bị từ chối bởi nhân viên hệ thống. Lý do: ${user.ownerRejectReason}`,
        type: 'System'
      });
    } catch (notiErr) {
      console.error('Lỗi tạo thông báo từ chối chủ xe:', notiErr);
    }

    res.status(200).json({
      success: true,
      message: `Đã từ chối yêu cầu làm chủ xe của ${user.username} thành công.`
    });
  } catch (error: any) {
    console.error('Lỗi từ chối yêu cầu làm chủ xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Khởi tạo Google OAuth2 Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '927292562825-91mdr6b51b97kutl1d6fpqt4c0clm9sg.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Đăng nhập bằng Google
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin xác thực Google (Access Token)' });
    }

    // Gọi API UserInfo của Google để lấy thông tin người dùng bằng access token qua Authorization Header
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    
    if (!googleResponse.ok) {
      return res.status(400).json({ success: false, message: 'Xác thực Access Token từ Google thất bại' });
    }

    const payload = await googleResponse.json();
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Xác thực Google thất bại' });
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatarUrl } = payload;

    if (!googleId) {
      return res.status(400).json({ success: false, message: 'Không thể xác định mã định danh Google (googleId) từ tài khoản của bạn' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Không thể lấy được địa chỉ email từ tài khoản Google của bạn' });
    }

    // Tìm user bằng googleId trước
    let user = await User.findOne({ googleId });

    if (!user) {
      // Nếu chưa có googleId, kiểm tra xem có user nào đăng ký bằng email này trước đó chưa
      user = await User.findOne({ email });

      if (user) {
        // Nếu đã có user đăng ký bằng email đó, liên kết tài khoản Google
        user.googleId = googleId;
        if (!user.avatarUrl && avatarUrl) {
          user.avatarUrl = avatarUrl;
        }
        await user.save();
      } else {
        // Nếu chưa có user nào cả, tạo mới tài khoản
        const baseUsername = email.split('@')[0];
        let username = baseUsername;
        let count = 0;
        
        // Đảm bảo username là duy nhất
        while (await User.findOne({ username })) {
          count++;
          username = `${baseUsername}_${count}_${Math.floor(100 + Math.random() * 900)}`;
        }

        user = new User({
          username,
          email,
          googleId,
          firstName: firstName || '',
          lastName: lastName || '',
          avatarUrl: avatarUrl || '',
          roles: ['Customer'],
          status: 'Active',
        });

        await user.save();
      }
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên' });
    }

    // Sinh token JWT của app
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const displayName = user.firstName && user.lastName
      ? `${user.lastName} ${user.firstName}`
      : (user.firstName || user.lastName || user.username);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: displayName,
        role: mapBackendRoleToFrontend(user.roles),
        phoneNumber: user.phoneNumber || '',
        avatarUrl: user.avatarUrl || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        dob: user.dob || '',
        status: user.status,
        identityStatus: user.identityStatus || null,
        ownerRequestStatus: user.ownerRequestStatus || 'None',
        ownerContractSigned: user.ownerContractSigned || false,
        ownerContractSignedAt: user.ownerContractSignedAt || null,
        ownerContractText: user.ownerContractText || null,
        ownerRejectReason: user.ownerRejectReason || '',
        bankName: user.bankName || '',
        bankAccountNumber: user.bankAccountNumber || '',
        bankAccountOwner: user.bankAccountOwner || '',
        ownerSignature: user.ownerSignature || ''
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi đăng nhập bằng Google:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ khi đăng nhập bằng Google', error: error.message });
  }
};

// Cập nhật thông tin cá nhân
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }

    const { firstName, lastName, phoneNumber, gender, dob, avatarUrl } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    // Chỉ cập nhật các trường được gửi lên
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    const savedUser = await user.save();

    const displayName = savedUser.firstName && savedUser.lastName
      ? `${savedUser.lastName} ${savedUser.firstName}`
      : (savedUser.firstName || savedUser.lastName || savedUser.username);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        name: displayName,
        role: mapBackendRoleToFrontend(savedUser.roles),
        phoneNumber: savedUser.phoneNumber || '',
        avatarUrl: savedUser.avatarUrl || '',
        firstName: savedUser.firstName || '',
        lastName: savedUser.lastName || '',
        gender: savedUser.gender || '',
        dob: savedUser.dob || '',
        status: savedUser.status
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật thông tin cá nhân', error: error.message });
  }
};

// Đăng xuất tài khoản
export const logout = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

// Đổi mật khẩu
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ và mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(userId);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại hoặc đăng nhập qua Google' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error: any) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Quên mật khẩu
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' });
    }

    // Kiểm tra tài khoản đăng ký/liên kết thông qua Google
    if (user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này được đăng ký thông qua Google. Vui lòng chọn đăng nhập bằng Google.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await PasswordResetToken.create({
      token: resetToken,
      userId: user._id,
      expiryTime,
      isUsed: false
    });

    // Gửi email thật chứa link reset mật khẩu (hoặc email ảo trong môi trường phát triển)
    const previewUrl = await sendPasswordReset(email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.',
      previewUrl: typeof previewUrl === 'string' ? previewUrl : undefined
    });
  } catch (error: any) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp token và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const resetRecord = await PasswordResetToken.findOne({
      token,
      isUsed: false,
      expiryTime: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    resetRecord.isUsed = true;
    await resetRecord.save();

    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error: any) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Đặt lại mật khẩu qua số điện thoại (Firebase OTP)
export const resetPasswordPhone = async (req: Request, res: Response) => {
  try {
    const { idToken, newPassword } = req.body;

    if (!idToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp token và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Mock mode for local testing without Firebase config
    // SEC-FIX: Only allow mock tokens in non-production environments
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('mock-token-')) {
      const phoneNumber = idToken.replace('mock-token-', '');
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        // Try mapping E.164 +84... or 84... to local format 0...
        let domesticPhone = phoneNumber;
        if (phoneNumber.startsWith('+84')) {
          domesticPhone = '0' + phoneNumber.slice(3);
          user = await User.findOne({ phoneNumber: domesticPhone });
        } else if (phoneNumber.startsWith('84')) {
          domesticPhone = '0' + phoneNumber.slice(2);
          user = await User.findOne({ phoneNumber: domesticPhone });
        }
      }
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng với số điện thoại này' });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      return res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công (Mock)' });
    }

    if (!firebaseAdmin) {
      return res.status(500).json({ success: false, message: 'Firebase service chưa được cấu hình trên server.' });
    }

    // Verify token using Firebase Admin SDK
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Token xác thực không chứa thông tin số điện thoại' });
    }

    // Find user by phone number
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      // Try mapping E.164 +84... to local format 0...
      let domesticPhone = phoneNumber;
      if (phoneNumber.startsWith('+84')) {
        domesticPhone = '0' + phoneNumber.slice(3);
        user = await User.findOne({ phoneNumber: domesticPhone });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản liên kết với số điện thoại này' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error: any) {
    console.error('Lỗi đặt lại mật khẩu qua điện thoại:', error);
    res.status(500).json({ success: false, message: 'Xác thực token thất bại hoặc lỗi server', error: error.message });
  }
};

// Xác minh email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã xác minh.' });
    }

    const record = await EmailVerificationToken.findOne({
      token,
      isUsed: false,
      expiryTime: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.' });
    }

    // Nếu có thông tin đăng ký tạm thời (Trì hoãn tạo user - Option 2)
    if (record.pendingUserData && record.pendingUserData.username) {
      const { username, email, passwordHash, firstName, lastName, phoneNumber, roles } = record.pendingUserData;

      // Kiểm tra trùng lặp lần cuối trước khi tạo tài khoản chính thức
      const query: any[] = [{ username }];
      if (email) {
        query.push({ email });
      }
      const existingUser = await User.findOne({ $or: query });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email
            ? 'Email này đã được sử dụng bởi một tài khoản khác.'
            : 'Tên đăng nhập này đã được sử dụng.'
        });
      }

      // Tạo và lưu tài khoản vào database
      const newUser = new User({
        username,
        email,
        passwordHash,
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber: phoneNumber || '',
        roles: roles || ['Customer'],
        status: 'Active'
      });

      try {
        await newUser.save();
      } catch (saveError: any) {
        if (saveError.code === 11000) {
          const alreadyCreated = await User.findOne({ username });
          if (alreadyCreated && alreadyCreated.email === email) {
            console.log(`User ${username} đã được tạo bởi một request xác minh song song.`);
          } else {
            throw saveError;
          }
        } else {
          throw saveError;
        }
      }
    } else if (record.userId) {
      // Trường hợp cũ (Option 1) - kích hoạt user đã được lưu sẵn
      const user = await User.findById(record.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      }

      user.status = 'Active';
      await user.save();
    } else {
      return res.status(400).json({ success: false, message: 'Dữ liệu xác minh không hợp lệ.' });
    }

    record.isUsed = true;
    await record.save();

    res.status(200).json({ success: true, message: 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.' });
  } catch (error: any) {
    console.error('Lỗi xác minh email:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Kiểm tra trạng thái xác minh email của tài khoản
export const checkVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email.' });
    }

    const user = await User.findOne({ email: (email as string).trim() });
    if (user && user.status === 'Active') {
      return res.status(200).json({ success: true, isVerified: true });
    }

    res.status(200).json({ success: true, isVerified: false });
  } catch (error: any) {
    console.error('Lỗi kiểm tra trạng thái xác minh:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra trạng thái xác minh', error: error.message });
  }
};

// Nộp yêu cầu xác minh danh tính (eKYC)
export const submitIdentityVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }

    const { cardFrontUrl, cardBackUrl, selfieUrl } = req.body;

    if (!cardFrontUrl || !cardBackUrl || !selfieUrl) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ ảnh mặt trước, mặt sau CCCD và ảnh selfie' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    // Giả lập OCR trích xuất thông tin từ CCCD
    // Lấy họ tên từ profile của user, chuyển thành viết hoa không dấu
    const rawName = user.lastName && user.firstName 
      ? `${user.lastName} ${user.firstName}` 
      : user.username;
    
    const cleanName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'D')
      .toUpperCase();

    // Sinh số CCCD ngẫu nhiên (12 chữ số)
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000); // 7 số ngẫu nhiên
    const idNumber = `048201${randomSuffix}`; // Định dạng CCCD Việt Nam

    // Ngày sinh
    const dobValue = user.dob || new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000); // Mặc định 25 tuổi nếu chưa điền

    const provinces = ['Đà Nẵng', 'Quảng Nam', 'Hà Nội', 'TP. Hồ Chí Minh', 'Thừa Thiên Huế', 'Khánh Hòa'];
    const selectedProvince = provinces[Math.floor(Math.random() * provinces.length)];
    const homeTown = selectedProvince;
    const address = `Số ${Math.floor(Math.random() * 200 + 1)} Đường Hùng Vương, Hải Châu, ${selectedProvince}`;

    // Đối sánh khuôn mặt Face Matching Confidence
    const faceMatchConfidence = parseFloat((80 + Math.random() * 19).toFixed(2)); // Ngẫu nhiên 80% - 99%

    user.citizenIdInfo = {
      idNumber,
      fullName: cleanName,
      dob: dobValue,
      homeTown,
      address,
      cardFrontUrl,
      cardBackUrl,
      selfieUrl,
      faceMatchConfidence
    };

    user.identityStatus = 'Pending';
    user.identitySubmittedAt = new Date();
    await user.save();

    // Tạo thông báo in-app
    try {
      await Notification.create({
        userId: user._id,
        title: 'Hồ sơ xác minh danh tính đang được xét duyệt',
        message: 'Yêu cầu xác minh danh tính (eKYC) của bạn đã được gửi thành công. Vui lòng chờ nhân viên kiểm duyệt thông tin.',
        type: 'System'
      });
    } catch (notiErr) {
      console.error('Lỗi khi tạo thông báo gửi eKYC:', notiErr);
    }

    res.status(200).json({
      success: true,
      message: 'Gửi yêu cầu xác minh danh tính thành công',
      data: {
        ocrResult: {
          idNumber,
          fullName: cleanName,
          dob: dobValue,
          homeTown,
          address
        },
        faceMatchConfidence,
        identityStatus: user.identityStatus
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi nộp eKYC:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi nộp xác minh danh tính', error: error.message });
  }
};

// Lấy danh sách yêu cầu eKYC đang chờ duyệt (Staff/Admin)
export const getIdentityRequests = async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập thông tin này' });
    }

    const requests = await User.find({ identityStatus: 'Pending' })
      .select('username email firstName lastName phoneNumber status identityStatus citizenIdInfo identitySubmittedAt')
      .sort('-identitySubmittedAt');

    const formattedRequests = requests.map(u => {
      const displayName = u.firstName && u.lastName
        ? `${u.lastName} ${u.firstName}`
        : (u.firstName || u.lastName || u.username);
      
      return {
        id: u._id,
        username: u.username,
        email: u.email,
        name: displayName,
        phoneNumber: u.phoneNumber,
        status: u.status,
        identityStatus: u.identityStatus,
        citizenIdInfo: u.citizenIdInfo,
        identitySubmittedAt: u.identitySubmittedAt
      };
    });

    res.status(200).json({
      success: true,
      data: formattedRequests
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách yêu cầu eKYC:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Phê duyệt yêu cầu eKYC (Staff/Admin)
export const approveIdentityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền phê duyệt yêu cầu này' });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (user.identityStatus === 'Verified') {
      return res.status(400).json({ success: false, message: 'Tài khoản này đã được xác minh danh tính trước đó' });
    }

    user.identityStatus = 'Verified';
    user.identityVerifiedAt = new Date();
    user.identityVerifiedBy = new mongoose.Types.ObjectId(req.user?.id);
    
    // Đồng bộ thông tin từ CCCD sang profile chính thức của user nếu thiếu
    if (user.citizenIdInfo) {
      if (!user.dob) user.dob = user.citizenIdInfo.dob;
      
      // Cập nhật họ tên nếu chưa có
      if (!user.firstName && !user.lastName) {
        const parts = user.citizenIdInfo.fullName.split(' ');
        if (parts.length > 1) {
          user.lastName = parts[0];
          user.firstName = parts.slice(1).join(' ');
        } else {
          user.firstName = user.citizenIdInfo.fullName;
        }
      }
    }

    await user.save();

    // Tạo thông báo cho người dùng
    try {
      await Notification.create({
        userId: user._id,
        title: 'Xác minh danh tính thành công',
        message: 'Chúc mừng! Hồ sơ eKYC của bạn đã được phê duyệt. Bây giờ bạn đã có thể bắt đầu đặt xe trên Motov.',
        type: 'System'
      });
    } catch (notiErr) {
      console.error('Lỗi tạo thông báo duyệt eKYC:', notiErr);
    }

    res.status(200).json({
      success: true,
      message: `Đã phê duyệt xác minh danh tính của ${user.username} thành công.`
    });

  } catch (error: any) {
    console.error('Lỗi phê duyệt eKYC:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Từ chối yêu cầu eKYC (Staff/Admin)
export const rejectIdentityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.identityStatus = 'Rejected';
    user.identityRejectReason = reason;
    await user.save();

    // Tạo thông báo cho người dùng
    try {
      await Notification.create({
        userId: user._id,
        title: 'Xác minh danh tính bị từ chối',
        message: `Rất tiếc, hồ sơ eKYC của bạn đã bị từ chối. Lý do: ${reason}. Vui lòng thử lại với ảnh chụp rõ ràng hơn.`,
        type: 'System'
      });
    } catch (notiErr) {
      console.error('Lỗi tạo thông báo từ chối eKYC:', notiErr);
    }

    res.status(200).json({
      success: true,
      message: `Đã từ chối xác minh danh tính của ${user.username} thành công.`
    });

  } catch (error: any) {
    console.error('Lỗi từ chối eKYC:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
