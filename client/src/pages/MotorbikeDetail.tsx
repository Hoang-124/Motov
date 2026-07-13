import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader, Edit2, Trash2, MapPin, Users, Zap, Check, X, Star, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMotorbikeById, Motorbike, deleteMotorbike, getAllMotorbikes } from '../services/vehicleService';
import { feedbackService, FeedbackItem } from '../services/feedbackService';
import { BikeCard } from '../components/BikeCard';
import { useLanguage } from '../hooks/useLanguage';

const translateCategory = (cat: string, t: any) => {
  const c = (cat || '').toLowerCase().trim();
  if (c === 'xe máy điện' || c === 'electric' || c === 'xe may dien') return t('categories.electric');
  if (c === 'xe số' || c === 'manual' || c === 'xe so') return t('categories.manual');
  if (c === 'xe ga' || c === 'scooter') return t('categories.scooter');
  return cat;
};

const translateFeature = (feature: string, lang: string) => {
  if (!feature) return '';
  const f = feature.toLowerCase().trim();
  if (lang === 'en') {
    if (f.includes('quãng đường') || f.includes('quang duong')) {
      return feature.replace(/quãng đường/i, 'Range').replace(/sạc/i, 'Charge');
    }
    if (f === 'pin lfp tiên tiến' || f === 'pin lfp tien tien') return 'Advanced LFP Battery';
    if (f === 'chống nước ip67' || f === 'chong nuoc ip67') return 'IP67 Waterproof';
    if (f.includes('tốc độ tối đa') || f.includes('toc do toi da')) {
      return feature.replace(/tốc độ tối đa/i, 'Max Speed');
    }
    if (f === 'phanh abs an toàn') return 'ABS Safety Brakes';
    if (f === 'khóa smartkey thông minh') return 'Smartkey System';
    if (f === 'cốp xe rộng rãi') return 'Spacious Underseat Storage';
  } else if (lang === 'ko') {
    if (f.includes('quãng đường') || f.includes('quang duong')) {
      return feature.replace(/quãng đường/i, '주행 거리').replace(/sạc/i, '충전');
    }
    if (f === 'pin lfp tiên tiến' || f === 'pin lfp tien tien') return '고성능 LFP 배터리';
    if (f === 'chống nước ip67' || f === 'chong nuoc ip67') return 'IP67 방수 등급';
    if (f.includes('tốc độ tối đa') || f.includes('toc do toi da')) {
      return feature.replace(/tốc độ tối đa/i, '최고 속도');
    }
    if (f === 'phanh abs an toàn') return 'ABS 안전 브레이크';
    if (f === 'khóa smartkey thông minh') return '스마트키 시스템';
    if (f === 'cốp xe rộng rãi') return '넓은 수물함 공간';
  }
  return feature;
};

