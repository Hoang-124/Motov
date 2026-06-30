import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { reminderService, BookingReminder } from '../services/reminderService';
import { Booking } from '../services/bookingService';

interface BookingReminderModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingReminderModal = ({ booking, onClose }: BookingReminderModalProps) => {
  const [reminders, setReminders] = useState<BookingReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadReminders = async () => {
    if (!booking) return;
    try {
      setLoading(true);
      setError(null);
      const data = await reminderService.getBookingReminders(booking.id);
      setReminders(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Không thể lấy nhật ký nhắc nhở.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (booking) {
      loadReminders();
      setSuccess(null);
      setError(null);
    }
  }, [booking]);

  const handleSendReminder = async () => {
    if (!booking) return;
    try {
      setSending(true);
      setError(null);
      setSuccess(null);
      const res = await reminderService.sendManualReminder(booking.id);
      if (res.success) {
        setSuccess(res.message || 'Đã gửi nhắc nhở thủ công thành công!');
        // Reload list to see the newly generated reminder log
        loadReminders();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Lỗi khi gửi nhắc nhở.');
    } finally {
      setSending(false);
    }
  };

  if (!booking) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case '24h_before_pickup': return 'Trước nhận xe 24h';
      case '2h_before_pickup': return 'Trước nhận xe 2h';
      case '24h_before_return': return 'Trước trả xe 24h';
      case '2h_before_return': return 'Trước trả xe 2h';
      default: return type;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Sent': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Cancelled': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-300 border-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Sent': return 'Đã gửi';
      case 'Pending': return 'Chờ gửi';
      case 'Failed': return 'Lỗi';
      case 'Cancelled': return 'Đã Hủy';
      default: return status;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return <Mail size={13} className="text-blue-400 inline mr-1" />;
      case 'SMS': return <MessageSquare size={13} className="text-yellow-500 inline mr-1" />;
      case 'Both': return (
        <span className="flex items-center gap-0.5">
          <Mail size={12} className="text-blue-400" />
          <MessageSquare size={12} className="text-yellow-500" />
        </span>
      );
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-2xl z-10"
        >
          {/* Top neon indicator border */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

          {/* Modal Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800/80 bg-black/25">
            <div className="flex items-center gap-2.5">
              <Bell size={20} className="text-neon" />
              <div>
                <h3 className="font-display font-bold text-base text-white">Quản lý Nhắc nhở Đơn đặt xe</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">Đơn hàng: {booking.bookingCode} | Khách hàng: {booking.userName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            {/* Status alerts */}
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Top triggers block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-dark border border-gray-800/50 gap-4">
              <div>
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">Hành động nhắc nhở thủ công</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  {booking.status === 'Confirmed' && 'Gửi email/sms thông báo nhắc lịch HẸN NHẬN XE cho khách.'}
                  {booking.status === 'Ongoing' && 'Gửi email/sms thông báo nhắc lịch HẸN TRẢ XE cho khách.'}
                  {booking.status !== 'Confirmed' && booking.status !== 'Ongoing' && 'Không khả dụng cho trạng thái đơn hàng hiện tại.'}
                </p>
              </div>
              <button
                onClick={handleSendReminder}
                disabled={sending || (booking.status !== 'Confirmed' && booking.status !== 'Ongoing')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs bg-neon text-dark font-black px-4 py-2.5 rounded-lg shadow-[0_0_15px_rgba(204,255,0,0.15)] hover:shadow-[0_0_20px_rgba(204,255,0,0.25)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Gửi nhắc nhở ngay
                  </>
                )}
              </button>
            </div>

            {/* History logs table */}
            <div>
              <div className="flex justify-between items-center mb-3.5">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                  Lịch sử nhắc nhở của đơn hàng
                </h4>
                <button
                  onClick={loadReminders}
                  disabled={loading}
                  className="text-[10px] font-bold text-neon bg-transparent hover:text-white border-none flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                  Làm mới
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-xs">
                  <Loader2 size={24} className="text-neon animate-spin mb-2" />
                  Đang tải nhật ký...
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs">
                  Chưa có lịch nhắc nhở nào được lập lịch hoặc gửi cho đơn này.
                </div>
              ) : (
                <div className="border border-gray-800 rounded-xl overflow-hidden bg-black/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider font-bold bg-surface/20">
                        <th className="py-2.5 px-4">Loại nhắc nhở</th>
                        <th className="py-2.5 px-4">Kênh</th>
                        <th className="py-2.5 px-4">Lập lịch lúc</th>
                        <th className="py-2.5 px-4">Đã gửi lúc</th>
                        <th className="py-2.5 px-4">Trạng thái</th>
                        <th className="py-2.5 px-4 text-center">Thử lại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {reminders.map((rem) => (
                        <tr key={rem._id} className="hover:bg-surface/10 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            {getReminderTypeLabel(rem.reminderType)}
                          </td>
                          <td className="py-3 px-4">
                            {getChannelIcon(rem.channel)}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-400 text-[10px]">
                            {formatDate(rem.scheduledTime)}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-400 text-[10px]">
                            {formatDate(rem.sentTime)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(rem.status)}`}>
                              {getStatusLabel(rem.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-gray-400">
                            {rem.retryCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
