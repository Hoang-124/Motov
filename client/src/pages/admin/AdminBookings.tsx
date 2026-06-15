import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Trash2, 
  CalendarDays, 
  MapPin, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  X, 
  CheckSquare, 
  Phone, 
  User, 
  CreditCard, 
  UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bookingService, Booking } from '../../services/bookingService.js';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface OwnerRequest {
  id: string;
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  status: string;
  ownerRequestStatus: string;
  createdAt: string;
}

export const AdminBookings = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'ownerRequests'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<OwnerRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    let token = localStorage.getItem('token');
    if (!token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          token = user?.token;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể kết nối đến máy chủ để lấy danh sách đơn!');
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/auth/owner-requests`, headers);
      if (res.data.success) {
        setOwnerRequests(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể lấy danh sách yêu cầu đăng ký làm chủ xe!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    } else {
      loadOwnerRequests();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (id: string, newStatus: 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled') => {
    let reason = '';
    if (newStatus === 'Cancelled') {
      const promptReason = window.prompt('Vui lòng nhập lý do hủy/từ chối đơn đặt xe:');
      if (promptReason === null) return;
      if (!promptReason.trim()) {
        window.alert('Bạn phải nhập lý do!');
        return;
      }
      reason = promptReason;
    }

    try {
      setLoading(true);
      await bookingService.updateStatus(id, newStatus, reason);
      window.alert('Cập nhật trạng thái đơn thành công!');
      await loadBookings();
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái đơn!');
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt xe này khỏi lịch sử hệ thống? Thao tác này không thể hoàn tác.')) {
      try {
        setLoading(true);
        await bookingService.deleteBooking(id);
        window.alert('Xóa đơn đặt xe thành công!');
        await loadBookings();
      } catch (err: any) {
        window.alert(err.response?.data?.message || err.message || 'Không thể xóa đơn đặt xe!');
        setLoading(false);
      }
    }
  };

  const handleApproveOwner = async (id: string) => {
    const confirm = window.confirm('Bạn có chắc chắn muốn phê duyệt khách hàng này thành Chủ xe đối tác không?');
    if (!confirm) return;

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await axios.put(`${API_BASE_URL}/auth/owner-requests/${id}/approve`, {}, headers);
      if (res.data.success) {
        window.alert(res.data.message || 'Phê duyệt chủ xe thành công!');
        await loadOwnerRequests();
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Lỗi khi phê duyệt chủ xe!');
      setLoading(false);
    }
  };

  const handleRejectOwner = async (id: string) => {
    const confirm = window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu đăng ký chủ xe này không?');
    if (!confirm) return;

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await axios.put(`${API_BASE_URL}/auth/owner-requests/${id}/reject`, {}, headers);
      if (res.data.success) {
        window.alert(res.data.message || 'Đã từ chối yêu cầu thành công.');
        await loadOwnerRequests();
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || err.message || 'Lỗi khi từ chối yêu cầu!');
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Ongoing': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Completed': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Lọc và Tìm kiếm đơn hàng
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    const matchesSearch = 
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Tìm kiếm yêu cầu chủ xe
  const filteredOwnerRequests = ownerRequests.filter(r => 
    r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-28 pb-20 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Top Header Actions */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-neon uppercase tracking-tight text-glow flex items-center gap-3">
              <ClipboardList size={32} />
              Hệ thống Quản lý Đơn hàng & Đối tác (Admin)
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Phê duyệt đối tác chủ xe mới, phê duyệt đơn đặt xe và điều phối quy trình thuê xe
            </p>
          </div>
          <button 
            onClick={activeTab === 'bookings' ? loadBookings : loadOwnerRequests}
            className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-2.5 rounded-lg text-gray-300 transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới dữ liệu
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 mb-6 gap-6">
          <button
            onClick={() => {
              setActiveTab('bookings');
              setSearchQuery('');
            }}
            className={`pb-3 font-bold text-sm tracking-wide transition-all uppercase cursor-pointer ${
              activeTab === 'bookings'
                ? 'text-neon border-b-2 border-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Điều phối đơn xe ({bookings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ownerRequests');
              setSearchQuery('');
            }}
            className={`pb-3 font-bold text-sm tracking-wide transition-all uppercase cursor-pointer ${
              activeTab === 'ownerRequests'
                ? 'text-neon border-b-2 border-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤝 Duyệt chủ xe mới ({ownerRequests.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center text-sm">
            ❌ {error}
          </div>
        )}

        {/* Bộ lọc & Tìm kiếm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'bookings' ? "Tìm theo mã đơn, khách hàng, dòng xe..." : "Tìm theo tài khoản, tên, email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface/50 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-neon transition-colors text-gray-200"
            />
          </div>

          {activeTab === 'bookings' && (
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:col-span-2">
              {[
                { key: 'All', label: 'Tất cả đơn' },
                { key: 'Pending', label: '⏳ Chờ duyệt' },
                { key: 'Confirmed', label: '✓ Đã xác nhận' },
                { key: 'Ongoing', label: '🚴 Đang thuê' },
                { key: 'Completed', label: '✓ Hoàn thành' },
                { key: 'Cancelled', label: '❌ Đã hủy' }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setFilterStatus(status.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === status.key
                      ? 'bg-neon text-dark font-bold'
                      : 'bg-surface border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Render Tab Bookings */}
        {activeTab === 'bookings' && (
          <div className="bg-surface/30 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-surface/50 font-bold">
                    <th className="py-4 px-6">Mã đơn</th>
                    <th className="py-4 px-6">Thông tin khách</th>
                    <th className="py-4 px-6">Thông tin xe</th>
                    <th className="py-4 px-6">Lịch trình thuê</th>
                    <th className="py-4 px-6">Tổng thanh toán</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-right">Thao tác điều phối</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-800/60 hover:bg-surface/20 transition-colors">
                      <td className="py-4 px-6 font-mono text-neon text-xs font-semibold">
                        {booking.bookingCode}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{booking.userName}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{booking.userPhone}</div>
                        <div className="text-gray-600 text-xs truncate max-w-[150px]" title={booking.userEmail}>{booking.userEmail}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={booking.vehicleImage || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'} alt={booking.vehicleModel} className="w-12 h-12 object-cover rounded-lg border border-gray-800 shrink-0" />
                          <div>
                            <div className="font-medium text-white">{booking.vehicleModel}</div>
                            <div className="text-gray-500 text-xs font-mono">ID: {booking.vehicleId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-300">
                        <div className="flex items-center gap-1"><CalendarDays size={12} className="text-gray-500" /> Nhận: {formatDate(booking.pickupDateTime)}</div>
                        <div className="flex items-center gap-1 mt-1"><CalendarDays size={12} className="text-gray-500" /> Trả: {formatDate(booking.returnDateTime)}</div>
                        <div className="text-gray-500 mt-1">Số ngày: <span className="text-white font-semibold">{booking.rentalDays} ngày</span></div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColorClass(booking.status)}`}>
                          {booking.statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Duyệt đơn Pending */}
                          {booking.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Phê duyệt đơn"
                              >
                                <Check size={12} /> Phê duyệt
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                                className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-500 border border-red-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Từ chối đơn"
                              >
                                <X size={12} /> Từ chối
                              </button>
                            </>
                          )}

                          {/* Bàn giao xe Confirmed */}
                          {booking.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'Ongoing')}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Bàn giao xe"
                              >
                                Bàn giao
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                                className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                                title="Hủy đơn hàng"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}

                          {/* Nhận xe Ongoing */}
                          {booking.status === 'Ongoing' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'Completed')}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Xác nhận khách trả xe"
                            >
                              <CheckSquare size={12} /> Thu hồi xe
                            </button>
                          )}

                          {/* Xóa đơn Completed/Cancelled */}
                          {(booking.status === 'Completed' || booking.status === 'Cancelled') && (
                            <button
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                              title="Xóa đơn thuê"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <RefreshCw size={32} className="mx-auto mb-2 text-neon animate-spin" />
                Đang đồng bộ đơn thuê xe từ máy chủ...
              </div>
            ) : filteredBookings.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle size={40} className="mx-auto mb-3 text-gray-600" />
                <p>Không tìm thấy dữ liệu đơn đặt xe phù hợp.</p>
              </div>
            )}
          </div>
        )}

        {/* Render Tab Owner Requests */}
        {activeTab === 'ownerRequests' && (
          <div className="bg-surface/30 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-surface/50 font-bold">
                    <th className="py-4 px-6">Tên Khách hàng</th>
                    <th className="py-4 px-6">Tên đăng nhập</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Số điện thoại</th>
                    <th className="py-4 px-6">Ngày đăng ký</th>
                    <th className="py-4 px-6 text-right">Hành động duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOwnerRequests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-800/60 hover:bg-surface/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        {req.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-300">
                        {req.username}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {req.email}
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-400">
                        {req.phoneNumber || 'Chưa cung cấp'}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-400">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveOwner(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-neon text-dark font-bold text-xs hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                            title="Phê duyệt chủ xe"
                          >
                            <Check size={12} /> Duyệt đối tác
                          </button>
                          <button
                            onClick={() => handleRejectOwner(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                            title="Từ chối yêu cầu"
                          >
                            <X size={12} /> Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <RefreshCw size={32} className="mx-auto mb-2 text-neon animate-spin" />
                Đang kiểm tra các yêu cầu đăng ký chủ xe...
              </div>
            ) : filteredOwnerRequests.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <UserCheck size={40} className="mx-auto mb-3 text-gray-600" />
                <p>Không có yêu cầu đăng ký chủ xe nào đang chờ phê duyệt.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};