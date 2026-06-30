import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { User } from './models/User.js';
import { Vehicle } from './models/Vehicle.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import { Category } from './models/Category.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { initBookingReminderScheduler } from './utils/bookingReminderScheduler.js';
import { Discount } from './models/Discount.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Motov';

// FIX [SEC-5]: Restrict CORS to configured frontend origin only, supporting multiple ports in development
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      ALLOWED_ORIGINS.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:\d+$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.error(`[CORS Blocked] Origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Phục vụ file tĩnh trong thư mục uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes xác thực (Auth APIs)
app.use('/api/auth', authRoutes);
// Routes Booking (Booking APIs)
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);

// Routes quản lý xe (Vehicle/Bike Management APIs)
app.use('/api/vehicles', vehicleRoutes);

// Cấu hình Multer để lưu trữ ảnh tải lên
const storage = multer.diskStorage({
  // @ts-ignore
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadsDir);
  },
  // @ts-ignore
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Tối đa 2MB
  // @ts-ignore
  fileFilter: (req: any, file: any, cb: any) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ cho phép tải lên file ảnh (.jpg, .jpeg, .png, .webp)'));
  }
});

// FIX [SEC-2]: Upload endpoint now requires authentication
app.post('/api/upload', authMiddleware as any, upload.single('image'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp file ảnh' });
    }
    // FIX [BUG-10]: Build URL from request instead of hardcoded localhost
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url: fileUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Lỗi tải ảnh lên server', error: error.message });
  }
});

// Hàm tạo tài khoản mẫu (Seed data) để kiểm thử
async function seedUsers() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const testAccounts: any[] = [
      {
        username: 'admin123',
        email: 'admin@motov.com',
        passwordHash,
        firstName: 'Trị Viên',
        lastName: 'Quản',
        phoneNumber: '0901234567',
        roles: ['Admin'],
        status: 'Active',
        identityStatus: 'Verified',
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
        identityStatus: 'Verified',
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
        identityStatus: 'Verified',
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
        identityStatus: 'Verified',
        citizenIdInfo: {
          idNumber: '048201999999',
          fullName: 'NGUYEN VAN KHACH',
          dob: new Date('1995-05-25'),
          homeTown: 'Đà Nẵng',
          address: 'Số 123 Đường Hùng Vương, Hải Châu, Đà Nẵng',
          cardFrontUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
          cardBackUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400',
          selfieUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          faceMatchConfidence: 95
        }
      }
    ];

    for (const acc of testAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
        console.log(`✅ Seeded tài khoản mẫu: ${acc.email} (${acc.username} / Mật khẩu: admin123)`);
      } else {
        // Cập nhật username, passwordHash và identityStatus để đồng bộ với kiểm thử
        exists.username = acc.username;
        exists.passwordHash = passwordHash;
        exists.identityStatus = acc.identityStatus as any;
        if (acc.citizenIdInfo) {
          exists.citizenIdInfo = acc.citizenIdInfo;
        }
        await exists.save();
        console.log(`🔄 Đồng bộ tài khoản mẫu: ${acc.email} (Đã xác minh eKYC - Mật khẩu mới: admin123)`);
      }
    }
  } catch (err) {
    console.error('❌ Lỗi khi seed tài khoản mẫu:', err);
  }
}

async function seedVehicles() {
  try {
    const count = await Vehicle.countDocuments();
    if (count > 0) {
      return;
    }

    const ownerUser = await User.findOne({ email: 'owner@motov.com' });
    if (!ownerUser) {
      console.log('⚠️ Owner user not found. Cannot seed vehicles.');
      return;
    }

    const seededVehicles = [];
    for (let idx = 0; idx < BIKES.length; idx++) {
      const bike = BIKES[idx];
      let transmissionType: 'Manual' | 'Automatic' | 'Semi-Automatic' = 'Automatic';
      if (bike.type === 'Xe Côn Tay' || bike.type === 'Sport' || bike.type === 'Cruiser' || bike.type === 'Classic' || bike.type === 'Sport Cafe') {
        transmissionType = 'Manual';
      } else if (bike.type === 'Xe Số') {
        transmissionType = 'Semi-Automatic';
      }

      const rentalPrice = parseInt(bike.price.replace(/\./g, ''), 10) || 100000;

      const CLOUD_NAME = 'dsxbuk4pe';
      const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/bikes`;
      const num = idx + 1;
      const imageUrls = [
        `${BASE_URL}/${num}_3.jpg.png`,
        `${BASE_URL}/${num}_1.jpg.png`,
        `${BASE_URL}/${num}_4.jpg.png`
      ];

      const catDoc = await Category.findOne({ name: bike.type });

      // Tọa độ ngẫu nhiên xung quanh thành phố Đà Nẵng (lat 16.068, lng 108.22)
      const baseLat = 16.068;
      const baseLng = 108.22;
      const latOffset = (Math.random() - 0.5) * 0.06; // ±0.03
      const lngOffset = (Math.random() - 0.5) * 0.06; // ±0.03

      seededVehicles.push({
        ownerId: ownerUser._id,
        vehicleModel: bike.name,
        licensePlate: `43-C1 ${String(10000 + idx).slice(0, 5)}`,
        seats: 2,
        odometer: Math.floor(1000 + Math.random() * 10000),
        rentalPrice,
        status: 'Available',
        category: catDoc ? catDoc._id : null,
        transmissionType,
        imageUrls,
        features: bike.specs,
        location: {
          type: 'Point',
          coordinates: [baseLng + lngOffset, baseLat + latOffset] // [longitude, latitude]
        }
      });
    }

    await Vehicle.insertMany(seededVehicles);
    console.log(`✅ Seeded ${seededVehicles.length} vehicles successfully into MongoDB!`);
  } catch (err) {
    console.error('❌ Lỗi khi seed xe mẫu:', err);
  }
}

