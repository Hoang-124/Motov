import React, { useState, useEffect } from 'react';
import { getBikes, Bike } from '../../data/bikes';
import { Landmark, Users, Calendar, Bike as BikeIcon, CircleDollarSign, TrendingUp, ChevronRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface Booking {
  id: string;
  bikeId: string;
  bikeName: string;
  price: string;
  status: string;
  fullName: string;
  date: string;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeRentals: 0,
    totalUsers: 0,
    totalBikes: 0
  });
  
  const [latestBookings, setLatestBookings] = useState<Booking[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [typeDistribution, setTypeDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Bookings data
    const bookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
    setLatestBookings(bookings.slice(0, 4));

    // 2. Bikes data
    const bikes = getBikes();

    // 3. Users data
    const users = JSON.parse(localStorage.getItem('motov_users') || '[]');

    // Calculate distributions & stats
    let revenue = 0;
    let renting = 0;
    const statusCounts: Record<string, number> = {
      'Chờ duyệt': 0,
      'Đang thuê': 0,
      'Đã trả': 0,
      'Đã hủy': 0
    };

    bookings.forEach(b => {
      // Increment status
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      
      // Calculate revenue for Approved / Completed bookings
      if (b.status === 'Đang thuê' || b.status === 'Đã trả') {
        const rawPrice = parseInt(b.price.replace(/\./g, ''), 10) || 0;
        // Mocking each booking as 3 days duration for revenue purposes
        revenue += rawPrice * 3; 
      }
      
      if (b.status === 'Đang thuê') {
        renting++;
      }
    });

    const bikeTypeCounts: Record<string, number> = {};
    bikes.forEach(b => {
      bikeTypeCounts[b.type] = (bikeTypeCounts[b.type] || 0) + 1;
    });

    setStats({
      totalBookings: bookings.length,
      totalRevenue: revenue,
      activeRentals: renting,
      totalUsers: Math.max(users.length, 3), // Fallback to minimum 3 users for demo
      totalBikes: bikes.length
    });

    setStatusDistribution(statusCounts);
    setTypeDistribution(bikeTypeCounts);
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Title and Welcome */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white tracking-tight mb-2">
            Bảng điều khiển admin
          </h1>
          <p className="text-gray-400 text-sm">
            Hệ thống thống kê & giám sát hoạt động cho chuỗi cửa hàng Motov Đà Nẵng
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          {/* Card 1 */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">Tổng số đơn thuê</p>
              <h3 className="font-display font-bold text-3xl text-white">{stats.totalBookings}</h3>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-neon" />
                <span>+12% so với tháng trước</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <Calendar size={22} />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">Doanh thu dự kiến</p>
              <h3 className="font-display font-bold text-2xl text-emerald-400">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-neon" />
                <span>Tính từ đơn thuê thành công</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <CircleDollarSign size={22} />
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">Xe đang thuê</p>
              <h3 className="font-display font-bold text-3xl text-white">{stats.activeRentals} / {stats.totalBikes}</h3>
              <p className="text-[10px] text-gray-400 mt-2">Đang lưu thông trên đường</p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <BikeIcon size={22} />
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">Số khách hàng</p>
              <h3 className="font-display font-bold text-3xl text-white">{stats.totalUsers}</h3>
              <p className="text-[10px] text-gray-400 mt-2">Tổng tài khoản đã đăng ký</p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <Users size={22} />
            </div>
          </motion.div>

        </div>

        {/* Sub-layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Latest bookings */}
          <div className="lg:col-span-8 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-white">
                Đơn thuê mới nhất
              </h3>
              <Link to="/admin/bookings" className="text-xs text-neon hover:underline flex items-center gap-1">
                Xem tất cả đơn
                <ChevronRight size={14} />
              </Link>
            </div>

            {latestBookings.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {latestBookings.map((b) => (
                  <div key={b.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{b.bikeName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          b.status === 'Chờ duyệt' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          b.status === 'Đang thuê' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          b.status === 'Đã trả' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khách: <strong className="text-gray-400">{b.fullName}</strong> • Thời gian: <span className="text-gray-400">{b.date}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-neon">{b.price} VNĐ</span>
                      <p className="text-[10px] text-gray-600">mã đơn: {b.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                Không có đơn thuê xe máy nào gần đây.
              </div>
            )}
          </div>

          {/* Breakdown Distribution */}
          <div className="lg:col-span-4 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-display font-bold text-lg text-white border-b border-gray-800 pb-3">
              Trạng thái đơn hàng
            </h3>

            <div className="space-y-4">
              {['Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map((status) => {
                const count = statusDistribution[status] || 0;
                const pct = stats.totalBookings > 0 ? (count / stats.totalBookings) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-400">{status}</span>
                      <span className="text-white">{count} đơn ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-gray-900">
                      <div 
                        className={`h-full rounded-full ${
                          status === 'Chờ duyệt' ? 'bg-yellow-500' :
                          status === 'Đang thuê' ? 'bg-green-500' :
                          status === 'Đã trả' ? 'bg-blue-500' : 'bg-red-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 className="font-display font-bold text-lg text-white border-b border-gray-800 pb-3 pt-2">
              Phân loại xe máy
            </h3>
            
            <div className="space-y-3">
              {Object.entries(typeDistribution).map(([type, count]) => {
                const pct = stats.totalBikes > 0 ? (count / stats.totalBikes) * 100 : 0;
                return (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                      {type}
                    </span>
                    <span className="text-white font-bold">{count} xe ({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
