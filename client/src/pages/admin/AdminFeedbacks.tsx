import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Trash2, Shield, Lock, Unlock, X, 
  AlertCircle, RefreshCw, Search, Filter, Calendar, Check, Info, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { feedbackService, FeedbackItem } from '../../services/feedbackService';

export const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'blocked'

  // Modals state
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isUnblockOpen, setIsUnblockOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reason form state
  const [blockReason, setBlockReason] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Common quick violation reasons
  const QUICK_REASONS = [
    'Sử dụng ngôn từ thô tục, xúc phạm người khác',
    'Nội dung spam, quảng cáo không liên quan',
    'Tiết lộ thông tin cá nhân sai sự thật',
    'Nội dung mang tính chất kích động, xúc phạm tôn giáo, chính trị'
  ];

  // Load feedbacks list
  const fetchFeedbacks = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const filters = {
        status: statusFilter,
        search: search
      };
      const data = await feedbackService.getAllFeedbacksForAdmin(filters);
      setFeedbacks(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách đánh giá từ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when search/filters change
  useEffect(() => {
    fetchFeedbacks();
  }, [search, statusFilter]);

  // Display Toast messages
  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Open Block Confirmation Modal
  const handleOpenBlock = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    // Auto-fill reason if bad words detected
    if (feedback.isSuspected && feedback.detectedBadWords && feedback.detectedBadWords.length > 0) {
      setBlockReason(`Vi phạm ngôn từ (Phát hiện từ nhạy cảm: ${feedback.detectedBadWords.join(', ')})`);
    } else {
      setBlockReason('');
    }
    setIsBlockOpen(true);
  };

  // Block Feedback Action
  const handleBlockFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    if (!blockReason.trim()) {
      showToast('Vui lòng nhập lý do ẩn đánh giá này', true);
      return;
    }

    setFormSaving(true);
    try {
      await feedbackService.blockFeedback(selectedFeedback._id, blockReason);
      setIsBlockOpen(false);
      showToast('Đã gỡ bỏ đánh giá và cộng điểm cảnh cáo cho người dùng thành công.');
      fetchFeedbacks();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi ẩn đánh giá.', true);
    } finally {
      setFormSaving(false);
    }
  };

  // Open Unblock Confirmation Modal
  const handleOpenUnblock = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setIsUnblockOpen(true);
  };

  // Unblock Feedback Action
  const handleUnblockFeedback = async () => {
    if (!selectedFeedback) return;
    setFormSaving(true);
    try {
      await feedbackService.unblockFeedback(selectedFeedback._id);
      setIsUnblockOpen(false);
      showToast('Đã khôi phục đánh giá và trừ điểm cảnh cáo thành công.');
      fetchFeedbacks();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi khôi phục đánh giá.', true);
      setIsUnblockOpen(false);
    } finally {
      setFormSaving(false);
    }
  };

  // Open Feedback Detail Modal
  const handleOpenDetail = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };

  // Render Star Rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          className={i <= rating ? 'fill-neon text-neon' : 'text-gray-700'} 
        />
      );
    }
    return <div className="flex gap-1 items-center">{stars}</div>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-tight mb-2 flex items-center gap-3">
              <MessageSquare size={36} />
              Kiểm duyệt đánh giá
            </h1>
            <p className="text-gray-400 text-sm">
              Xem danh sách phản hồi, phát hiện các nội dung vi phạm ngôn từ và xử lý kỷ luật cảnh cáo/khóa thành viên
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface/60 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 shadow-lg flex flex-col md:flex-row gap-4">
          {/* Search field */}
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung đánh giá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all"
            />
          </div>

          {/* Status dropdown filter */}
          <div className="relative min-w-[200px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Filter size={14} />
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/5 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="blocked">Đã bị ẩn/chặn</option>
            </select>
          </div>
        </div>

        {/* Success / Error toast banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-500 text-dark font-black text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg max-w-md mx-auto mb-6 border border-green-400/20"
            >
              <Check size={16} />
              {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg max-w-md mx-auto mb-6 border border-red-400/20"
            >
              <AlertCircle size={16} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback List Container */}
        <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-neon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">Đang tải danh sách...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 text-gray-600" />
              <p className="font-semibold text-sm">Không tìm thấy đánh giá nào phù hợp</p>
              <p className="text-xs text-gray-500 mt-1">Vui lòng điều chỉnh lại từ khóa hoặc bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-gray-500 bg-black/20">
                    <th className="py-4 px-6">Thành viên / Cảnh cáo</th>
                    <th className="py-4 px-6">Dòng Xe</th>
                    <th className="py-4 px-6">Đánh giá</th>
                    <th className="py-4 px-6">Nội dung phản hồi</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {feedbacks.map(fb => (
                    <tr key={fb._id} className={`hover:bg-white/[0.01] transition-colors duration-150 ${
                      fb.isBlocked ? 'opacity-50' : fb.isSuspected ? 'bg-red-500/5 hover:bg-red-500/10' : ''
                    }`}>
                      
                      {/* User Info / Strikes */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                            {fb.userId?.avatarUrl ? (
                              <img src={fb.userId.avatarUrl} alt={fb.userId.username} className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {fb.userId ? `${fb.userId.lastName} ${fb.userId.firstName}` : 'Ẩn danh'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>@{fb.userId?.username || 'unknown'}</span>
                              {fb.userId && (fb.userId.strikes || 0) > 0 && (
                                <span className={`px-1.5 py-0.2 text-[9px] font-semibold rounded ${
                                  fb.userId.strikes >= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                }`}>
                                  ⚠️ Cảnh cáo: {fb.userId.strikes}/3
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Info */}
                      <td className="py-4 px-6 text-xs whitespace-nowrap">
                        <div className="font-bold text-gray-200">{fb.vehicleId?.vehicleModel || 'Xe mẫu'}</div>
                        <div className="text-gray-500 mt-0.5 font-mono">{fb.vehicleId?.licensePlate || 'N/A'}</div>
                      </td>

                      {/* Stars Rating */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {renderStars(fb.rating)}
                      </td>

                      {/* Content (With highlighting for violation) */}
                      <td className="py-4 px-6 max-w-sm">
                        <div className="text-gray-300 break-words leading-relaxed">
                          {fb.content}
                        </div>
                        {/* Sensitive words indicator */}
                        {!fb.isBlocked && fb.isSuspected && fb.detectedBadWords && fb.detectedBadWords.length > 0 && (
                          <div className="mt-1.5 text-[10px] bg-red-500/15 border border-red-500/30 text-red-400 font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 w-fit uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                            Nghi ngờ vi phạm: {fb.detectedBadWords.join(', ')}
                          </div>
                        )}
                        {/* Blocked reason display */}
                        {fb.isBlocked && (
                          <div className="mt-1 text-xs text-red-400 font-medium">
                            Lý do gỡ: {fb.blockReason}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {fb.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 whitespace-nowrap">
                            Bị ẩn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20 whitespace-nowrap">
                            Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(fb)}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Info size={14} />
                          </button>
                          
                          {fb.isBlocked ? (
                            <button
                              onClick={() => handleOpenUnblock(fb)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-green-500 hover:bg-white/10 transition-all cursor-pointer"
                              title="Khôi phục đánh giá"
                            >
                              <Unlock size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenBlock(fb)}
                              className={`p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-500 hover:bg-white/10 transition-all cursor-pointer ${
                                fb.isSuspected ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10' : ''
                              }`}
                              title="Ẩn đánh giá (Vi phạm ngôn từ)"
                            >
                              <Lock size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 1. BLOCK CONFIRMATION MODAL                                    */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isBlockOpen && selectedFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlockOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-red-500/20 rounded-2xl p-6 shadow-2xl relative w-full max-w-lg z-10 overflow-hidden"
            >
              {/* Red top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
              
              <button 
                onClick={() => setIsBlockOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-red-500 uppercase mb-4 flex items-center gap-2">
                🔒 Ẩn đánh giá vi phạm
              </h3>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 mb-5 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-bold mb-1">Cảnh báo kỷ luật thành viên</p>
                  <p>
                    Hành động này sẽ ẩn phản hồi khỏi trang xe của khách hàng. Đồng thời cộng <strong>+1 điểm cảnh cáo (strike)</strong> cho tài khoản viết phản hồi. Nếu tài khoản đạt đủ 3 cảnh cáo, hệ thống sẽ <strong>tự động khóa tài khoản</strong> của thành viên đó.
                  </p>
                </div>
              </div>

              <div className="bg-black/35 p-3 rounded-lg border border-white/5 mb-5 space-y-1.5">
                <p className="text-xs text-gray-500">NỘI DUNG PHẢN HỒI:</p>
                <p className="text-sm text-gray-200 leading-relaxed">"{selectedFeedback.content}"</p>
                <p className="text-xs text-neon font-medium">Người viết: @{selectedFeedback.userId?.username}</p>
              </div>

              <form onSubmit={handleBlockFeedback} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Nhập lý do vi phạm *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Sử dụng ngôn từ thô tục xúc phạm chủ xe..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                  />
                </div>

                {/* Quick reasons */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Chọn nhanh lý do mẫu:</label>
                  <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {QUICK_REASONS.map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBlockReason(r)}
                        className="text-left text-xs bg-white/5 hover:bg-white/10 text-gray-300 p-2 rounded border border-white/5 transition-all cursor-pointer truncate"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBlockOpen(false)}
                    disabled={formSaving}
                    className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer disabled:opacity-50"
                  >
                    {formSaving ? 'Đang ẩn...' : 'Xác nhận gỡ & Cảnh cáo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 2. UNBLOCK CONFIRMATION MODAL                                  */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isUnblockOpen && selectedFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnblockOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-green-500/20 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Green top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              
              <button 
                onClick={() => setIsUnblockOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-green-500 uppercase mb-4 flex items-center gap-2">
                🔓 Khôi phục đánh giá
              </h3>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                Bạn có chắc chắn muốn khôi phục hiển thị đánh giá này của khách hàng <strong>@{selectedFeedback.userId?.username}</strong>?
              </p>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-xs text-green-400 mb-5 flex items-start gap-2.5">
                <Check size={16} className="shrink-0 mt-0.5 text-green-500" />
                <p>
                  Hệ thống sẽ <strong>-1 điểm cảnh cáo (strike)</strong> của thành viên này. Nếu trước đó tài khoản của họ bị khóa do đủ 3 cảnh cáo, tài khoản sẽ tự động được <strong>kích hoạt hoạt động lại</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsUnblockOpen(false)}
                  disabled={formSaving}
                  className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUnblockFeedback}
                  disabled={formSaving}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {formSaving ? 'Đang xử lý...' : 'Xác nhận khôi phục'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 3. FEEDBACK DETAIL MODAL                                       */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isDetailOpen && selectedFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-lg z-10 overflow-hidden"
            >
              {/* Neon top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-white uppercase mb-6 flex items-center gap-2">
                📝 Chi tiết đánh giá
              </h3>

              <div className="space-y-4 text-sm text-gray-300">
                {/* User section */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                    {selectedFeedback.userId?.avatarUrl ? (
                      <img src={selectedFeedback.userId.avatarUrl} alt={selectedFeedback.userId.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      {selectedFeedback.userId ? `${selectedFeedback.userId.lastName} ${selectedFeedback.userId.firstName}` : 'Ẩn danh'}
                    </h4>
                    <p className="text-xs text-gray-500 font-mono">@{selectedFeedback.userId?.username}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Email: <span className="font-mono">{selectedFeedback.userId?.email || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 block">DÒNG XE:</span>
                    <span className="font-bold text-white">{selectedFeedback.vehicleId?.vehicleModel || 'N/A'}</span>
                    <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{selectedFeedback.vehicleId?.licensePlate}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-gray-500 block">ĐIỂM ĐÁNH GIÁ:</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-bold text-white text-lg">{selectedFeedback.rating}/5</span>
                      {renderStars(selectedFeedback.rating)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">NỘI DUNG:</span>
                  <div className="bg-black/35 p-3.5 rounded-lg border border-white/5 text-gray-200 leading-relaxed font-sans">
                    "{selectedFeedback.content}"
                  </div>
                </div>

                {/* Dates & Moderation */}
                <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Thời gian viết:</span>
                    <span className="text-gray-300">{formatDate(selectedFeedback.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mã đơn thuê (Booking ID):</span>
                    <span className="font-mono text-gray-300">{selectedFeedback.bookingId}</span>
                  </div>
                  
                  {selectedFeedback.isBlocked && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg space-y-1.5">
                      <div className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Lock size={12} /> Thông tin kiểm duyệt ẩn
                      </div>
                      <p>Lý do vi phạm: <strong className="text-white">{selectedFeedback.blockReason}</strong></p>
                      <p className="text-[11px] text-red-400/80">Ẩn ngày: {formatDate(selectedFeedback.blockedAt || '')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
