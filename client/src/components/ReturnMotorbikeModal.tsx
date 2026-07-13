import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Camera, Upload } from 'lucide-react';
import { useReturnMotorbike } from '../hooks/useReturnMotorbike';

interface ReturnMotorbikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  pickupDateTime?: string;
  startOdometer?: number;
  onSuccess?: () => void;
}

export const ReturnMotorbikeModal: React.FC<ReturnMotorbikeModalProps> = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  pickupDateTime,
  startOdometer = 0,
  onSuccess 
}) => {
  const [actualReturnTime, setActualReturnTime] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  // Inline field errors
  const [odometerError, setOdometerError] = useState<string | null>(null);
  const [returnTimeError, setReturnTimeError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    helmetsReturned: false,
    mirrorsIntact: false,
    noNewScratches: false
  });
  const [photos, setPhotos] = useState<{ [key: string]: string }>({
    front: '',
    back: '',
    left: '',
    right: ''
  });

  const { executeReturn, isSubmitting, error, success, setError, setSuccess } = useReturnMotorbike();

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      // Set default to current time in local format for datetime-local input
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setActualReturnTime(localDateTime);
      setReturnReason('');
      setEndOdometer(startOdometer ? startOdometer.toString() : '');
      setOdometerError(null);
      setReturnTimeError(null);
      setChecklist({
        helmetsReturned: false,
        mirrorsIntact: false,
        noNewScratches: false
      });
      setPhotos({
        front: '',
        back: '',
        left: '',
        right: ''
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, setError, setSuccess, startOdometer]);

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

    // Lỗi 76: Validate thời gian trả xe không được trước thời gian nhận xe
    if (pickupDateTime && new Date(actualReturnTime) < new Date(pickupDateTime)) {
      const msg = 'Thời gian trả xe không thể trước thời gian nhận xe.';
      setReturnTimeError(msg);
      setError(msg);
      return;
    }
    setReturnTimeError(null);

    if (!endOdometer.trim()) {
      setError('Vui lòng nhập số Odometer hiện tại của xe máy.');
      return;
    }

    const endOdoVal = Number(endOdometer);
    if (isNaN(endOdoVal) || endOdoVal < 0) {
      const msg = 'Số Odometer không hợp lệ (phải là số không âm).';
      setOdometerError(msg);
      setError(msg);
      return;
    }

    // Lỗi 75: Validate Odometer trả xe không được nhỏ hơn lúc nhận xe
    if (endOdoVal < startOdometer) {
      const msg = `Số Odometer hiện tại (${endOdoVal} km) không được nhỏ hơn Số Odometer lúc nhận xe (${startOdometer} km).`;
      setOdometerError(msg);
      setError(msg);
      return;
    }
    setOdometerError(null);

    if (!checklist.helmetsReturned || !checklist.mirrorsIntact || !checklist.noNewScratches) {
      setError('Vui lòng kiểm tra và xác nhận đầy đủ hiện trạng thiết bị thu hồi.');
      return;
    }

    if (!photos.front || !photos.back || !photos.left || !photos.right) {
      setError('Vui lòng chụp đầy đủ 4 hướng góc ảnh của xe lúc thu hồi.');
      return;
    }

    if (!returnReason.trim()) {
      setError('Vui lòng nhập lý do thu hồi xe.');
      return;
    }

    try {
      // Save return inspection data locally
      const returnData = {
        bookingId,
        endOdometer: endOdoVal,
        checklist,
        photos,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`return_${bookingId}`, JSON.stringify(returnData));

      await executeReturn(bookingId, new Date(actualReturnTime).toISOString(), endOdoVal, returnReason.trim());
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden text-gray-300 flex flex-col max-h-[90vh]"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
            
            <div className="flex justify-between items-center p-4 border-b border-gray-800 shrink-0">
              <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">Thu hồi xe</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-white bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-neon/5 border border-neon/30 text-neon rounded-lg text-xs font-semibold text-center relative overflow-hidden neon-text-glow">
                  {success}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Thời gian trả xe thực tế
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-neon" />
                  </div>
                  <input
                    type="datetime-local"
                    value={actualReturnTime}
                    onChange={(e) => {
                      setActualReturnTime(e.target.value);
                      // Lỗi 76: Real-time validate khi người dùng thay đổi thời gian
                      if (pickupDateTime && new Date(e.target.value) < new Date(pickupDateTime)) {
                        setReturnTimeError('Thời gian trả xe không thể trước thời gian nhận xe.');
                      } else {
                        setReturnTimeError(null);
                      }
                    }}
                    className={`pl-10 w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all cursor-pointer ${
                      returnTimeError ? 'border-red-500' : 'border-gray-800'
                    }`}
                    required
                  />
                </div>
                {pickupDateTime && (
                  <p className="mt-1 text-[10px] text-gray-500">
                    Nhận xe lúc: {new Date(pickupDateTime).toLocaleString('vi-VN')}
                  </p>
                )}
                {/* Inline error lỗi 76 */}
                {returnTimeError && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1">
                    <span>⚠️</span> {returnTimeError}
                  </p>
                )}
              </div>

              {/* Nhập số Odometer khi trả xe */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Số Odometer hiện tại (km) *
                </label>
                <input
                  type="number"
                  value={endOdometer}
                  onChange={(e) => {
                    setEndOdometer(e.target.value);
                    // Lỗi 75: Real-time validate Odometer khi người dùng nhập
                    const val = Number(e.target.value);
                    if (e.target.value !== '' && !isNaN(val) && val < startOdometer) {
                      setOdometerError(`Số Odometer hiện tại không được nhỏ hơn Số Odometer lúc nhận xe (${startOdometer} km).`);
                    } else {
                      setOdometerError(null);
                    }
                  }}
                  min={startOdometer}
                  placeholder={`Nhập số km hiện tại (>= ${startOdometer} km)`}
                  className={`w-full bg-black/50 border text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono ${
                    odometerError ? 'border-red-500' : 'border-gray-800'
                  }`}
                  required
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Odometer lúc nhận: {startOdometer} km
                </p>
                {/* Inline error lỗi 75 */}
                {odometerError && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1">
                    <span>⚠️</span> {odometerError}
                  </p>
                )}
              </div>

              {/* Checklist thu hồi */}
              <div className="space-y-2 border-t border-gray-800 pt-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Kiểm tra khi thu hồi xe *
                </label>
                <div className="bg-black/40 border border-gray-800 rounded-xl p-3 space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.helmetsReturned}
                      onChange={(e) => setChecklist(prev => ({ ...prev, helmetsReturned: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>Khách trả đủ 02 Mũ bảo hiểm đã giao</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.mirrorsIntact}
                      onChange={(e) => setChecklist(prev => ({ ...prev, mirrorsIntact: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>02 Gương chiếu hậu nguyên vẹn, không vỡ</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.noNewScratches}
                      onChange={(e) => setChecklist(prev => ({ ...prev, noNewScratches: e.target.checked }))}
                      className="accent-neon w-4 h-4 rounded"
                    />
                    <span>Xác nhận không phát sinh thêm vết móp/xước mới</span>
                  </label>
                </div>
              </div>

              {/* Ảnh chụp thu hồi */}
              <div className="space-y-2 border-t border-gray-800 pt-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Camera size={12} className="text-neon" />
                  Ảnh chụp hiện trạng lúc thu hồi xe *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'front', label: 'Trước' },
                    { key: 'back', label: 'Sau' },
                    { key: 'left', label: 'Trái' },
                    { key: 'right', label: 'Phải' }
                  ].map((dir) => (
                    <div key={dir.key} className="flex flex-col gap-1 text-center">
                      <span className="text-[8px] text-gray-400 font-bold uppercase">{dir.label}</span>
                      <div className="aspect-[4/3] w-full bg-black/60 border border-dashed border-gray-800 rounded-lg overflow-hidden relative flex flex-col items-center justify-center cursor-pointer hover:border-neon/40 transition-colors group">
                        {photos[dir.key] ? (
                          <>
                            <img src={photos[dir.key]} alt={dir.label} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotos(prev => ({ ...prev, [dir.key]: '' }));
                              }}
                              className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-500 text-white rounded-full p-0.5 border-none cursor-pointer"
                            >
                              <X size={8} />
                            </button>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            <Upload size={14} className="text-gray-600 group-hover:text-neon" />
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

              <div className="space-y-1.5 border-t border-gray-800 pt-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Lý do thu hồi xe
                </label>
                <textarea
                  rows={2}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Nhập lý do thu hồi xe (ví dụ: Trả xe đúng hẹn, Trả xe sớm, Hỏng hóc cần sửa chữa...)"
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-800 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-neon text-dark hover:bg-[#bbf000] font-bold rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thu hồi'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
