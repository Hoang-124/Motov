# HỒ SƠ TỔNG HỢP LUỒNG NGHIỆP VỤ & BÀI THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN MOTOV
**(Hệ thống Nền tảng Cho thuê xe máy Thông minh - Smart Motorbike Rental Platform)**

---

## 🎤 PHẦN I: KỊCH BẢN NÓI THUYẾT TRÌNH TRỰC TIẾP TRƯỚC HỘI ĐỒNG (Spoken Presentation Script)

> **[Lời mở đầu]**
> *"Kính thưa Thầy/Cô trong Hội đồng chấm đồ án,*
> 
> *Sau đây em xin đại diện nhóm trình bày về **Hệ thống Cho thuê xe máy Thông minh Motov**. Motov được thiết kế theo mô hình kết hợp P2P Rental (kinh tế chia sẻ giữa Chủ xe & Khách thuê) và Trung tâm điều phối giao nhận trực tiếp. Hệ thống giải quyết trọn vẹn bài toán quản lý tài sản, tự động hóa quyết toán tài chính và minh bạch hóa hợp đồng giao nhận xe.*
> 
> *Sau đây em xin trình bày 1 Luồng nghiệp vụ chính và 3 Luồng nghiệp vụ phụ nổi bật của hệ thống:"*

---

### 1. Kịch bản nói Luồng chính: "Vòng đời Đặt thuê & Giao nhận - Thu hồi xe"
> *"Luồng chính của ứng dụng quản lý trọn vẹn hành trình thuê xe qua 4 bước:*
> 
> * **Bước 1 - Đặt xe & eKYC:** Khách hàng chọn mẫu xe, thời gian và địa điểm. Hệ thống tự động chặn các tài khoản chưa xác thực **eKYC (CCCD/Bằng lái xe)** và kiểm tra thuật toán trùng lịch trống của xe.
> * **Bước 2 - Quy định Đặt cọc 30%:** Mọi đơn hàng trên Motov đều bắt buộc chịu mức **Đặt cọc giữ xe 30%**. Nếu khách chọn thanh toán Banking/VNPay, cọc 30% được trả ngay online. Nếu chọn Tiền mặt, khoản cọc 30% này sẽ được tính và thu trực tiếp tại cửa hàng khi làm thủ tục nhận xe.
> * **Bước 3 - Thủ tục Giao xe (Handover):** Nhân viên mở Biên bản bàn giao, hệ thống **tự động trích xuất số Odometer thực tế từ Database** để điền sẵn. Nhân viên tích kiểm tra giấy tờ, mũ bảo hiểm và **chụp 4 góc ảnh thực tế của xe (Trước, Sau, Trái, Phải)** để tạo bằng chứng pháp lý ban đầu.
> * **Bước 4 - Thu hồi xe & Quyết toán tự động:** Khi trả xe, Nhân viên chụp lại 4 góc ảnh thu hồi và nhập số Odo kết thúc. Thuật toán của Motov sẽ tự động phân loại:
>   * **Trả xe sớm (>15 phút):** Khách hàng sẽ **mất tiền cọc 30%** và hệ thống tính lại tiền thuê thực tế dựa trên **chính xác số giờ khách đã sử dụng (`actualHours`)**.
>   * **Trả xe muộn:** Tự động tính phụ phí trễ hạn.
>   * Ngay khi hoàn tất, số Odo mới sẽ tự động cập nhật ngược lại vào Database chiếc xe để phục vụ cảnh báo bảo dưỡng."*

---

### 2. Kịch bản nói Luồng phụ 1: "Đăng ký Chủ xe đối tác & Ký Hợp đồng điện tử"
> *"Luồng phụ thứ nhất giải quyết bài toán mở rộng nguồn cung xe cho nền tảng (Supply Chain Scaling):*
> 
> * Khi cá nhân muốn đưa xe vào hệ thống kiếm thu nhập thụ động, họ nộp thông tin tài khoản ngân hàng và **trực tiếp ký tên bằng Chữ ký điện tử (Digital Canvas Signature)** lên Hợp đồng ủy thác.
> * Nhân viên điều phối sẽ thẩm định 2 lớp: **Lớp 1 (Thẩm định Chủ xe)** - kiểm tra eKYC, ngân hàng và hợp đồng đã ký; **Lớp 2 (Thẩm định Xe)** - kiểm tra giấy đăng ký, số Odo ban đầu và hình ảnh xe trước khi phê duyệt xe hoạt động `Available`."*

