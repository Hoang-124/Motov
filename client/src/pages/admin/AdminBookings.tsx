import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Trash2, CalendarDays, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface Booking {
  id: string; // Bản chất là _id từ MongoDB
  bookingCode: string; // Mã đơn hiển thị (VD: BK-1717...)
  userId: string;
  userName: string; // Tên đầy đủ của khách hàng thay vì fullName
  userEmail: string;
  userPhone: string; // Số điện thoại khách hàng thay vì phone
  vehicleId: string; // Thay thế bikeId
  vehicleModel: string; // Tên dòng xe (thay thế bikeName)
  vehicleImage: string; // Ảnh xe (thay thế image)
  pickupDateTime: string; // ISO String ngày nhận xe
  returnDateTime: string; // ISO String ngày trả xe
  pickupLocation: {
    address: string;
    coordinates?: number[];
  };
  returnLocation: {
    address: string;
    coordinates?: number[];
  };
  rentalDays: number;
  totalAmount: number; // Tổng tiền (Number thay vì giá chuỗi price)
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled'; // Trạng thái chuẩn backend
  statusLabel: string; // Nhãn tiếng Việt nhận từ backend (VD: "⏳ Chờ xác nhận")
}

export const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Giả lập lấy dữ liệu từ localStorage hoặc API sau này
    const list = JSON.parse(localStorage.getItem('bookings') || '[]');
    setBookings(list);
  }, []);

  const handleDeleteBooking = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt xe này khỏi lịch sử hệ thống? Thao tác này không thể hoàn tác.')) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      localStorage.setItem('bookings', JSON.stringify(updated));
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    const matchesSearch = 
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Hàm xác định màu sắc dựa theo mã status chuẩn backend
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Ongoing': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Completed': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="text-neon" />
            Hệ thống Quản lý Đơn đặt xe (Admin)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý toàn bộ danh sách thuê xe của hệ thống</p>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, dòng xe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface/50 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:col-span-2">
          {['All', 'Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-neon text-dark font-bold'
                  : 'bg-surface border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {status === 'All' ? 'Tất cả đơn' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng hiển thị đơn hàng */}
      <div className="bg-surface/30 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-surface/50">
                <th className="py-4 px-6">Mã đơn</th>
                <th className="py-4 px-6">Thông tin khách</th>
                <th className="py-4 px-6">Thông tin xe</th>
                <th className="py-4 px-6">Lịch trình thuê</th>
                <th className="py-4 px-6">Tổng thanh toán</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-800/60 hover:bg-surface/20 transition-colors">
                  <td className="py-4 px-6 font-mono text-neon text-xs font-semibold">
                    {booking.bookingCode}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white">{booking.userName}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{booking.userPhone}</div>
                    <div className="text-gray-600 text-xs truncate max-w-[150px]">{booking.userEmail}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={booking.vehicleImage} alt={booking.vehicleModel} className="w-12 h-12 object-cover rounded-lg border border-gray-800" />
                      <div>
                        <div className="font-medium text-white">{booking.vehicleModel}</div>
                        <div className="text-gray-500 text-xs font-mono">ID: {booking.vehicleId.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-300">
                    <div className="flex items-center gap-1"><CalendarDays size={12} className="text-gray-500" /> Nhận: {formatDate(booking.pickupDateTime)}</div>
                    <div className="flex items-center gap-1 mt-1"><CalendarDays size={12} className="text-gray-500" /> Trả: {formatDate(booking.returnDateTime)}</div>
                    <div className="text-gray-500 mt-1">Số ngày: <span className="text-white font-semibold">{booking.rentalDays} ngày</span></div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-white">
                    {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColorClass(booking.status)}`}>
                      {booking.statusLabel}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                      title="Xóa đơn thuê"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-600" />
            <p>Không tìm thấy dữ liệu đơn đặt xe phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
};