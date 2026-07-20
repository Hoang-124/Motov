# TÀI LIỆU NỘI DUNG SLIDE BẢO VỆ ĐỒ ÁN - HỆ THỐNG MOTOV
*Ngày cập nhật: 20-07-2026*

---

## PHẦN 0 — Thông tin nhóm và quản lý dự án

### 0.1 Thành viên nhóm & Phân chia công việc

#### 👨‍💻 Trần Quang Bửu Hoàng (Trưởng nhóm - Leader)
*   **Chức năng phát triển:**
    *   **Thanh toán:** Tích hợp cổng VNPay Sandbox thực tế (Web/Mobile), tự động hủy đơn khi thanh toán lỗi và đồng bộ hóa luồng thanh toán VNPay In-App trên Mobile App.
    *   **Nhắc nhở tự động:** Hệ thống gửi Email & SMS nhắc nhở lịch trình song song, tối ưu hóa cache transporter (Backend), thiết kế giao diện UI quản lý nhắc nhở của Admin.
    *   **Đồng bộ ứng dụng di động:** Đồng bộ hóa toàn bộ tính năng đặt xe, chi tiết hóa đơn, hiển thị eKYC từ Web sang Mobile App.
    *   **Giao diện & UI/UX Web:** Thiết kế Layout Web Admin dọc, trang cấu hình hệ thống, thiết kế Footer cao cấp, dropdowns danh sách Yêu thích (Favorites) trên Header navbar, chỉ báo active menu.
    *   **Quản lý Đánh giá & Phản hồi:** Phát triển luồng trả hàng sớm (early return), gửi lý do phản hồi trả hàng, cảnh báo thô tục và tự động ẩn đánh giá vi phạm.
    *   **Quản lý Chat & Chat Real-time:** Gộp các cuộc hội thoại chat theo đối tác, chia mốc thời gian thông minh, tích hợp chat trực tiếp với Admin hoặc Chủ xe.
    *   **Đa ngôn ngữ & Map styling:** Hỗ trợ đa ngôn ngữ tiếng Hàn, Anh, Việt (tĩnh và động từ DB); áp dụng bộ lọc CSS Cyber Dark cho bản đồ Leaflet để tăng độ tương phản, đổi layer bản đồ sang CartoDB Voyager.
*   **Kiểm thử & Sửa lỗi (Bugfixes):**
    *   Sửa lỗi 404 lệch route Đăng ký chủ xe (`becomeOwner` -> `become-owner`) trên Mobile.
    *   Sửa lỗi 404 lệch route Nhân viên giao xe (`api/staff/bookings/...` -> `api/bookings/staff/bookings/...`) trên Web.
    *   Sửa lỗi chặn CORS/CSRF đối với method `DELETE` bằng cách cho phép header `Authorization` đi qua middleware.
    *   Sửa lỗi đồng bộ Chat Socket.io thời gian thực (real-time sync, hiển thị tên, double emit, null handling).
    *   Sửa lỗi đồng bộ Token đăng nhập của Admin (Admin token sync).
    *   Khôi phục vị trí GPS thật (`navigator.geolocation`) với Da Nang coordinates fallback.
    *   Tối ưu hóa hiệu năng máy chủ, khắc phục triệt để lỗi tràn bộ nhớ (OOM) khi khởi chạy server.
*   **Quản lý & Điều phối:** Phân công, điều phối công việc của dự án trên GitHub; kiểm duyệt chất lượng mã nguồn (Code review), giải quyết xung đột (conflict resolution) và tiến hành merge code chính của toàn bộ nhóm.



#### 👨‍💻 Nguyễn Thanh Tùng (Core Developer)
*   **Chức năng phát triển:**
    *   **Web:** Quản lý xe máy (CRUD), So sánh xe (Compare), áp dụng Voucher đặt xe, Hệ thống nhắc nhở tự động Email/SMS.
    *   **Web Security:** Tích hợp Helmet, Rate Limiting, CORS strict, chống NoSQL Injection, xác thực CSRF, hardening JWT và ẩn chi tiết thông báo lỗi.
    *   **Mobile:** Modal chi tiết xe, so sánh thông số (Compare Modal), bản đồ BikesMap (Đà Nẵng), Staff Dashboard, Staff Schedule (Giao/Nhận xe), quản lý kho (Inventory), Admin Promotions/Categories/Feedbacks, phân luồng Tab Navigation.
