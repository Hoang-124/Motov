import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ClipboardList, Trash2, RefreshCw, Star, X, AlertCircle, Clock, ShieldAlert, CheckCircle, HelpCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bookingService, Booking } from '../services/bookingService'; // Import Service
import { useLanguage } from '../hooks/useLanguage';
import { feedbackService } from '../services/feedbackService';
import { BookingTrackingModal } from '../components/BookingTrackingModal';
import { useToast } from '../hooks/useToast';

export const Bookings = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [reviewedBookingIds, setReviewedBookingIds] = useState<string[]>([]);

  // State cho Modal trả xe
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturnBooking, setActiveReturnBooking] = useState<Booking | null>(null);

  // State cho Modal hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeCancelBookingId, setActiveCancelBookingId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  const handleOpenFeedbackModal = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setFeedbackRating(5);
    setFeedbackContent('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    try {
      setLoading(true);
      await feedbackService.createFeedback({
        bookingId: selectedBookingId,
        rating: feedbackRating,
        content: feedbackContent
      });
      showToast(language === 'vi' ? 'Gửi đánh giá thành công! Cảm ơn phản hồi của bạn.' : 'Feedback submitted successfully! Thank you for your feedback.', 'success');
      setReviewedBookingIds(prev => [...prev, selectedBookingId]);
      setShowFeedbackModal(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || (language === 'vi' ? 'Không thể gửi đánh giá vào lúc này!' : 'Failed to submit feedback at this moment!'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tải danh sách đơn từ Server
  const loadMyBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('bookings.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, [language]);

  // Helper tính toán thông tin trả xe sớm/muộn
  const getReturnDetails = (booking: Booking | null) => {
    if (!booking) return null;

    const pickupTime = new Date(booking.pickupDateTime);
    const returnTime = new Date(booking.returnDateTime);
    const now = new Date();

    const totalRentalHours = Math.ceil((returnTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60));
    // Đơn giá thuê mỗi giờ (sau giảm giá nếu có)
    const hourlyRate = booking.totalAmount / (totalRentalHours || 1);

    const diffMs = returnTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let type: 'early' | 'late' | 'normal' = 'normal';
    let hours = 0;
    let amount = 0;
    const deposit = booking.depositAmount || Math.round(booking.totalAmount * 0.3);
    const actualHours = Math.max(0, Math.ceil((now.getTime() - pickupTime.getTime()) / (1000 * 60 * 60)));
    const actualRentalFee = Math.round(actualHours * hourlyRate);

    if (diffHours >= 2) {
      // Trả sớm trên 2 tiếng
      type = 'early';
      hours = Math.floor(diffHours);
      // Mất cọc, khách hàng phải thanh toán thêm số tiền bằng đúng tiền thuê thực tế
      amount = actualRentalFee;
    } else if (diffHours < -0.25) {
      // Trả muộn trên 15 phút (0.25 giờ)
      type = 'late';
      hours = Math.ceil(Math.abs(diffHours));
      amount = Math.round(hours * hourlyRate); // Phí trễ đơn giản
    }

    return { type, hours, amount, pickupTime, returnTime, now, deposit, actualHours, actualRentalFee };
  };

  // Hàm mở Modal hủy đơn
  const openCancelModal = (id: string) => {
    setActiveCancelBookingId(id);
    setCancelReasonInput('');
    setShowCancelModal(true);
  };

  // Hàm gọi API hủy đơn từ Modal
  const handleCancelBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCancelBookingId) return;

    if (!cancelReasonInput.trim()) {
      showToast(language === 'vi' ? 'Bạn phải nhập lý do hủy đơn!' : 'You must enter the cancellation reason!', 'warning');
      return;
    }

    try {
      setLoading(true);
      await bookingService.cancelBooking(activeCancelBookingId, cancelReasonInput);
      showToast(t('myBookingsPage.cancelModalSuccess'), 'success');
      setShowCancelModal(false);
      // Tải lại danh sách mới cập nhật trạng thái từ Server
      await loadMyBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || (language === 'vi' ? 'Không thể hủy đơn vào lúc này!' : 'Failed to cancel booking at this moment!'), 'error');
      setLoading(false);
    }
  };

  // Hàm mở Modal trả xe
  const openReturnModal = (booking: Booking) => {
    setActiveReturnBooking(booking);
    setShowReturnModal(true);
  };

  // Hàm gọi API trả xe máy từ Modal
  const handleReturnBookingSubmit = async () => {
    if (!activeReturnBooking) return;

    try {
      setLoading(true);
      await bookingService.returnMotorbike(activeReturnBooking.id, new Date().toISOString());
      showToast(t('myBookingsPage.returnSuccess'), 'success');
      setShowReturnModal(false);
      // Tải lại danh sách mới từ Server
      await loadMyBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || (language === 'vi' ? 'Không thể trả xe vào lúc này!' : 'Failed to return motorbike at this moment!'), 'error');
      setLoading(false);
    }
  };

  const translateStatusLabel = (status: string, label: string) => {
    if (language === 'vi') return label;
    if (status === 'Pending') return 'Pending';
    if (status === 'Confirmed') return 'Confirmed';
    if (status === 'Ongoing') return 'Ongoing';
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';
    return label;
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
              <ClipboardList size={36} />
              {t('myBookingsPage.title')}
            </h1>
            <p className="text-gray-400 text-sm">
              {t('myBookingsPage.subtitle')}
            </p>
          </div>
          <button 
            onClick={loadMyBookings}
            className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-gray-600 px-4 py-2 rounded-lg text-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('myBookingsPage.refreshData')}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center text-sm flex items-center justify-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{t('myBookingsPage.loadingData')}</div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map(booking => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-lg relative overflow-hidden"
              >
                {/* Image xe từ Snapshot */}
                <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-black border border-gray-800 flex-shrink-0">
                  <img src={booking.vehicleImage} alt={booking.vehicleModel} loading="lazy" className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-3 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                        {t('myBookingsPage.bookingCode', { code: booking.bookingCode })}
                      </span>
                      <h3 className="font-display font-bold text-xl text-white">{booking.vehicleModel}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      booking.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                      booking.status === 'Confirmed' ? 'bg-neon/10 text-neon border-neon/30 shadow-[0_0_10px_rgba(204,255,0,0.1)]' :
                      booking.status === 'Ongoing' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                      booking.status === 'Completed' ? 'bg-white/5 text-gray-300 border-white/20' :
                      'bg-red-500/10 text-red-500 border-red-500/30' // Cancelled
                    }`}>
                      {translateStatusLabel(booking.status, booking.statusLabel)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-neon" />
                        <span className="text-xs">{t('myBookingsPage.pickup', { time: new Date(booking.pickupDateTime).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-gray-600" />
                        <span className="text-xs">{t('myBookingsPage.return', { time: new Date(booking.returnDateTime).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 items-start sm:items-center">
                      <MapPin size={16} className="text-neon mt-1 sm:mt-0" />
                      <span className="text-xs line-clamp-2">{t('myBookingsPage.pickupLoc', { loc: booking.pickupLocation?.address || 'N/A' })}</span>
                    </div>
                  </div>

                  {booking.cancelReason && (
                    <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg text-xs text-red-400/80">
                      {t('myBookingsPage.cancelReason', { reason: booking.cancelReason })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-800/50 flex flex-wrap gap-4 text-xs text-gray-500 justify-between items-center">
                    <div>
                      {t('myBookingsPage.rentalDays', { days: booking.rentalDays })}
                    </div>
                    <div className="text-neon font-semibold text-sm">
                      {t('myBookingsPage.totalPay', { amount: booking.totalAmount?.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') })}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setTrackingBookingId(booking.id);
                        setTrackingBooking(booking);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      {t('myBookingsPage.detailSchedule')}
                    </button>
                  </div>
                </div>

                {/* Nút hủy đơn liên kết API */}
                <div className="w-full md:w-auto flex justify-end md:self-center border-t md:border-t-0 pt-4 md:pt-0 border-gray-800/50">
                  {booking.status === 'Pending' ? (
                    <button 
                      onClick={() => openCancelModal(booking.id)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 px-4 py-2.5 rounded-lg transition-all text-sm w-full md:w-auto font-medium cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {t('myBookingsPage.cancelReq')}
                    </button>
                  ) : booking.status === 'Ongoing' ? (
                    <button 
                      onClick={() => openReturnModal(booking)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 bg-neon text-dark hover:bg-[#bbf000] px-4 py-2.5 rounded-xl transition-all text-sm w-full md:w-auto font-bold cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(204,255,0,0.2)]"
                    >
                      {t('myBookingsPage.returnBtn')}
                    </button>
                  ) : booking.status === 'Completed' ? (
                    reviewedBookingIds.includes(booking.id) ? (
                      <span className="text-xs text-neon font-medium bg-neon/10 px-3 py-1.5 rounded-md border border-neon/20">
                        ✓ {t('myBookingsPage.reviewed')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenFeedbackModal(booking.id)}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-neon text-dark hover:bg-[#bbf000] px-4 py-2.5 rounded-lg transition-all text-sm w-full md:w-auto font-bold cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(204,255,0,0.2)]"
                      >
                        <Star size={16} className="fill-dark text-dark" />
                        {t('myBookingsPage.reviewBtn')}
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-500 font-medium bg-black/30 px-3 py-1.5 rounded-md border border-gray-900">
                      {booking.status === 'Cancelled' ? t('myBookingsPage.closed') : t('myBookingsPage.locked')}
                    </span>
                  )}
                </div>

              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
            <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{t('myBookingsPage.noBookings')}</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
              {t('myBookingsPage.noBookingsDesc')}
            </p>
            <Link to="/bikes" className="bg-neon text-dark font-bold px-8 py-3.5 rounded-full hover:bg-[#bbf000] transition-colors inline-block shadow-[0_0_15px_rgba(204,255,0,0.3)]">
              {t('myBookingsPage.findBikeNow')}
            </Link>
          </div>
        )}

      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && selectedBookingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-white uppercase mb-4 flex items-center gap-2">
                <Star size={20} className="fill-neon text-neon shrink-0" />
                Đánh giá chuyến đi
              </h3>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Mức độ hài lòng của bạn</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFeedbackRating(num)}
                        className="hover:scale-110 transition-transform cursor-pointer border-none bg-transparent"
                      >
                        <Star 
                          size={32} 
                          className={num <= feedbackRating ? 'fill-neon text-neon text-glow' : 'text-gray-700'} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-neon font-bold mt-2.5">
                    {feedbackRating === 5 ? 'Rất hài lòng' :
                     feedbackRating === 4 ? 'Hài lòng' :
                     feedbackRating === 3 ? 'Bình thường' :
                     feedbackRating === 2 ? 'Chưa hài lòng' :
                     'Rất tệ'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Ý kiến phản hồi của bạn</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về xe máy, thái độ phục vụ của chủ xe..."
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-neon text-dark hover:bg-[#bbf000] font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Return Confirm Modal */}
      <AnimatePresence>
        {showReturnModal && activeReturnBooking && (() => {
          const details = getReturnDetails(activeReturnBooking);
          if (!details) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReturnModal(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden text-gray-300"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
                
                <button 
                  onClick={() => setShowReturnModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X size={20} />
                </button>

                <h3 className="font-display font-black text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-neon shrink-0" />
                  {t('myBookingsPage.returnModalTitle')}
                </h3>

                <div className="space-y-4">
                  {/* Tên xe */}
                  <div className="flex gap-4 items-center bg-black/30 p-3 rounded-xl border border-white/5">
                    <img 
                      src={activeReturnBooking.vehicleImage} 
                      alt={activeReturnBooking.vehicleModel} 
                      className="w-16 h-10 object-cover rounded-md"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{activeReturnBooking.vehicleModel}</h4>
                      <p className="text-xs text-gray-500">{t('myBookingsPage.bookingCode', { code: activeReturnBooking.bookingCode })}</p>
                    </div>
                  </div>

                  {/* Chi tiết thời gian */}
                  <div className="space-y-2.5 text-xs bg-black/20 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t('myBookingsPage.returnModalTimeInfo')}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('myBookingsPage.returnModalPickup')}</span>
                      <span className="font-semibold text-white font-mono">{details.pickupTime.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('myBookingsPage.returnModalScheduledReturn')}</span>
                      <span className="font-semibold text-white font-mono">{details.returnTime.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="border-t border-white/5 my-2 pt-2 flex justify-between items-center">
                      <span className="text-gray-400">{t('myBookingsPage.returnModalActualReturn')}</span>
                      <span className="font-bold text-neon font-mono">{details.now.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Thông báo chi phí / hoàn trả */}
                  {details.type === 'early' && (
                    <div className="bg-neon/5 border border-neon/30 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="flex items-center gap-2 text-neon text-sm font-bold uppercase tracking-wider font-display neon-text-glow">
                        <CheckCircle size={16} />
                        <span>{t('myBookingsPage.returnModalEarlyReturn')}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-300">
                        {t('myBookingsPage.returnModalEarlyRefundDesc', { 
                          earlyTime: `${details.hours} ${language === 'vi' ? 'giờ' : 'hours'}`, 
                          deposit: details.deposit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US'),
                          hours: details.actualHours,
                          amount: details.amount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') 
                        })}
                      </p>
                      <div className="flex gap-1.5 items-start text-[10px] text-neon/85 leading-normal">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>{t('myBookingsPage.returnModalRefundNote')}</span>
                      </div>
                    </div>
                  )}

                  {details.type === 'late' && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                        <ShieldAlert size={16} />
                        <span>{t('myBookingsPage.returnModalLateReturn')}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-300">
                        {t('myBookingsPage.returnModalLateSurchargeDesc', { 
                          lateTime: `${details.hours} ${language === 'vi' ? 'giờ' : 'hours'}`, 
                          amount: details.amount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') 
                        })}
                      </p>
                    </div>
                  )}

                  {details.type === 'normal' && (
                    <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
                        <CheckCircle size={16} />
                        <span>{t('myBookingsPage.returnModalNormalReturn')}</span>
                      </div>
                      <p className="text-xs text-gray-300">
                        {t('myBookingsPage.returnModalNormalDesc', { 
                          amount: activeReturnBooking.totalAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') 
                        })}
                      </p>
                      <div className="border-t border-white/5 pt-2 mt-2 text-xs space-y-1 text-gray-400">
                        <div className="flex justify-between">
                          <span>{language === 'vi' ? 'Số tiền cọc đã đóng (30%):' : 'Paid deposit (30%):'}</span>
                          <span className="font-semibold text-white">{details.deposit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VNĐ</span>
                        </div>
                        <div className="flex justify-between text-neon font-bold">
                          <span>{language === 'vi' ? 'Thanh toán còn lại (70%):' : 'Remaining payment (70%):'}</span>
                          <span>{(activeReturnBooking.remainingAmount !== undefined ? activeReturnBooking.remainingAmount : (activeReturnBooking.totalAmount - details.deposit)).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VNĐ</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2.5 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-xs font-bold cursor-pointer flex items-center justify-center"
                  >
                    {t('myBookingsPage.returnModalCancelButton')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnBookingSubmit}
                    disabled={loading}
                    className="px-4 py-2.5 bg-neon text-dark hover:bg-[#bbf000] font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    {t('myBookingsPage.returnModalConfirmButton')}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Custom Cancel Confirm Modal */}
      <AnimatePresence>
        {showCancelModal && activeCancelBookingId && (() => {
          const booking = bookings.find(b => b.id === activeCancelBookingId);
          if (!booking) return null;
          
          const now = new Date();
          const pickupTime = new Date(booking.pickupDateTime);
          const hoursRemaining = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          const isNearPickup = hoursRemaining < 6;

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelModal(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden text-gray-300"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X size={20} />
                </button>

                <h3 className="font-display font-black text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <Trash2 size={20} className="text-red-400 shrink-0" />
                  {t('myBookingsPage.cancelModalTitle')}
                </h3>

                <form onSubmit={handleCancelBookingSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                      {t('myBookingsPage.cancelModalReasonLabel')}
                    </label>
                    <textarea 
                      required
                      rows={3}
                      placeholder={t('myBookingsPage.cancelModalPlaceholder')}
                      value={cancelReasonInput}
                      onChange={(e) => setCancelReasonInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent block p-2.5 outline-none transition-all resize-none"
                    />
                  </div>

                  {isNearPickup ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex gap-2 items-start">
                      <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-red-400 leading-normal">
                        {language === 'vi' 
                          ? 'Đơn đặt xe đã sát giờ nhận (dưới 6 tiếng). Bạn không thể thực hiện hủy đơn vào lúc này.' 
                          : 'This booking is too close to pickup time (under 6 hours). Cancellation is not allowed at this moment.'}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex gap-2 items-center">
                      <Info size={16} className="text-gray-400 shrink-0" />
                      <span className="text-[11px] text-gray-400">
                        {t('myBookingsPage.cancelModalWarning')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-5">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      className="px-4 py-2.5 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-xs font-bold cursor-pointer flex items-center justify-center"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || isNearPickup}
                      className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('myBookingsPage.cancelModalConfirmBtn')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Modal Lịch trình Tracking */}
      <BookingTrackingModal
        isOpen={!!trackingBookingId}
        onClose={() => {
          setTrackingBookingId(null);
          setTrackingBooking(null);
        }}
        bookingId={trackingBookingId}
        status={trackingBooking?.status}
        pickupAddress={trackingBooking?.pickupLocation?.address}
        returnAddress={trackingBooking?.returnLocation?.address}
      />
    </div>
  );
};