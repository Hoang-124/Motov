import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { mapBackendRoleToFrontend, mapFrontendRoleToBackend } from '../utils/roleMapper.js';

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

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Username, Email, Mật khẩu)' });
    }

    // Kiểm tra trùng lặp email hoặc username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email này đã được sử dụng bởi một tài khoản khác' 
          : 'Tên đăng nhập này đã được sử dụng'
      });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // FIX [SEC-4]: Whitelist public registration roles — only 'customer' and 'owner' are allowed
    const allowedPublicRoles = ['customer', 'owner'];
    const safeRole = allowedPublicRoles.includes(role) ? role : 'customer';
    const backendRole = mapFrontendRoleToBackend(safeRole);
    const assignedRoles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[] = [backendRole];

    const newUser = new User({
      username,
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || '',
      roles: assignedRoles,
      status: 'Active'
    });

    const savedUser = await newUser.save();

    // Sinh token JWT
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, roles: savedUser.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const displayName = savedUser.firstName && savedUser.lastName
      ? `${savedUser.lastName} ${savedUser.firstName}`
      : (savedUser.firstName || savedUser.lastName || savedUser.username);

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
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên' });
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
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
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
        status: user.status
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
        status: user.status
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ khi lấy thông tin người dùng', error: error.message });
  }
};

// Nâng cấp tài khoản lên Chủ xe đối tác
export const becomeOwner = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    // FIX [BUG-8]: Idempotency guard — don't re-process if already an Owner
    if (user.roles.includes('Owner')) {
      return res.status(400).json({ success: false, message: 'Tài khoản của bạn đã là Chủ xe đối tác' });
    }

    // Cập nhật vai trò thành Owner
    user.roles = ['Owner'];
    const savedUser = await user.save();

    // Sinh token mới với vai trò mới
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, roles: savedUser.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const displayName = savedUser.firstName && savedUser.lastName
      ? `${savedUser.lastName} ${savedUser.firstName}`
      : (savedUser.firstName || savedUser.lastName || savedUser.username);

    res.status(200).json({
      success: true,
      message: 'Đăng ký làm chủ xe đối tác thành công!',
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        name: displayName,
        role: 'owner',
        phoneNumber: savedUser.phoneNumber,
        status: savedUser.status
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi nâng cấp lên chủ xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký làm chủ xe đối tác', error: error.message });
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
        status: user.status
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
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
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

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await PasswordResetToken.create({
      token: resetToken,
      userId: user._id,
      expiryTime,
      isUsed: false
    });

    // FIX [BUG-7]: Token must NEVER be logged — send via email service instead
    // TODO: Integrate Nodemailer/SendGrid to email the reset link to the user
    // Example: await emailService.sendPasswordReset(email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.'
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