export const MotorbikeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [motorbike, setMotorbike] = useState<Motorbike | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [relatedBikes, setRelatedBikes] = useState<Motorbike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const canEditOrDelete = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'staff' || 
    (currentUser.role === 'owner' && motorbike && typeof motorbike.ownerId !== 'string' && motorbike.ownerId?.email === currentUser.email)
  );

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
        if (data.imageUrls && data.imageUrls.length > 0) {
          setActiveImage(data.imageUrls[0]);
        }
        
        // Fetch feedbacks
        const fbData = await feedbackService.getVehicleFeedbacks(id);
        setFeedbacks(fbData);

        // Fetch related motorbikes of the same category that are Available, excluding current motorbike
        if (data.category) {
          try {
            const catId = typeof data.category === 'object' && data.category !== null ? (data.category as any)._id : data.category;
            const allBikes = await getAllMotorbikes({ category: catId });
            const filtered = allBikes
              .filter(bike => bike._id !== data._id && bike.status === 'Available')
              .slice(0, 3);
            setRelatedBikes(filtered);
          } catch (relErr) {
            console.error('Error fetching related motorbikes:', relErr);
          }
        }
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
      let token = '';
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user.token || '';
        } catch (e) {}
      }
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
    : t('bikesPage.ownerNameUnknown');

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
            {t('bikesPage.backToBikes')}
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
      <div className="w-full max-w-[95%] xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 lg:px-8 2xl:px-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/bikes')}
          className="flex items-center gap-2 text-neon hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('bikesPage.backToBikes')}
        </button>

        {/* Main Content (2-Column Grid Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          
          {/* Left Column: Image and Thumbnails Overlay */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square md:aspect-[4/3] lg:aspect-[16/10] bg-black border border-gray-800 rounded-2xl overflow-hidden group">
              <img
                src={activeImage || imageUrl}
                alt={motorbike.vehicleModel}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Status and Category Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className={`px-4 py-1.5 rounded-full font-semibold text-xs backdrop-blur-md border ${
                  motorbike.status === 'Available'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : motorbike.status === 'Rented'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {motorbike.status === 'Available' 
                    ? (language === 'vi' ? 'Sẵn sàng' : language === 'ko' ? '대여 가능' : 'Available') 
                    : motorbike.status === 'Rented' 
                    ? (language === 'vi' ? 'Đang thuê' : language === 'ko' ? '대여 중' : 'Rented') 
                    : (language === 'vi' ? 'Bảo trì' : language === 'ko' ? '정비 중' : 'Maintenance')}
                </div>
                <div className="bg-dark/70 backdrop-blur-md px-4 py-1.5 rounded-full font-semibold text-xs text-neon border border-neon/30">
                  {translateCategory(typeof motorbike.category === 'object' && motorbike.category !== null ? (motorbike.category as any).name : motorbike.category, t)}
                </div>
              </div>

              {/* Thumbnails overlay in the bottom right corner */}
              {motorbike.imageUrls && motorbike.imageUrls.length > 0 && (
                <div className="absolute bottom-4 right-4 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  {motorbike.imageUrls.slice(0, 4).map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(url)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        (activeImage || imageUrl) === url ? 'border-neon scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Motorbike Details & Action Buttons */}
          <div className="lg:col-span-5 bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[400px]">
            <div>
              {/* Header Title & Pricing */}
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h1 className="font-display font-black text-3xl text-white mb-2 leading-tight">
                    {motorbike.vehicleModel}
                  </h1>
                  <p className="text-gray-400 text-xs font-mono">{t('bikesPage.licensePlate')}: {motorbike.licensePlate}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-neon">
                    {motorbike.rentalPrice.toLocaleString()} VNĐ
                  </p>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t('bikesPage.perDay')}</p>
                </div>
              </div>

              {/* Owner Info Card */}
              <div className="bg-black/40 border border-gray-800/80 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{t('bikesPage.ownerTitle')}</p>
                  <p className="text-white font-bold text-sm">{ownerName}</p>
                  {typeof motorbike.ownerId !== 'string' && motorbike.ownerId.phoneNumber && (
                    <p className="text-gray-400 text-xs mt-0.5">{motorbike.ownerId.phoneNumber}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center text-neon">
                  <Users size={18} />
                </div>
              </div>

              {/* Description */}
              {motorbike.description && (
                <div className="mb-6">
                  <h2 className="text-xs text-neon uppercase font-black tracking-wider mb-2">{t('bikesPage.description')}</h2>
                  <p className="text-gray-400 text-xs leading-relaxed">{motorbike.description}</p>
                </div>
              )}

              {/* Specifications and Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Specifications */}
                <div className="space-y-2.5 bg-black/25 p-4 rounded-xl border border-gray-800/40">
                  <h3 className="text-[10px] text-white font-bold uppercase tracking-wider mb-1">{t('bikesPage.specs')}</h3>
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <Users size={14} className="text-neon" />
                    <span>{language === 'vi' ? `${motorbike.seats} chỗ ngồi` : language === 'ko' ? `${motorbike.seats}인승` : `${motorbike.seats} seats`}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <Zap size={14} className="text-neon" />
                    <span>{motorbike.transmissionType === 'Manual' ? (language === 'vi' ? 'Xe số' : language === 'ko' ? '수동 (매뉴얼)' : 'Manual') : motorbike.transmissionType === 'Automatic' ? (language === 'vi' ? 'Xe ga' : language === 'ko' ? '자동 (스쿠터)' : 'Automatic') : motorbike.transmissionType}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <MapPin size={14} className="text-neon" />
                    <span>{motorbike.odometer.toLocaleString()} km</span>
                  </div>
                </div>

                {/* Features */}
                {motorbike.features && motorbike.features.length > 0 && (
                  <div className="space-y-2 bg-black/25 p-4 rounded-xl border border-gray-800/40">
                    <h3 className="text-[10px] text-white font-bold uppercase tracking-wider mb-2">{t('bikesPage.features')}</h3>
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                      {motorbike.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon shrink-0"></span>
                          <span className="truncate">{translateFeature(feature, language)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap border-t border-gray-800/80 pt-6 mt-6">
              {canEditOrDelete && (
                <>
                  <button
                    onClick={() => navigate(`/motorbike/${motorbike._id}/edit`)}
                    className="flex items-center justify-center gap-2 bg-blue-600/95 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                    {t('bikesPage.edit')}
                  </button>
                  <button
                    onClick={handleOpenDeleteModal}
                    disabled={deleting}
                    className="flex items-center justify-center gap-2 bg-red-600/95 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    {deleting ? t('bikesPage.deleting') : t('bikesPage.delete')}
                  </button>
                </>
              )}

              {/* Show Book Now button for customer/guest when motorbike is available */}
              {(!currentUser || currentUser.role === 'customer') && (
                <button
                  onClick={() => {
                    if (motorbike.status === 'Available') {
                      navigate(`/booking/${motorbike._id}`);
                    }
                  }}
                  disabled={motorbike.status !== 'Available'}
                  className={`flex-grow flex items-center justify-center gap-2 text-xs font-black px-6 py-3 rounded-lg transition-all duration-300 cursor-pointer ${
                    motorbike.status === 'Available'
                      ? 'bg-neon text-dark hover:bg-[#bbf000] shadow-[0_0_12px_rgba(204,255,0,0.25)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)]'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {motorbike.status === 'Available' ? t('bikesPage.bookNowBtn') : t('bikesPage.notAvailable')}
                </button>
              )}

              {(() => {
                const ownerId = motorbike && typeof motorbike.ownerId === 'object' && motorbike.ownerId !== null 
                  ? (motorbike.ownerId as any)._id 
                  : motorbike?.ownerId;
                const isOwnBike = ownerId && currentUser && ownerId.toString() === (currentUser.id || currentUser._id || '').toString();

                if (isOwnBike) return null;

                return (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        navigate(`/auth?redirect=${encodeURIComponent(`/chat?with=${ownerId}&vehicle=${id}`)}`);
                      } else {
                        navigate(`/chat?with=${ownerId}&vehicle=${id}`);
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-black/40 border border-neon/30 hover:bg-neon hover:text-dark text-neon text-xs font-bold px-6 py-3 rounded-lg transition-all duration-300 cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    {language === 'vi' ? 'Chat với người cho thuê' : 'Chat with Owner'}
                  </button>
                );
              })()}

              <button
                onClick={() => navigate('/bikes')}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {t('bikesPage.backToListing')}
              </button>
            </div>
          </div>
        </div>



        {/* Related Motorbikes Section */}
        {relatedBikes.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display font-black text-2xl text-neon uppercase mb-6 tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-neon" />
              {t('bikesPage.relatedBikes')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBikes.map((bike) => (
                <BikeCard key={bike._id} bike={bike} />
              ))}
            </div>
          </div>
        )}
        {/* Customer Feedbacks Section */}
        <div className="mt-12 bg-surface border border-gray-800 rounded-2xl p-6 md:p-8">
          <h2 className="font-display font-black text-2xl text-neon uppercase mb-6 tracking-tight flex items-center gap-2">
            <Star size={24} className="fill-neon text-neon" />
            {t('bikesPage.customerReviews')} ({feedbacks.length})
          </h2>

          {feedbacks.length === 0 ? (
            <div className="text-center py-10 bg-black/20 rounded-xl border border-white/5">
              <p className="text-gray-500 text-sm">
                {language === 'vi' ? 'Chưa có đánh giá nào cho xe này.' : language === 'ko' ? '이 차량에 대한 이용 후기가 없습니다.' : 'No reviews yet for this vehicle.'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {language === 'vi' ? 'Hãy thuê xe và là người đầu tiên để lại phản hồi!' : language === 'ko' ? '대여 후 첫 번째로 후기를 작성해보세요!' : 'Rent this bike and be the first to leave feedback!'}
              </p>
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
                  <span className="text-xs text-gray-500 block mt-0.5">
                    {language === 'vi' ? 'Điểm đánh giá trung bình' : language === 'ko' ? '평균 평점' : 'Average Rating'}
                  </span>
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
                            {fb.userId ? `${fb.userId.lastName} ${fb.userId.firstName}` : (language === 'vi' ? 'Ẩn danh' : language === 'ko' ? '익명' : 'Anonymous')}
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
                <Trash2 size={20} />
                {t('bikesPage.delete')}
              </h3>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 mb-4 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <p>
                  {language === 'vi' ? 'Hành động này không thể hoàn tác. Xe sẽ bị xóa vĩnh viễn khỏi hệ thống.' : language === 'ko' ? '이 작업은 취소할 수 없습니다. 오토바이가 시스템에서 영구적으로 삭제됩니다.' : 'This action cannot be undone. The motorbike will be permanently removed.'}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-300">
                  {language === 'vi' ? 'Bạn chuẩn bị xóa:' : language === 'ko' ? '삭제하려는 차량:' : 'You are about to delete:'}
                </p>
                <div className="bg-black/35 p-3 rounded-lg border border-white/5">
                  <div className="font-bold text-white text-sm mb-1">{motorbike.vehicleModel}</div>
                  <div className="text-xs text-gray-400 font-mono">{t('bikesPage.licensePlate')}: {motorbike.licensePlate}</div>
                  <div className="text-xs text-gray-400 font-mono">{t('bikesPage.categoryFilter')} {translateCategory(typeof motorbike.category === 'object' && motorbike.category !== null ? (motorbike.category as any).name : motorbike.category, t)}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {language === 'vi' ? 'Hủy' : language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {deleting ? t('bikesPage.deleting') : (language === 'vi' ? 'Xóa Vĩnh Viễn' : language === 'ko' ? '영구 삭제' : 'Delete Permanently')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