---

### 3. Kịch bản nói Luồng phụ 2: "Định vị & Gợi ý Xe máy gần vị trí Khách thuê nhất (GIS Nearby Search)"
> *"Luồng phụ thứ hai tối ưu trải nghiệm tìm kiếm tiện lợi cho Khách thuê chuẩn bị thuê xe:*
> 
> * Khi khách truy cập Bản đồ tìm xe (`/bikes-map` hoặc tính năng Xem xe gần bạn), hệ thống tự động kích hoạt **Geolocation API** lấy tọa độ GPS hiện tại của khách hàng (Kinh độ & Vĩ độ).
> * Backend sử dụng **Truy vấn Địa lý 2DSphere (`$near` / Haversine Distance)** trong MongoDB để tính khoảng cách và tự động sắp xếp danh sách xe khả dụng từ **gần nhất đến xa nhất** (kèm hiển thị số `km` thực tế). Đồng thời, hiển thị trực quan các ghim vị trí xe trên Bản đồ tương tác Leaflet/MapLibre giúp khách dễ dàng chọn chiếc xe gần mình nhất để đặt thuê."*

---

### 4. Kịch bản nói Luồng phụ 3: "Tự động Cảnh báo Bảo dưỡng Odometer & Đặt lại Chu kỳ Bảo dưỡng Xe"
> *"Luồng phụ thứ ba đảm bảo an toàn kỹ thuật phương tiện và tuổi thọ tài sản:*
> 
> * Mỗi khi xe hoàn tất đơn thuê, chỉ số Odometer mới được cập nhật vào Database. Hệ thống tự động tính quãng đường xe đã vận hành từ lần bảo dưỡng trước (`odometer - lastMaintenanceOdometer`).
> * Nếu quãng đường tích lũy đạt mốc cài đặt (mặc định `2.000 km` từ lần thay dầu trước), hệ thống tự động chuyển cờ `requiresMaintenance = true`, tự động khóa trạng thái xe sang `Maintenance` (Bảo dưỡng) và gửi cảnh báo kỹ thuật cho Staff/Owner.
> * Sau khi mang xe đi thay dầu/bảo dưỡng xong, Nhân viên bấm nút **"Xác nhận đã bảo dưỡng"**, hệ thống sẽ cập nhật lại `lastMaintenanceOdometer` bằng Odometer hiện tại và đưa xe trở lại trạng thái `Available` sẵn sàng đón khách."*

---

## 🔄 PHẦN II: CHI TIẾT LUỒNG NGHIỆP VỤ CHÍNH (MAIN WORKFLOW)
### 📌 Tên luồng: Vòng đời Đặt thuê xe - Giao nhận 4 góc ảnh - Thu hồi & Quyết toán tài chính

```
[Khách thuê (Customer)] 
    │
    ├── 1. Chọn xe, Thời gian & Địa điểm giao nhận
    ├── 2. Kiểm tra điều kiện eKYC (Bắt buộc phải Verified)
    ├── 3. Kiểm tra thuật toán trùng lịch trống (checkVehicleAvailability)
    ├── 4. Chọn Phương thức thanh toán (Banking / Cash)
    │      └── Mọi phương thức đều tính: 
    │          - Tiền cọc giữ xe (Deposit) = 30% tổng tiền
    │          - Thanh toán còn lại (Remaining) = 70% tổng tiền
    │
[Nhân viên điều phối (Staff / Admin)]
    │
    ├── 5. Duyệt đơn & Thực hiện Thủ tục Bàn giao xe (Handover Modal):
    │      ├── Trích xuất tự động số Odometer hiện tại từ Database
    │      ├── Tích chọn Checklist thiết bị (Giấy tờ, Mũ bảo hiểm, Phanh, Gương, Xăng)
    │      └── Chụp & lưu 4 góc ảnh hiện trạng xe (Mặt trước, Mặt sau, Sườn trái, Sườn phải)
    │      └── Trạng thái chuyển sang: 'Ongoing' (Đang thuê)
    │
[Thu hồi xe & Quyết toán tự động (Return & Settlement)]
    │
    ├── 6. Mở Biên bản Thu hồi xe (Return Modal):
    │      ├── Nhập Odometer kết thúc (Bắt buộc >= Odometer nhận xe)
    │      └── Chụp & lưu 4 góc ảnh xe lúc thu hồi
    │
    ├── 7. Thuật toán kiểm tra thời gian trả xe thực tế:
    │      ├── TRẢ XE SỚM (> 15 phút):
    │      │   ├── Mất tiền cọc 30% đã đăng ký
    │      │   └── Quyết toán tiền thuê = (Số giờ thực tế đã đi * Đơn giá theo giờ)
    │      ├── TRẢ XE MUỘN (> 15 phút):
    │      │   └── Quyết toán = Tiền thuê gốc + Phụ phí trễ hạn theo giờ
    │      └── TRẢ XE ĐÚNG HẠN:
    │          └── Thanh toán đúng 70% số tiền còn lại
    │
    └── 8. Hoàn tất đơn ('Completed'):
           └── Tự động cập nhật Odometer mới nhất vào bảng Vehicle trong Database
```

