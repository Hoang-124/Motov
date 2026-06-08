# 🏍️ Motov - Bike & Motorcycle Rental Platform

**Motov** là một nền tảng cho thuê xe máy và xe đạp điện theo nhu cầu, phục vụ khách du lịch và cư dân địa phương tại TP.HCM. Hệ thống hỗ trợ nhiều vai trò (Admin, Staff, Owner, Customer) với các tính năng quản lý booking, thanh toán và khách hàng.

---

## 📦 Tech Stack

### **Backend (Server)**
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **OAuth:** Google OAuth 2.0
- **File Upload:** Multer
- **Language:** TypeScript

### **Frontend (Client - Web)**
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Animations:** Framer Motion
- **Icons:** Lucide React

### **Mobile (App)**
- **Framework:** React Native (Expo)
- **State Management:** Redux Toolkit
- **Platform Support:** iOS, Android, Web

---

## 🚀 Cài Đặt Nhanh

### Prerequisites
- Node.js 18+ và npm
- MongoDB running (local or cloud)
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd Motov
```

### 2. Setup Backend (Server)
```bash
cd server
npm install
```

### 3. Setup Frontend (Client)
```bash
cd client
npm install
```

### 4. Setup Mobile (App)
```bash
cd mobile
npm install
```

### 5. Environment Configuration

Tạo file `.env` tại **root directory**:
```env
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/Motov
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Client
VITE_API_URL=http://localhost:5000/api
```

### 6. Run Server
```bash
cd server
npm run dev
```
Server chạy tại: http://localhost:5000

### 7. Run Client
```bash
cd client
npm run dev
```
Client chạy tại: http://localhost:3000

### 8. Run Mobile (Expo)
```bash
cd mobile
npm start
```

---

## 📋 Project Structure

```
Motov/
├── docs/
│   ├── BOOKING_API.md          # 📚 Booking API Documentation
│   ├── CHANGELOG.md
│   └── ...
├── server/                      # 🖥️ Backend (Express)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── bookingController.ts  # ✨ NEW: Booking CRUD
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── bookingRoutes.ts      # ✨ NEW: Booking API Routes
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Vehicle.ts
│   │   │   ├── Booking.ts           # ✨ Booking Document Schema
│   │   │   └── ...
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts
│   │   ├── validators/
│   │   │   └── bookingValidation.ts # ✨ NEW: Validation Logic
│   │   └── index.ts
│   ├── uploads/                     # Uploaded images
│   └── package.json
├── client/                      # 💻 Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
├── mobile/                      # 📱 Mobile App (React Native)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── features/
│   └── package.json
└── README.md
```

---

## 🔐 Authentication

### Login Flow

```
1. User nhập email & password
   ↓
2. Server hash & validate mật khẩu
   ↓
3. Server sinh JWT token (7 days)
   ↓
4. Client lưu token vào localStorage
   ↓
5. Mỗi request được gửi kèm: Authorization: Bearer {token}
   ↓
