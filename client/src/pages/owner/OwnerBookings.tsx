import React, { useState, useEffect } from 'react';
import { ClipboardList, CalendarDays, MapPin, User, Phone, CreditCard, AlertCircle, Check, X, CheckSquare, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { bookingService } from '../../services/bookingService.js';

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
  cancelReason?: string;
}

export const OwnerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOwnerBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ để lấy danh sách đơn!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerBookings();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled') => {
    let reason = '';
    if (newStatus === 'Cancelled') {
      const promptReason = window.prompt('Vui lòng nhập lý do từ chối đơn đặt xe:');
      if (promptReason === null) return; // Nhấn hủy prompt
      if (!promptReason.trim()) {
        window.alert('Bạn phải nhập lý do từ chối!');
        return;
      }
      reason = promptReason;
    }

    try {
      setLoading(true);
      await bookingService.updateStatus(id, newStatus, reason);
      window.alert('Cập nhật trạng thái đơn thành công!');
      await loadOwnerBookings();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'Không thể cập nhật trạng thái đơn!');
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'All' || b.status === filterStatus);

  return (
    <div className="p-6 text-white min-h-screen bg-black">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="text-neon" />
            Lịch trình & Đơn thuê xe của tôi
          </h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi trạng thái thuê và duyệt đơn đăng ký của các dòng xe của bạn</p>
        </div>
        <button 
          onClick={loadOwnerBookings}
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

      {/* Thanh bộ lọc trạng thái */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
        {[
          { key: 'All', label: 'Tất cả' },
          { key: 'Pending', label: '⏳ Chờ duyệt' },
          { key: 'Confirmed', label: '✓ Đã xác nhận' },
          { key: 'Ongoing', label: '🚴 Đang thuê' },
          { key: 'Completed', label: '✓ Hoàn thành' },
          { key: 'Cancelled', label: '❌ Đã hủy' }
        ].map((status) => (
          <button
            key={status.key}
            onClick={() => setFilterStatus(status.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === status.key ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Grid danh sách dạng Card */}
      {loading && bookings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Đang đồng bộ dữ liệu với máy chủ...</div>
      ) : filteredBookings.length > 0 ? (
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
                    booking.status === 'Pending' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' : 
                    booking.status === 'Confirmed' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 
                    booking.status === 'Completed' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' :
                    'text-red-400 border-red-500/20 bg-red-500/5' // Cancelled
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
                    <span>SĐT: <a href={`tel:${booking.userPhone}`} className="text-blue-400 underline font-mono">{booking.userPhone}</a></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-gray-600" />
                    <span>{formatDate(booking.pickupDateTime)} → {formatDate(booking.returnDateTime)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">Nhận tại: {booking.pickupLocation?.address || 'N/A'}</span>
                  </div>
                </div>

                {booking.cancelReason && (
                  <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-[11px] text-red-400/80 mb-4">
                    <strong>Lý do hủy đơn:</strong> {booking.cancelReason}
                  </div>
                )}
              </div>

              {/* Các nút bấm thao tác duyệt trạng thái dành cho Owner */}
              <div className="pt-3 border-t border-gray-800/60 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <CreditCard size={12} /> Tổng thu:
                  </span>
                  <span className="text-neon font-bold text-sm">
                    {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                <div className="grid gap-2">
                  {booking.status === 'Pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                        disabled={loading}
                        className="flex items-center justify-center gap-1 bg-neon text-dark font-bold py-2 rounded-lg text-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} /> Duyệt đơn
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                        disabled={loading}
                        className="flex items-center justify-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  )}

                  {booking.status === 'Confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'Ongoing')}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-1 bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Bàn giao xe (Đang thuê)
                    </button>
                  )}

                  {booking.status === 'Ongoing' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'Completed')}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-1 bg-green-600 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckSquare size={14} /> Xác nhận trả xe
                    </button>
                  )}

                  {booking.status === 'Completed' && (
                    <div className="text-center text-xs text-purple-400 font-semibold py-2 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                      ✓ Đơn hàng hoàn tất
                    </div>
                  )}

                  {booking.status === 'Cancelled' && (
                    <div className="text-center text-xs text-red-500/50 font-medium py-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                      Đơn hàng đã hủy bỏ
                    </div>
                  )}
                </div>
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