---

## 🤝 PHẦN III: LUỒNG NGHIỆP VỤ PHỤ 1 (SECONDARY WORKFLOW 1)
### 📌 Tên luồng: Đăng ký Chủ xe đối tác - Ký Hợp đồng điện tử & Phê duyệt Phương tiện 2 Lớp

```
[Chủ xe đối tác (Vehicle Owner)]
    │
    ├── 1. Gửi yêu cầu đăng ký làm Chủ xe (Nộp STK Ngân hàng, SĐT)
    ├── 2. Đọc nội dung Hợp đồng Ủy thác Hợp tác
    ├── 3. Ký tên bằng Chữ ký điện tử trực tiếp trên màn hình (Digital Signature Canvas)
    └── 4. Gửi hồ sơ lên hệ thống (Lưu chữ ký dạng mã hóa Base64)
    │
[Nhân viên điều phối (Staff / Admin)]
    │
    ├── 5. Thẩm định Lớp 1 (Duyệt Chủ xe):
    │      ├── Xem Hồ sơ, eKYC & Bản hợp đồng kèm Chữ ký điện tử đã ký
    │      └── Phê duyệt tài khoản nâng cấp quyền thành 'Owner'
    │
[Chủ xe đối tác (Vehicle Owner)]
    │
    ├── 6. Đăng tải thông tin Xe máy:
    │      └── Nhập Model, Biển số, Số Odometer hiện tại, Giá thuê, Cavet & Ảnh xe
    │
[Nhân viên điều phối (Staff / Admin)]
    │
    └── 7. Thẩm định Lớp 2 (Duyệt Xe):
           ├── Kiểm tra tính hợp pháp của xe & biển số
           └── Phê duyệt xe sang trạng thái 'Available' (Sẵn sàng đưa vào kinh doanh)
```

---

## 🗺️ PHẦN IV: LUỒNG NGHIỆP VỤ PHỤ 2 (SECONDARY WORKFLOW 2)
### 📌 Tên luồng: Định vị GPS & Tìm kiếm Gợi ý Xe máy gần vị trí Khách hàng nhất (GIS Nearby Search)

```
[Khách hàng chuẩn bị thuê xe (Customer)]
    │
    ├── 1. Truy cập Trang Tìm xe theo Bản đồ (`/bikes-map` hoặc tính năng "Tìm xe gần bạn")
    ├── 2. Trình duyệt gửi yêu cầu cấp quyền Định vị GPS (HTML5 Geolocation API)
    │      └── Lấy được tọa độ hiện tại của Khách hàng: `[Kinh độ (Lng), Vĩ độ (Lat)]`
    │
[Hệ thống Backend (Node.js & MongoDB GIS)]
    │
    ├── 3. Gọi API `/api/vehicles/nearby?lat=...&lng=...&maxDistance=10000`
    ├── 4. Chạy truy vấn không gian 2DSphere MongoDB Index:
    │      └── Sử dụng toán tử `$near` / Thuật toán Haversine đo khoảng cách
    │
    ├── 5. Lọc danh sách xe:
    │      ├── Chỉ lấy các xe đang có trạng thái 'Available'
    │      └── Tính chính xác khoảng cách đường chim bay (đơn vị `km`) từ vị trí Khách đến từng Xe
    │
[Giao diện Client (React & Interactive Map)]
    │
    ├── 6. Sắp xếp danh sách Xe hiển thị từ GẦN NHẤT đến XA NHẤT (Ví dụ: `0.8 km`, `1.5 km`, `3.2 km`)
    └── 7. Vẽ trực quan các ghim vị trí xe (Map Markers) lên Bản đồ tương tác
           └── Khách bấm vào ghim trên Bản đồ để xem thông tin chi tiết & tiến hành Đặt xe ngay
```