6. Server verify token qua authMiddleware
```

### Test Accounts

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin123 | admin@motov.com | 123456 | Admin |
| staff123 | nhanvien@motov.com | 123456 | Staff |
| owner123 | owner@motov.com | 123456 | Owner |
| customer123 | khachhang@motov.com | 123456 | Customer |

---

## 🎯 Features

### ✅ Hiện Có

#### Authentication
- ✓ Register / Login (Email/Password)
- ✓ Google OAuth 2.0
- ✓ JWT Token Management
- ✓ Profile Management

#### Booking Management **(NEW)**
- ✓ Create Booking
- ✓ View Booking Details
- ✓ List My Bookings
- ✓ Update Booking Status
- ✓ Cancel Booking
- ✓ Admin View All Bookings
- ✓ Vehicle Availability Check
- ✓ Booking Code Generation

#### User Management
- ✓ User Registration
- ✓ User Profile Update
- ✓ Avatar Upload
- ✓ Role-based Access Control

#### File Management
- ✓ Image Upload (Multer)
- ✓ Static File Serving

### 🚧 Đang Phát Triển

- 🔄 Vehicle Management (CRUD)
- 🔄 Payment Processing
- 🔄 Admin Dashboard
- 🔄 Staff Tools
- 🔄 Feedback & Rating System
- 🔄 Discount & Voucher System
- 🔄 Battery Monitoring (IoT)
- 🔄 SMS Notifications

---

## 📚 API Documentation

### Booking API
Xem [BOOKING_API.md](./docs/BOOKING_API.md) để tìm hiểu chi tiết về Booking Management endpoints, validation, và examples.

**Quick Links:**
- [Create Booking](./docs/BOOKING_API.md#1-✅-create-booking)
- [Get Booking By ID](./docs/BOOKING_API.md#2-📋-get-booking-by-id)
- [Get My Bookings](./docs/BOOKING_API.md#3-📚-get-my-bookings)
- [Update Booking Status](./docs/BOOKING_API.md#5-✏️-update-booking-change-status)
- [Cancel Booking](./docs/BOOKING_API.md#6-❌-cancel-booking)

### Auth API
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Lấy thông tin user (cần auth)
- `PUT /api/auth/profile` - Cập nhật hồ sơ (cần auth)
- `POST /api/auth/become-owner` - Nâng cấp thành chủ xe (cần auth)

---

## 🔄 Booking Workflow

### Quy Trình Cho Thuê Xe Hoàn Chỉnh

```
┌─────────────────────┐
│   Khách Hàng (Đặt)  │
└──────────┬──────────┘
           │
      1. Đăng nhập
           │
           ▼
      2. Tạo Booking (Pending)
           │
           ▼
    ┌─────────────────┐
    │ Chủ Xe (Xác Nhận)│
    └────────┬────────┘
             │
        3. Xác nhận (Confirmed)
        Vehicle → Rented
             │
             ▼
    ┌──────────────────┐
    │ Bắt Đầu Cho Thuê │
    │  (Ongoing)       │
    └────────┬─────────┘
             │
        4. Hoàn Tất
           Completed
             │
             ▼
    ┌──────────────────┐
    │  Tính Phí Phụ    │
    │ & Lưu Feedback   │
    └──────────────────┘
```

### Booking Statuses
- **Pending** (⏳) - Chờ chủ xe xác nhận
- **Confirmed** (✓) - Chủ xe đã xác nhận
- **Ongoing** (🚴) - Xe đang được cho thuê
- **Completed** (✓) - Hoàn tất
- **Cancelled** (❌) - Đã hủy

---

## 🗄️ Database Schema

### User Collection
```typescript
{
  username: string,           // Tên đăng nhập
  email: string,              // Email (unique)
  passwordHash: string,       // Mật khẩu hash
  firstName: string,          // Tên
  lastName: string,           // Họ
  phoneNumber: string,        // SĐT
  roles: string[],            // ['Admin', 'Staff', 'Owner', 'Customer']
  status: string,             // 'Active', 'Suspended', 'Unverified'
  avatarUrl: string,          // Ảnh đại diện
  googleId: string,           // Google OAuth ID
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Collection
```typescript
{
  userId: ObjectId,                    // Khách hàng
  vehicleId: ObjectId,                 // Xe được đặt
  vehicleSnapshot: {                   // Snapshot giá tại thời điểm booking
    name: string,
    image: string,
    rentalPrice: number
  },
  pickupDateTime: Date,                // Ngày giờ lấy xe
  returnDateTime: Date,                // Ngày giờ trả xe
  pickupLocation: {                    // Địa điểm lấy xe
    address: string,
    coordinates: [longitude, latitude]
  },
  returnLocation: {                    // Địa điểm trả xe
    address: string,
    coordinates: [longitude, latitude]
  },
  totalAmount: number,                 // Tổng tiền (VND)
  status: string,                      // 'Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'
  bookingCode: string,                 // Mã booking unique (BK20240115...)
  surcharges: [{                       // Phí phụ (trả muộn, hỏng hóc, etc)
    surchargeType: string,
    amount: number,
    description: string,
    isPaid: boolean,
    createdAt: Date
  }],
  cancelReason: string,                // Lý do hủy (nếu cancelled)
  createdAt: Date,
  updatedAt: Date
}
```

### Vehicle Collection
```typescript
{
  ownerId: ObjectId,                   // Chủ sở hữu xe
  vehicleModel: string,                // Model xe (Honda CB300R, etc)
  licensePlate: string,                // Biển số xe (unique)
  seats: number,                       // Số ghế
  odometer: number,                    // Số km đã đi
  rentalPrice: number,                 // Giá cho thuê/ngày
  status: string,                      // 'Available', 'Rented', 'Maintenance', 'PendingApproval'
  description: string,                 // Mô tả chi tiết
  category: string,                    // 'Sport', 'Cruiser', 'Scooter', etc
  transmissionType: string,            // 'Manual', 'Automatic', 'Semi-Automatic'
  imageUrls: string[],                 // Ảnh xe
  features: string[],                  // Tính năng (ABS, GPS, etc)
  regCertificateUrl: string,          // URL giấy đăng ký
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing

### Test Booking Flow với cURL

**1. Lấy JWT Token**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "khachhang@motov.com",
    "password": "123456"
  }'
```

**2. Tạo Booking**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "pickupDateTime": "2024-02-01T09:00:00Z",
    "returnDateTime": "2024-02-02T09:00:00Z",
    "pickupLocation": {
      "coordinates": [106.6297, 10.7769]
    },
    "returnLocation": {
      "coordinates": [106.6626, 10.7689]
    }
  }'
