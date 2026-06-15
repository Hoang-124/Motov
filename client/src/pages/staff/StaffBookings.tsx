import React, { useState, useEffect } from 'react';
import { CalendarDays, MapPin, ClipboardList, Check, X, CheckSquare, Phone, User, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { ReturnMotorbikeModal } from '../../components/ReturnMotorbikeModal';
import { bookingService, Booking as APIBooking } from '../../services/bookingService';

export const StaffBookings = () => {
  const [bookings, setBookings] = useState<APIBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [returningBookingId, setReturningBookingId] = useState<string | null>(null);
  const [returningPickupTime, setReturningPickupTime] = useState<string | undefined>(undefined);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getAllBookings();
      setBookings(data.bookings || data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled') => {
    try {
      if (newStatus === 'Cancelled') {
        await bookingService.cancelBooking(id);
      } else if (newStatus === 'Confirmed' || newStatus === 'Ongoing' || newStatus === 'Completed') {
        await bookingService.updateStatus(id, newStatus);
      }
      fetchBookings();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'All' || b.status === filterStatus);

  return (
    <div className="p-6 text-white min-h-screen bg-black">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="text-neon" />
          Điều phối & Duyệt Đơn Thuê Xe (Staff)
        </h1>
        <p className="text-gray-500 text-sm mt-1">Xử lý nhanh quy trình nhận xe, bàn giao xe và trả xe cho quý khách</p>
      </div>

      {/* Bộ lọc nhanh trạng thái */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
        {['All', 'Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === status ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400'
            }`}
          >
            {status === 'All' ? 'Tất cả đơn' : status}
          </button>
        ))}
      </div>

      {/* Giao diện Card thao tác nhanh */}
      {filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={booking.id}
              className="bg-surface/30 border border-gray-800/60 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-xs font-bold text-neon">{booking.bookingCode}</span>
                  <span className="text-[11px] font-medium text-gray-400">{booking.statusLabel}</span>
                </div>

                <h3 className="font-bold text-base text-white mb-2">{booking.vehicleModel}</h3>

                {/* Thông tin chi tiết khách hàng */}
                <div className="p-3 bg-black/40 border border-gray-900 rounded-xl mb-4 space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2"><User size={13} /> Khách: <span className="text-white font-medium">{booking.userName}</span></div>
                  <div className="flex items-center gap-2"><Phone size={13} /> SĐT: <span className="text-white font-mono">{booking.userPhone}</span></div>
                  <div className="flex items-center gap-2"><CreditCard size={13} /> Tổng thu: <span className="text-neon font-semibold">{booking.totalAmount.toLocaleString('vi-VN')} VNĐ</span></div>
                </div>

                {/* Địa điểm giao nhận xe */}
                <div className="space-y-2 text-xs text-gray-400 mb-6">
                  <div className="flex items-start gap-1.5">
                    <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Điểm nhận xe ({formatDate(booking.pickupDateTime)}):</p>
                      <p className="text-gray-300 mt-0.5">{booking.pickupLocation.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 pt-2 border-t border-gray-900">
                    <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Điểm trả xe ({formatDate(booking.returnDateTime)}):</p>
                      <p className="text-gray-300 mt-0.5">{booking.returnLocation.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Các nút bấm thao tác thay đổi Trạng thái linh hoạt của Staff */}
              <div className="mt-auto pt-3 border-t border-gray-900 grid gap-2">
                {booking.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                      className="flex items-center justify-center gap-1 bg-neon text-dark font-bold py-2 rounded-lg text-xs hover:opacity-90 transition-all cursor-pointer"
                    >
                      <Check size={14} /> Duyệt đơn
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                      className="flex items-center justify-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <X size={14} /> Từ chối
                    </button>
                  </div>
                )}

                {booking.status === 'Confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'Ongoing')}
                    className="w-full flex items-center justify-center gap-1 bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    Bàn giao xe (Đang thuê)
                  </button>
                )}

                {booking.status === 'Ongoing' && (
                  <button
                    onClick={() => {
                      setReturningBookingId(booking.id);
                      setReturningPickupTime(booking.pickupDateTime);
                    }}
                    className="w-full flex items-center justify-center gap-1 bg-green-600 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    <CheckSquare size={14} /> Xác nhận hoàn tất trả xe
                  </button>
                )}

                {booking.status === 'Completed' && (
                  <div className="text-center text-xs text-gray-500 font-medium py-2 bg-gray-900/30 border border-gray-800/40 rounded-lg">
                    ✓ Thủ tục giao nhận hoàn thành
                  </div>
                )}

                {booking.status === 'Cancelled' && (
                  <div className="text-center text-xs text-red-500/50 font-medium py-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                    Đơn hàng đã hủy bỏ
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
          <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Không có đơn đặt xe nào</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">Không tìm thấy đơn hàng nào khớp với bộ lọc điều phối hiện tại.</p>
        </div>
      )}

      <ReturnMotorbikeModal
        isOpen={!!returningBookingId}
        onClose={() => setReturningBookingId(null)}
        bookingId={returningBookingId}
        pickupDateTime={returningPickupTime}
        onSuccess={() => {
          fetchBookings();
          setReturningBookingId(null);
        }}
      />
    </div>
  );
};