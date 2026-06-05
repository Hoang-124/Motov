import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Motov';

app.use(cors());
app.use(express.json());

// Phục vụ file tĩnh trong thư mục uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes xác thực (Auth APIs)
app.use('/api/auth', authRoutes);

// Cấu hình Multer để lưu trữ ảnh tải lên
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Tối đa 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ cho phép tải lên file ảnh (.jpg, .jpeg, .png, .webp)'));
  }
});

// API upload ảnh đại diện
app.post('/api/upload', upload.single('image'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp file ảnh' });
    }
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url: fileUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Lỗi tải ảnh lên server', error: error.message });
  }
});

// Hàm tạo tài khoản mẫu (Seed data) để kiểm thử
async function seedUsers() {
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    const testAccounts: {
      username: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      roles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
      status: 'Active' | 'Suspended' | 'Unverified';
    }[] = [
      {
        username: 'admin123',
        email: 'admin@motov.com',
        passwordHash,
        firstName: 'Trị Viên',
        lastName: 'Quản',
        phoneNumber: '0901234567',
        roles: ['Admin'],
        status: 'Active',
      },
      {
        username: 'staff123',
        email: 'nhanvien@motov.com',
        passwordHash,
        firstName: 'Phòng Vé',
        lastName: 'Nhân Viên',
        phoneNumber: '0901234568',
        roles: ['Staff'],
        status: 'Active',
      },
      {
        username: 'owner123',
        email: 'owner@motov.com',
        passwordHash,
        firstName: 'Chủ Xe',
        lastName: 'Nguyễn',
        phoneNumber: '0901234569',
        roles: ['Owner'],
        status: 'Active',
      },
      {
        username: 'customer123',
        email: 'khachhang@motov.com',
        passwordHash,
        firstName: 'Văn Khách',
        lastName: 'Nguyễn',
        phoneNumber: '0901234570',
        roles: ['Customer'],
        status: 'Active',
      }
    ];

    for (const acc of testAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
        console.log(`✅ Seeded tài khoản mẫu: ${acc.email} (${acc.username} / Mật khẩu: 123456)`);
      } else {
        // Cập nhật username để đồng bộ với kiểm thử
        if (exists.username !== acc.username) {
          exists.username = acc.username;
          await exists.save();
          console.log(`🔄 Cập nhật username tài khoản mẫu: ${acc.email} thành ${acc.username}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Lỗi khi seed tài khoản mẫu:', err);
  }
}

// Kết nối MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    await seedUsers();
  })
  .catch((err) => console.error('❌ Failed to connect to MongoDB:', err));


interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  specs: string[];
  image: string;
  featured: boolean;
}

const BIKES: Bike[] = [
  {
    id: 'cb300r',
    name: 'Honda CB300R',
    price: '120.000',
    type: 'Sport Cafe',
    specs: ['Chế Độ Lái Thể Thao', 'Phanh ABS', 'Cốp Phụ Nhỏ', 'Tiết Kiệm Xăng'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
    featured: true,
  },
  {
    id: 'xsr155',
    name: 'Yamaha XSR155',
    price: '150.000',
    type: 'Classic',
    specs: ['Kiểu Dáng Cổ Điển', 'Động Cơ VVA', 'Phuộc USD', 'Côn Tay'],
    image: 'https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'vespa',
    name: 'Vespa GTS Super Sport',
    price: '150.000',
    type: 'Scooter',
    specs: ['Sang Trọng', 'Phanh ABS / ASR', 'Hộc Để Đồ Trực Diện', 'Smartkey'],
    image: 'https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'ninja400',
    name: 'Kawasaki Ninja 400',
    price: '250.000',
    type: 'Sport',
    specs: ['Động Cơ 2 Xi-lanh', 'Ly Hợp Chống Trượt', 'Tư Thế Lái Thể Thao', 'Hệ Thống Đèn LED'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
    featured: true,
  },
  {
    id: 'vision',
    name: 'Honda Vision 110cc',
    price: '80.000',
    type: 'Scooter',
    specs: ['Khóa Smartkey', 'Động Cơ eSP', 'Cốp Xe Rộng', 'Siêu Tiết Kiệm Xăng'],
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'exciter155',
    name: 'Yamaha Exciter 155 VVA',
    price: '100.000',
    type: 'Underbone',
    specs: ['Động cơ VVA 155cc', 'Côn Tay Thể Thao', 'Khóa Thông Minh', 'Phanh Đĩa Thủy Lực'],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
    featured: true,
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API test kết nối, ghi & đọc dữ liệu thực tế trên MongoDB
app.get('/api/test-db', async (req, res) => {
  try {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testUser = new User({
      username: `testuser_${randomSuffix}`,
      email: `test_${randomSuffix}@motov.com`,
      passwordHash: 'hashed_password_123',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '0912345678',
      roles: ['Customer']
    });

    // Ghi dữ liệu vào MongoDB
    const savedUser = await testUser.save();

    // Đọc ngược lại dữ liệu từ MongoDB
    const usersSample = await User.find({}).limit(5);

    res.json({
      success: true,
      message: 'Kết nối và đọc/ghi MongoDB hoàn toàn thành công!',
      newlyCreatedUser: savedUser,
      databaseSampleUsers: usersSample
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Không thể ghi/đọc dữ liệu từ MongoDB',
      error: error.message
    });
  }
});

app.get('/api/bikes', (req, res) => {
  res.json(BIKES);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

