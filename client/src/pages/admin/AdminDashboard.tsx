import React, { useState, useEffect, useMemo } from 'react';
import { Landmark, Users, Calendar, Bike as BikeIcon, CircleDollarSign, TrendingUp, ChevronRight, ClipboardList, RefreshCw, Download, AlertCircle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { bookingService } from '../../services/bookingService';
import { getAllMotorbikes } from '../../services/vehicleService';

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
    totalBikes: 0,
    pendingRevenue: 0,
    expectedRevenue: 0
  });
  
  const [latestBookings, setLatestBookings] = useState<Booking[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [typeDistribution, setTypeDistribution] = useState<Record<string, number>>({});
  
  // States for revenue time filtering
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'>('thisWeek');
  
  const [hoveredBar, setHoveredBar] = useState<{ index: number; x: number; y: number; label: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Memoized stats for today's operations
  const todayOps = useMemo(() => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('vi-VN');
    
    let bookings = 0;
    let deliveries = 0;
    let returns = 0;
    let revenue = 0;

    allBookings.forEach((b: any) => {
      const createdDateStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '';
      const startDateStr = b.startDate ? new Date(b.startDate).toLocaleDateString('vi-VN') : '';
      const endDateStr = b.endDate ? new Date(b.endDate).toLocaleDateString('vi-VN') : '';
      
      if (createdDateStr === todayStr) {
        bookings++;
      }
      
      // Bàn giao xe hôm nay (Confirmed hoặc Ongoing bắt đầu hôm nay)
      if (startDateStr === todayStr && (b.status === 'Confirmed' || b.status === 'Ongoing')) {
        deliveries++;
      }
      
      // Thu hồi xe hôm nay (Ongoing kết thúc hôm nay)
      if (endDateStr === todayStr && b.status === 'Ongoing') {
        returns++;
      }
      
      // Doanh thu thực tế phát sinh hôm nay (Đơn hoàn thành hôm nay)
      const completedDateStr = b.updatedAt ? new Date(b.updatedAt).toLocaleDateString('vi-VN') : (b.status === 'Completed' && b.endDate ? new Date(b.endDate).toLocaleDateString('vi-VN') : '');
      if (b.status === 'Completed' && completedDateStr === todayStr) {
        revenue += b.totalAmount || 0;
      }
    });

    return {
      bookings,
      deliveries,
      returns,
      revenue
    };
  }, [allBookings]);

  // Memoized chart dataset based on selected time range
  const chartData = useMemo(() => {
    if (!allBookings || allBookings.length === 0) return [];

    // Helper to get days for this week (Monday to Sunday)
    const getThisWeekDays = () => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Align to Monday
      const monday = new Date(today);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    };

    // Helper to get days for last week (Monday to Sunday)
    const getLastWeekDays = () => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7; // Shift back 7 days
      const monday = new Date(today);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    };

    // Helper to get all days in current month
    const getThisMonthDays = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      
      return Array.from({ length: numDays }, (_, i) => {
        const d = new Date(year, month, i + 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    };

    // Helper to get all days in previous month
    const getLastMonthDays = () => {
      const today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth() - 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      const numDays = new Date(year, month + 1, 0).getDate();
      
      return Array.from({ length: numDays }, (_, i) => {
        const d = new Date(year, month, i + 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    };

    const days = timeRange === 'thisWeek' ? getThisWeekDays() :
                 timeRange === 'lastWeek' ? getLastWeekDays() :
                 timeRange === 'thisMonth' ? getThisMonthDays() :
                 getLastMonthDays();

    return days.map(date => {
      const dateStr = date.toLocaleDateString('vi-VN');
      const formattedDay = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
      const amount = allBookings
        .filter((b: any) => b.status === 'Completed' && b.createdAt && new Date(b.createdAt).toLocaleDateString('vi-VN') === dateStr)
        .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

      return {
        dateStr,
        label: formattedDay, // Just date label, e.g. "23-06"
        amount
      };
    });
  }, [allBookings, timeRange]);

  // Memoized top rented motorbikes (Top 3)
  const popularBikes = useMemo(() => {
    if (!allBookings || allBookings.length === 0) return [];
    
    const counts: Record<string, { model: string; count: number; image: string }> = {};
    allBookings.forEach((b: any) => {
      const model = b.vehicleModel || 'N/A';
      if (!counts[model]) {
        counts[model] = {
          model,
          count: 0,
          image: b.vehicleImage || ''
        };
      }
      counts[model].count++;
    });
    
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [allBookings]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const currentUser = JSON.parse(storedUser);
      const token = currentUser?.token;
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // 1. Fetch bookings
      const bookingsData = await bookingService.getAllBookings();
      const bookingsList: Booking[] = (bookingsData || []).map((b: any) => {
        let displayStatus = 'Chờ duyệt';
        if (b.status === 'Ongoing' || b.status === 'Confirmed') {
          displayStatus = 'Đang thuê';
        } else if (b.status === 'Completed') {
          displayStatus = 'Đã trả';
        } else if (b.status === 'Cancelled') {
          displayStatus = 'Đã hủy';
        }

        return {
          id: b.id || b._id,
          bikeId: b.vehicleId?._id || b.vehicleId,
          bikeName: b.vehicleModel || b.vehicleSnapshot?.name || 'N/A',
          price: (b.totalAmount || 0).toLocaleString('vi-VN'),
          status: displayStatus,
          fullName: b.userName || (b.userId?.lastName ? `${b.userId.lastName} ${b.userId.firstName}` : 'N/A'),
          date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : 'N/A'
        };
      });

      // 2. Fetch motorbikes
      const bikesList = await getAllMotorbikes();

      // 3. Fetch users
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const usersData = await usersResponse.json();
      const usersList = usersData.users || [];

      // Calculate distributions & stats
      let revenue = 0;
      let pendingRevenue = 0;
      let expectedRevenue = 0;
      let renting = 0;
      const statusCounts: Record<string, number> = {
        'Chờ duyệt': 0,
        'Đang thuê': 0,
        'Đã trả': 0,
        'Đã hủy': 0
      };

      (bookingsData || []).forEach((b: any) => {
        if (b.status === 'Pending') {
          statusCounts['Chờ duyệt']++;
          pendingRevenue += b.totalAmount || 0;
        } else if (b.status === 'Ongoing' || b.status === 'Confirmed') {
          statusCounts['Đang thuê']++;
          expectedRevenue += b.totalAmount || 0;
        } else if (b.status === 'Completed') {
          statusCounts['Đã trả']++;
          revenue += b.totalAmount || 0;
        } else if (b.status === 'Cancelled') {
          statusCounts['Đã hủy']++;
        }
        
        if (b.status === 'Ongoing') {
          renting++;
        }
      });

      const bikeTypeCounts: Record<string, number> = {};
      (bikesList || []).forEach((b: any) => {
        const category = b.category || 'Khác';
        bikeTypeCounts[category] = (bikeTypeCounts[category] || 0) + 1;
      });

      setStats({
        totalBookings: bookingsData.length,
        totalRevenue: revenue,
        activeRentals: renting,
        totalUsers: usersList.length || 3,
        totalBikes: bikesList.length,
        pendingRevenue,
        expectedRevenue
      });

      setAllBookings(bookingsData || []);
      setLatestBookings(bookingsList.slice(0, 4));
      setStatusDistribution(statusCounts);
      setTypeDistribution(bikeTypeCounts);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ để lấy thông tin thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      
      const timeRangeLabel = timeRange === 'thisWeek' ? 'Tuan_nay' :
                             timeRange === 'lastWeek' ? 'Tuan_truoc' :
                             timeRange === 'thisMonth' ? 'Thang_nay' : 'Thang_truoc';
                             
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for Vietnamese character support
      csvContent += "Ngày/Tháng,Doanh thu thực tế (VNĐ)\n";
      
      chartData.forEach(row => {
        csvContent += `${row.label},${row.amount}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `bao_cao_doanh_thu_${timeRangeLabel}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' VNĐ';
  };

  // Fleet Occupancy Rate
  const occupancyRate = useMemo(() => {
    if (stats.totalBikes === 0) return 0;
    return Math.round((stats.activeRentals / stats.totalBikes) * 100);
  }, [stats.activeRentals, stats.totalBikes]);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Title and Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-tight mb-2">
              Bảng điều khiển admin
            </h1>
            <p className="text-gray-400 text-sm">
              Hệ thống thống kê & giám sát hoạt động cho chuỗi cửa hàng Motov Đà Nẵng
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <button 
              onClick={handleExport}
              disabled={loading || exporting || allBookings.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-2.5 rounded-lg text-gray-300 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} className={exporting ? 'animate-bounce' : ''} />
              {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
            </button>
            <button 
              onClick={loadDashboardData}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-2.5 rounded-lg text-gray-300 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới dữ liệu
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION: Quick Today Operations - HIGHLY VALUABLE FOR DAILY OPERATIONS */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
            Hoạt động hôm nay
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Today's Bookings */}
            <div className="bg-surface/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Đơn đặt mới</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">{todayOps.bookings}</span>
                <span className="text-[10px] text-gray-400">Hôm nay</span>
              </div>
            </div>
            
            {/* 2. Today's Deliveries */}
            <div className="bg-surface/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Cần bàn giao</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">{todayOps.deliveries}</span>
                <span className="text-[10px] text-neon flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Chờ giao
                </span>
              </div>
            </div>
            
            {/* 3. Today's Returns */}
            <div className="bg-surface/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Cần thu hồi</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">{todayOps.returns}</span>
                <span className="text-[10px] text-yellow-500">Hạn trả</span>
              </div>
            </div>
            
            {/* 4. Today's Revenue */}
            <div className="bg-surface/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Doanh thu phát sinh</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {todayOps.revenue > 0 ? `+${(todayOps.revenue / 1000).toFixed(0)}k` : '0 đ'}
                </span>
                <span className="text-[10px] text-gray-400">Đã thực thu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid (Overall stats) */}
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
                <span>Hoạt động hệ thống</span>
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
              <p className="text-xs text-gray-500 font-semibold mb-1">Doanh thu thực tế</p>
              <h3 className="font-display font-bold text-2xl text-emerald-400">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-neon" />
                <span>Tính từ đơn hoàn thành</span>
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
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tỷ lệ lấp đầy: {occupancyRate}%</span>
              </p>
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

        {/* Chart & Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Column 1: SVG Revenue Column Chart */}
          <div className="lg:col-span-8 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {timeRange === 'thisWeek' ? 'Biểu đồ doanh thu tuần này' :
                   timeRange === 'lastWeek' ? 'Biểu đồ doanh thu tuần trước' :
                   timeRange === 'thisMonth' ? 'Biểu đồ doanh thu tháng này' :
                   'Biểu đồ doanh thu tháng trước'}
                </h3>
                <p className="text-gray-500 text-xs mt-1">
                  Doanh thu thực tế từ đơn thuê hoàn thành thành công (không có VNĐ thừa)
                </p>
              </div>
              
              {/* Time Range Filter Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'thisWeek', label: 'Tuần này' },
                  { key: 'lastWeek', label: 'Tuần trước' },
                  { key: 'thisMonth', label: 'Tháng này' },
                  { key: 'lastMonth', label: 'Tháng trước' }
                ].map((range) => (
                  <button
                    key={range.key}
                    onClick={() => {
                      setTimeRange(range.key as any);
                      setHoveredBar(null); // Reset tooltip
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      timeRange === range.key
                        ? 'bg-neon text-dark shadow-[0_0_10px_rgba(204,255,0,0.2)] font-black'
                        : 'bg-black/40 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="relative h-[250px] w-full mt-4">
              {chartData.length > 0 ? (
                (() => {
                  const chartHeight = 180;
                  const chartWidth = 500; // viewBox width
                  const paddingBottom = 25;
                  const paddingTop = 15;
                  const paddingLeft = 55;
                  const paddingRight = 15;
                  
                  const maxVal = Math.max(...chartData.map(d => d.amount), 100000);
                  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
                  
                  const graphWidth = chartWidth - paddingLeft - paddingRight;
                  const graphHeight = chartHeight - paddingTop - paddingBottom;
                  
                  const totalBars = chartData.length;
                  const barWidth = totalBars > 7 ? Math.max(6, Math.floor((graphWidth / totalBars) * 0.6)) : 30;

                  // Label helper to hide labels on monthly chart to prevent text overlapping
                  const showLabel = (index: number, total: number) => {
                    if (total <= 7) return true;
                    const dayNum = index + 1;
                    return dayNum === 1 || dayNum === total || dayNum % 5 === 0;
                  };

                  return (
                    <svg 
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                      className="w-full h-full"
                    >
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ccff00" stopOpacity="1" />
                          <stop offset="100%" stopColor="#ccff00" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Y-Axis Tick Grid Lines */}
                      {yTicks.map((tick, index) => {
                        const yPos = chartHeight - paddingBottom - (tick / maxVal) * graphHeight;
                        return (
                          <g key={index} className="opacity-20">
                            <line 
                              x1={paddingLeft} 
                              y1={yPos} 
                              x2={chartWidth - paddingRight} 
                              y2={yPos} 
                              stroke="#4b5563" 
                              strokeWidth="0.75" 
                              strokeDasharray="3 3"
                            />
                            <text 
                              x={paddingLeft - 8} 
                              y={yPos + 3} 
                              fill="#9ca3af" 
                              fontSize="8" 
                              textAnchor="end"
                              className="font-mono font-semibold"
                            >
                              {tick === 0 ? '0' : tick >= 1000000 ? `${(tick / 1000000).toFixed(1)}M` : `${(tick / 1000).toFixed(0)}k`}
                            </text>
                          </g>
                        );
                      })}

                      {/* SVG Columns (Bars) */}
                      {chartData.map((d, index) => {
                        const spacing = graphWidth / totalBars;
                        const xPos = paddingLeft + (index * spacing) + (spacing - barWidth) / 2;
                        
                        const valRatio = d.amount / maxVal;
                        const barHeight = valRatio * graphHeight;
                        const yPos = chartHeight - paddingBottom - barHeight;

                        const isHovered = hoveredBar?.index === index;

                        return (
                          <g key={index}>
                            {/* SVG column bar rect */}
                            <motion.rect
                              initial={{ height: 0, y: chartHeight - paddingBottom }}
                              animate={{ height: barHeight, y: yPos }}
                              transition={{ duration: 0.6, delay: index * 0.015, ease: "easeOut" }}
                              x={xPos}
                              width={barWidth}
                              rx={totalBars > 7 ? "2" : "5"}
                              fill={isHovered ? "#ccff00" : "url(#neonGradient)"}
                              className="transition-colors duration-100 cursor-pointer"
                              onMouseEnter={() => {
                                setHoveredBar({
                                  index,
                                  x: xPos + barWidth / 2,
                                  y: yPos - 10,
                                  label: d.label,
                                  amount: d.amount
                                });
                              }}
                              onMouseLeave={() => setHoveredBar(null)}
                            />

                            {/* X-Axis labels */}
                            {showLabel(index, totalBars) && (
                              <text
                                x={xPos + barWidth / 2}
                                y={chartHeight - 8}
                                fill={isHovered ? "#white" : "#6b7280"}
                                fontSize={totalBars > 7 ? "7" : "9"}
                                textAnchor="middle"
                                className="font-semibold transition-colors duration-100"
                              >
                                {d.label}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Đang tải dữ liệu biểu đồ...
                </div>
              )}

              {/* Float Hover Tooltip */}
              {hoveredBar && (
                <div 
                  className="absolute bg-surface border border-gray-800 px-3 py-2 rounded-xl shadow-2xl pointer-events-none text-xs z-30 transition-all duration-75 text-center min-w-[110px] backdrop-blur-md"
                  style={{
                    left: `calc(${(hoveredBar.x / 500) * 100}% - 55px)`,
                    top: `calc(${(hoveredBar.y / 180) * 100}% - 42px)`
                  }}
                >
                  <p className="text-gray-400 font-semibold mb-0.5">{hoveredBar.label}</p>
                  <p className="text-neon font-bold font-mono">{hoveredBar.amount.toLocaleString('vi-VN')} đ</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Financial Summary Analysis Panel */}
          <div className="lg:col-span-4 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-white border-b border-gray-800 pb-3 mb-5">
                Phân tích tài chính
              </h3>
              
              <div className="space-y-4">
                {/* Doanh thu thực tế */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-gray-400">Doanh thu thực tế (Đã trả)</span>
                    <span className="text-emerald-400 font-bold font-mono">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Tiền đã thực thu từ các chuyến đi hoàn thành</p>
                </div>

                {/* Doanh thu dự kiến */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-gray-400">Doanh thu dự kiến (Đang thuê)</span>
                    <span className="text-blue-400 font-bold font-mono">{formatCurrency(stats.expectedRevenue)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Tổng tiền từ đơn đang đi và đã được duyệt</p>
                </div>

                {/* Doanh thu chờ duyệt */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-gray-400">Doanh thu chờ duyệt</span>
                    <span className="text-yellow-500 font-bold font-mono">{formatCurrency(stats.pendingRevenue)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Tiền tiềm năng từ các đơn đang chờ phê duyệt</p>
                </div>
              </div>

              {/* Fleet Top Rented Bikes */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center justify-between">
                  <span>Dòng xe thuê nhiều nhất</span>
                  <span className="text-[10px] text-gray-500 normal-case font-normal">Top 3</span>
                </h4>
                {popularBikes.length > 0 ? (
                  <div className="space-y-3">
                    {popularBikes.map((bike, idx) => {
                      const maxCount = popularBikes[0].count;
                      const pct = maxCount > 0 ? (bike.count / maxCount) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <img 
                            src={bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'} 
                            alt={bike.model} 
                            className="w-10 h-10 object-cover rounded-lg border border-gray-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-gray-300 truncate">{bike.model}</span>
                              <span className="text-neon shrink-0">{bike.count} lượt</span>
                            </div>
                            <div className="w-full bg-black h-1 rounded-full overflow-hidden border border-gray-900">
                              <div className="bg-neon h-full rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">Chưa có dữ liệu lượt thuê xe.</p>
                )}
              </div>
            </div>

            {/* AOV average booking value */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="bg-black/40 border border-gray-900 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Giá trị đơn hàng trung bình (AOV)</p>
                  <span className="text-sm font-bold text-white font-mono">
                    {stats.totalBookings > 0 
                      ? formatCurrency(Math.round((stats.totalRevenue + stats.expectedRevenue) / stats.totalBookings)) 
                      : '0 VNĐ'}
                  </span>
                </div>
                <div className="w-9 h-9 bg-neon/10 rounded-lg flex items-center justify-center text-neon border border-neon/20">
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-layout lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Latest bookings list */}
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
              <div className="divide-y divide-gray-800/60">
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
                        Khách: <strong className="text-gray-400">{b.fullName}</strong> • Ngày tạo: <span className="text-gray-400">{b.date}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-neon">{b.price} VNĐ</span>
                      <p className="text-[10px] text-gray-600 font-mono">ID: {b.id.substring(0, 8)}</p>
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

          {/* Status Breakdown & Category distribution */}
          <div className="lg:col-span-4 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-white border-b border-gray-800/80 pb-3 mb-4">
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
                      <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-gray-900">
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

            <div>
              <h3 className="font-display font-bold text-lg text-white border-b border-gray-800/80 pb-3 pt-2 mb-3">
                Phân loại xe máy
              </h3>
              
              <div className="space-y-2.5">
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
    </div>
  );
};
