/**
 * Script kiểm thử tự động toàn bộ luồng API (End-to-End API Flow Test)
 * Chạy bằng Node.js: node scratch/test_api_flow.js
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('=== BẮT ĐẦU KIỂM THỬ LUỒNG API HỆ THỐNG MOTOV ===\n');

  try {
    // 1. ĐĂNG NHẬP TÀI KHOẢN KHÁCH HÀNG (CUSTOMER)
    console.log('[Bước 1] Đăng nhập tài khoản Khách hàng (Customer)...');
    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khachhang@motov.com', password: 'admin123' })
    });
    const customerLoginData = await customerLoginRes.json();
    if (!customerLoginData.success) {
      throw new Error(`Đăng nhập khách hàng thất bại: ${customerLoginData.message}`);
    }
    let customerToken = customerLoginData.token;
    let customerId = customerLoginData.user.id;
    console.log(`=> Đăng nhập khách hàng thành công! ID: ${customerId}`);

    // Kiểm tra thông tin cá nhân của khách hàng
    console.log('=> Lấy thông tin cá nhân hiện tại...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const meData = await meRes.json();
    if (!meData.success) {
      throw new Error(`Lấy thông tin cá nhân thất bại: ${meData.message}`);
    }
    const currentIdentityStatus = meData.user.identityStatus;
    console.log(`=> Trạng thái eKYC hiện tại: ${currentIdentityStatus}`);

    // 2. THỰC HIỆN NỘP HỒ SƠ VÀ DUYỆT EKYC NẾU CHƯA VERIFIED
    if (currentIdentityStatus !== 'Verified') {
      console.log('\n[Bước 2] Nộp hồ sơ eKYC giả lập từ tài khoản Khách hàng...');
      const verifyIdentityRes = await fetch(`${BASE_URL}/auth/verify-identity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          cardFrontUrl: 'http://example.com/front.jpg',
          cardBackUrl: 'http://example.com/back.jpg',
          selfieUrl: 'http://example.com/selfie.jpg'
        })
      });
      const verifyIdentityData = await verifyIdentityRes.json();
      if (!verifyIdentityRes.ok || !verifyIdentityData.success) {
        throw new Error(`Nộp hồ sơ eKYC thất bại: ${verifyIdentityData.message}`);
      }
      console.log(`=> Gửi hồ sơ eKYC thành công! Trạng thái hiện tại: ${verifyIdentityData.data.identityStatus}`);

      // Đăng nhập Admin để phê duyệt eKYC
      console.log('=> Đăng nhập tài khoản Admin để duyệt eKYC...');
      const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@motov.com', password: 'admin123' })
      });
      const adminLoginData = await adminLoginRes.json();
      if (!adminLoginData.success) {
        throw new Error(`Đăng nhập Admin thất bại: ${adminLoginData.message}`);
      }
      const adminToken = adminLoginData.token;

      console.log(`=> Phê duyệt yêu cầu eKYC của khách hàng [ID: ${customerId}]...`);
      const approveRes = await fetch(`${BASE_URL}/auth/identity-requests/${customerId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const approveData = await approveRes.json();
      if (!approveRes.ok || !approveData.success) {
        throw new Error(`Duyệt eKYC thất bại: ${approveData.message}`);
      }
      console.log('=> Phê duyệt eKYC khách hàng thành công!');
    } else {
      console.log('\n[Bước 2] Tài khoản đã được eKYC. Bỏ qua bước xác minh.');
    }

    // 3. TÌM HOẶC THIẾT LẬP XE SẴN SÀNG
    console.log('\n[Bước 3] Kiểm tra danh sách xe và thiết lập xe có sẵn (Available)...');
    const vehiclesRes = await fetch(`${BASE_URL}/vehicles`);
    const vehiclesData = await vehiclesRes.json();
    if (!vehiclesData.success) {
      throw new Error(`Lấy danh sách xe thất bại: ${vehiclesData.message}`);
    }

    let targetVehicle = vehiclesData.data.find(v => v.status === 'Available');
    if (!targetVehicle) {
      console.log('=> Không tìm thấy chiếc xe nào sẵn sàng. Đang lấy chiếc đầu tiên và cập nhật trạng thái thành Available...');
      if (vehiclesData.data.length === 0) {
        throw new Error('Không có xe nào trong hệ thống để thực hiện đặt thử.');
      }
      const vehicleToUpdate = vehiclesData.data[0];

      // Đăng nhập Admin để cập nhật status xe
      const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@motov.com', password: 'admin123' })
      });
      const adminLoginData = await adminLoginRes.json();
      const adminToken = adminLoginData.token;

      const updateVehicleRes = await fetch(`${BASE_URL}/vehicles/${vehicleToUpdate._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Available' })
      });
      const updateVehicleData = await updateVehicleRes.json();
      if (!updateVehicleRes.ok || !updateVehicleData.success) {
        throw new Error(`Cập nhật trạng thái xe thất bại: ${updateVehicleData.message}`);
      }
      targetVehicle = updateVehicleData.data || vehicleToUpdate;
      console.log(`=> Đã cập nhật trạng thái xe [Model: ${targetVehicle.vehicleModel}] thành Available`);
    } else {
      console.log(`=> Tìm thấy xe sẵn sàng: [ID: ${targetVehicle._id}, Model: ${targetVehicle.vehicleModel}]`);
    }

    // 4. TẠO ĐƠN ĐẶT XE (BOOKING)
    console.log('\n[Bước 4] Tiến hành tạo đơn đặt xe mới (Booking)...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const bookingPayload = {
      vehicleId: targetVehicle._id,
      pickupDateTime: tomorrow.toISOString(),
      returnDateTime: dayAfterTomorrow.toISOString(),
      pickupLocation: {
        address: 'Sân bay Đà Nẵng, Việt Nam',
        coordinates: [108.2022, 16.0472]
      },
      returnLocation: {
        address: 'Sân bay Đà Nẵng, Việt Nam',
        coordinates: [108.2022, 16.0472]
      }
    };

    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify(bookingPayload)
    });
    const bookingData = await bookingRes.json();
    if (!bookingRes.ok || !bookingData.success) {
      throw new Error(`Tạo đơn đặt xe thất bại: ${bookingData.message}`);
    }
    const bookingId = bookingData.booking.id;
    console.log(`=> Tạo đơn đặt xe thành công!`);
    console.log(`   - Mã đơn: ${bookingData.booking.bookingCode}`);
    console.log(`   - Dòng xe: ${bookingData.booking.vehicleModel}`);
    console.log(`   - Tổng tiền: ${bookingData.booking.totalAmount.toLocaleString()} VNĐ`);
    console.log(`   - Trạng thái hiện tại: ${bookingData.booking.status}`);

    // 5. CHỦ XE DUYỆT ĐƠN ĐẶT XE
    console.log('\n[Bước 5] Đăng nhập chủ xe (Owner) để phê duyệt đơn đặt xe...');
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@motov.com', password: 'admin123' })
    });
    const ownerLoginData = await ownerLoginRes.json();
    if (!ownerLoginData.success) {
      throw new Error(`Đăng nhập chủ xe thất bại: ${ownerLoginData.message}`);
    }
    const ownerToken = ownerLoginData.token;

    // Cập nhật trạng thái đơn đặt xe thành Confirmed
    const confirmRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'Confirmed', notes: 'Chủ xe phê duyệt yêu cầu đặt xe.' })
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok || !confirmData.success) {
      throw new Error(`Phê duyệt đơn đặt xe thất bại: ${confirmData.message}`);
    }
    console.log(`=> Phê duyệt đơn đặt xe thành công!`);
    console.log(`   - Trạng thái mới: ${confirmData.booking.status}`);

    // 6. KIỂM TRA LẠI THÔNG TIN CHI TIẾT ĐƠN HÀNG PHÍA KHÁCH HÀNG
    console.log('\n[Bước 6] Khách hàng kiểm chứng lại chi tiết đơn đặt xe đã phê duyệt...');
    const getBookingRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const getBookingData = await getBookingRes.json();
    if (!getBookingRes.ok || !getBookingData.success) {
      throw new Error(`Lấy chi tiết đơn hàng thất bại: ${getBookingData.message}`);
    }
    console.log('=> Lấy thông tin đơn đặt xe từ khách hàng thành công!');
    console.log(`   - Mã đơn: ${getBookingData.booking.bookingCode}`);
    console.log(`   - Trạng thái kiểm chứng: ${getBookingData.booking.status}`);

    console.log('\n=== KẾT QUẢ: KIỂM THỬ LUỒNG API CORE THÀNH CÔNG (PASS 100%) ===');

  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', error.message);
  }
}

runTest();
