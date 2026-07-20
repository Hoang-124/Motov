# TÀI LIỆU NỘI DUNG SLIDE BẢO VỆ ĐỒ ÁN - HỆ THỐNG MOTOV
*Ngày cập nhật: 20-07-2026*

---

## PHẦN 0 — Thông tin nhóm và quản lý dự án

### 0.1 Thành viên nhóm & Phân chia công việc

#### 👨‍💻 Trần Quang Bửu Hoàng (Trưởng nhóm - Leader)
*   **Các chức năng đã phát triển (Web/Server/Mobile):**
    *   Tích hợp thanh toán trực tuyến qua cổng VNPay Sandbox thực tế, tự động hủy đơn khi thanh toán thất bại.
    *   Tối ưu hóa hệ thống gửi email và tin nhắn SMS song song, thiết lập bộ nhớ cache transporter.
    *   Đồng bộ hóa toàn bộ tính năng đặt xe, chi tiết hóa đơn và eKYC tự động điền từ Web lên Mobile.
    *   Giao diện Web Admin: thiết kế Layout Admin dọc, trang cài đặt hệ thống, và thiết kế Footer cao cấp.
    *   Hỗ trợ đa ngôn ngữ: dịch tĩnh & động toàn hệ thống (Tiếng Hàn, Việt, Anh).
*   **Hoạt động kiểm thử & Sửa lỗi (QA/Debugging):**
    *   Kiểm tra đồng bộ hóa luồng thanh toán VNPay trên ứng dụng di động (In-App Integration).
    *   Sửa lỗi đồng bộ dữ liệu thời gian thực của Chat (real-time sync), hiển thị tên và chặn lặp tin nhắn.
    *   Sửa lỗi đồng bộ Token đăng nhập của Admin (Admin token sync).
    *   Tối ưu hóa hiệu năng máy chủ, khắc phục hoàn toàn lỗi tràn bộ nhớ (OOM) khi khởi chạy server.
*   **Công việc Quản lý & Tài liệu:**
    *   Đóng vai trò Trưởng nhóm (Leader): Phân công, điều phối công việc và quản lý tiến độ dự án.
    *   Kiểm duyệt chất lượng mã nguồn, giải quyết xung đột (conflict resolution) và tiến hành merge code trên GitHub.

#### 👩‍💻 Lê Thị Bảo Uyên
*   **Các chức năng đã phát triển (Web/Server):**
    *   Tích hợp bản đồ Leaflet hiển thị Xe máy Lân cận sử dụng truy vấn GeoJSON.
    *   Xác thực danh tính eKYC & Quy trình đăng ký, duyệt đối tác Chủ xe (eKYC & Owner Approval).
    *   Quy trình đặt xe và Scheduler nhắc nhở lịch trình tự động qua Email (SMTP) và SMS Twilio.
    *   Phê duyệt: Xây dựng cổng duyệt thông tin xe, duyệt chủ xe và duyệt đơn hàng của Admin.
    *   Quản lý kho phụ tùng thiết bị (CRUD Inventory) & Tự động cảnh báo số lượng tồn kho.
    *   Quản lý chương trình khuyến mãi (Voucher/Promotion CRUD) của Admin.
    *   Quản lý đánh giá & phản hồi (Feedback) và chức năng xóa/ẩn đánh giá của Admin.
    *   Tích hợp Chat thời gian thực sử dụng Socket.io giữa Customer và Owner/Admin.
    *   Quản lý thông tin thành viên (CRUD Users) dành cho Admin.
