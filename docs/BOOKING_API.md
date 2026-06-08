# 🚀 Booking Management API Documentation

## Tổng Quan
API Quản lý Booking (Đặt Chỗ) cho nền tảng cho thuê xe Motov. Cung cấp các chức năng CRUD đầy đủ để tạo, xem, cập nhật và hủy bookings.

---

## 📋 Mục Lục
1. [Cấu Trúc Dữ Liệu](#cấu-trúc-dữ-liệu)
2. [Trạng Thái Booking](#trạng-thái-booking)
3. [API Endpoints](#api-endpoints)
4. [Ví Dụ Request/Response](#ví-dụ-requestresponse)
5. [Validation Rules](#validation-rules)
6. [Authorization](#authorization)
7. [Error Handling](#error-handling)

---

## 🗂️ Cấu Trúc Dữ Liệu

### Booking Object

```json
{
  "id": "507f1f77bcf86cd799439011",
  "bookingCode": "BK202401151234567",
  "userId": "507f1f77bcf86cd799439012",
  "userName": "Nguyễn Văn A",
  "userEmail": "nguyena@example.com",
  "userPhone": "0901234567",
  "vehicleId": "507f1f77bcf86cd799439013",
  "vehicleModel": "Honda CB300R",
  "vehicleImage": "https://example.com/image.jpg",
  "pickupDateTime": "2024-02-01T09:00:00Z",
  "returnDateTime": "2024-02-02T09:00:00Z",
  "pickupLocation": {
    "address": "245 Cách Mạng Tháng Tám, Q3, TP.HCM",
    "coordinates": [106.6297, 10.7769]
  },
  "returnLocation": {
    "address": "123 Nguyễn Huệ, Q1, TP.HCM",
    "coordinates": [106.6626, 10.7689]
  },
  "rentalDays": 1,
  "totalAmount": 120000,
  "status": "Confirmed",
  "statusLabel": "✓ Đã xác nhận",
  "surcharges": [
    {
      "surchargeType": "Late return fee",
      "amount": 50000,
      "description": "Trả xe muộn 3 giờ",
      "isPaid": false,
      "createdAt": "2024-02-02T12:00:00Z"
    }
  ],
  "cancelReason": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:00:00Z"
}
```

### Surcharge Object

```json
{
  "surchargeType": "string",           // Loại phí phụ
  "amount": 50000,                     // Số tiền (VND)
  "description": "string",             // Mô tả
  "isPaid": false,                     // Đã thanh toán?
  "createdAt": "2024-01-15T10:30:00Z" // Ngày tạo
}
```

### Location Object

```json
{
  "address": "string",           // Địa chỉ (tùy chọn)
  "coordinates": [106.6297, 10.7769]  // [Longitude, Latitude]
}
```

---

## 🔄 Trạng Thái Booking

| Trạng Thái | Mô Tả | Chuyển Đổi Được |
|-----------|-------|-----------------|
| **Pending** | ⏳ Chờ xác nhận từ chủ xe | Có (→ Confirmed, Cancelled) |
| **Confirmed** | ✓ Chủ xe đã xác nhận | Có (→ Ongoing, Cancelled) |
| **Ongoing** | 🚴 Xe đang được cho thuê | Có (→ Completed) |
| **Completed** | ✓ Hoàn tất cho thuê | Không |
| **Cancelled** | ❌ Đã bị hủy | Không |

---

## 📡 API Endpoints

### 1. ✅ CREATE BOOKING
Tạo booking mới

```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
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
}
```

**Response (201 Created):**
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

**Errors:**
| Code | Message |
|------|---------|
| 400 | Vui lòng cung cấp đầy đủ các thông tin |
| 404 | Người dùng không tồn tại |
| 404 | Xe không tồn tại |
| 400 | Xe này không có sẵn trong khoảng thời gian được chọn |
| 400 | Xe hiện không khả dụng |

---

### 2. 📋 GET BOOKING BY ID
Lấy thông tin chi tiết một booking

```http
GET /api/bookings/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "booking": {
    "id": "507f1f77bcf86cd799439011",
    "bookingCode": "BK202401151234567",
    "vehicleModel": "Honda CB300R",
    "status": "Confirmed",
    "totalAmount": 120000,
    ...
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | ID booking không hợp lệ |
| 404 | Không tìm thấy booking |
| 403 | Bạn không có quyền xem booking này |

---

### 3. 📚 GET MY BOOKINGS
Lấy danh sách bookings của user hiện tại

```http
GET /api/bookings/my-bookings?status=Confirmed&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
| Param | Type | Mô Tả |
|-------|------|-------|
| status | string | Lọc theo trạng thái (Pending, Confirmed, Ongoing, Completed, Cancelled) |
| page | number | Số trang (default: 1) |
| limit | number | Số records/trang (default: 10) |

**Response (200 OK):**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "507f1f77bcf86cd799439011",
      "bookingCode": "BK202401151234567",
      "vehicleModel": "Honda CB300R",
      "status": "Confirmed",
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalBookings": 45,
    "bookingsPerPage": 10
  }
}
```

---

### 4. 👥 GET ALL BOOKINGS (Admin/Staff)
Lấy danh sách tất cả bookings (chỉ Admin/Staff)

```http
GET /api/bookings?status=Pending&vehicleId=507f1f77bcf86cd799439013&userId=507f1f77bcf86cd799439012&page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
| Param | Type | Mô Tả |
|-------|------|-------|
| status | string | Lọc theo trạng thái |
| vehicleId | string | Lọc theo xe |
| userId | string | Lọc theo user |
| page | number | Số trang (default: 1) |
| limit | number | Số records/trang (default: 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "bookings": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalBookings": 50,
    "bookingsPerPage": 20
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Bạn không có quyền xem tất cả bookings |

---

### 5. ✏️ UPDATE BOOKING (Change Status)
Cập nhật trạng thái booking

```http
PUT /api/bookings/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Confirmed",
  "notes": "Đã kiểm tra xe, tình trạng tốt"
}
```

**Status Transitions:**
```
Pending     → Confirmed, Cancelled
Confirmed   → Ongoing, Cancelled
Ongoing     → Completed
Completed   → (không thể chuyển đổi)
Cancelled   → (không thể chuyển đổi)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật booking sang trạng thái \"✓ Đã xác nhận\" thành công",
  "booking": {
    "id": "507f1f77bcf86cd799439011",
    "status": "Confirmed",
    "statusLabel": "✓ Đã xác nhận",
    ...
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | ID booking không hợp lệ |
| 404 | Booking không tồn tại |
| 403 | Bạn không có quyền cập nhật booking này |
| 400 | Không thể chuyển từ ... sang ... |

---

### 6. ❌ CANCEL BOOKING
Hủy booking

```http
POST /api/bookings/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancelReason": "Khách hàng yêu cầu hủy"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "❌ Booking đã bị hủy thành công",
  "booking": {
    "id": "507f1f77bcf86cd799439011",
    "status": "Cancelled",
    "cancelReason": "Khách hàng yêu cầu hủy",
    ...
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | ID booking không hợp lệ |
| 404 | Booking không tồn tại |
| 403 | Bạn không có quyền hủy booking này |
| 400 | Không thể hủy booking ở trạng thái ... |

**Chỉ có thể hủy booking ở trạng thái:**
- Pending (⏳ Chờ xác nhận)
- Confirmed (✓ Đã xác nhận)

---

### 7. 🗑️ DELETE BOOKING (Admin only)
Xóa booking vĩnh viễn khỏi hệ thống

```http
DELETE /api/bookings/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "✓ Booking đã bị xóa khỏi hệ thống"
}
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Chỉ Admin mới có thể xóa booking |
| 400 | ID booking không hợp lệ |
| 404 | Booking không tồn tại |

---

### 8. 🚗 GET BOOKINGS BY VEHICLE
Lấy danh sách bookings của một chiếc xe

```http
GET /api/bookings/vehicle/{vehicleId}?status=Confirmed&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
| Param | Type | Mô Tả |
|-------|------|-------|
| status | string | Lọc theo trạng thái |
| page | number | Số trang (default: 1) |
| limit | number | Số records/trang (default: 10) |

**Response (200 OK):**
```json
{
  "success": true,
  "bookings": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalBookings": 15,
    "bookingsPerPage": 10
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | ID xe không hợp lệ |
| 404 | Xe không tồn tại |
| 403 | Bạn không có quyền xem bookings của xe này |

---

## 📝 Ví Dụ Request/Response

### Ví Dụ 1: Tạo Booking Mới

**cURL Request:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "507f1f77bcf86cd799439013",
    "pickupDateTime": "2024-02-01T09:00:00Z",
    "returnDateTime": "2024-02-02T09:00:00Z",
    "pickupLocation": {
      "address": "245 Cách Mạng Tháng Tám",
      "coordinates": [106.6297, 10.7769]
    },
    "returnLocation": {
      "address": "123 Nguyễn Huệ",
      "coordinates": [106.6626, 10.7689]
    }
  }'
```

**JavaScript Fetch:**
```javascript
const response = await fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    vehicleId: '507f1f77bcf86cd799439013',
    pickupDateTime: '2024-02-01T09:00:00Z',
    returnDateTime: '2024-02-02T09:00:00Z',
    pickupLocation: {
      address: '245 Cách Mạng Tháng Tám',
      coordinates: [106.6297, 10.7769]
    },
    returnLocation: {
      address: '123 Nguyễn Huệ',
      coordinates: [106.6626, 10.7689]
    }
  })
});

const data = await response.json();
console.log(data);
```

---

### Ví Dụ 2: Xác Nhận Booking

**cURL Request:**
```bash
curl -X PUT http://localhost:5000/api/bookings/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Confirmed",
    "notes": "Đã kiểm tra xe, tình trạng tốt"
  }'
```

---

### Ví Dụ 3: Lấy Danh Sách Bookings Của User

**cURL Request:**
```bash
curl http://localhost:5000/api/bookings/my-bookings?status=Confirmed&page=1&limit=10 \
  -H "Authorization: Bearer your_jwt_token"
```

---

## ✅ Validation Rules

### Pickup & Return DateTime
- ✓ Định dạng ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- ✓ Pickup DateTime phải là tương lai
- ✓ Return DateTime phải sau Pickup DateTime
- ✓ Thời gian cho thuê tối thiểu: 1 giờ
- ✓ Thời gian cho thuê tối đa: 30 ngày

### Locations
- ✓ Coordinates phải là array [Longitude, Latitude]
- ✓ Longitude: -180 to 180
- ✓ Latitude: -90 to 90

### Vehicle Availability
- ✗ Không thể đặt xe nếu đã có booking Confirmed hoặc Ongoing
- ✗ Không thể đặt xe nếu trạng thái không phải "Available"

---

## 🔐 Authorization

### Access Control By Endpoint

| Endpoint | Customer | Owner | Staff | Admin |
|----------|----------|-------|-------|-------|
| POST /bookings | ✓ | ✓ | - | - |
| GET /bookings/my-bookings | ✓ | ✓ | ✓ | ✓ |
| GET /bookings/:id | ✓ (own) | ✓ (own vehicle) | ✓ | ✓ |
| GET /bookings (all) | - | - | ✓ | ✓ |
| PUT /bookings/:id | - | ✓ (own vehicle) | ✓ | ✓ |
| POST /bookings/:id/cancel | ✓ (own) | - | - | ✓ |
| DELETE /bookings/:id | - | - | - | ✓ |
| GET /bookings/vehicle/:id | ✓ | ✓ (own) | ✓ | ✓ |

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Mô tả lỗi chi tiết",
  "error": "Error stack trace (nếu có)"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔄 Workflow Example

### Quy Trình Cho Thuê Xe Hoàn Chỉnh

```
1. Customer đăng nhập
   ↓
2. Customer tạo booking (Status: Pending)
   ↓
3. Owner nhấn "Xác nhận" (Status: Confirmed)
   Vehicle status: Available → Rented
   ↓
4. Customer lấy xe, Owner nhấn "Bắt đầu" (Status: Ongoing)
   ↓
5. Customer trả xe, Owner nhấn "Hoàn tất" (Status: Completed)
   Vehicle status: Rented → Available
   ↓
6. Tính toán phí phụ (nếu có)
7. Lưu feedback
```

---

## 📚 Additional Notes

### Booking Code Format
`BK` + `YYYYMMDD` + `6-digit random`
**Example:** `BK202401151234567`

### Total Amount Calculation
```
Total = (Rental Price per Day) × (Number of Days)
```

### Surcharge Types
- `Late return fee` - Phí trả xe muộn
- `Damage fee` - Phí hỏng hóc
- `Cleaning fee` - Phí vệ sinh
- `Fuel fee` - Phí xăng
- `Maintenance` - Chi phí bảo dưỡng
- `Note from owner` - Ghi chú từ chủ xe

---

## 🚀 Best Practices

1. **Always include Authorization header** với valid JWT token
2. **Validate dates** trên client trước khi gửi
3. **Handle pagination** để tránh overload server
4. **Check vehicle availability** trước tạo booking
5. **Store booking code** để reference
6. **Monitor surcharges** khi hoàn tất booking
7. **Implement polling/WebSocket** để cập nhật real-time status

---

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained By:** Quang - Backend Developer
