import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ShieldCheck, CheckCircle2, Maximize2, Calendar, Gauge } from 'lucide-react';

interface InspectionPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  bookingCode?: string;
  vehicleModel?: string;
}

export const InspectionPhotosModal: React.FC<InspectionPhotosModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingCode = '',
  vehicleModel = 'Xe máy'
}) => {
  const [activeTab, setActiveTab] = useState<'return' | 'handover'>('return');
  const [returnRecord, setReturnRecord] = useState<any>(null);
  const [handoverRecord, setHandoverRecord] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      // Đọc biên bản trả xe
      const rDataStr = localStorage.getItem(`return_${bookingId}`);
      if (rDataStr) {
        try {
          setReturnRecord(JSON.parse(rDataStr));
        } catch (e) {
          console.error(e);
        }
      } else {
        setReturnRecord(null);
      }

      // Đọc biên bản giao xe
      const hDataStr = localStorage.getItem(`handover_${bookingId}`);
      if (hDataStr) {
        try {
          setHandoverRecord(JSON.parse(hDataStr));
        } catch (e) {
          console.error(e);
        }
      } else {
        setHandoverRecord(null);
      }

      setActiveTab('return');
      setZoomedImage(null);
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const currentRecord = activeTab === 'return' ? returnRecord : handoverRecord;
  const photos = currentRecord?.photos || {};

  // Mock ảnh minh họa nếu chưa có ảnh thực tế trong localStorage
  const demoPhotos: Record<string, string> = {
    front: photos.front || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    back: photos.back || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    left: photos.left || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    right: photos.right || 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=600&q=80',
  };

  const photoLabels: Record<string, string> = {
    front: 'Mặt trước (Front)',
    back: 'Mặt sau (Back)',
    left: 'Sườn trái (Left)',
    right: 'Sườn phải (Right)',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-3xl bg-surface border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden text-gray-300 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Top glowing bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-black/30 shrink-0">
            <div>
              <div className="text-[10px] text-neon uppercase font-bold tracking-widest mb-0.5">
                Biên bản ghi nhận hiện trạng xe
              </div>
              <h2 className="text-base font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-5 h-5 text-neon" />
                {vehicleModel} <span className="text-gray-500 text-xs font-mono">({bookingCode})</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-gray-400 hover:text-white bg-transparent border-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-gray-800 bg-black/40 px-6 pt-3 shrink-0 gap-4">
            <button
              onClick={() => setActiveTab('return')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                activeTab === 'return'
                  ? 'text-neon border-neon'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              📷 Ảnh Trả Xe (Thu Hồi)
            </button>
            <button
              onClick={() => setActiveTab('handover')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                activeTab === 'handover'
                  ? 'text-neon border-neon'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              📋 Ảnh Giao Xe Ban Đầu
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-grow">
            {/* Meta status bar */}
            <div className="p-4 bg-black/40 border border-gray-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-neon" />
                <span>Thời gian ghi nhận:</span>
                <span className="font-mono text-white font-bold">
                  {currentRecord?.timestamp
                    ? new Date(currentRecord.timestamp).toLocaleString('vi-VN')
                    : 'N/A'}
                </span>
              </div>

              {(currentRecord?.endOdometer || currentRecord?.startOdometer) && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Gauge className="w-4 h-4 text-neon" />
                  <span>Chỉ số Odometer:</span>
                  <span className="font-mono text-neon font-bold text-sm">
                    {(currentRecord?.endOdometer || currentRecord?.startOdometer).toLocaleString('vi-VN')} km
                  </span>
                </div>
              )}
            </div>

            {/* Checklist summary */}
            {currentRecord?.checklist && (
              <div className="bg-black/30 border border-gray-900 rounded-2xl p-4 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-neon" /> Tình trạng kiểm tra thiết bị & xe
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Object.entries(currentRecord.checklist).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 className={`w-4 h-4 ${val ? 'text-neon' : 'text-gray-600'}`} />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Angle Photos Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Hình ảnh chụp 4 hướng thực tế</span>
                <span className="text-[10px] text-gray-500 font-normal">Click ảnh để phóng to</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {Object.keys(photoLabels).map((dir) => {
                  const imgUrl = photos[dir] || demoPhotos[dir];
                  const hasRealPhoto = !!photos[dir];

                  return (
                    <div
                      key={dir}
                      onClick={() => setZoomedImage(imgUrl)}
                      className="group relative bg-black/60 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-neon/50 transition-all duration-300 aspect-[4/3] flex flex-col justify-end"
                    >
                      <img
                        src={imgUrl}
                        alt={photoLabels[dir]}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {!hasRealPhoto && (
                        <div className="absolute top-3 left-3 bg-black/70 border border-yellow-500/30 text-yellow-400 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          Ảnh minh họa mẫu
                        </div>
                      )}

                      <div className="relative p-3 flex justify-between items-center z-10">
                        <span className="text-xs font-bold text-white shadow-sm">
                          {photoLabels[dir]}
                        </span>
                        <div className="p-1.5 rounded-lg bg-black/60 text-white/80 group-hover:text-neon group-hover:bg-neon/20 transition-colors">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800 bg-black/30 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-neon text-dark font-bold text-xs uppercase hover:bg-[#bbf000] transition-all cursor-pointer"
            >
              Đóng biên bản
            </button>
          </div>
        </motion.div>

        {/* Fullscreen Zoom Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Phóng to ảnh"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
