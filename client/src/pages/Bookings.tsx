import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ClipboardList, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SavedBooking {
  id: string;
  bikeId: string;
  bikeName: string;
  image: string;
  price: string;
  date: string;
  location: string;
  fullName: string;
  phone: string;
  status: string;
  createdAt: string;
}

export const Bookings = () => {
  const [bookings, setBookings] = useState<SavedBooking[]>([]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('bookings') || '[]');
    setBookings(list);
  }, []);

  const handleCancelBooking = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn thuê xe này không?')) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      localStorage.setItem('bookings', JSON.stringify(updated));
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
            <ClipboardList size={36} />
            Đơn Thuê Xe Của Bạn
          </h1>
          <p className="text-gray-400 text-sm">
            Danh sách các đơn đăng ký thuê xe máy tại Motov Đà Nẵng
          </p>
        </div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map(booking => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-lg relative overflow-hidden"
              >
                {/* Image */}
                <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-black border border-gray-800 flex-shrink-0">
                  <img src={booking.image} alt={booking.bikeName} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Mã đơn: {booking.id}</span>
                      <h3 className="font-display font-bold text-xl text-white">{booking.bikeName}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      booking.status === 'Chờ duyệt' 
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' 
                        : 'bg-green-500/10 text-green-500 border-green-500/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-neon" />
                      <span>Ngày thuê: {booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-neon" />
                      <span>Nơi nhận: {booking.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : booking.location === 'Da Nang Train Station' ? 'Ga Đà Nẵng' : booking.location === 'Son Tra Peninsula' ? 'Bán đảo Sơn Trà' : 'Khách sạn Mỹ Khê'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800/50 flex flex-wrap gap-4 text-xs text-gray-500 justify-between items-center">
                    <div>
                      Người đặt: <span className="text-gray-300 font-medium">{booking.fullName}</span> • SĐT: <span className="text-gray-300 font-medium">{booking.phone}</span>
                    </div>
                    <div className="text-neon font-semibold text-sm">
                      Tổng giá dự kiến: {booking.price} VNĐ/ngày
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full md:w-auto flex justify-end md:self-center border-t md:border-t-0 pt-4 md:pt-0 border-gray-800/50">
                  <button 
                    onClick={() => handleCancelBooking(booking.id)}
                    className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 px-4 py-2.5 rounded-lg transition-all text-sm w-full md:w-auto font-medium cursor-pointer"
                  >
                    <Trash2 size={16} />
                    Hủy đơn
                  </button>
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
