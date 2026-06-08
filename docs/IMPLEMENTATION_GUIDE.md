# 🛠️ Booking Management Implementation Guide

Hướng dẫn triển khai và sử dụng Booking Management API cho dự án Motov.

---

## 📦 Cấu Trúc File Được Thêm

```
server/
├── src/
│   ├── controllers/
│   │   └── bookingController.ts          # ✨ Booking CRUD operations
│   ├── routes/
│   │   └── bookingRoutes.ts              # ✨ Booking API routes
│   ├── validators/
│   │   └── bookingValidation.ts          # ✨ Validation & business logic
│   └── index.ts                          # (Updated: mount booking routes)
│
├── docs/
│   └── BOOKING_API.md                    # ✨ Complete API documentation
│
└── README.md                             # (Updated: features & guides)
```

---

## 🚀 Cách Sử Dụng

### 1. Enable Booking Routes

Routes đã được tự động mount trong `server/src/index.ts`:

```typescript
import bookingRoutes from './routes/bookingRoutes.js';

// Mount routes
app.use('/api/bookings', bookingRoutes);
```

### 2. Start Server

```bash
cd server
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### 3. Test API Endpoints

#### A. Đăng nhập trước
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "khachhang@motov.com",
    "password": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "khachhang@motov.com",
    "role": "customer"
  }
}
```

Lưu `token` để dùng ở bước tiếp.

#### B. Tạo Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "507f1f77bcf86cd799439013",
    "pickupDateTime": "2024-02-01T09:00:00Z",
    "returnDateTime": "2024-02-02T09:00:00Z",
    "pickupLocation": {
      "address": "245 Cách Mạng Tháng Tám, Q3, TP.HCM",
      "coordinates": [106.6297, 10.7769]
    },
    "returnLocation": {
      "address": "123 Nguyễn Huệ, Q1, TP.HCM",
      "coordinates": [106.6626, 10.7689]
    }
  }'
```

#### C. Lấy Danh Sách Bookings
```bash
curl http://localhost:5000/api/bookings/my-bookings \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 📝 API Endpoints Overview

| Method | Endpoint | Mô Tả | Auth Required |
|--------|----------|-------|---------------|
| POST | `/api/bookings` | Tạo booking mới | ✓ |
| GET | `/api/bookings/my-bookings` | Lấy bookings của user | ✓ |
| GET | `/api/bookings/:id` | Lấy chi tiết booking | ✓ |
| GET | `/api/bookings` | Lấy tất cả bookings (Admin/Staff) | ✓ |
| PUT | `/api/bookings/:id` | Cập nhật trạng thái booking | ✓ |
| POST | `/api/bookings/:id/cancel` | Hủy booking | ✓ |
| DELETE | `/api/bookings/:id` | Xóa booking (Admin) | ✓ |
| GET | `/api/bookings/vehicle/:vehicleId` | Lấy bookings của xe | ✓ |

---

## 🔄 Booking Status Flow

```
┌──────────────┐
│  Pending ⏳  │ (Chờ xác nhận)
└──────┬───────┘
       │
       ├→ Confirmed ✓ (Xác nhận)
       │   │
       │   └→ Ongoing 🚴 (Đang cho thuê)
       │       │
       │       └→ Completed ✓ (Hoàn tất)
       │
       └→ Cancelled ❌ (Hủy)
```

### Mô Tả Trạng Thái

| Trạng Thái | Mô Tả | Tiếp Theo |
|-----------|-------|----------|
| **Pending** | Khách hàng vừa tạo booking, chờ chủ xe xác nhận | Confirmed, Cancelled |
| **Confirmed** | Chủ xe đã xác nhận, xe sẵn sàng | Ongoing, Cancelled |
| **Ongoing** | Khách hàng đã lấy xe, đang sử dụng | Completed |
| **Completed** | Khách hàng đã trả xe | (Kết thúc) |
| **Cancelled** | Booking đã bị hủy | (Kết thúc) |

---

## 👥 Access Control

### By Role