---

## 🛠️ PHẦN V: LUỒNG NGHIỆP VỤ PHỤ 3 (SECONDARY WORKFLOW 3)
### 📌 Tên luồng: Cảnh báo Bảo dưỡng Odometer Tự động & Đặt lại Chu kỳ Bảo dưỡng Xe máy

```
[Hệ thống tự động (Automated System Engine)]
    │
    ├── 1. Mỗi khi thu hồi xe hoàn tất ('Completed'):
    │      └── Ghi nhận Odometer kết thúc mới vào bảng Vehicle
    │
    ├── 2. Thuật toán kiểm tra hạn bảo dưỡng:
    │      └── Quãng đường đã vận hành = (Odometer hiện tại - lastMaintenanceOdometer)
    │
    ├── 3. Nếu Quãng đường đã vận hành >= maintenanceInterval (mặc định 2.000 km):
    │      ├── Tự động bật cờ `requiresMaintenance = true`
    │      ├── Tự động khóa trạng thái xe sang 'Maintenance' (Bảo dưỡng)
    │      └── Phát cảnh báo trên trang Quản lý Kho xe (`/staff/bikes` / `/inventory`)
    │
[Nhân viên bảo trì (Staff)]
    │
    ├── 4. Đưa xe đi thay dầu, bảo dưỡng kỹ thuật
    └── 5. Bấm nút "Xác nhận đã bảo dưỡng" (Reset Maintenance):
           ├── Cập nhật `lastMaintenanceOdometer` = Odometer hiện tại
           ├── Đặt lại cờ `requiresMaintenance = false`
           └── Đưa trạng thái xe trở lại 'Available' (Sẵn sàng kinh doanh)
```

---

## 💎 PHẦN VI: BẢNG TỔNG HỢP ĐIỂM SÁNG KỸ THUẬT NỔI BẬT DÀNH CHO BẢO VỆ

| STT | Tính năng / Mô-đun | Giải pháp Công nghệ & Nghiệp vụ | Giá trị Thuyết phục Hội đồng |
| :---: | :--- | :--- | :--- |
| **1** | **Xác thực eKYC & Hợp đồng số** | Tích hợp OCR eKYC giấy tờ và Chữ ký số Canvas Base64. | Loại bỏ rủi ro pháp lý & mạo danh khi giao tài sản có giá trị cao. |
| **2** | **Biên bản Bàn giao & Thu hồi 4 Góc ảnh** | Lưu trữ và hiển thị 4 góc ảnh (Trước, Sau, Trái, Phải) kèm nút phóng to toàn màn hình. | Minh bạch 100% tình trạng xe, giải quyết triệt để tranh chấp trầy xước. |
| **3** | **Thuật toán Quyết toán Phí Trả Sớm / Muộn** | Tự động tính tiền theo số giờ sử dụng thực tế (`actualHours`) & quy tắc phạt cọc 30%. | Xử lý linh hoạt bài toán tài chính phức tạp theo thời gian thực. |
| **4** | **Định vị GIS & Gợi ý Xe gần nhất** | Ứng dụng MongoDB 2DSphere Index `$near` & Geolocation API định vị GPS. | Tối ưu hóa hành trình khách thuê, gợi ý xe phù hợp theo khoảng cách thực tế. |
| **5** | **Cảnh báo Bảo dưỡng Xe tự động** | Thuật toán so sánh Odometer chạy thực tế với mốc 2.000 km thay dầu. | Đảm bảo an toàn kỹ thuật phương tiện & nâng cao tuổi thọ tài sản. |
| **6** | **Trích xuất Odometer tự động từ DB** | Hệ thống tự động `populate` và pre-fill chỉ số Odo từ Database vào biên bản. | Giảm thiểu sai sót gõ tay của nhân viên, tăng tốc độ làm thủ tục bàn giao. |
