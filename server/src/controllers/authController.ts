import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'motov_super_secret_key_998877';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Ánh xạ vai trò từ Database (Backend) -> Giao diện (Client)
const mapBackendRoleToFrontend = (backendRoles: string[]): string => {
  const primaryRole = backendRoles[0] || 'Customer';
  switch (primaryRole) {
    case 'Admin': return 'admin';
    case 'Staff': return 'staff';
    case 'Owner': return 'owner';
    case 'Customer':
    default:
      return 'customer';
  }
};

// Ánh xạ vai trò từ Giao diện (Client) -> Database (Backend)
const mapFrontendRoleToBackend = (frontendRole: string): 'Admin' | 'Staff' | 'Owner' | 'Customer' => {
  switch (frontendRole) {
    case 'admin': return 'Admin';
    case 'staff': return 'Staff';
    case 'owner': return 'Owner';
    case 'customer':
    default:
      return 'Customer';
  }
};

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

    // Xác định vai trò từ client gửi lên (chỉ cho phép Owner hoặc Customer)
    const backendRole = mapFrontendRoleToBackend(role || 'customer');
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

    // Gọi API UserInfo của Google để lấy thông tin người dùng bằng access token
    const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    
    if (!googleResponse.ok) {
      return res.status(400).json({ success: false, message: 'Xác thực Access Token từ Google thất bại' });
    }

    const payload = await googleResponse.json();
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Xác thực Google thất bại' });
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatarUrl } = payload;

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


