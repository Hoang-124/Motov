import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, MapPin, X, AlertCircle } from 'lucide-react';
import { useBookingTracking } from '../hooks/useBookingTracking';
import { InteractiveMap } from './InteractiveMap';

interface BookingTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  status?: 'Pending' | 'Confirmed' | 'Ongoing' | 'Returning' | 'Completed' | 'Cancelled';
  pickupAddress?: string;
  returnAddress?: string;
}

export const BookingTrackingModal: React.FC<BookingTrackingModalProps> = ({ isOpen, onClose, bookingId, status, pickupAddress, returnAddress }) => {
  const { timeline, loading, error } = useBookingTracking(isOpen ? bookingId : null);

  const getIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'ongoing': return <MapPin className="w-5 h-5 text-indigo-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Lịch trình chuyến đi</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {status && (
                <div className="mb-4">
                  <InteractiveMap status={status} pickupAddress={pickupAddress} returnAddress={returnAddress} />
                </div>
              )}

              {loading && <p className="text-center text-gray-500">Đang tải...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              
              {!loading && !error && timeline.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">Không có dữ liệu lịch trình.</p>
              )}

              {!loading && !error && timeline.length > 0 && (
                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                  {timeline.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-6"
                    >
                      <div className="absolute -left-[11px] top-1 bg-white dark:bg-gray-800 rounded-full">
                        {getIcon(event.status)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {event.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.timestamp).toLocaleString('vi-VN')}
                        </span>
                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {event.description}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" /> {event.location}
                          </p>
                        )}
                        {event.actor && (
                          <p className="text-xs text-gray-500 mt-1">
                            Bởi: {event.actor}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