*   **Kiểm thử & Sửa lỗi:** Fix lỗi logic Chat (sse hook, double emit); fix lỗi inventory (khóa nhập ô số lượng, chặn chữ); fix lỗi đặt xe (nút trả xe, validate Odometer & thời gian, checklist bàn giao, nội dung feedback); fix lỗi TypeScript 'Returning' và tỷ lệ hoạt động xe; fix định dạng biển số xe VN.

#### 👩‍💻 Lê Thị Bảo Uyên (Developer)
*   **Chức năng phát triển:** Bản đồ xe lân cận Leaflet (GeoJSON), duyệt đối tác Chủ xe (eKYC & Owner Approval), duyệt xe của Admin, CRUD kho, CRUD khuyến mãi, quản lý và xóa/ẩn feedback, CRUD người dùng.
*   **Kiểm thử & Sửa lỗi:** Kiểm thử lọc bán kính bản đồ, kéo thả Marker, ràng buộc thời gian thuê, eKYC bypass và định dạng SĐT; sửa lỗi debounce search 400ms và sửa lỗi bảo mật.
*   **Tài liệu & Thiết kế:** Vẽ các loại sơ đồ (SWD, SDN), viết báo cáo file doc môn SWD & SDN, viết báo cáo LaTeX tổng kết dự án và làm slide thuyết trình.

#### 👨‍💻 Nguyễn Hà Tiến Quang (Developer)
*   **Chức năng phát triển:** Giao diện & API Xem danh sách đặt xe, xác nhận đặt xe, cập nhật trạng thái xe (Available/Maintenance), thêm/xóa xe yêu thích (Favorites dropdown).
*   **Kiểm thử & Sửa lỗi:** Kiểm thử danh mục (trùng tên, trường bắt buộc); kiểm thử quản lý người dùng (lọc nhiều điều kiện, trùng Email/SĐT, khóa/mở khóa đăng nhập); kiểm thử khuyến mãi (thêm mới trùng mã, thời gian lỗi); ẩn đánh giá nhạy cảm.
*   **Tài liệu & Thiết kế:** Hỗ trợ vẽ biểu đồ tuần tự (Sequence Diagram).

#### 👨‍💻 Đặng Phương Khôi Nguyên (Developer)
*   **Chức năng phát triển:** Đặt thuê xe máy & kiểm tra xe có sẵn, ngăn ngừa đặt trùng lịch thuê xe trên cùng một đầu xe máy (Hệ thống).
    *   Tự động tính phí thuê xe dựa trên thời gian thực tế.
    *   Giao diện Xem danh sách đặt chỗ và chi tiết đặt chỗ (Khách hàng).
    *   Hủy đặt chỗ và theo dõi trạng thái đơn đặt chỗ (Khách hàng).
    *   Luồng Xác nhận trả xe (phía Nhân viên).
    *   Tự động tính toán phụ phí quá hạn và các phụ phí phát sinh (Hệ thống).
*   **Hoạt động kiểm thử & Sửa lỗi (QA/Debugging):**
    *   Kiểm thử bàn giao xe: Bỏ trống Odometer khi giao, thiếu ảnh hiện trạng xe (bắt buộc 4 góc chụp), không tích chọn đủ checklist thiết bị bàn giao.
    *   Kiểm thử trạng thái xe: Chuyển trạng thái xe sang Bảo trì, khôi phục trạng thái xe sau bảo trì và reset Odo.
    *   Kiểm thử quản lý kho linh kiện: Tìm kiếm xe trong đội, thêm mới linh kiện thành công, kiểm tra ràng buộc kiểu số của các trường số lượng/ngưỡng/đơn giá, kiểm thử nhập trùng mã SKU.
    *   Kiểm thử nhập kho/xuất kho: Nhập kho thành công, nhập số lượng bằng 0 hoặc âm, nhập chữ cái, xuất kho thành công, xuất kho vượt quá tồn thực tế, cập nhật thông tin linh kiện, sửa mã SKU trùng lặp.