```

**3. Lấy Danh Sách Bookings Của User**
```bash
curl http://localhost:5000/api/bookings/my-bookings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Available Scripts

### Server
```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build TypeScript
npm start          # Run production server
```

### Client
```bash
npm run dev        # Start dev server (Vite)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Mobile
```bash
npm start          # Start Expo dev server
npm run android    # Build for Android
npm run ios        # Build for iOS
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Đảm bảo MongoDB service đang chạy
2. Kiểm tra MONGODB_URI trong .env
3. Nếu dùng MongoDB Atlas: update connection string
```

### Token Invalid/Expired
```
Error: Token không hợp lệ hoặc đã hết hạn

Solution:
1. Đăng nhập lại để lấy token mới
2. Kiểm tra JWT_SECRET khớp với server
3. Đảm bảo format: Authorization: Bearer {token}
```

### Port Already in Use
```bash
# Kill process on port 5000 (Unix/Linux/Mac)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5000 (Windows PowerShell)
Get-Process | Where-Object {$_.Port -eq 5000} | Stop-Process
```

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details (if applicable)"
}
```

---

## 🔒 Security Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use HTTPS** in production
3. **Validate input** on both client & server
4. **Sanitize data** before storing in DB
5. **Use secure passwords** for test accounts
6. **Implement rate limiting** for APIs
7. **Enable CORS** only for trusted origins
8. **Hash passwords** with bcryptjs (already done)
9. **Rotate JWT secrets** regularly
10. **Monitor suspicious activities**

---

## 👨‍💻 Development Guidelines

### Code Style
- Use **TypeScript** for type safety
- Follow **ESLint** rules
- Use **Prettier** for formatting
- Comment complex logic
- Meaningful variable names

### Commit Messages
```
feat(booking): implement create booking API
fix(auth): resolve token expiration issue
docs(booking): update API documentation
refactor(server): improve error handling
test(booking): add booking validation tests
```

### Branch Naming
- `feature/booking-crud` - New feature
- `fix/token-issue` - Bug fix
- `docs/api-guide` - Documentation
- `refactor/auth-logic` - Code improvement

---

## 📦 Dependencies

### Server
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `google-auth-library` - OAuth 2.0
- `multer` - File uploads
- `cors` - CORS handling
- `dotenv` - Environment variables
- `typescript` - Type safety

### Client
- `react` - UI framework
- `vite` - Build tool
- `react-router-dom` - Routing
- `tailwindcss` - Styling
- `framer-motion` - Animations
- `lucide-react` - Icons

### Mobile
- `react-native` - Mobile framework
- `expo` - RN platform
- `redux-toolkit` - State management
- `react-redux` - Redux bindings
- `typescript` - Type safety

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

| Role | Name | Contact |
|------|------|---------|
| **Backend/Booking** | Quang | quang@motov.com |
| **Frontend** | [Name] | [contact] |
| **Mobile** | [Name] | [contact] |
| **DevOps** | [Name] | [contact] |

---

## 📧 Support

- 📖 Documentation: [./docs/](./docs/)
- 🐛 Report Issues: [Create Issue](../../issues)
- 💬 Questions: [Start Discussion](../../discussions)
- 📞 Contact: contact@motov.com

---

## 🎯 Roadmap

### Q1 2024
- ✅ Booking Management (CRUD)
- 🔄 Vehicle Management
- 🔄 Payment Integration

### Q2 2024
- 🔄 Admin Dashboard
- 🔄 Feedback System
- 🔄 Notification System

### Q3 2024
- 🔄 Advanced Analytics
- 🔄 Mobile App Optimization
- 🔄 AI Recommendations

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0

