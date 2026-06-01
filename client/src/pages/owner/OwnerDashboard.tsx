import React, { useState, useEffect } from 'react';
import { getBikes, Bike } from '../../data/bikes';
import { CircleDollarSign, Calendar, Bike as BikeIcon, TrendingUp, ClipboardList, ShieldCheck } from 'lucide-react';
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
  location: string;
}

export const OwnerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeRentals: 0,
    totalBikes: 0
  });

  const [latestBookings, setLatestBookings] = useState<Booking[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Get logged in owner
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const currentUser = JSON.parse(storedUser);
    setUser(currentUser);

    // 2. Get all bikes and filter for this owner
    const allBikes = getBikes();
    const myBikes = allBikes.filter(b => b.ownerEmail === currentUser.email);
    const myBikeIds = myBikes.map(b => b.id);

    // 3. Get all bookings and filter for my bikes
    const allBookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
    const myBookings = allBookings.filter(b => myBikeIds.includes(b.bikeId));

    setLatestBookings(myBookings.slice(0, 4));

    // Calculate stats
    let revenue = 0;
    let renting = 0;
    const statusCounts: Record<string, number> = {
      'Chờ duyệt': 0,
      'Đang thuê': 0,
      'Đã trả': 0,
      'Đã hủy': 0
    };

    myBookings.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      
      // Calculate revenue (approved or completed bookings)
      if (b.status === 'Đang thuê' || b.status === 'Đã trả') {
        const rawPrice = parseInt(b.price.replace(/\./g, ''), 10) || 0;
        // Mock each booking as 3 days rental duration
        revenue += rawPrice * 3;
      }

      if (b.status === 'Đang thuê') {
        renting++;
      }
    });

    setStats({
      totalBookings: myBookings.length,
      totalRevenue: revenue,
      activeRentals: renting,
      totalBikes: myBikes.length
    });

    setStatusDistribution(statusCounts);
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
            Doanh Thu & Thống Kê Chủ Xe
          </h1>
          <p className="text-gray-400 text-sm">
            Hộp cát tài chính và hiệu suất hoạt động dành cho đối tác {user?.name}
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Card 1: Revenue */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 font-sans">Doanh Thu Của Bạn</p>
              <h3 className="font-display font-bold text-2xl text-neon">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-[10px] text-gray-400 mt-2">Tổng tiền nhận từ lượt thuê thành công</p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <CircleDollarSign size={22} />
            </div>
          </motion.div>

          {/* Card 2: Bookings */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Tổng Lượt Thuê</p>
              <h3 className="font-display font-bold text-3xl text-white">{stats.totalBookings}</h3>
              <p className="text-[10px] text-gray-400 mt-2">Tổng số lượt đăng ký thuê xe của bạn</p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <Calendar size={22} />
            </div>
          </motion.div>

          {/* Card 3: Active rentals */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Xe Đang Cho Thuê</p>
              <h3 className="font-display font-bold text-3xl text-white">{stats.activeRentals} / {stats.totalBikes}</h3>
              <p className="text-[10px] text-gray-400 mt-2">Xe đang thuộc hợp đồng thuê</p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <BikeIcon size={22} />
            </div>
          </motion.div>

          {/* Card 4: Total bikes */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg"
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 font-sans">Xe Đăng Ký</p>
              <h3 className="font-display font-bold text-3xl text-white">{stats.totalBikes} xe</h3>
              <p className="text-[10px] text-gray-400 mt-2">Tổng xe máy bạn đăng ký cho thuê</p>
            </div>
            <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center text-neon border border-neon/20">
              <ShieldCheck size={22} />
            </div>
          </motion.div>
        </div>

        {/* Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Latest bookings for Owner's bikes */}
          <div className="lg:col-span-8 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-xl text-white uppercase">
                Yêu Cầu Thuê Xe Mới Nhất
              </h3>
              <Link to="/owner/bookings" className="text-xs text-neon hover:underline">
                Xem tất cả lịch sử
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
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khách: <strong className="text-gray-400">{b.fullName}</strong> • Nơi giao: <span className="text-gray-400">{b.location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : 'Địa điểm khác'}</span>
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
              <div className="text-center py-12 text-gray-500 text-sm">
                Chưa có khách đặt thuê xe của bạn. Hãy tiếp tục chia sẻ xe để tăng thu nhập!
              </div>
            )}
          </div>

          {/* Booking state breakdown */}
          <div className="lg:col-span-4 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-display font-bold text-xl text-white uppercase border-b border-gray-800 pb-3">
              Trạng Thái Thuê Xe
            </h3>

            <div className="space-y-4">
              {['Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map((status) => {
                const count = statusDistribution[status] || 0;
                const pct = stats.totalBookings > 0 ? (count / stats.totalBookings) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-400">{status}</span>
                      <span className="text-white">{count} lượt ({pct.toFixed(0)}%)</span>
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
          </div>

        </div>

      </div>
    </div>
  );
};