*   **Hoạt động kiểm thử & Sửa lỗi (QA/Debugging):**
    *   Kiểm tra thuật toán lọc xe theo Bán kính trên bản đồ.
    *   Kiểm tra tính năng kéo thả Marker ghim vị trí tùy chỉnh.
    *   Kiểm tra các hành động thao tác bản đồ (Zoom In/Out, Refresh thủ công, định vị nhanh).
    *   Kiểm tra các ràng buộc thời gian (ngày thuê, ngày trả xe).
    *   Kiểm thử bảo mật eKYC: Xác thực luồng hiển thị trang đặt xe với các tài khoản Chưa xác thực eKYC, Đang chờ duyệt eKYC, và Đã hoàn thành eKYC.
    *   Kiểm tra định dạng nhập Số điện thoại (sai đầu số quy định, thiếu ký tự, chứa ký tự lạ).
    *   Kiểm tra vượt hạn mức thuê tối đa và các luồng giao dịch VNPay (thành công NCB, khách hủy, timeout giao dịch).
    *   Kiểm tra lọc đơn hàng theo trạng thái và khởi chạy luồng bàn giao xe (Pickup).
    *   Sửa lỗi Admin-users: Thêm debounce 400ms khi tìm kiếm người dùng để tối ưu hiệu năng API.
    *   Sửa lỗi bảo mật: Xóa bỏ debug logs lộ và vá backdoor bypass OTP qua token.
    *   Biên dịch & Typecheck: Đảm bảo code pass hoàn toàn không có lỗi TypeScript trên cả 3 module (client, server, mobile).
*   **Công việc Tài liệu & Thiết kế:**
    *   Vẽ các loại sơ đồ nghiệp vụ trong tài liệu môn SWD, SDN.
    *   Viết tài liệu báo cáo file doc cho 2 môn SWD, SDN.
    *   Viết báo cáo kỹ thuật tổng kết cho dự án bằng LaTeX.
    *   Thiết kế và hoàn thiện slide thuyết trình chính.

#### 👨‍💻 Nguyễn Hà Tiến Quang
*   **Các chức năng đã phát triển (Web/Server):**
    *   Giao diện và API Xem danh sách đơn đặt xe (Bookings).
    *   Xác nhận đặt xe và luồng nghiệp vụ Bàn giao xe (Pickup/Return).
    *   Cập nhật trạng thái kỹ thuật của xe máy (Available/Maintenance).
    *   Xử lý lưu trữ, đồng bộ và hiển thị danh sách Xe yêu thích (Favorites).
*   **Hoạt động kiểm thử & Sửa lỗi (QA/Debugging):**
    *   Kiểm thử tính năng danh mục xe: Nhập trùng tên danh mục, bỏ trống các trường bắt buộc khi thêm mới/chỉnh sửa danh mục.
    *   Kiểm thử lưu cập nhật xe thành công.
    *   Kiểm thử quản lý người dùng: Tìm kiếm chính xác theo Username, lọc kết hợp nhiều điều kiện, thêm thành viên trùng lặp Email/SĐT/Username, nhập sai định dạng liên hệ.
    *   Kiểm thử quản lý tài khoản: Khóa tài khoản thành viên thành công, chặn đăng nhập tài khoản bị khóa.
    *   Kiểm thử quản lý khuyến mãi: Tìm kiếm khuyến mãi theo mã code, thêm mới trùng mã, bỏ trống trường bắt buộc, ngày kết thúc nhỏ hơn ngày bắt đầu, sửa mã trùng lặp, bật/tắt trạng thái hoạt động trực tiếp.
    *   Kiểm thử quản lý đánh giá: Tìm kiếm nội dung đánh giá, xem chi tiết đánh giá, nhận diện từ ngữ thô tục/nhạy cảm, ẩn đánh giá vi phạm kèm nhập lý do tùy chỉnh, xóa vĩnh viễn đánh giá.
*   **Công việc Tài liệu & Thiết kế:**
    *   Hỗ trợ thiết kế và vẽ các sơ đồ tuần tự (Sequence Diagram).

#### 👨‍💻 Đặng Phương Khôi Nguyên
*   **Các chức năng đã phát triển:**
    *   Luồng đặt thuê xe máy (phía Khách hàng).
    *   Kiểm tra tình trạng xe có sẵn trước khi cho thuê.
    *   Ngăn ngừa xung đột trùng lịch thuê xe trên cùng một đầu xe máy (Hệ thống).
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