| Feature | Customer | Owner | Staff | Admin |
|---------|----------|-------|-------|-------|
| Tạo Booking | ✓ | ✓ | - | - |
| Xem Booking Của Mình | ✓ | ✓ | ✓ | ✓ |
| Xem Booking Chi Tiết | ✓ (own) | ✓ (own vehicle) | ✓ | ✓ |
| Xem Tất Cả Bookings | - | - | ✓ | ✓ |
| Cập Nhật Status | - | ✓ (own vehicle) | ✓ | ✓ |
| Hủy Booking | ✓ (own) | - | - | ✓ |
| Xóa Booking | - | - | - | ✓ |

### Authorization Middleware

```typescript
// Tất cả endpoints bắt buộc phải có token
authMiddleware as any

// Chỉ Admin
restrictTo('Admin')

// Admin hoặc Staff
restrictTo('Admin', 'Staff')
```

---

## 💾 Database Integration

### Booking Model
Đã được định nghĩa trong `server/src/models/Booking.ts`:

```typescript
interface IBooking {
  userId: ObjectId;              // Khách hàng
  vehicleId: ObjectId;           // Xe được đặt
  vehicleSnapshot: {             // Snapshot giá lúc booking
    name: string;
    image: string;
    rentalPrice: number;
  };
  pickupDateTime: Date;
  returnDateTime: Date;
  pickupLocation?: ILocationDetails;
  returnLocation?: ILocationDetails;
  totalAmount: number;           // Tổng tiền (VND)
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';
  bookingCode: string;           // BK20240115... (unique)
  surcharges: ISurcharge[];      // Phí phụ
  cancelReason?: string;         // Lý do hủy
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Happy Path (Tạo → Xác nhận → Hoàn tất)

**Step 1: Khách hàng đăng nhập**
```bash
# Login with customer account
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"email":"khachhang@motov.com","password":"123456"}'
```

**Step 2: Khách hàng tạo booking**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "pickupDateTime": "2024-02-01T09:00:00Z",
    "returnDateTime": "2024-02-02T09:00:00Z",
    ...
  }'
# Response: Booking với status = "Pending"
```

**Step 3: Chủ xe đăng nhập & xác nhận booking**
```bash
# Login with owner account
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"email":"owner@motov.com","password":"123456"}'

# Update status to Confirmed
curl -X PUT http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -d '{"status":"Confirmed"}'
# Vehicle status: Available → Rented
```

**Step 4: Chủ xe bắt đầu cho thuê**
```bash
curl -X PUT http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -d '{"status":"Ongoing"}'
```

**Step 5: Chủ xe hoàn tất**
```bash
curl -X PUT http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -d '{"status":"Completed"}'
# Vehicle status: Rented → Available
```

---

### Scenario 2: Cancellation (Hủy Booking)

**Step 1: Khách hàng hủy booking Pending**
```bash
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{"cancelReason":"Thay đổi kế hoạch"}'
# Status: Pending → Cancelled ✓
```

**Step 2: Không thể hủy booking Ongoing**
```bash
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
# Error: Không thể hủy booking ở trạng thái "Ongoing"
```

---

### Scenario 3: Vehicle Availability Check

**Nếu xe được booking từ 2024-02-01 → 2024-02-02**
- ❌ Không thể tạo booking 2024-02-01 → 2024-02-03 (overlap)
- ❌ Không thể tạo booking 2024-01-31 → 2024-02-01T10:00 (overlap)
- ✓ Có thể tạo booking 2024-02-02 → 2024-02-03 (không overlap)

```bash
# Try to create overlapping booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "pickupDateTime": "2024-02-01T12:00:00Z",
    "returnDateTime": "2024-02-02T12:00:00Z"
  }'
# Error: Xe này không có sẵn trong khoảng thời gian được chọn
```

---

## 🔧 Validation Rules

### DateTime Validation
- ✓ Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- ✓ Pickup > Now
- ✓ Return > Pickup
- ✓ Min duration: 1 hour
- ✓ Max duration: 30 days

```javascript
// Example valid dates
pickupDateTime: "2024-02-01T09:00:00Z"
returnDateTime: "2024-02-02T09:00:00Z"
```

### Location Validation
```javascript
// Coordinates must be [longitude, latitude]
coordinates: [106.6297, 10.7769]  // Valid
coordinates: [10.7769, 106.6297]  // Invalid (swapped)

// Longitude: -180 to 180
// Latitude: -90 to 90
```

