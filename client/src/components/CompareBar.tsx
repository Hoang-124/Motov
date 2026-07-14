import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCompare } from '../contexts/CompareContext';
import { X, SlidersHorizontal, Trash2 } from 'lucide-react';

export const CompareBar = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  const getImageUrl = (bike: any) =>
    bike.imageUrls && bike.imageUrls.length > 0
      ? bike.imageUrls[0]
      : 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=200';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 pb-3 sm:pb-4"
      >
        <div className="max-w-4xl mx-auto bg-[#141414] border border-white/10 rounded-xl sm:rounded-2xl shadow-[0_-4px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 border-b border-white/5 bg-white/2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-neon" />
              <span className="text-white text-xs sm:text-sm font-semibold">
                So sánh xe ({compareList.length}/3)
              </span>
            </div>
            <button
              onClick={clearCompare}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Xóa tất cả</span>
            </button>
          </div>

          {/* Bikes row — mobile: scrollable + no empty slots + compact */}
          <div className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 overflow-x-auto">
            {/* Selected bikes */}
            {compareList.map((bike) => (
              <motion.div
                key={bike._id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 flex-shrink-0 group"
              >
                <img
                  src={getImageUrl(bike)}
                  alt={bike.vehicleModel}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium max-w-[70px] sm:max-w-[100px] truncate">{bike.vehicleModel}</span>
                  <span className="text-neon text-xs">{bike.rentalPrice?.toLocaleString()}đ</span>
                </div>
                <button
                  onClick={() => removeFromCompare(bike._id!)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={8} className="text-white" />
                </button>
              </motion.div>
            ))}

            {/* Empty slots — hidden on mobile */}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="hidden sm:flex items-center justify-center w-[140px] h-[60px] border-2 border-dashed border-white/10 rounded-xl text-gray-600 text-xs flex-shrink-0"
              >
                + Thêm xe
              </div>
            ))}

            {/* Compare button — always visible, right side */}
            <div className="ml-auto flex-shrink-0 pl-1">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const ids = compareList.map(b => b._id).join(',');
                  navigate(`/compare?ids=${ids}`);
                }}
                disabled={compareList.length < 2}
                className="bg-neon text-dark font-bold px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-[#bbf000] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                So sánh →
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
