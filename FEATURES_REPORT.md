# Báo Cáo Công Việc — Nhánh `xtung`

## Tùng

### Đã làm các chức năng:

**Web (Client & Server):**
+ Quản lý xe máy (CRUD Motorbike page & APIs)
+ So sánh xe máy (Compare Bikes)
+ Nhập mã khuyến mãi/voucher trong form đặt xe
+ Booking Reminder (Gửi email/SMS tự động nhắc nhở lịch nhận/trả xe)
+ Bảo mật hệ thống: Tích hợp Helmet, giới hạn dung lượng body, Rate Limiting, CORS strict mode, chống tấn công NoSQL Injection (mongo-sanitize), xác thực CSRF, và hardening JWT.
+ Ẩn các chi tiết thông báo lỗi thô (`error.message`) ở toàn bộ controller để tăng bảo mật.

**Mobile (React Native / Expo):**
+ BikeDetailModal (carousel ảnh xe, thông số, liên hệ chủ xe, CTA đặt xe)
+ CompareBikesModal (giao diện chọn 2-3 xe & bảng thông số so sánh chi tiết)
+ BikesMapScreen (bản đồ xe gần bạn khu vực Đà Nẵng, ghim xe tương tác, popup đặt xe)
+ StaffDashboardScreen (thống kê tổng hợp, biểu đồ trạng thái, hành động nhanh)
+ StaffScheduleScreen (lịch trình hôm nay: Lấy xe / Trả xe, xác nhận giao xe)
+ InventoryScreen (quản lý kho phụ tùng CRUD, nhập/xuất kho nhanh, cảnh báo sắp hết hàng)
+ AdminPromotionsScreen (CRUD khuyến mãi trực quan)
+ AdminCategoriesScreen (CRUD danh mục xe)
+ AdminFeedbacksScreen (quản lý phản hồi, block người dùng/xóa đánh giá)
+ Phân chia luồng Tab Navigation theo vai trò Staff và Admin riêng biệt

---

### Những chức năng đã test và fix:

+ Fix lỗi logic Chat thời gian thực (truy cập field, double emit, SSE hook, null handling)
+ Fix lỗi inventory: Khóa ô nhập số lượng trong edit mode, chỉ cho chỉnh sửa qua nhập/xuất kho
+ Fix lỗi inventory: Chặn ký tự không phải số trong ô nhập tồn kho tối thiểu và đơn giá
+ Fix lỗi booking: Nút trả xe chỉ xuất hiện đối với các đơn có trạng thái "Ongoing"
+ Fix lỗi booking: Fix loading state khi submit trả xe
+ Fix lỗi booking: Validate số km lúc trả xe không được thấp hơn lúc nhận xe
+ Fix lỗi booking: Validate thời gian trả xe không được trước thời gian nhận xe
+ Fix lỗi booking: Thêm hiển thị lỗi trực quan khi chưa chọn checklist hoặc thiếu ảnh bàn giao xe
+ Fix lỗi booking: Validate nội dung feedback đánh giá không được để trống khi gửi
+ Fix lỗi TypeScript: Đồng bộ trạng thái 'Returning' trong code (BookingService, TrackingModal, InteractiveMap)
+ Fix lỗi hiển thị occupancy rate: Đưa thêm trạng thái 'Returning' vào thống kê xe đang hoạt động
+ Fix lỗi admin-bikes: Regex validate định dạng biển số xe Việt Nam và hiển thị thông báo thiếu trường bắt buộc
+ Fix lỗi categories: Cảnh báo trùng tên danh mục ở cả chế độ thêm mới và chỉnh sửa
+ Fix lỗi admin-users: Thêm debounce 400ms khi tìm kiếm user để tối ưu hiệu năng API
+ Fix lỗi bảo mật: Xóa bỏ debug logs và vá cổng sau bypass token
+ TypeScript compilation pass 0 errors trên cả 3 module (client, server, mobile)
