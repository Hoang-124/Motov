import React, { useState, useEffect } from 'react';
import { getBikes } from '../../data/bikes';
import { ClipboardList, CalendarDays, MapPin, User, Phone, CreditCard, AlertCircle } from 'lucide-react';
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

export const OwnerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    // 1. Get current logged in owner
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const currentUser = JSON.parse(storedUser);

    // 2. Get my bike ids
    const allBikes = getBikes();
    const myBikeIds = allBikes
      .filter(b => b.ownerEmail === currentUser.email)
      .map(b => b.id);

    // 3. Get all bookings and filter for my bikes
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const myBookings = allBookings.filter((b: any) => myBikeIds.includes(b.bikeId));
    setBookings(myBookings);
  }, []);

  const filteredBookings = bookings.filter(b => {
    if (filterStatus === 'All') return true;
    return b.status === filterStatus;
  });

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
              <ClipboardList size={36} />
              Lịch Sử Thuê Xe Của Bạn
            </h1>
            <p className="text-gray-400 text-sm">
              Theo dõi tình hình thuê xe của khách hàng đối với các dòng xe bạn đang chia sẻ
            </p>
          </div>

          {/* Status Filters */}
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

        {/* Bookings list */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-6">
            {filteredBookings.map(booking => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-lg relative overflow-hidden"
              >
                {/* Status colored side indicator */}
                <div className={`absolute left-0 inset-y-0 w-1 ${
                  booking.status === 'Chờ duyệt' ? 'bg-yellow-500' :
                  booking.status === 'Đang thuê' ? 'bg-green-500' :
                  booking.status === 'Đã trả' ? 'bg-blue-500' : 'bg-red-600'
                }`}></div>

                {/* Bike Image */}
                <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-black border border-gray-800 flex-shrink-0">
                  <img src={booking.image} alt={booking.bikeName} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Mã đơn: {booking.id} • Ngày tạo: {booking.createdAt}</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-neon" />
                      <span>Khách hàng: <strong className="text-gray-300">{booking.fullName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-neon" />
                      <span>Số điện thoại: <strong className="text-gray-300">{booking.phone}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-neon" />
                      <span>Ngày thuê: {booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-neon" />
                      <span>Nơi nhận: {booking.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : booking.location === 'Da Nang Train Station' ? 'Ga Đà Nẵng' : booking.location === 'Son Tra Peninsula' ? 'Bán đảo Sơn Trà' : 'Khách sạn Mỹ Khê'}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-gray-800/50 flex justify-between items-center text-xs">
                    <span className="text-gray-500">Doanh thu dự kiến:</span>
                    <span className="text-neon font-semibold text-sm">
                      {booking.price} VNĐ/ngày
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
            <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Chưa phát sinh lượt thuê</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Không tìm thấy lượt thuê xe nào tương ứng với bộ lọc &ldquo;{filterStatus}&rdquo;.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
