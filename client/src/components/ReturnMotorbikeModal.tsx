import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
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
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, setError, setSuccess, startOdometer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    if (pickupDateTime && new Date(actualReturnTime) < new Date(pickupDateTime)) {
      setError('Thời gian trả xe không thể trước thời gian nhận xe.');
      return;
    }

    if (!endOdometer.trim()) {
      setError('Vui lòng nhập số Odometer hiện tại của xe máy.');
      return;
    }

    const endOdoVal = Number(endOdometer);
    if (isNaN(endOdoVal) || endOdoVal < 0) {
      setError('Số Odometer không hợp lệ (phải là số không âm).');
      return;
    }

    if (endOdoVal < startOdometer) {
      setError(`Số Odometer trả xe (${endOdoVal} km) không được nhỏ hơn lúc nhận (${startOdometer} km).`);
      return;
    }

    if (!returnReason.trim()) {
      setError('Vui lòng nhập lý do thu hồi xe.');
      return;
    }

    try {
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
            className="w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden text-gray-300"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
            
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">Thu hồi xe</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-white bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-xs">
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
                    onChange={(e) => setActualReturnTime(e.target.value)}
                    className="pl-10 w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all cursor-pointer"
                    required
                  />
                </div>
                {pickupDateTime && (
                  <p className="mt-1 text-[10px] text-gray-500">
                    Nhận xe lúc: {new Date(pickupDateTime).toLocaleString('vi-VN')}
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
                  onChange={(e) => setEndOdometer(e.target.value)}
                  min={startOdometer}
                  placeholder={`Nhập số km hiện tại (>= ${startOdometer} km)`}
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                  required
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Odometer lúc nhận: {startOdometer} km
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Lý do thu hồi xe
                </label>
                <textarea
                  rows={3}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Nhập lý do thu hồi xe (ví dụ: Trả xe đúng hẹn, Trả xe sớm, Hỏng hóc cần sửa chữa...)"
                  className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-800 pt-4">
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
