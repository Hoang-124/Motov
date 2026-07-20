# Báo Cáo Công Việc — Nhánh `xtung`

## Tùng

### Đã làm các chức năng:

**Web (Client):**
+ Đăng ký / Đăng nhập (Email + Google OAuth)
+ Real-time validation form đăng ký + Xác thực Email (same-tab)
+ Quên mật khẩu / Đặt lại mật khẩu / Đổi mật khẩu
+ Hệ thống phân quyền đa vai trò (Guest/Customer/Owner/Staff/Admin)
+ Quản lý xe máy (CRUD) + Upload ảnh Cloudinary
+ Trang chi tiết xe (premium layout, gợi ý xe tương tự)
+ So sánh xe máy (Compare Bikes — chọn 2-3 xe, bảng so sánh)
+ Áp mã voucher/khuyến mãi khi đặt xe
+ Hệ thống đặt xe + Tracking + Trả xe (Early return + hoàn tiền từng phần)
+ Tích hợp thanh toán VNPay Sandbox
+ Hủy đơn tự động khi thanh toán thất bại
+ Custom Toast thay thế window.alert
+ Redesign admin pages + vertical layout + custom scrollbar
+ Redesign notifications dropdown (kiểu Facebook)
+ Premium footer + theme + custom dropdown
+ Dịch toàn bộ UI sang tiếng Việt + thay emoji bằng Lucide icon
+ Tự động tạo feedback cho đơn xe thành công
+ Return reasons + replies + cảnh báo ngôn từ thô tục
+ Active menu indicator

**Server (API):**
+ Bảo mật: Helmet, Rate limiting, Body size limit, CORS strict, mongo-sanitize, CSRF, JWT hardening
+ Loại bỏ lộ error.message khỏi tất cả controller
+ Guard mock-token backdoor, xóa debug logs
+ Upload validation
+ Guard dotenv load trên production
+ Fix route mismatches (become-owner, staff pickup, auth header CSRF)

**Mobile (React Native / Expo):**
+ BikeDetailModal (carousel ảnh, thông số, CTA đặt xe)
+ CompareBikesModal (chọn 2-3 xe, bảng so sánh qua API)
+ BikesMapScreen (bản đồ xe gần bạn, interactive pins, popup đặt xe)
+ StaffDashboardScreen (stats grid, biểu đồ, quick actions)
+ StaffScheduleScreen (lịch trình hôm nay — pickup/return)
+ InventoryScreen (CRUD kho phụ tùng, search, filter sắp hết, nhập/xuất kho)
+ AdminPromotionsScreen (CRUD khuyến mãi qua API)
+ AdminCategoriesScreen (CRUD danh mục qua API)
+ AdminFeedbacksScreen (filter, block/unblock, xóa qua API)
+ AdminManageScreen (sub-nav: Xe/Users/Khuyến mãi/Danh mục/Feedback)
+ Staff tab navigation (Tổng hợp / Yêu cầu / Lịch trình / Kho / Cá nhân)
+ Admin tab navigation (Tổng hợp / Đơn hàng / Quản trị / Cá nhân)

---

### Những chức năng đã test và fix:

+ Fix Google login flow & token verification
+ Fix Admin login token sync
+ Fix mật khẩu ngắn cho tài khoản seed (đổi thành 8 ký tự)
+ Fix password validation đồng bộ CI test
+ Admin Users search với debounce 400ms tránh gọi API thừa
+ Fix validate biển số xe Việt Nam (regex)
+ Fix validate required fields khi thêm xe (Admin)
+ Fix import Sparkles icon crash trên MotorbikeDetail
+ Fix nút Edit/Delete chỉ hiện cho chủ xe, ẩn cho customer
+ Fix nút Return chỉ hiện cho đơn Ongoing
+ Fix loading state trong return submit handler
+ Fix Odometer validation (không nhỏ hơn lúc nhận xe)
+ Fix return time validation (không trước pickup time)
+ Fix inline error khi checklist thiếu hoặc ảnh thiếu
+ Fix validate feedback content không được rỗng
+ Thêm status 'Returning' vào TypeScript types (BookingService, TrackingModal, InteractiveMap)
+ Fix 'Returning' trong tính tỷ lệ occupancy trên dashboard
+ Fix date validation + HTML5 calendar popup
+ Fix tăng tolerance date validation lên 30 phút (client + server)
+ Fix booking link quay về trang chi tiết xe
+ Fix inventory: quantity read-only trong edit mode
+ Fix inventory: chặn ký tự không phải số trong input
+ Fix categories: inline error + duplicate name check (create/edit)
+ Fix chat: logic bugs (field access, double emit, SSE hook, null handling)
+ Fix chat: initiation + duplicate scroll/render
+ Fix chat: real-time sync + undefined participant name
+ Fix chat: hiển thị tin nhắn với admin + upload ảnh từ máy
+ Fix esbuild build error AdminBookings
+ Fix booking test + startup OOM
+ Fix Leaflet crash on marker dragend
+ Fix navigation link path cho BikesMap
+ Fix tile layer → OpenStreetMap (Vietnamese localization)
+ Fix fallback Da Nang coords cho map
+ Fix sync sovereignty claims trong ko.ts locale
+ Fix mobile: babel-preset-expo + Kotlin version cho EAS build
+ Fix mobile: restore files sau security merge
+ Fix security: route mismatches become-owner, staff pickup, auth header CSRF
+ Fix environment override on production (guard dotenv load)
+ Verify: radius filtering, ekyc verification, phone validation, booking constraints
+ TypeScript compilation pass 0 errors trên cả 3 module (client, server, mobile)
