import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { useReturnMotorbike } from '../hooks/useReturnMotorbike';

interface ReturnMotorbikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  pickupDateTime?: string;
  onSuccess?: () => void;
}

export const ReturnMotorbikeModal: React.FC<ReturnMotorbikeModalProps> = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  pickupDateTime,
  onSuccess 
}) => {
  const [actualReturnTime, setActualReturnTime] = useState('');
  const { executeReturn, isSubmitting, error, success, setError, setSuccess } = useReturnMotorbike();

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      // Set default to current time in local format for datetime-local input
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setActualReturnTime(localDateTime);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, setError, setSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    if (pickupDateTime && new Date(actualReturnTime) < new Date(pickupDateTime)) {
      setError('Thời gian trả xe không thể trước thời gian nhận xe.');
      return;
    }

    try {
      await executeReturn(bookingId, new Date(actualReturnTime).toISOString());
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Thu hồi xe</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thời gian trả xe thực tế
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={actualReturnTime}
                    onChange={(e) => setActualReturnTime(e.target.value)}
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                    required
                  />
                </div>
                {pickupDateTime && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Nhận xe lúc: {new Date(pickupDateTime).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
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