*   **Công việc Tài liệu & Thiết kế:**
    *   Phân chia công việc và giám sát các mốc công việc trên Jira.
    *   Vẽ sơ đồ quan hệ thực thể ERD và thiết kế cấu trúc Cơ sở dữ liệu.

### 0.2 Công cụ quản lý dự án
*   **Công cụ:** Jira Software (Quản lý dự án theo mô hình Agile/Scrum).
*   **Hình thức:** Phân chia task, theo dõi trạng thái công việc (To Do, In Progress, Done) và giám sát tiến độ Sprint trực quan qua Jira board.

---

## PHẦN 1 — Mô tả bài toán và Phạm vi dự án

### 1.1 Danh sách vai trò (Roles) & Middleware RBAC trong code
*   **Bằng chứng phân quyền tại file [User.ts:L74](file:///d:/Motov/Motov/server/src/models/User.ts#L74)**:
    ```typescript
    roles: [{ type: String, enum: ['Admin', 'Staff', 'Owner', 'Customer'], default: ['Customer'] }]
    ```
*   **Bằng chứng phân quyền API thực tế (restrictTo)**:
    ```text
    server\src\routes\adminRoutes.ts:25:router.use(restrictTo('Admin') as any);
    server\src\routes\authRoutes.ts:48:router.get('/owner-requests', authMiddleware as any, restrictTo('Admin', 'Staff') as any, getOwnerRequests as any);
    server\src\routes\bookingRoutes.ts:126:router.put('/staff/bookings/:id/confirm', restrictTo('Staff', 'Admin') as any, confirmBookingByStaff as any);
    ```

### 1.2 Mô tả hệ thống (5-7 câu)
Hệ thống Motov là một nền tảng thuê xe máy trực tuyến toàn diện, hỗ trợ đầy đủ 4 nhóm vai trò người dùng (Customer, Owner, Staff, Admin) với phân quyền bảo mật chặt chẽ (RBAC) trên cả Web và Mobile. Khách hàng (Customer) sau khi hoàn tất định danh eKYC tích hợp công nghệ AI OCR tự động có thể tiến hành đặt xe, thanh toán trực tuyến qua cổng VNPay Sandbox, theo dõi trạng thái đơn hàng thời gian thực (Real-time tracking) và liên lạc trực tiếp với chủ xe thông qua hệ thống Chat nội bộ. Đối tác Chủ xe (Owner) có quyền đăng ký, quản lý danh sách xe và theo dõi doanh thu. Nhân viên (Staff) đảm nhận việc phê duyệt yêu cầu đăng ký chủ xe, xác nhận bàn giao/thu hồi xe bằng quy trình checklist kỹ thuật và đồng hồ Odometer. Toàn bộ hoạt động của hệ thống được giám sát thông qua bảng điều khiển trực quan (Dashboard) của Admin cùng cơ chế tự động gửi tin nhắn SMS Twilio nhắc nhở lịch nhận/trả xe.

---

## PHẦN 2 — Use Case Diagram

### 2.1 Bằng chứng phân quyền Use Case trong routes
```text
server\src\routes\authRoutes.ts:54:router.get('/identity-requests', authMiddleware as any, restrictTo('Admin', 'Staff') as any, getIdentityRequests as any);
server\src\routes\bookingRoutes.ts:83:router.put('/:id/return', restrictTo('Admin', 'Staff', 'Customer') as any, returnMotorbike as any);
server\src\routes\feedbackRoutes.ts:26:router.put('/:id/block', authMiddleware as any, restrictTo('Admin') as any, blockFeedback as any);
server\src\routes\inventoryRoutes.ts:16:router.use(restrictTo('Admin', 'Staff') as any);
server\src\routes\promotionRoutes.ts:22:router.use(authMiddleware as any, restrictTo('Admin') as any);
```

### 2.2 Bảng phân vai trò và Use Case tương ứng

| Actor (Role) | Use Case | Route/API tương ứng |
| :--- | :--- | :--- |
| **Public (Khách vãng lai)** | Đăng ký tài khoản | `POST /api/auth/register` |
| | Đăng nhập tài khoản | `POST /api/auth/login` |
| | Xem danh sách xe máy | `GET /api/vehicles` |
| **Customer (Khách thuê)** | Thực hiện eKYC (Định danh) | `POST /api/auth/verify-identity` |
| | Yêu cầu nâng cấp lên Chủ xe | `POST /api/auth/become-owner` |
| | Đặt thuê xe máy | `POST /api/bookings` |
| | Tạo link thanh toán VNPay | `POST /api/bookings/:id/vnpay-url` |
| | Nhận diện tọa độ xe gần nhất | `GET /api/vehicles/nearby` |
| | Đánh giá & Phản hồi sau chuyến đi| `POST /api/feedbacks` |
| **Owner (Chủ xe)** | Đăng ký & quản lý danh sách xe | `POST /api/vehicles` |
| | Xác nhận yêu cầu thuê xe | `PUT /api/bookings/:id` |
| **Staff (Nhân viên)** | Duyệt yêu cầu Định danh eKYC | `PUT /api/auth/identity-requests/:id/approve` |
| | Duyệt yêu cầu nâng cấp đối tác | `PUT /api/auth/owner-requests/:id/approve` |
| | Xác nhận bàn giao xe (Pickup) | `PUT /api/bookings/staff/bookings/:id/pickup` |
| | Quản lý kho phụ tùng thiết bị | `GET/POST/PUT/DELETE /api/inventory` |
| **Admin (Quản trị viên)** | Quản lý người dùng (Ban/Unban) | `PUT /api/users/:id/ban` |
| | Cấu hình cài đặt hệ thống | `PUT /api/system/settings` |
| | Quản lý mã giảm giá (Voucher) | `POST/PUT/DELETE /api/promotions` |

---

## PHẦN 3 — Sơ đồ ngữ cảnh (Context Diagram)

### 3.1 Xác thực dịch vụ bên ngoài trong Server (`package.json`)
*   `firebase-admin`: Xác thực và gửi mã OTP qua Firebase Auth.
*   `nodemailer`: Gửi email xác thực tài khoản và thông tin hóa đơn.
*   `axios`: Gọi APIs VNPay, Twilio SMS.

### 3.2 Bằng chứng gọi dịch vụ ngoài trong code
```text
.\server\src\config\firebase.ts (Khởi tạo SDK Firebase Admin)
.\server\src\controllers\bookingController.ts (Khởi tạo URL VNPay)
.\server\src\utils\emailService.ts (Khởi tạo SMTP Mailer & Twilio SMS API)
```

### 3.3 Danh sách các Node trong sơ đồ ngữ cảnh
1.  **Actor (Người dùng)**:
    *   Khách thuê xe (Customer)
    *   Đối tác chủ xe (Owner)
    *   Nhân viên phòng vé (Staff)
    *   Quản trị viên (Admin)
2.  **Hệ thống trung tâm (Motov System)**:
    *   Ứng dụng React Web Frontend (`localhost:3000`)
    *   Ứng dụng di động Expo React Native Mobile App
    *   Hệ thống máy chủ Node.js Express Backend (`localhost:5000`)
    *   Cơ sở dữ liệu MongoDB
3.  **Hệ thống tích hợp bên ngoài (External Services)**:
    *   **VNPay Sandbox Gateway**: Xử lý cổng thanh toán trực tuyến và phản hồi giao dịch qua IPN.
    *   **Twilio SMS Gateway**: Gửi tin nhắn SMS tự động nhắc nhở lịch trình xe.
    *   **Firebase Authentication**: Xác thực số điện thoại người dùng bằng OTP.
    *   **Google SMTP Server**: Gửi các email giao dịch, xác thực tài khoản, hóa đơn.
    *   **OpenStreetMap Nominatim API**: Giải mã ngược địa chỉ từ tọa độ GPS của xe.

---

## PHẦN 4 — Kiến trúc Cơ sở dữ liệu (Database Schema)

### 4.1 Bảng ánh xạ Schema MongoDB

| Collection | Field chính | Kiểu dữ liệu | Ghi chú (Mối quan hệ) |
| :--- | :--- | :--- | :--- |
| **users** | `username`, `email`, `passwordHash`, `roles`, `status`, `favoriteVehicles`, `identityStatus` | Object | `favoriteVehicles` liên kết đến **vehicles** |
| **vehicles** | `ownerId`, `vehicleModel`, `licensePlate`, `rentalPrice`, `status`, `category`, `location` | Object | `ownerId` liên kết đến **users**; `category` liên kết đến **categories** |
| **bookings** | `userId`, `vehicleId`, `pickupDateTime`, `returnDateTime`, `totalAmount`, `status`, `discountId`, `startOdometer` | Object | `userId` liên kết đến **users**; `vehicleId` liên kết đến **vehicles**; `discountId` liên kết đến **discounts** |
| **discounts** | `discountName`, `discountType`, `discountValue`, `voucherCode`, `usageLimit`, `usedCount` | Object | Quản lý thông tin chương trình khuyến mãi |
| **feedbacks** | `userId`, `vehicleId`, `bookingId`, `rating`, `content` | Object | `userId` -> **users**; `vehicleId` -> **vehicles**; `bookingId` -> **bookings** |
| **conversations** | `participants`, `lastMessageAt` | Object | `participants` mảng các **users** |
| **messages** | `conversationId`, `senderId`, `content` | Object | `conversationId` -> **conversations**; `senderId` -> **users** |
| **inventories** | `name`, `sku`, `quantity`, `minQuantity`, `price`, `location` | Object | Quản lý thiết bị/phụ tùng kho |
| **bookingreminders** | `bookingId`, `reminderType`, `scheduledTime`, `isSent` | Object | `bookingId` liên kết đến **bookings** |

---

## PHẦN 5 — Demo Checklist (Kế hoạch Demo đồ án)

> [!IMPORTANT]
> Cảnh báo trước demo: Tránh demo các luồng chức năng bị mock cục bộ trên thiết bị Mobile. Ưu tiên demo các luồng đó trên giao diện Web để hiển thị dữ liệu thật từ cơ sở dữ liệu.

### 5.1 Các luồng khuyên dùng để Demo trên WEB CLIENT
1.  **Định danh eKYC**: Khách hàng tải ảnh chụp 2 mặt CCCD và ảnh chân dung selfie, hệ thống chạy OCR tự động điền thông tin và chấm điểm khớp mặt.
2.  **Đăng ký xe mới của Chủ xe**: Owner thêm xe máy mới đầy đủ hình ảnh, giá thuê, định vị xe trực quan trên bản đồ Leaflet.
3.  **Xác nhận bàn giao xe (Pickup) của Staff**: Nhân viên xác thực thông tin bàn giao, nhập số Odometer nhận xe và kích hoạt hợp đồng Đang thuê.
4.  **Admin Dashboard & Cấu hình khuyến mãi**: Xem thống kê doanh số thu nhập thời gian thực, quản lý và áp dụng mã giảm giá.

### 5.2 Các luồng khuyên dùng để Demo trên MOBILE APP
1.  **Đăng nhập & Tìm kiếm xe**: Khách hàng tìm xe gần nhất dựa trên khoảng cách GPS và bản đồ.
2.  **Quy trình Đặt xe & Thanh toán VNPay**: Khách thuê xe, nhập mã giảm giá, nhấn thanh toán để chuyển hướng sang trang VNPay Gateway nhập thẻ test của ngân hàng Sandbox.
3.  **Chat thời gian thực**: Trò chuyện trực tiếp giữa Khách thuê xe và Chủ xe.

### 5.3 Lưu ý kỹ thuật quan trọng cho buổi demo
*   **Vá lỗi 404 Route Mismatch**: 2 lỗi lệch đường dẫn nghiêm trọng gây lỗi 404 đã được sửa thành công cục bộ:
    1.  *Staff pickup trên Web*: `/api/staff/bookings/:id/pickup` -> `/api/bookings/staff/bookings/:id/pickup`.
    2.  *Become owner trên Mobile*: `/auth/becomeOwner` -> `/auth/become-owner`.
*   **Hành động bắt buộc**: Bạn cần đẩy (deploy) bản sửa đổi này lên môi trường hosting thật (ví dụ Render) trước buổi demo để đảm bảo các lỗi này được khắc phục hoàn toàn trên production.
