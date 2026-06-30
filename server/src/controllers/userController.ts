import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { mapBackendRoleToFrontend, mapFrontendRoleToBackend, escapeRegex } from '../utils/roleMapper.js';

// Map individual user for response
const formatUserResponse = (user: IUser) => {
  const displayName = user.firstName && user.lastName
    ? `${user.lastName} ${user.firstName}`
    : (user.firstName || user.lastName || user.username);

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    name: displayName,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phoneNumber: user.phoneNumber || '',
    avatarUrl: user.avatarUrl || '',
    gender: user.gender || '',
    dob: user.dob || '',
    role: mapBackendRoleToFrontend(user.roles),
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// [GET] Get all users (with search and filters)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;
    const query: any = {};

    // Apply search filter (username, email, phone, name)
    if (search) {
      // FIX [BUG-9]: Escape user input before using as RegExp to prevent ReDoS
      const searchRegex = new RegExp(escapeRegex(String(search)), 'i');
      query.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ];
    }

    // Apply role filter
    if (role) {
      const backendRole = mapFrontendRoleToBackend(String(role));
      query.roles = backendRole;
    }

    // Apply status filter
    if (status) {
      query.status = status;
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    const formattedUsers = users.map(user => formatUserResponse(user));

    res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách thành viên',
      error: error.message,
    });
  }
};

// [GET] Get user details by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên',
      });
    }

    res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin thành viên',
      error: error.message,
    });
  }
};

// [POST] Create a new user (Admin CRUD)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      gender,
      dob,
      role,
      status,
      avatarUrl,
    } = req.body;

    // User Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ Tên đăng nhập, Email và Mật khẩu',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ',
      });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập phải dài ít nhất 3 ký tự',
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải dài ít nhất 6 ký tự',
      });
    }

    // Check username or email duplicate
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email này đã được sử dụng bởi một tài khoản khác' 
          : 'Tên đăng nhập này đã được sử dụng',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Map role & status
    const backendRole = mapFrontendRoleToBackend(role || 'customer');
    const assignedRoles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[] = [backendRole];

    const newUser = new User({
      username,
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || '',
      gender: gender || undefined,
      dob: dob ? new Date(dob) : undefined,
      roles: assignedRoles,
      status: status || 'Active',
      avatarUrl: avatarUrl || '',
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành viên thành công',
      user: formatUserResponse(savedUser),
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo tài khoản thành viên',
      error: error.message,
    });
  }
};

// [PUT] Update user details (Admin CRUD)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      gender,
      dob,
      role,
      status,
      avatarUrl,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên',
      });
    }

    // Check username duplication
    if (username && username !== user.username) {
      const duplicateUsername = await User.findOne({ username });
      if (duplicateUsername) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập này đã được sử dụng',
        });
      }
      user.username = username;
    }

    // Check email duplication
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng email không hợp lệ',
        });
      }

      const duplicateEmail = await User.findOne({ email });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email này đã được sử dụng bởi một tài khoản khác',
        });
      }
      user.email = email;
    }

    // Safety check: Prevent lockouts (admin cannot change their own role or suspend themselves)
    const isSelf = req.user?.id === id;
    if (isSelf) {
      if (status && status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể thay đổi trạng thái hoạt động của chính mình (Tránh khóa tài khoản Admin hiện tại)',
        });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể hạ cấp quyền Admin của chính mình (Tránh khóa tài khoản Admin hiện tại)',
        });
      }
    }

    // Update general fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : undefined;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    if (status !== undefined && !isSelf) {
      user.status = status;
    }

    if (role !== undefined && !isSelf) {
      const backendRole = mapFrontendRoleToBackend(role);
      user.roles = [backendRole];
    }

    // Hash password if updating
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải dài ít nhất 6 ký tự',
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    const savedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành viên thành công',
      user: formatUserResponse(savedUser),
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật thông tin thành viên',
      error: error.message,
    });
  }
};

// [PUT] Ban user (Admin action)
export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Safety check: Prevent self-ban
    const isSelf = req.user?.id === id;
    if (isSelf) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự khóa tài khoản Admin đang đăng nhập',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên cần khóa',
      });
    }

    user.status = 'Suspended';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Khóa tài khoản thành viên thành công',
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi khóa tài khoản thành viên',
      error: error.message,
    });
  }
};

// [PUT] Unban user (Admin action)
export const unbanUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên cần mở khóa',
      });
    }

    user.status = 'Active';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mở khóa tài khoản thành viên thành công',
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi mở khóa tài khoản thành viên',
      error: error.message,
    });
  }
};
// [POST] Add vehicle to favorites
export const addFavoriteVehicle = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id; // Lấy ID user từ token qua AuthRequest
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã xe (vehicleId).',
      });
    }

    // Tận dụng Model User sẵn có trong file của bạn
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteVehicles: vehicleId } }, // Thêm vào mảng không trùng lặp
      { new: true }
    ).select('favoriteVehicles');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã thêm xe vào danh sách yêu thích thành công',
      favoriteVehicles: updatedUser.favoriteVehicles,
    });
  } catch (error: any) {
    console.error('Error adding favorite vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thêm xe vào danh sách yêu thích',
      error: error.message,
    });
  }
};

// [DELETE] Remove vehicle from favorites
export const removeFavoriteVehicle = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { vehicleId } = req.params; // Lấy từ URL params theo chuẩn RESTful

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteVehicles: vehicleId } }, // Xóa phần tử khỏi mảng
      { new: true }
    ).select('favoriteVehicles');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa xe khỏi danh sách yêu thích thành công',
      favoriteVehicles: updatedUser.favoriteVehicles,
    });
  } catch (error: any) {
    console.error('Error removing favorite vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa xe khỏi danh sách yêu thích',
      error: error.message,
    });
  }
};

// [GET] Get all favorite vehicles of current user
export const getFavoriteVehicles = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;

    const userWithFavorites = await User.findById(userId)
      .populate('favoriteVehicles') // Nối dữ liệu để lấy thông tin xe chi tiết
      .select('favoriteVehicles');

    if (!userWithFavorites) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thành viên',
      });
    }

    res.status(200).json({
      success: true,
      data: userWithFavorites.favoriteVehicles || [],
    });
  } catch (error: any) {
    console.error('Error fetching favorite vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách xe yêu thích',
      error: error.message,
    });
  }
};
