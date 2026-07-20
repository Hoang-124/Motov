import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Truck, Flag, Bike, User, Clock, Check } from 'lucide-react';

// Định nghĩa kiểu dữ liệu để TypeScript không bắt lỗi
interface Booking {
  _id: string;
  bookingCode: string;
  pickupDateTime: string;
  returnDateTime: string;
  status: string;
  totalAmount: number;
  userId: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  vehicleId: {
    _id: string;
    vehicleModel: string;
    licensePlate: string;
  };
}

export const StaffSchedule: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'pickup' | 'return'>('pickup');
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Gọi API lấy danh sách đơn hàng khi vào trang
  useEffect(() => {
    fetchDailyBookings();
  }, []);

  const fetchDailyBookings = async () => {
    try {
      setLoading(true);
      // Gọi API lấy toàn bộ đơn hàng (hoặc API schedule nếu BE có hỗ trợ)
      const response = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const resData = await response.json();
      
      if (resData.success) {
        setBookings(resData.data || []);
      }
    } catch (error) {
      console.error('Lỗi lấy dữ liệu lịch trình:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic lọc đơn hàng TRONG NGÀY HÔM NAY bằng JavaScript ở FE
  const todayStr = new Date().toDateString();

  // Danh sách khách đến lấy xe hôm nay
  const pickupsToday = bookings.filter(b => 
    new Date(b.pickupDateTime).toDateString() === todayStr && b.status !== 'Cancelled'
  );

  // Danh sách khách đến trả xe hôm nay
  const returnsToday = bookings.filter(b => 
    new Date(b.returnDateTime).toDateString() === todayStr && b.status !== 'Cancelled'
  );

  // 3. Xử lý nút hành động nhanh: Xác nhận giao xe (Pickup)
  const handleConfirmPickup = async (bookingId: string) => {
    if (!window.confirm('Xác nhận bàn giao xe và chìa khóa cho khách hàng?')) return;
    try {
      const response = await fetch(`/api/bookings/staff/bookings/${bookingId}/pickup`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✓ Đã gán trạng thái xe thành Đang thuê!' });
        fetchDailyBookings(); // Tải lại data để cập nhật trạng thái mới
      } else {
        setMessage({ type: 'error', text: data.error || 'Thao tác thất bại' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối hệ thống' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lịch Trình Thuê Xe Hôm Nay</h1>
            <p className="text-sm text-gray-500">Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <button 
          onClick={fetchDailyBookings} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} />
          Làm mới
        </button>
      </div>

      {/* Thông báo Alert */}
      {message && (
        <div className={`p-4 mb-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Thống kê nhanh số lượng (Counters) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div 
          onClick={() => setActiveTab('pickup')}
          className={`p-4 rounded-xl border cursor-pointer transition text-center flex flex-col items-center justify-center ${activeTab === 'pickup' ? 'bg-orange-50 border-orange-500 shadow-md' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={18} />
            Khách Lấy Xe (Pickups)
          </p>
          <p className="text-3xl font-black text-orange-700 mt-1">{pickupsToday.length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('return')}
          className={`p-4 rounded-xl border cursor-pointer transition text-center flex flex-col items-center justify-center ${activeTab === 'return' ? 'bg-green-50 border-green-500 shadow-md' : 'bg-white hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
            <Flag size={18} />
            Khách Trả Xe (Returns)
          </p>
          <p className="text-3xl font-black text-green-700 mt-1">{returnsToday.length}</p>
        </div>
      </div>

      {/* Danh sách Đơn hàng hiển thị theo Tab */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Đang tải lịch trình...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-100 font-bold text-gray-700">
            {activeTab === 'pickup' ? 'Danh sách xe cần bàn giao' : 'Danh sách xe chờ thu hồi'}
          </div>

          <div className="divide-y divide-gray-100">
            {activeTab === 'pickup' && pickupsToday.length === 0 && (
              <div className="p-8 text-center text-gray-400">Hôm nay không có lịch nhận xe nào.</div>
            )}
            {activeTab === 'return' && returnsToday.length === 0 && (
              <div className="p-8 text-center text-gray-400">Hôm nay không có lịch trả xe nào.</div>
            )}

            {/* Render Tab Nhận xe */}
            {activeTab === 'pickup' && pickupsToday.map((booking) => (
              <div key={booking._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">
                      #{booking.bookingCode}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${booking.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {booking.status === 'Ongoing' ? 'Đang đi (Picked Up)' : 'Chờ lấy xe'}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mt-2 flex items-center gap-1.5">
                    <Bike size={18} className="text-gray-500" />
                    {booking.vehicleId?.vehicleModel} - <span className="text-blue-600">{booking.vehicleId?.licensePlate}</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    Khách hàng: <strong>{booking.userId?.lastName} {booking.userId?.firstName}</strong> ({booking.userId?.phoneNumber})
                  </p>
                  <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-orange-500" />
                    Giờ hẹn lấy: {new Date(booking.pickupDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  {booking.status !== 'Ongoing' ? (
                    <button
                      onClick={() => handleConfirmPickup(booking._id)}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-lg text-sm transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={14} />
                      Xác nhận giao xe
                    </button>
                  ) : (
                    <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                      <Check size={14} />
                      Đã giao xe
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Render Tab Trả xe */}
            {activeTab === 'return' && returnsToday.map((booking) => (
              <div key={booking._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">
                      #{booking.bookingCode}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">
                      Chờ trả xe
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mt-2 flex items-center gap-1.5">
                    <Bike size={18} className="text-gray-500" />
                    {booking.vehicleId?.vehicleModel} - <span className="text-blue-600">{booking.vehicleId?.licensePlate}</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    Khách hàng: <strong>{booking.userId?.lastName} {booking.userId?.firstName}</strong> ({booking.userId?.phoneNumber})
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-green-500" />
                    Giờ hẹn trả: {new Date(booking.returnDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium mb-1">Cần thu tiền mặt:</p>
                  <p className="text-lg font-black text-red-600 mb-2">
                    {booking.totalAmount?.toLocaleString('vi-VN')}đ
                  </p>
                  <span className="text-xs bg-gray-100 text-gray-600 border px-3 py-1.5 rounded-md font-medium block text-center">
                    Kiểm tra xe tại quầy
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};