### Vehicle Validation
- ❌ Vehicle doesn't exist
- ❌ Vehicle status != "Available"
- ❌ Vehicle already booked (overlapping dates)

---

## 🔍 Filtering & Pagination

### Get My Bookings with Filters
```bash
# Filter by status
curl "http://localhost:5000/api/bookings/my-bookings?status=Confirmed" \
  -H "Authorization: Bearer TOKEN"

# Pagination
curl "http://localhost:5000/api/bookings/my-bookings?page=2&limit=5" \
  -H "Authorization: Bearer TOKEN"

# Combined
curl "http://localhost:5000/api/bookings/my-bookings?status=Pending&page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

### Get All Bookings (Admin/Staff)
```bash
# Filter by multiple criteria
curl "http://localhost:5000/api/bookings?status=Confirmed&vehicleId=VEHICLE_ID&page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 Response Examples

### Success: Create Booking
```json
{
  "success": true,
  "message": "Đặt chỗ thành công. Vui lòng chờ xác nhận từ chủ xe.",
  "booking": {
    "id": "507f1f77bcf86cd799439011",
    "bookingCode": "BK202401151234567",
    "vehicleModel": "Honda CB300R",
    "pickupDateTime": "2024-02-01T09:00:00Z",
    "returnDateTime": "2024-02-02T09:00:00Z",
    "totalAmount": 120000,
    "status": "Pending",
    "rentalDays": 1,
    "message": "⏳ Đợi chủ xe xác nhận. Bạn sẽ nhận được thông báo khi được phê duyệt."
  }
}
```

### Error: Unavailable Vehicle
```json
{
  "success": false,
  "message": "Xe này không có sẵn trong khoảng thời gian được chọn. Vui lòng chọn thời gian khác."
}
```

### Error: Invalid Status Transition
```json
{
  "success": false,
  "message": "Không thể chuyển từ \"Completed\" sang \"Ongoing\". Chuyển đổi hợp lệ: "
}
```

---

## 🛡️ Security Considerations

### 1. Token Validation
Tất cả booking endpoints yêu cầu valid JWT token trong header:
```
Authorization: Bearer <JWT_TOKEN>
```

### 2. Authorization Checks
- Owner chỉ có thể xem/cập nhật bookings của chính xe mình
- Khách hàng chỉ có thể xem/hủy booking của mình
- Admin/Staff có quyền truy cập tất cả

### 3. Data Validation
- Tất cả input được validate trước khi xử lý
- DateTime được check để đảm bảo không tạo booking trong quá khứ
- Coordinates được validate để đúng format

### 4. Business Logic Protection
- Không thể đặt xe nếu xe không "Available"
- Không thể đặt xe nếu có booking trùng lặp
- Không thể chuyển status nếu không hợp lệ
- Không thể hủy booking nếu đang "Ongoing" hoặc "Completed"

---

## 📋 Checklist

- ✅ `bookingController.ts` - Implement CRUD operations
- ✅ `bookingRoutes.ts` - Define API routes
- ✅ `bookingValidation.ts` - Validation & business logic
- ✅ Update `server/src/index.ts` - Mount booking routes
- ✅ `BOOKING_API.md` - Complete API documentation
- ✅ Update `README.md` - Project overview
- ✅ This guide - Implementation instructions

---

## 🚀 Next Steps

### Phase 2: Frontend Integration
- Create booking form (date/time/location picker)
- Display booking list with filters
- Update booking status UI
- Add cancellation dialog

### Phase 3: Vehicle Management
- Implement vehicle CRUD API
- Vehicle availability calendar
- Owner vehicle dashboard

### Phase 4: Advanced Features
- Payment integration
- SMS notifications
- Admin analytics dashboard
- Feedback & rating system

---

## 📞 Support & Documentation

- 📖 Full API Docs: [BOOKING_API.md](./docs/BOOKING_API.md)
- 🐛 Report Issues: Create GitHub Issue
- 💬 Questions: Start Discussion
- 📧 Contact: quang@motov.com

---

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Implemented By:** Quang
