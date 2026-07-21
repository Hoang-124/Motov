import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckSquare, Upload, ClipboardCheck, AlertCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';

interface HandoverChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  vehicleModel: string;
  initialOdometer?: number;
  onSuccess?: () => void;
}

export const HandoverChecklistModal: React.FC<HandoverChecklistModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  vehicleModel,
  initialOdometer = 0,
  onSuccess
}) => {
  const [startOdometer, setStartOdometer] = useState(initialOdometer ? String(initialOdometer) : '');
  const [checklist, setChecklist] = useState({
    documents: false,
    helmets: false,
    mirrors: false,
    fuel: false,
    brakes: false
  });
  const [photos, setPhotos] = useState<{ [key: string]: string }>({
    front: '',
    back: '',
    left: '',
    right: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartOdometer(initialOdometer !== undefined && initialOdometer !== null ? String(initialOdometer) : '');
      setChecklist({
        documents: false,
        helmets: false,
        mirrors: false,
        fuel: false,
        brakes: false
      });
      setPhotos({
        front: '',
        back: '',
        left: '',
        right: ''
      });
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialOdometer]);

  const handlePhotoUpload = (direction: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({
          ...prev,
          [direction]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    // Validation
    if (!startOdometer.trim() || Number(startOdometer) <= 0) {
      setError('Vui lòng nhập số Odometer hợp lệ lúc bàn giao.');
      return;
    }

    if (!checklist.documents || !checklist.helmets || !checklist.mirrors || !checklist.fuel || !checklist.brakes) {
      setError('Vui lòng kiểm tra và tích chọn xác nhận đủ tất cả các trang thiết bị.');
      return;
    }

    if (!photos.front || !photos.back || !photos.left || !photos.right) {
      setError('Vui lòng chụp đầy đủ 4 hướng góc ảnh của xe để làm bằng chứng bàn giao.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate saving checklist/photos (we store it locally in localStorage to simulate DB persistence)
      const checklistData = {
        bookingId,
        startOdometer: Number(startOdometer),
        checklist,
        photos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`handover_${bookingId}`, JSON.stringify(checklistData));

      // Call API to update booking status to Ongoing
      await bookingService.updateStatus(bookingId, 'Ongoing');

      setSuccessMsg('Biên bản bàn giao xe đã được phê duyệt! Trạng thái đơn đổi sang Đang thuê.');
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gặp lỗi trong quá trình phê duyệt bàn giao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden text-gray-300 my-8 flex flex-col max-h-[90vh]"
          >
            {/* Top glowing bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-black/20 shrink-0">
              <h2 className="text-base font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-neon" />
                Biên bản bàn giao xe: <span className="text-neon">{vehicleModel}</span>
              </h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-white bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-grow">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-neon/10 border border-neon/30 text-neon rounded-xl text-xs font-semibold text-center relative overflow-hidden neon-text-glow">
                  {successMsg}
                </div>
              )}

              {/* 1. Số Odometer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Thông tin số Odometer hiện tại</h4>
                  {initialOdometer !== undefined && initialOdometer !== null && (
                    <span className="text-[11px] font-mono text-neon font-bold bg-neon/10 border border-neon/30 px-2.5 py-1 rounded-lg">
                      Odo hệ thống: {Number(initialOdometer).toLocaleString('vi-VN')} km
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Số Km lúc giao xe *</label>
                    <input
                      type="number"
                      value={startOdometer}
                      onChange={(e) => setStartOdometer(e.target.value)}
                      placeholder={initialOdometer ? `Nhập số Odo (Gợi ý: ${initialOdometer} km)` : "Nhập số Odo thực tế trên đồng hồ"}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all font-mono"
                      required
                    />
                    {initialOdometer !== undefined && initialOdometer !== null && Number(initialOdometer) > 0 && startOdometer !== String(initialOdometer) && (
                      <button
                        type="button"
                        onClick={() => setStartOdometer(String(initialOdometer))}
                        className="text-[10px] text-neon hover:underline mt-1 cursor-pointer font-medium block"
                      >
                        ⚡ Lấy Odo từ dữ liệu ({Number(initialOdometer).toLocaleString('vi-VN')} km)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Checklist linh kiện */}
              <div className="space-y-2 border-t border-gray-800/60 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Kiểm tra bàn giao thiết bị</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-4 rounded-2xl border border-gray-900">
                  <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.documents}
                      onChange={(e) => setChecklist(prev => ({ ...prev, documents: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>Giấy tờ đăng ký xe (Bản gốc / Sao y)</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.helmets}
                      onChange={(e) => setChecklist(prev => ({ ...prev, helmets: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>Cung cấp đủ 02 Mũ bảo hiểm đạt chuẩn</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.mirrors}
                      onChange={(e) => setChecklist(prev => ({ ...prev, mirrors: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>02 Gương chiếu hậu nguyên vẹn</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.fuel}
                      onChange={(e) => setChecklist(prev => ({ ...prev, fuel: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>Xăng đầy bình lúc bàn giao</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-gray-300 cursor-pointer select-none md:col-span-2">
                    <input
                      type="checkbox"
                      checked={checklist.brakes}
                      onChange={(e) => setChecklist(prev => ({ ...prev, brakes: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>Phanh trước/sau & Động cơ hoạt động ổn định</span>
                  </label>
                </div>
              </div>

              {/* 3. Chụp ảnh hiện trạng xe */}
              <div className="space-y-3 border-t border-gray-800/60 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Camera size={14} className="text-neon" />
                  3. Chụp ảnh hiện trạng xe (Bắt buộc 4 góc)
                </h4>
                <p className="text-[10px] text-gray-500">Chụp cận cảnh mặt trước, sau và hai bên sườn để bảo vệ quyền lợi khi hoàn trả.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'front', label: 'Mặt trước (Front)' },
                    { key: 'back', label: 'Mặt sau (Back)' },
                    { key: 'left', label: 'Sườn trái (Left)' },
                    { key: 'right', label: 'Sườn phải (Right)' }
                  ].map((dir) => (
                    <div key={dir.key} className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase text-center">{dir.label}</span>
                      <div className="aspect-[4/3] w-full bg-black/60 border border-dashed border-gray-800 rounded-xl overflow-hidden relative flex flex-col items-center justify-center cursor-pointer hover:border-neon/40 transition-colors group">
                        {photos[dir.key] ? (
                          <>
                            <img src={photos[dir.key]} alt={dir.label} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotos(prev => ({ ...prev, [dir.key]: '' }));
                              }}
                              className="absolute top-1 right-1 bg-black/80 hover:bg-red-500 text-white rounded-full p-1 border-none cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            <Upload size={18} className="text-gray-600 group-hover:text-neon transition-colors" />
                            <span className="text-[9px] text-gray-500 mt-1 font-semibold group-hover:text-neon transition-colors">Tải ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(dir.key, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 flex justify-end gap-3 border-t border-gray-800 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-neon text-dark hover:bg-[#bbf000] font-bold rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang duyệt bàn giao...' : 'Xác nhận Bàn Giao Xe'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
