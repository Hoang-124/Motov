import React, { useState, useEffect } from 'react';
import { CalendarDays, MapPin, ClipboardList, Check, X, CheckSquare, Phone, User, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

interface Booking {
  id: string;
  bikeId: string;
  bikeName: string;
  image: string;
  price: string;
  date: string;
  location: string;
  fullName: string;
  phone: string;
  license: string;
  status: string;
  createdAt: string;
}

export const StaffBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('bookings') || '[]');
    setBookings(list);
  }, []);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('bookings', JSON.stringify(updated));
  };

  const filteredBookings = bookings.filter(b => {
    if (filterStatus === 'All') return true;
    return b.status === filterStatus;
  });

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
              <ClipboardList size={36} />
              Duyệt Đơn Đặt Xe
            </h1>
            <p className="text-gray-400 text-sm">
              Trang dành riêng cho Nhân viên duyệt đơn thuê và kiểm soát giao nhận xe máy
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['All', 'Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-neon text-dark border-neon shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                    : 'bg-surface border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                {status === 'All' ? 'Tất cả' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-6">
            {filteredBookings.map(booking => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-lg relative overflow-hidden"
              >
                {/* Visual indicator stripe */}
                <div className={`absolute left-0 inset-y-0 w-1 ${
                  booking.status === 'Chờ duyệt' ? 'bg-yellow-500' :
                  booking.status === 'Đang thuê' ? 'bg-green-500' :
                  booking.status === 'Đã trả' ? 'bg-blue-500' : 'bg-red-600'
                }`}></div>

                {/* Bike Image */}
                <div className="w-full md:w-52 aspect-video rounded-xl overflow-hidden bg-black border border-gray-800 flex-shrink-0">
                  <img src={booking.image} alt={booking.bikeName} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-4 w-full">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                        Mã đơn: {booking.id} • Ngày tạo: {booking.createdAt}
                      </span>
                      <h3 className="font-display font-bold text-xl text-white">{booking.bikeName}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      booking.status === 'Chờ duyệt' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                      booking.status === 'Đang thuê' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                      booking.status === 'Đã trả' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                      'bg-red-500/10 text-red-500 border-red-500/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Customer Info Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-3.5 rounded-xl border border-gray-800/40 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-neon" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Khách hàng</p>
                        <p className="font-medium text-white">{booking.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-neon" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Số điện thoại</p>
                        <p className="font-medium text-white">{booking.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-neon" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Số GPLX</p>
                        <p className="font-medium text-white">{booking.license}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Time details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-neon" />
                      <span>Ngày thuê: {booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-neon" />
                      <span>Giao xe tại: {booking.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : booking.location === 'Da Nang Train Station' ? 'Ga Đà Nẵng' : booking.location === 'Son Tra Peninsula' ? 'Bán đảo Sơn Trà' : 'Khách sạn Mỹ Khê'}</span>
                    </div>
                  </div>

                  {/* Revenue / Price info */}
                  <div className="pt-2 border-t border-gray-800/50 flex justify-between items-center text-xs">
                    <span className="text-gray-500">Giá trị đơn:</span>
                    <span className="text-neon font-semibold text-base">{booking.price} VNĐ/ngày</span>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="w-full md:w-44 flex md:flex-col justify-center gap-2.5 border-t md:border-t-0 pt-4 md:pt-0 border-gray-800/50 flex-shrink-0">
                  {booking.status === 'Chờ duyệt' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'Đang thuê')}
                        className="flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        Duyệt đơn (Giao xe)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'Đã hủy')}
                        className="flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-400 font-bold py-2.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <X size={14} />
                        Từ chối / Hủy đơn
                      </button>
                    </>
                  )}
                  {booking.status === 'Đang thuê' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'Đã trả')}
                      className="w-full flex items-center justify-center gap-1.5 bg-neon hover:bg-[#bbf000] text-dark font-bold py-3 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      <CheckSquare size={14} />
                      Xác nhận trả xe
                    </button>
                  )}
                  {booking.status === 'Đã trả' && (
                    <div className="text-center text-xs text-gray-500 font-medium py-2">
                      Đã hoàn thành thủ tục trả xe
                    </div>
                  )}
                  {booking.status === 'Đã hủy' && (
                    <div className="text-center text-xs text-red-500/50 font-medium py-2">
                      Đơn hàng đã hủy
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
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Không tìm thấy đơn hàng nào khớp với bộ lọc trạng thái &ldquo;{filterStatus}&rdquo;.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
