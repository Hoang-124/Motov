import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  MapPin, 
  ClipboardList, 
  Check, 
  X, 
  CheckSquare, 
  Phone, 
  User, 
  CreditCard, 
  RefreshCw, 
  UserCheck,
  Key,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { bookingService, Booking } from '../../services/bookingService';
import axios from 'axios';
import { ReturnMotorbikeModal } from '../../components/ReturnMotorbikeModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface OwnerRequest {
  id: string;
  _id?: string; // Bổ sung để tránh lỗi compile TypeScript khi dùng fallback _id
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  status: string;
  ownerRequestStatus: string;
  createdAt: string;
}

export const StaffBookings = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'ownerRequests'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<OwnerRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returningBookingId, setReturningBookingId] = useState<string | null>(null);
  const [returningPickupTime, setReturningPickupTime] = useState<string | undefined>(undefined);

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

  const loadStaffBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getAllBookings();
      // Đảm bảo dữ liệu luôn là mảng để không bị lỗi hàm .filter hoặc .length
      setBookings(Array.isArray(data) ? data : data?.bookings || data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ để lấy danh sách đơn!');
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
        setOwnerRequests(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lấy danh sách yêu cầu đăng ký làm chủ xe!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadStaffBookings();
    } else {
      loadOwnerRequests();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (id: string, newStatus: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled') => {
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

      setBookings(prev =>
        prev.map(b => (b.id === id || (b as any)._id === id) ? { ...b, status: newStatus } : b)
      );
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'Không thể cập nhật trạng thái đơn!');
    } finally {
      setLoading(false);
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
      window.alert(err.response?.data?.message || 'Lỗi khi phê duyệt chủ xe!');
    } finally {
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
      window.alert(err.response?.data?.message || 'Lỗi khi từ chối yêu cầu!');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSuccess = () => {
    loadStaffBookings();
    setReturningBookingId(null);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'All' || b.status === filterStatus);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">

        {/* Title and Top Header Actions */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-neon uppercase tracking-tight text-glow flex items-center gap-3">
              <ClipboardList size={32} />
              Quản Lý Yêu Cầu & Điều Phối (Staff)
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Phê duyệt đối tác và xử lý nhanh quy trình giao nhận xe thực tế cho khách hàng
            </p>
          </div>
          <button
            onClick={activeTab === 'bookings' ? loadStaffBookings : loadOwnerRequests}
            className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-2.5 rounded-lg text-gray-300 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới dữ liệu
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 font-bold text-sm tracking-wide transition-all uppercase cursor-pointer flex items-center ${activeTab === 'bookings'
              ? 'text-neon border-b-2 border-neon'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <ClipboardList className="inline mr-2" size={18} /> Điều phối đơn xe ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('ownerRequests')}
            className={`pb-3 font-bold text-sm tracking-wide transition-all uppercase cursor-pointer flex items-center ${activeTab === 'ownerRequests'
              ? 'text-neon border-b-2 border-neon'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <UserCheck className="inline mr-2" size={18} /> Duyệt chủ xe mới ({ownerRequests.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center text-sm flex items-center justify-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Render Tab Bookings */}
        {activeTab === 'bookings' && (
          <>
            {/* Filter quick status */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
              {[
                { key: 'All', label: 'Tất cả đơn' },
                { key: 'Pending', label: 'Chờ duyệt' },
                { key: 'Confirmed', label: 'Đã xác nhận' },
                { key: 'Ongoing', label: 'Đang thuê' },
                { key: 'Completed', label: 'Hoàn thành' },
                { key: 'Cancelled', label: 'Đã hủy' }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setFilterStatus(status.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${filterStatus === status.key ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* Grid list Bookings */}
            {loading && bookings.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Đang đồng bộ dữ liệu với máy chủ...</div>
            ) : filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={booking.id || (booking as any)._id}
                    className="bg-surface border border-gray-800 rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-xs font-bold text-neon">{booking.bookingCode}</span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${booking.status === 'Ongoing' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                          booking.status === 'Pending' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' :
                            booking.status === 'Confirmed' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                              booking.status === 'Completed' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' :
                                'text-red-400 border-red-500/20 bg-red-500/5'
                          }`}>
                          {booking.statusLabel}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-white mb-2">{booking.vehicleModel}</h3>

                      {/* Customer Info */}
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl mb-4 space-y-2 text-xs text-gray-400">
                        <div className="flex items-center gap-2"><User size={13} /> Khách: <span className="text-white font-medium">{booking.userName}</span></div>
                        <div className="flex items-center gap-2"><Phone size={13} /> SĐT: <span className="text-white font-mono">{booking.userPhone}</span></div>
                        <div className="flex items-center gap-2"><CreditCard size={13} /> Tổng thu: <span className="text-neon font-semibold">{(booking.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</span></div>
                      </div>

                      {/* Giao nhận địa chỉ */}
                      <div className="space-y-2 text-xs text-gray-400 mb-6">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Điểm nhận xe ({formatDate(booking.pickupDateTime)}):</p>
                            <p className="text-gray-300 mt-0.5">{booking.pickupLocation?.address || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 pt-2 border-t border-gray-900">
                          <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Điểm trả xe ({formatDate(booking.returnDateTime)}):</p>
                            <p className="text-gray-300 mt-0.5">{booking.returnLocation?.address || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t border-gray-800 flex flex-col gap-2">
                      {booking.status === 'Pending' && (
                        <div className="flex flex-col gap-2">
                          <div className="text-center text-[11px] text-yellow-400 font-semibold py-1.5 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                            Đang chờ Chủ xe duyệt đơn
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleUpdateStatus(booking.id || (booking as any)._id, 'Confirmed')}
                              disabled={loading}
                              className="bg-neon text-dark font-bold py-2 rounded-lg text-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 text-center"
                            >
                              Duyệt hộ đơn
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id || (booking as any)._id, 'Cancelled')}
                              disabled={loading}
                              className="bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50 text-center"
                            >
                              Từ chối đơn
                            </button>
                          </div>
                        </div>
                      )}

                      {booking.status === 'Confirmed' && (
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            onClick={() => handleUpdateStatus(booking.id || (booking as any)._id, 'Ongoing')}
                            disabled={loading}
                            className="col-span-3 flex items-center justify-center gap-1 bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Bàn giao xe (Bắt đầu thuê)
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id || (booking as any)._id, 'Cancelled')}
                            disabled={loading}
                            className="col-span-1 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                            title="Hủy đơn hàng"
                          >
                            Hủy
                          </button>
                        </div>
                      )}

                      {booking.status === 'Ongoing' && (
                        <button
                          onClick={() => {
                            setReturningBookingId(booking.id || (booking as any)._id);
                            setReturningPickupTime(booking.pickupDateTime);
                          }}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-1 bg-green-600 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Key size={14} /> Xác nhận khách trả xe (Thu hồi xe)
                        </button>
                      )}

                      {booking.status === 'Completed' && (
                        <div className="text-center text-xs text-gray-500 font-medium py-2 bg-gray-900/30 border border-gray-800/40 rounded-lg">
                          Thủ tục giao nhận hoàn thành
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
          </>
        )}

        {/* Render Tab Owner Requests */}
        {activeTab === 'ownerRequests' && (
          <>
            {loading && ownerRequests.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Đang kiểm tra các yêu cầu đăng ký...</div>
            ) : ownerRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownerRequests.map((req) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={req.id || req._id} // SỬA ĐỂ AN TOÀN KEY
                    className="bg-surface border border-gray-800 rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold text-neon tracking-wider px-2 py-0.5 rounded bg-neon/10 border border-neon/20">
                          Chờ duyệt Owner
                        </span>
                        <span className="text-[10px] text-gray-500">{formatDate(req.createdAt)}</span>
                      </div>

                      <h3 className="font-bold text-base text-white mb-3">{req.name}</h3>

                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl mb-6 space-y-2 text-xs text-gray-400">
                        <div>Tài khoản: <span className="text-white font-mono font-medium">{req.username}</span></div>
                        <div>Email: <span className="text-white font-medium">{req.email}</span></div>
                        {req.phoneNumber && (
                          <div>SĐT liên hệ: <span className="text-white font-mono">{req.phoneNumber}</span></div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveOwner(req.id || (req as any)._id)} // SỬA LỖI FALLBACK ID CHỦ XE
                        disabled={loading}
                        className="flex items-center justify-center gap-1 bg-neon text-dark font-bold py-2 rounded-lg text-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} /> Phê duyệt
                      </button>
                      <button
                        onClick={() => handleRejectOwner(req.id || (req as any)._id)} // SỬA LỖI FALLBACK ID CHỦ XE
                        disabled={loading}
                        className="flex items-center justify-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
                <UserCheck size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Không có yêu cầu đăng ký nào</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">Tất cả các yêu cầu đăng ký làm đối tác chủ xe đã được xử lý xong.</p>
              </div>
            )}
          </>
        )}

      </div>
      
      <ReturnMotorbikeModal
        isOpen={!!returningBookingId}
        onClose={() => setReturningBookingId(null)}
        bookingId={returningBookingId}
        pickupDateTime={returningPickupTime}
        startOdometer={bookings.find(b => (b.id === returningBookingId || (b as any)._id === returningBookingId))?.startOdometer || 0}
        onSuccess={handleReturnSuccess}
      />
    </div>
  );
};