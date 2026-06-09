import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ClipboardList, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { bookingService, Booking } from '../services/bookingService'; // Import Service

export const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hàm tải danh sách đơn từ Server
  const loadMyBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể kết nối danh sách đơn hàng từ hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, []);

  // Hàm gọi API hủy đơn
  const handleCancelBooking = async (id: string) => {
    const reason = window.prompt('Vui lòng nhập lý do hủy đơn thuê xe:');
    if (reason === null) return; // Nhấn hủy prompt

    if (!reason.trim()) {
      window.alert('Bạn phải nhập lý do hủy đơn!');
      return;
    }

    try {
      setLoading(true);
      await bookingService.cancelBooking(id, reason);
      window.alert('Hủy đơn đặt xe thành công!');
      // Tải lại danh sách mới cập nhật trạng thái từ Server
      await loadMyBookings();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'Không thể hủy đơn vào lúc này!');
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
              <ClipboardList size={36} />
              Đơn Thuê Xe Của Bạn
            </h1>
            <p className="text-gray-400 text-sm">
              Danh sách các đơn đăng ký thuê xe máy thực tế của bạn trên hệ thống Motov
            </p>
          </div>
          <button 
            onClick={loadMyBookings}
            className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-gray-600 px-4 py-2 rounded-lg text-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới dữ liệu
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center text-sm">
            ❌ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Đang đồng bộ dữ liệu với máy chủ...</div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map(booking => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-lg relative overflow-hidden"
              >
                {/* Image xe từ Snapshot */}
                <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-black border border-gray-800 flex-shrink-0">
                  <img src={booking.vehicleImage} alt={booking.vehicleModel} loading="lazy" className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                        Mã đơn: {booking.bookingCode}
                      </span>
                      <h3 className="font-display font-bold text-xl text-white">{booking.vehicleModel}</h3>
                    </div>
                    {/* Sử dụng trực tiếp label tiếng Việt kèm icon từ Backend truyền sang */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      booking.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                      booking.status === 'Confirmed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                      booking.status === 'Ongoing' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                      booking.status === 'Completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                      'bg-red-500/10 text-red-500 border-red-500/30' // Cancelled
                    }`}>
                      {booking.statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-neon" />
                        <span className="text-xs">Nhận: {new Date(booking.pickupDateTime).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-gray-600" />
                        <span className="text-xs">Trả: {new Date(booking.returnDateTime).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 items-start sm:items-center">
                      <MapPin size={16} className="text-neon mt-1 sm:mt-0" />
                      <span className="text-xs line-clamp-2">Nơi giao xe: {booking.pickupLocation?.address || 'N/A'}</span>
                    </div>
                  </div>

                  {booking.cancelReason && (
                    <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-xs text-red-400/80">
                      <strong>Lý do hủy đơn:</strong> {booking.cancelReason}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-800/50 flex flex-wrap gap-4 text-xs text-gray-500 justify-between items-center">
                    <div>
                      Hạn thuê: <span className="text-neon font-medium">{booking.rentalDays} ngày</span>
                    </div>
                    <div className="text-neon font-semibold text-sm">
                      Tổng tiền thanh toán: {booking.totalAmount?.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>

                {/* Nút hủy đơn liên kết API */}
                <div className="w-full md:w-auto flex justify-end md:self-center border-t md:border-t-0 pt-4 md:pt-0 border-gray-800/50">
                  {booking.status === 'Pending' ? (
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 px-4 py-2.5 rounded-lg transition-all text-sm w-full md:w-auto font-medium cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Yêu cầu hủy
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium bg-black/30 px-3 py-1.5 rounded-md border border-gray-900">
                      {booking.status === 'Cancelled' ? 'Đã đóng đơn' : 'Khóa chỉnh sửa'}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
            <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Bạn chưa đặt xe nào</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
              Khám phá danh sách các dòng xe máy đa dạng tại Đà Nẵng và chọn chiếc xe yêu thích của bạn ngay hôm nay.
            </p>
            <Link to="/bikes" className="bg-neon text-dark font-bold px-8 py-3.5 rounded-full hover:bg-[#bbf000] transition-colors inline-block shadow-[0_0_15px_rgba(204,255,0,0.3)]">
              TÌM XE NGAY
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};