import React, { useState, useEffect } from 'react';
import { ClipboardList, CalendarDays, MapPin, User, Phone, CreditCard, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vehicleId: string;
  vehicleModel: string;
  vehicleImage: string;
  pickupDateTime: string;
  returnDateTime: string;
  pickupLocation: { address: string; coordinates?: number[] };
  returnLocation: { address: string; coordinates?: number[] };
  rentalDays: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';
  statusLabel: string;
}

export const OwnerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const currentUser = JSON.parse(storedUser);

    // Lấy toàn bộ đơn hàng trong hệ thống
    const allBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    // Giả lập lọc các đơn hàng liên quan đến xe của Chủ xe hiện tại (Nơi bạn cấu hình API thực tế)
    // Ở đây tạm hiển thị toàn bộ hoặc dựa vào logic backend sau này gửi về riêng cho Owner
    setBookings(allBookings);
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'All' || b.status === filterStatus);

  return (
    <div className="p-6 text-white min-h-screen bg-black">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="text-neon" />
          Lịch trình & Đơn thuê xe của tôi
        </h1>
        <p className="text-gray-500 text-sm mt-1">Theo dõi trạng thái thuê và tổng doanh thu dự kiến của các dòng xe của bạn</p>
      </div>

      {/* Thanh bộ lọc trạng thái */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
        {['All', 'Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === status ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400'
            }`}
          >
            {status === 'All' ? 'Tất cả' : status}
          </button>
        ))}
      </div>

      {/* Grid danh sách dạng Card */}
      {filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={booking.id}
              className="bg-surface/30 border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-neon/30 transition-all duration-300"
            >
              <div>
                {/* Tiêu đề Đơn */}
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded">CODE</span>
                    <h3 className="text-sm font-mono text-neon font-bold mt-1">{booking.bookingCode}</h3>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    booking.status === 'Ongoing' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 
                    booking.status === 'Pending' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' : 'text-gray-400 border-gray-800 bg-surface'
                  }`}>
                    {booking.statusLabel}
                  </span>
                </div>

                {/* Ảnh & Tên xe */}
                <div className="flex items-center gap-3 bg-surface/50 p-3 rounded-xl mb-4 border border-gray-800/40">
                  <img src={booking.vehicleImage} alt={booking.vehicleModel} className="w-14 h-14 object-cover rounded-lg border border-gray-800" />
                  <div>
                    <h4 className="font-semibold text-sm text-white">{booking.vehicleModel}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">Thời gian: {booking.rentalDays} ngày</p>
                  </div>
                </div>

                {/* Chi tiết thông tin Khách & Thời gian */}
                <div className="space-y-2.5 text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-600" />
                    <span>Khách: <strong className="text-gray-200">{booking.userName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-600" />
                    <span>SĐT: <a href={`tel:${booking.userPhone}`} className="text-blue-400 underline">{booking.userPhone}</a></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-gray-600" />
                    <span>{formatDate(booking.pickupDateTime)} → {formatDate(booking.returnDateTime)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">Nhận tại: {booking.pickupLocation.address}</span>
                  </div>
                </div>
              </div>

              {/* Phần footer của card chứa Giá tiền */}
              <div className="pt-3 border-t border-gray-800/60 flex justify-between items-center">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <CreditCard size={12} /> Doanh thu dự kiến:
                </span>
                <span className="text-neon font-bold text-base">
                  {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
          <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Chưa phát sinh lượt thuê</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">Không tìm thấy lượt thuê xe nào tương ứng với bộ lọc này.</p>
        </div>
      )}
    </div>
  );
};