async function seedCategories() {
  try {
    const staticCategories = Array.from(new Set(BIKES.map(b => b.type)));

    // Check if any existing vehicles have text categories to seed
    const existingVehicles = await Vehicle.find();
    const dbCategories: string[] = [];
    for (const v of existingVehicles) {
      if (typeof v.category === 'string' && !mongoose.Types.ObjectId.isValid(v.category)) {
        dbCategories.push(v.category);
      }
    }

    const uniqueCategories = Array.from(new Set([...staticCategories, ...dbCategories]));

    for (const catName of uniqueCategories) {
      if (!catName || catName.trim() === '') continue;

      const slug = catName
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

      const exists = await Category.findOne({ $or: [{ name: catName }, { slug }] });
      if (!exists) {
        await Category.create({
          name: catName,
          slug,
          description: `Danh mục xe ${catName}`
        });
        console.log(`✅ Seeded category: ${catName}`);
      }
    }
  } catch (err) {
    console.error('❌ Lỗi khi seed danh mục mẫu:', err);
  }
}

async function migrateVehicleCategories() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const rawVehicles = await db.collection('vehicles').find().toArray();
    let migratedCount = 0;

    for (const v of rawVehicles) {
      if (typeof v.category === 'string' && !mongoose.Types.ObjectId.isValid(v.category)) {
        const catName = v.category;
        let categoryDoc = await db.collection('categories').findOne({ name: catName });
        if (!categoryDoc) {
          const slug = catName
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');

          const insertRes = await db.collection('categories').insertOne({
            name: catName,
            slug,
            description: `Danh mục xe ${catName}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          categoryDoc = { _id: insertRes.insertedId, name: catName } as any;
          console.log(`✅ Tự động tạo danh mục thiếu khi migrate raw: ${catName}`);
        }

        await db.collection('vehicles').updateOne(
          { _id: v._id },
          { $set: { category: categoryDoc?._id } } // Chỉ dùng ?. thôi bạn nhé
        );
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`✅ Migrated raw ${migratedCount} vehicles to use Category ObjectId reference!`);
    }
  } catch (err) {
    console.error('❌ Lỗi khi migration danh mục xe:', err);
  }
}

// Hàm tạo mã khuyến mãi mẫu (Seed data) để kiểm thử
async function seedDiscounts() {
  try {
    const count = await Discount.countDocuments();
    if (count > 0) {
      return;
    }

    const testDiscounts = [
      {
        discountName: 'Khởi đầu rực rỡ',
        description: 'Giảm ngay 10% giá trị đơn hàng cho khách hàng mới của Motov.',
        discountType: 'Percentage',
        discountValue: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        voucherCode: 'MOTOV10',
        minOrderAmount: 100000,
        maxDiscountAmount: 50000,
        usedCount: 0
      },
      {
        discountName: 'Đường dài yêu thương',
        description: 'Giảm thẳng 50.000 VNĐ cho các chuyến đi từ 3 ngày trở lên.',
        discountType: 'FixedAmount',
        discountValue: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        voucherCode: 'WELCOME50K',
        minOrderAmount: 250000,
        usedCount: 0
      }
    ];

    await Discount.insertMany(testDiscounts);
    console.log(`✅ Seeded ${testDiscounts.length} discounts successfully into MongoDB!`);
  } catch (err) {
    console.error('❌ Lỗi khi seed khuyến mãi mẫu:', err);
  }
}

// Kết nối MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    await seedUsers();
    await seedCategories();
    await seedVehicles();
    await migrateVehicleCategories();
    await seedDiscounts();
    initBookingReminderScheduler();
  })
  .catch((err: any) => console.error('❌ Failed to connect to MongoDB:', err));


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
    id: "honda-vision-smartkey",
    name: "Honda Vision Smartkey",
    price: "90.000",
    type: "Xe Tay Ga",
    specs: [
      "Khóa Smartkey",
      "Động Cơ eSP",
      "Cốp Xe Rộng",
      "Siêu Tiết Kiệm Xăng"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: true
  },
  {
    id: "honda-air-blade",
    name: "Honda Air Blade",
    price: "130.000",
    type: "Xe Tay Ga",
    specs: [
      "Phanh ABS An Toàn",
      "Động Cơ eSP+",
      "Cốp Rộng 23.2L",
      "Sạc USB Tiện Lợi"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: true
  },
  {
    id: "honda-lead",
    name: "Honda Lead",
    price: "120.000",
    type: "Xe Tay Ga",
    specs: [
      "Cốp Siêu Rộng 37L",
      "Sạc Điện Thoại",
      "Sàn Để Chân Rộng",
      "Động Cơ eSP+"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "honda-sh-mode-sh",
    name: "Honda SH Mode / SH",
    price: "240.000",
    type: "Xe Tay Ga",
    specs: [
      "Phanh ABS Hai Kênh",
      "Smartkey Thông Minh",
      "Đèn LED Cao Cấp",
      "Thiết Kế Thời Thượng"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-grande-hybrid",
    name: "Yamaha Grande Hybrid",
    price: "120.000",
    type: "Xe Tay Ga",
    specs: [
      "Động Cơ Hybrid",
      "Cốp Rộng 27L",
      "Nắp Bình Xăng Trước",
      "Trọng Lượng Siêu Nhẹ"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-janus",
    name: "Yamaha Janus",
    price: "90.000",
    type: "Xe Tay Ga",
    specs: [
      "Khóa Smartkey",
      "Động Cơ Blue Core",
      "Thiết Kế Nhỏ Gọn",
      "Tiết Kiệm Nhiên Liệu"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-nvx",
    name: "Yamaha NVX",
    price: "140.000",
    type: "Xe Tay Ga",
    specs: [
      "Phanh ABS Bánh Trước",
      "Động Cơ Blue Core 155cc",
      "Van Biến Thiên VVA",
      "Smartkey Thông Minh"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "vespa-sprint-primavera",
    name: "Vespa Sprint / Primavera",
    price: "220.000",
    type: "Xe Tay Ga",
    specs: [
      "Phanh ABS An Toàn",
      "Động Cơ i-Get Mới",
      "Vỏ Thép Nguyên Khối",
      "Thiết Kế Ý Sang Trọng"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: true
  },
  {
    id: "piaggio-liberty-abs",
    name: "Piaggio Liberty ABS",
    price: "140.000",
    type: "Xe Tay Ga",
    specs: [
      "Phanh ABS An Toàn",
      "Động Cơ i-Get",
      "Bánh Xe Kích Thước Lớn",
      "Khóa Từ Chống Trộm"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "suzuki-burgman-street",
    name: "Suzuki Burgman Street",
    price: "130.000",
    type: "Xe Tay Ga",
    specs: [
      "Tư Thế Ngồi Thoải Mái",
      "Động Cơ SEP Tiết Kiệm",
      "Cốp Xe Rộng Rãi",
      "Đầu Sạc 12V Tiện Lợi"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "suzuki-impulse",
    name: "Suzuki Impulse",
    price: "100.000",
    type: "Xe Tay Ga",
    specs: [
      "Thiết Kế Thể Thao",
      "Hệ Thống Phun Xăng FI",
      "Vận Hành Đầm Chắc",
      "Cốp Đồ Tiện Lợi"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "sym-attila-elizabethvenus",
    name: "SYM Attila (Elizabeth/Venus)",
    price: "90.000",
    type: "Xe Tay Ga",
    specs: [
      "Kiểu Dáng Cổ Điển",
      "Nắp Bình Xăng Ngoài",
      "Cốp Đồ Rộng Rãi",
      "Động Cơ Êm Ái"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "sym-elite-50",
    name: "SYM Elite 50",
    price: "110.000",
    type: "Xe 50cc",
    specs: [
      "Không Cần Bằng Lái",
      "Kiểu Dáng Nhỏ Xinh",
      "Nắp Bình Xăng Tiện Lợi",
      "Phù Hợp Học Sinh"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "sym-passing-50",
    name: "SYM Passing 50",
    price: "110.000",
    type: "Xe 50cc",
    specs: [
      "Không Cần Bằng Lái",
      "Kiểu Dáng Thể Thao",
      "Đèn Halogen Siêu Sáng",
      "Khung Sườn Đầm Chắc"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "sym-attila-50",
    name: "SYM Attila 50",
    price: "120.000",
    type: "Xe 50cc",
    specs: [
      "Không Cần Bằng Lái",
      "Dáng Vespa Thanh Lịch",
      "Cốp Xe Rộng Rãi",
      "Tiết Kiệm Nhiên Liệu"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "sym-elegant-50",
    name: "SYM Elegant 50",
    price: "90.000",
    type: "Xe 50cc",
    specs: [
      "Không Cần Bằng Lái",
      "Động Cơ Siêu Bền",
      "Tiết Kiệm Xăng Cực Kì",
      "Dễ Dàng Vận Hành"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "sym-angela-50",
    name: "SYM Angela 50",
    price: "90.000",
    type: "Xe 50cc",
    specs: [
      "Không Cần Bằng Lái",
      "Có Hộc Đồ Phía Trước",
      "Yên Xe Dài Êm Ái",
      "Thiết Kế Dễ Thương"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "honda-wave-alpha-rsx",
    name: "Honda Wave Alpha / RSX",
    price: "80.000",
    type: "Xe Số",
    specs: [
      "Động Cơ 110cc Bền Bỉ",
      "Hệ Thống Phun Xăng FI",
      "Cực Kỳ Tiết Kiệm Xăng",
      "Dễ Bảo Dưỡng Sửa Chữa"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "honda-future",
    name: "Honda Future",
    price: "110.000",
    type: "Xe Số",
    specs: [
      "Động Cơ 125cc Mạnh Mẽ",
      "Tiết Kiệm Xăng Vượt Trội",
      "Cốp Xe U-Box Rộng",
      "Đèn Pha LED Bền Bỉ"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-sirius",
    name: "Yamaha Sirius",
    price: "80.000",
    type: "Xe Số",
    specs: [
      "Động Cơ 110cc Bốc Khỏe",
      "Khung Sườn Chắc Chắn",
      "Giá Thuê Cực Rẻ",
      "Dễ Dàng Vượt Đèo Dốc"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-jupiter-fi",
    name: "Yamaha Jupiter FI",
    price: "100.000",
    type: "Xe Số",
    specs: [
      "Động Cơ Phun Xăng FI",
      "Vận Hành Đầm Chắc",
      "Phuộc Bình Dầu Thể Thao",
      "Tiết Kiệm Nhiên Liệu"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-exciter-150155-vva",
    name: "Yamaha Exciter 150/155 VVA",
    price: "120.000",
    type: "Xe Côn Tay",
    specs: [
      "Động Cơ 155cc VVA",
      "Côn Tay Thể Thao",
      "Khóa Smartkey",
      "Ly Hợp Chống Trượt"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: true
  },
  {
    id: "honda-winner-x",
    name: "Honda Winner X",
    price: "110.000",
    type: "Xe Côn Tay",
    specs: [
      "Phanh ABS An Toàn",
      "Động Cơ DOHC 150cc",
      "Xích Có Phớt Cao Su",
      "Ống Xả Thể Thao Bốc"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "suzuki-raider-satria-150",
    name: "Suzuki Raider / Satria 150",
    price: "140.000",
    type: "Xe Côn Tay",
    specs: [
      "Động Cơ DOHC Mạnh Mẽ",
      "Kiểu Dáng Hyper Underbone",
      "Trọng Lượng Siêu Nhẹ",
      "Khả N Kahn Gia Tốc Cực Nhanh"
    ],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "yamaha-xsr-155",
    name: "Yamaha XSR 155",
    price: "200.000",
    type: "Classic",
    specs: [
      "Kiểu Dáng Cổ Điển",
      "Động Cơ VVA 155cc",
      "Phuộc Ngược USD",
      "Bộ Ly Hợp Chống Trượt"
    ],
    image: "https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "honda-cb150r-neo",
    name: "Honda CB150R Neo",
    price: "200.000",
    type: "Sport Cafe",
    specs: [
      "Thiết Kế Neo Sports Cafe",
      "Phuộc USD Showa 41mm",
      "Phanh ABS G-Sensor",
      "Gắp Sau Nhôm Đúc"
    ],
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "suzuki-bandit-150-gsx-s150",
    name: "Suzuki Bandit 150 / GSX-S150",
    price: "150.000",
    type: "Xe Côn Tay",
    specs: [
      "Động Cơ DOHC 150cc",
      "Tư Thế Ngồi Thoải Mái",
      "Khung Sườn Đầm Chắc",
      "Thích Hợp Phượt Đường Dài"
    ],
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "vinfast-evo200",
    name: "VinFast Evo200",
    price: "100.000",
    type: "Xe Máy Điện",
    specs: [
      "Quãng Đường 203km/Sạc",
      "Pin LFP Tiên Tiến",
      "Chống Nước IP67",
      "Tốc Độ Tối Đa 70km/h"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "vinfast-feliz-s",
    name: "VinFast Feliz S",
    price: "120.000",
    type: "Xe Máy Điện",
    specs: [
      "Động Cơ Điện 3000W",
      "Quãng Đường 198km",
      "Cốp Rộng Rãi 25L",
      "Hệ Thống Phanh An Toàn"
    ],
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "vinfast-klara-s",
    name: "VinFast Klara S",
    price: "130.000",
    type: "Xe Máy Điện",
    specs: [
      "Thiết Kế Ý Thanh Lịch",
      "Động Cơ Bosch Cao Cấp",
      "Hai Viên Pin LFP",
      "Kết Nối Thông Minh App"
    ],
    image: "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "dat-bike-weaverplus",
    name: "Dat Bike Weaver++",
    price: "170.000",
    type: "Xe Máy Điện",
    specs: [
      "Động Cơ 7000W Siêu Bốc",
      "Sạc Nhanh 3 Giờ",
      "Quãng Đường 200km",
      "Thiết Kế Retro Độc Đáo"
    ],
    image: "https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800",
    featured: true
  },
  {
    id: "honda-rebel-300-500",
    name: "Honda Rebel 300 / 500",
    price: "450.000",
    type: "Cruiser",
    specs: [
      "Động Cơ Cruiser Uy Lực",
      "Tư Thế Ngồi Thấp Phong Trần",
      "Phanh ABS Cả Hai Bánh",
      "Thích Hợp Tour Đường Trường"
    ],
    image: "https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "honda-cb500x",
    name: "Honda CB500X",
    price: "550.000",
    type: "Adventure",
    specs: [
      "Dòng Xe Adventure Chuyên Nghiệp",
      "Động Cơ 2 Xi-lanh Mạnh Mẽ",
      "Phuộc Hành Trình Dài",
      "Kính Chắn Gió Lớn"
    ],
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    featured: false
  },
  {
    id: "kawasaki-ninja-400",
    name: "Kawasaki Ninja 400",
    price: "450.000",
    type: "Sport",
    specs: [
      "Động Cơ 2 Xi-lanh 399cc",
      "Bộ Ly Hợp Chống Trượt",
      "Tư Thế Lái Thể Thao",
      "Mặt Đồng Hồ LCD Đa Năng"
    ],
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    featured: true
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// FIX [SEC-3]: Gate test-db endpoint to development environment only
if (process.env.NODE_ENV !== 'production') {
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

      const savedUser = await testUser.save();
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
}

app.get('/api/bikes', (req, res) => {
  res.json(BIKES);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
