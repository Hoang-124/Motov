import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Trash2, CalendarDays, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
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

export const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
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

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.phone.includes(searchQuery) ||
                          b.bikeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
            Đơn Thuê Toàn Hệ Thống
          </h1>
          <p className="text-gray-400 text-sm">
            Xem và rà soát toàn bộ lịch sử đơn đặt xe máy của mọi khách hàng trong hệ thống
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-xl">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm theo khách hàng, SĐT, xe hoặc mã đơn..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-neon text-dark border-neon font-black'
                    : 'bg-black border-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                {status === 'All' ? 'Tất cả trạng thái' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                  <th className="py-4 px-6">Mã đơn</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Dòng xe máy</th>
                  <th className="py-4 px-6">Thời gian & Điểm nhận</th>
                  <th className="py-4 px-6">Giá thuê</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-black/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-gray-500 font-semibold">{booking.id}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{booking.fullName}</p>
                      <p className="text-xs text-gray-500">SĐT: {booking.phone}</p>
                      <p className="text-[10px] text-gray-600">GPLX: {booking.license}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-white">{booking.bikeName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-mono">{booking.bikeId}</p>
                    </td>
                    <td className="py-4 px-6 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <CalendarDays size={13} className="text-neon" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin size={13} className="text-neon" />
                        <span>{booking.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : booking.location === 'Da Nang Train Station' ? 'Ga Đà Nẵng' : booking.location === 'Son Tra Peninsula' ? 'Bán đảo Sơn Trà' : 'Khách sạn Mỹ Khê'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-neon">{booking.price} VNĐ</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        booking.status === 'Chờ duyệt' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        booking.status === 'Đang thuê' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        booking.status === 'Đã trả' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {booking.status}
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
              <AlertCircle size={32} className="mx-auto mb-2 text-gray-600" />
              Không tìm thấy đơn hàng nào.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
