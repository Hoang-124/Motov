import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader, Edit2, Trash2, MapPin, Users, Zap, Check, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMotorbikeById, Motorbike, deleteMotorbike } from '../services/vehicleService';
import { feedbackService, FeedbackItem } from '../services/feedbackService';

export const MotorbikeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [motorbike, setMotorbike] = useState<Motorbike | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchMotorbike = async () => {
      if (!id) {
        setError('Invalid motorbike ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getMotorbikeById(id);
        setMotorbike(data);
        
        // Fetch feedbacks
        const fbData = await feedbackService.getVehicleFeedbacks(id);
        setFeedbacks(fbData);
      } catch (err) {
        setError('Failed to load motorbike details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMotorbike();
  }, [id]);


  const handleDelete = async () => {
    if (!motorbike?._id) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token') || '';
      await deleteMotorbike(motorbike._id, token);
      setShowDeleteModal(false);
      navigate('/bikes');
    } catch (err) {
      alert('Failed to delete motorbike');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const ownerName = motorbike && typeof motorbike.ownerId !== 'string'
    ? `${motorbike.ownerId.firstName} ${motorbike.ownerId.lastName}`
    : 'Unknown Owner';

  const imageUrl = motorbike?.imageUrls?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1200';

  if (loading) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading motorbike details...</p>
        </div>
      </div>
    );
  }

  if (error || !motorbike) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/bikes')}
            className="flex items-center gap-2 text-neon hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Bikes
          </button>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-3">
            <AlertCircle size={24} className="text-red-500" />
            <p className="text-red-300">{error || 'Motorbike not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/bikes')}
          className="flex items-center gap-2 text-neon hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Bikes
        </button>

        {/* Main Content */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden">
          {/* Image Gallery */}
          <div className="relative aspect-video bg-black overflow-hidden">
            <img
              src={imageUrl}
              alt={motorbike.vehicleModel}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <div className={`px-4 py-2 rounded-full font-semibold text-sm backdrop-blur-md border ${
                motorbike.status === 'Available'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : motorbike.status === 'Rented'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {motorbike.status}
              </div>
              <div className="bg-dark/70 backdrop-blur-md px-4 py-2 rounded-full font-semibold text-sm text-neon border border-neon/30">
                {motorbike.category}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="font-display font-black text-4xl text-neon mb-2">
                  {motorbike.vehicleModel}
                </h1>
                <p className="text-gray-400">License Plate: {motorbike.licensePlate}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-neon">
                  {motorbike.rentalPrice.toLocaleString()} VNĐ
                </p>
                <p className="text-gray-400 text-sm">per day</p>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-black/50 border border-gray-800 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm">OWNER</p>
              <p className="text-white font-semibold">{ownerName}</p>
              {typeof motorbike.ownerId !== 'string' && motorbike.ownerId.phoneNumber && (
                <p className="text-gray-400 text-sm">{motorbike.ownerId.phoneNumber}</p>
              )}
            </div>

            {/* Description */}
            {motorbike.description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                <p className="text-gray-400 leading-relaxed">{motorbike.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Specifications</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Users size={18} className="text-neon" />
                    <span>Seats: {motorbike.seats}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Zap size={18} className="text-neon" />
                    <span>Transmission: {motorbike.transmissionType}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin size={18} className="text-neon" />
                    <span>Odometer: {motorbike.odometer.toLocaleString()} km</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {motorbike.features && motorbike.features.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Features</h2>
                  <div className="space-y-2">
                    {motorbike.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-neon"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => navigate(`/motorbike/${motorbike._id}/edit`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Edit Motorbike
              </button>
              <button
                onClick={handleOpenDeleteModal}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                {deleting ? 'Deleting...' : 'Delete Motorbike'}
              </button>
              <button
                onClick={() => navigate('/bikes')}
                className="flex items-center gap-2 bg-neon text-dark hover:bg-[#bbf000] font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Back to Listing
              </button>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        {motorbike.imageUrls && motorbike.imageUrls.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">More Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {motorbike.imageUrls.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-neon transition-colors cursor-pointer">
                  <img src={url} alt={`${motorbike.vehicleModel} ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Feedbacks Section */}
        <div className="mt-12 bg-surface border border-gray-800 rounded-2xl p-6 md:p-8">
          <h2 className="font-display font-black text-2xl text-neon uppercase mb-6 tracking-tight flex items-center gap-2">
            <Star size={24} className="fill-neon text-neon" />
            Đánh giá từ khách hàng ({feedbacks.length})
          </h2>

          {feedbacks.length === 0 ? (
            <div className="text-center py-10 bg-black/20 rounded-xl border border-white/5">
              <p className="text-gray-500 text-sm">Chưa có đánh giá nào cho xe này.</p>
              <p className="text-xs text-gray-600 mt-1">Hãy thuê xe và là người đầu tiên để lại phản hồi!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary stat */}
              <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/5 w-fit">
                <div className="text-3xl font-extrabold text-neon">
                  {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}
                </div>
                <div>
                  <div className="flex gap-0.5 text-neon">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const avg = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
                      return (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < Math.round(avg) ? 'fill-neon text-neon' : 'text-gray-700'} 
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500 block mt-0.5">Điểm đánh giá trung bình</span>
                </div>
              </div>

              {/* Feedback items list */}
              <div className="divide-y divide-gray-800 space-y-4">
                {feedbacks.map((fb) => (
                  <div key={fb._id} className="pt-4 first:pt-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center text-xs">
                          {fb.userId?.avatarUrl ? (
                            <img src={fb.userId.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500">{fb.userId?.username?.substring(0, 2).toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {fb.userId ? `${fb.userId.lastName} ${fb.userId.firstName}` : 'Ẩn danh'}
                          </span>
                          <span className="text-[10px] text-gray-500 block font-mono">@{fb.userId?.username}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5 justify-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={10} 
                              className={i < fb.rating ? 'fill-neon text-neon' : 'text-gray-800'} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-500 mt-1 block">
                          {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 bg-black/10 p-3 rounded-lg border border-white/5 leading-relaxed">
                      "{fb.content}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && motorbike && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {}}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-red-500/20 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Red top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
              
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-red-500 uppercase mb-4 flex items-center gap-2">
                🗑️ Delete Motorbike
              </h3>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 mb-4 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <p>
                  This action cannot be undone. The motorbike will be permanently removed from the system.
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-300">You are about to delete:</p>
                <div className="bg-black/35 p-3 rounded-lg border border-white/5">
                  <div className="font-bold text-white text-sm mb-1">{motorbike.vehicleModel}</div>
                  <div className="text-xs text-gray-400 font-mono">License Plate: {motorbike.licensePlate}</div>
                  <div className="text-xs text-gray-400 font-mono">Category: {motorbike.category}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
