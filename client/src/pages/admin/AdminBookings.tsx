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
  UserCheck,
  Key,
  FileText,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bookingService, Booking } from '../../services/bookingService';
import axios from 'axios';
import { ReturnMotorbikeModal } from '../../components/ReturnMotorbikeModal';
import { BookingReminderModal } from '../../components/BookingReminderModal';
import { useToast } from '../../hooks/useToast';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';

interface OwnerRequest {
  id: string;
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  status: string;
  ownerRequestStatus: string;
  createdAt: string;
  ownerContractText?: string;
  ownerContractSignedAt?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountOwner?: string;
  ownerSignature?: string;
}

export const AdminBookings = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'bookings' | 'ownerRequests') || 'bookings';
  const initialStatus = searchParams.get('status') || 'All';
  const [activeTab, setActiveTab] = useState<'bookings' | 'ownerRequests'>(initialTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<OwnerRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returningBookingId, setReturningBookingId] = useState<string | null>(null);
  const [returningPickupTime, setReturningPickupTime] = useState<string | undefined>(undefined);
  const [viewingContractRequest, setViewingContractRequest] = useState<OwnerRequest | null>(null);
  const [reminderBooking, setReminderBooking] = useState<Booking | null>(null);
  const [viewingReturnReasonBooking, setViewingReturnReasonBooking] = useState<Booking | null>(null);
  const [returnReplyText, setReturnReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

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

  const loadOwnerRequestsSilent = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/auth/owner-requests`, headers);
      if (res.data.success) {
        setOwnerRequests(res.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi tải ngầm danh sách chủ xe:', err);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'ownerRequests' || tab === 'bookings') {
      setActiveTab(tab);
    }
    const status = searchParams.get('status');
    if (status) {
      setFilterStatus(status);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
      loadOwnerRequestsSilent();
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
        showToast('Bạn phải nhập lý do!', 'warning');
        return;
      }
      reason = promptReason;
    }

    try {
      setLoading(true);
      await bookingService.updateStatus(id, newStatus, reason);
      showToast('Cập nhật trạng thái đơn thành công!', 'success');
      await loadBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái đơn!', 'error');
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt xe này khỏi lịch sử hệ thống? Thao tác này không thể hoàn tác.')) {
      try {
        setLoading(true);
        await bookingService.deleteBooking(id);
        showToast('Xóa đơn đặt xe thành công!', 'success');
        await loadBookings();
      } catch (err: any) {
        showToast(err.response?.data?.message || err.message || 'Không thể xóa đơn đặt xe!', 'error');
        setLoading(false);
      }
    }
  };

  const [confirmApproveRequest, setConfirmApproveRequest] = useState<OwnerRequest | null>(null);
  const [confirmRejectRequest, setConfirmRejectRequest] = useState<OwnerRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApproveOwner = (req: OwnerRequest) => {
    setConfirmApproveRequest(req);
  };

  const handleRejectOwner = (req: OwnerRequest) => {
    setConfirmRejectRequest(req);
    setRejectReason('');
  };

  const submitApproveOwner = async () => {
    if (!confirmApproveRequest) return;
    const id = confirmApproveRequest.id || (confirmApproveRequest as any)._id;
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await axios.put(`${API_BASE_URL}/auth/owner-requests/${id}/approve`, {}, headers);
      if (res.data.success) {
        showToast(res.data.message || 'Phê duyệt chủ xe thành công!', 'success');
        await loadOwnerRequests();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi phê duyệt chủ xe!', 'error');
    } finally {
      setLoading(false);
      setConfirmApproveRequest(null);
    }
  };

  const submitRejectOwner = async () => {
    if (!confirmRejectRequest) return;
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối cụ thể.', 'error');
      return;
    }
    const id = confirmRejectRequest.id || (confirmRejectRequest as any)._id;
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await axios.put(`${API_BASE_URL}/auth/owner-requests/${id}/reject`, { rejectReason }, headers);
      if (res.data.success) {
        showToast(res.data.message || 'Đã từ chối yêu cầu thành công.', 'success');
        await loadOwnerRequests();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi từ chối yêu cầu!', 'error');
    } finally {
      setLoading(false);
      setConfirmRejectRequest(null);
      setRejectReason('');
    }
  };

  const handleReturnSuccess = () => {
    loadBookings();
    setReturningBookingId(null);
  };

  const handleSendReturnResponse = async (warnUser: boolean) => {
    if (!viewingReturnReasonBooking) return;
    try {
      setSubmittingReply(true);
      await bookingService.replyToReturnReason(
        viewingReturnReasonBooking.id, 
        returnReplyText, 
        warnUser
      );
      showToast(
        warnUser 
          ? 'Đã gửi phản hồi và gửi cảnh cáo thô tục tới người dùng thành công!' 
          : 'Gửi phản hồi yêu cầu trả xe thành công!', 
        'success'
      );
      setViewingReturnReasonBooking(null);
      await loadBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Không thể phản hồi yêu cầu!', 'error');
    } finally {
      setSubmittingReply(false);
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
      case 'Returning': return 'bg-neon/10 text-neon border-neon/30 animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.2)]';
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
            <h1 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-3">
              <ClipboardList size={28} className="text-gray-400" />
              Hệ thống quản lý đơn hàng & đối tác
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
            className={`pb-3 font-bold text-sm tracking-wide transition-all uppercase cursor-pointer flex items-center ${
              activeTab === 'bookings'
                ? 'text-neon border-b-2 border-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardList className="inline mr-2" size={16} /> Điều phối đơn xe ({bookings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ownerRequests');
              setSearchQuery('');
            }}
            className={`pb-3 font-bold text-sm tracking-wide transition-all uppercase cursor-pointer flex items-center ${
              activeTab === 'ownerRequests'
                ? 'text-neon border-b-2 border-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="inline mr-2" size={16} /> Duyệt chủ xe mới ({ownerRequests.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center text-sm flex items-center justify-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span>{error}</span>
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
                { key: 'Pending', label: 'Chờ duyệt' },
                { key: 'Confirmed', label: 'Đã xác nhận' },
                { key: 'Ongoing', label: 'Đang thuê' },
                { key: 'Returning', label: 'Yêu cầu trả' },
                { key: 'Completed', label: 'Hoàn thành' },
                { key: 'Cancelled', label: 'Đã hủy' }
              ].map((status) => {
                const count = status.key === 'All'
                  ? bookings.length
                  : bookings.filter(b => b.status === status.key).length;
                const isSelected = filterStatus === status.key;
                
                return (
                  <button
                    key={status.key}
                    onClick={() => setFilterStatus(status.key)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-neon text-dark font-bold shadow-[0_0_12px_rgba(204,255,0,0.4)]' 
                        : status.key === 'Returning' && count > 0
                          ? 'bg-neon/10 border border-neon/30 text-neon hover:border-neon/50 animate-pulse font-bold'
                          : 'bg-surface border border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{status.label}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        isSelected 
                          ? 'bg-dark text-neon' 
                          : status.key === 'Returning'
                            ? 'bg-neon text-dark'
                            : 'bg-gray-800 text-gray-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cảnh báo yêu cầu trả xe cho Admin */}
        {activeTab === 'bookings' && bookings.filter(b => b.status === 'Returning').length > 0 && (
          <div className="mb-6 p-4 bg-neon/10 border border-neon/30 rounded-2xl text-neon text-xs sm:text-sm flex items-center justify-between gap-3 animate-pulse shadow-[0_0_15px_rgba(204,255,0,0.15)] font-sans">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neon animate-ping"></span>
              <span className="font-bold">
                Có {bookings.filter(b => b.status === 'Returning').length} đơn đặt xe đang yêu cầu trả xe. Vui lòng thông báo nhân viên thu hồi!
              </span>
            </div>
            <button
              onClick={() => setFilterStatus('Returning')}
              className="bg-neon hover:bg-[#bbf000] text-dark font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer shrink-0"
            >
              Xem ngay
            </button>
          </div>
        )}

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
                      <td className="py-4 px-6 font-mono text-neon text-xs font-semibold whitespace-nowrap">
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
                      <td className="py-4 px-6 text-xs text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1"><CalendarDays size={12} className="text-gray-500" /> Nhận: {formatDate(booking.pickupDateTime)}</div>
                        <div className="flex items-center gap-1 mt-1"><CalendarDays size={12} className="text-gray-500" /> Trả: {formatDate(booking.returnDateTime)}</div>
                        <div className="text-gray-500 mt-1">Số ngày: <span className="text-white font-semibold whitespace-nowrap">{booking.rentalDays} ngày</span></div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white whitespace-nowrap">
                        {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColorClass(booking.status)}`}>
                          {booking.status === 'Returning' ? '⏳ Chờ trả xe' : booking.statusLabel}
                        </span>
                        {booking.returnReason && (
                          <button
                            onClick={() => {
                              setViewingReturnReasonBooking(booking);
                              setReturnReplyText(booking.returnReasonReply || '');
                            }}
                            className="mt-1.5 px-2 py-1 rounded-lg bg-neon/10 hover:bg-neon/20 text-neon border border-neon/20 text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto"
                            title="Bấm để xem lý do trả xe"
                          >
                            <FileText size={11} /> Lý do trả
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Duyệt đơn Pending */}
                          {booking.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                                className="px-3 py-1.5 rounded-lg bg-neon hover:bg-[#bbf000] text-dark text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
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
                                className="px-3 py-1.5 rounded-lg bg-neon hover:bg-[#bbf000] text-dark text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Bàn giao xe"
                              >
                                Bàn giao
                              </button>
                              <button
                                onClick={() => setReminderBooking(booking)}
                                className="px-3 py-1.5 rounded-lg bg-surface border border-gray-800 hover:border-neon hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 text-gray-300"
                                title="Nhắc nhở nhận xe"
                              >
                                <Bell size={12} className="text-neon" /> Nhắc nhở
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

                          {/* Nhận xe Ongoing hoặc Returning (Thu hồi xe qua Modal) */}
                          {(booking.status === 'Ongoing' || booking.status === 'Returning') && (
                            <>
                              <button
                                onClick={() => {
                                  setReturningBookingId(booking.id);
                                  setReturningPickupTime(booking.pickupDateTime);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  booking.status === 'Returning'
                                    ? 'bg-neon hover:bg-[#bbf000] text-dark animate-pulse shadow-[0_0_12px_rgba(204,255,0,0.4)]'
                                    : 'bg-neon hover:bg-[#bbf000] text-dark'
                                }`}
                                title={booking.status === 'Returning' ? 'Khách yêu cầu trả xe - click để tiến hành thu hồi' : 'Xác nhận khách trả xe'}
                              >
                                <Key size={12} /> {booking.status === 'Returning' ? 'Tiến hành thu hồi' : 'Thu hồi xe'}
                              </button>
                              <button
                                onClick={() => setReminderBooking(booking)}
                                className="px-3 py-1.5 rounded-lg bg-surface border border-gray-800 hover:border-neon hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 text-gray-300"
                                title="Nhắc nhở trả xe"
                              >
                                <Bell size={12} className="text-neon" /> Nhắc nhở
                              </button>
                            </>
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
                          {req.ownerContractText && (
                            <button
                              onClick={() => setViewingContractRequest(req)}
                              className="px-3 py-1.5 rounded-lg bg-surface border border-gray-800 text-gray-300 hover:border-neon hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Xem hợp đồng đã ký"
                            >
                              <FileText size={12} /> Hợp đồng
                            </button>
                          )}
                          <button
                            onClick={() => handleApproveOwner(req)}
                            className="px-3 py-1.5 rounded-lg bg-neon text-dark font-bold text-xs hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                            title="Phê duyệt chủ xe"
                          >
                            <Check size={12} /> Duyệt đối tác
                          </button>
                          <button
                            onClick={() => handleRejectOwner(req)}
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

      {/* Modal Xem hợp đồng đối tác cho Admin */}
      {viewingContractRequest && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setViewingContractRequest(null)}
          />
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-3xl z-10 overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
            
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="font-display font-black text-lg text-white uppercase flex items-center gap-2">
                <FileText size={18} className="text-neon" />
                Hợp đồng đối tác chủ xe đã ký
              </h3>
              <button
                onClick={() => setViewingContractRequest(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-grow text-gray-300 text-sm font-sans space-y-4">
              <div className="text-xs text-gray-400 flex items-center justify-between bg-neon/10 border border-neon/20 p-3 rounded-lg text-neon font-bold">
                <span>Hợp đồng điện tử đã được đối tác ký cam kết</span>
                <span>Ký ngày: {viewingContractRequest.ownerContractSignedAt ? new Date(viewingContractRequest.ownerContractSignedAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </div>

              <pre className="whitespace-pre-wrap font-mono text-xs bg-black/40 border border-white/5 rounded-xl p-4 max-h-[40vh] overflow-y-auto leading-relaxed">
                {viewingContractRequest.ownerContractText || 'Không có dữ liệu hợp đồng.'}
              </pre>

              {viewingContractRequest.ownerSignature && (
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider text-neon">
                    Chữ ký điện tử của đối tác
                  </h4>
                  <div className="bg-black/60 border border-white/10 rounded-lg p-2 flex justify-center items-center h-24">
                    <img 
                      src={viewingContractRequest.ownerSignature} 
                      alt="Chữ ký đối tác" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-black/20">
              <button
                onClick={() => setViewingContractRequest(null)}
                className="px-6 py-2.5 rounded-lg bg-neon text-dark font-bold text-xs uppercase hover:bg-[#bbf000] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận Phê duyệt */}
      {confirmApproveRequest && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmApproveRequest(null)}
          />
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md z-10 overflow-hidden relative shadow-2xl p-6 space-y-4">
            <h3 className="font-display font-black text-base text-white uppercase tracking-wider text-neon">
              Xác nhận phê duyệt chủ xe
            </h3>
            <p className="text-gray-300 text-xs leading-relaxed">
              Bạn có chắc chắn muốn phê duyệt đối tác <span className="text-white font-bold">{confirmApproveRequest.name}</span> thành Chủ xe đối tác của Motov không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmApproveRequest(null)}
                className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitApproveOwner}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-neon text-dark font-bold text-xs uppercase hover:bg-[#bbf000] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận Từ chối */}
      {confirmRejectRequest && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmRejectRequest(null)}
          />
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md z-10 overflow-hidden relative shadow-2xl p-6 space-y-4">
            <h3 className="font-display font-black text-base text-red-500 uppercase tracking-wider">
              Từ chối đối tác chủ xe
            </h3>
            <p className="text-gray-300 text-xs">
              Vui lòng nhập lý do từ chối cụ thể gửi cho đối tác <span className="text-white font-bold">{confirmRejectRequest.name}</span>:
            </p>
            <div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Thông tin ngân hàng không trùng khớp với eKYC, vui lòng cập nhật lại..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 h-24 resize-none leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmRejectRequest(null)}
                className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitRejectOwner}
                disabled={loading || !rejectReason.trim()}
                className="px-5 py-2 rounded-lg bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Từ chối yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReturnMotorbikeModal
        isOpen={!!returningBookingId}
        onClose={() => setReturningBookingId(null)}
        bookingId={returningBookingId}
        pickupDateTime={returningPickupTime}
        startOdometer={bookings.find(b => b.id === returningBookingId)?.startOdometer || 0}
        onSuccess={handleReturnSuccess}
      />

      <BookingReminderModal
        booking={reminderBooking}
        onClose={() => setReminderBooking(null)}
      />

      {/* Modal hiển thị Lý do trả xe và Phản hồi/Cảnh cáo */}
      {viewingReturnReasonBooking && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setViewingReturnReasonBooking(null)}
          />
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md z-10 overflow-hidden relative shadow-2xl p-5 space-y-4 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-display font-black text-xs text-neon uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Lý do trả xe & Phản hồi
              </h3>
              <button 
                onClick={() => setViewingReturnReasonBooking(null)} 
                className="text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div>
              <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Lý do khách gửi:</span>
              <div className="text-gray-300 text-xs leading-relaxed bg-black/50 border border-white/5 p-4 rounded-xl font-mono whitespace-pre-wrap min-h-[60px]">
                {viewingReturnReasonBooking.returnReason}
              </div>
            </div>

            <div>
              <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Phản hồi của Admin:</span>
              <textarea
                value={returnReplyText}
                onChange={(e) => setReturnReplyText(e.target.value)}
                placeholder="Nhập nội dung phản hồi cho khách hàng..."
                className="w-full text-xs text-gray-200 bg-black/50 border border-white/10 focus:border-neon focus:ring-1 focus:ring-neon rounded-xl p-3 outline-none resize-none h-20 transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendReturnResponse(false)}
                  disabled={submittingReply}
                  className="flex-1 py-2 px-3 rounded-lg bg-neon hover:bg-[#bbf000] text-dark text-xs font-bold uppercase transition-all cursor-pointer border-none disabled:opacity-50 text-center"
                >
                  {submittingReply ? 'Đang gửi...' : 'Gửi Phản Hồi'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Cảnh cáo tài khoản khách hàng vì ngôn từ thô tục? (Đủ 3 lần cảnh cáo sẽ tự động khóa tài khoản)')) {
                      handleSendReturnResponse(true);
                    }
                  }}
                  disabled={submittingReply}
                  className="py-2 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-500 border border-red-500/20 text-xs font-bold uppercase transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  ⚠️ Cảnh cáo thô tục
                </button>
              </div>
              <button
                onClick={() => setViewingReturnReasonBooking(null)}
                className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase transition-all cursor-pointer border border-white/5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};