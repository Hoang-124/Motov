import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ClipboardList, Trash2, RefreshCw, Star, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bookingService, Booking } from '../services/bookingService'; // Import Service
import { useLanguage } from '../hooks/useLanguage';
import { feedbackService } from '../services/feedbackService';
import { BookingTrackingModal } from '../components/BookingTrackingModal';

export const Bookings = () => {
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [reviewedBookingIds, setReviewedBookingIds] = useState<string[]>([]);

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
      window.alert(language === 'vi' ? 'Gửi đánh giá thành công! Cảm ơn phản hồi của bạn.' : 'Feedback submitted successfully! Thank you for your feedback.');
      setReviewedBookingIds(prev => [...prev, selectedBookingId]);
      setShowFeedbackModal(false);
    } catch (err: any) {
      window.alert(err.response?.data?.message || (language === 'vi' ? 'Không thể gửi đánh giá vào lúc này!' : 'Failed to submit feedback at this moment!'));
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

  // Hàm gọi API hủy đơn
  const handleCancelBooking = async (id: string) => {
    const reason = window.prompt(language === 'vi' ? 'Vui lòng nhập lý do hủy đơn thuê xe:' : 'Please enter the cancellation reason:');
    if (reason === null) return; // Nhấn hủy prompt

    if (!reason.trim()) {
      window.alert(language === 'vi' ? 'Bạn phải nhập lý do hủy đơn!' : 'You must enter the cancellation reason!');
      return;
    }

    try {
      setLoading(true);
      await bookingService.cancelBooking(id, reason);
      window.alert(language === 'vi' ? 'Hủy đơn đặt xe thành công!' : 'Booking cancelled successfully!');
      // Tải lại danh sách mới cập nhật trạng thái từ Server
      await loadMyBookings();
    } catch (err: any) {
      window.alert(err.response?.data?.message || (language === 'vi' ? 'Không thể hủy đơn vào lúc này!' : 'Failed to cancel booking at this moment!'));
      setLoading(false);
    }
  };

  // Hàm gọi API trả xe máy
  const handleReturnBooking = async (id: string) => {
    const confirm = window.confirm(t('myBookingsPage.returnConfirm'));
    if (!confirm) return;

    try {
      setLoading(true);
      await bookingService.returnMotorbike(id, new Date().toISOString());
      window.alert(t('myBookingsPage.returnSuccess'));
      // Tải lại danh sách mới từ Server
      await loadMyBookings();
    } catch (err: any) {
      window.alert(err.response?.data?.message || (language === 'vi' ? 'Không thể trả xe vào lúc này!' : 'Failed to return motorbike at this moment!'));
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
                      booking.status === 'Confirmed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                      booking.status === 'Ongoing' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                      booking.status === 'Completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
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
                      onClick={() => setTrackingBookingId(booking.id)}
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
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 px-4 py-2.5 rounded-lg transition-all text-sm w-full md:w-auto font-medium cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {t('myBookingsPage.cancelReq')}
                    </button>
                  ) : booking.status === 'Ongoing' ? (
                    <button 
                      onClick={() => handleReturnBooking(booking.id)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-all text-sm w-full md:w-auto font-bold cursor-pointer disabled:opacity-50"
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

      {/* Modal Lịch trình Tracking */}
      <BookingTrackingModal
        isOpen={!!trackingBookingId}
        onClose={() => setTrackingBookingId(null)}
        bookingId={trackingBookingId}
      />
    </div>
  );
};