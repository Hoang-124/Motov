import React, { useEffect, useState } from 'react';
import { promotionService, Promotion } from '../services/promotionService';
import { Tag, Calendar, Copy, Check, Percent, Ticket, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

export const Promotions = () => {
  const { language, t } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const data = await promotionService.getActivePromotions();
        setPromotions(data);
      } catch (err: any) {
        console.error('Lỗi khi tải khuyến mãi:', err);
        setError(language === 'vi' ? 'Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.' : 'Failed to load promotions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, [language]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark relative overflow-hidden">
      {/* Background Neon Elements */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-neon/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-neon/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/10 border border-neon/30 text-neon text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <Sparkles size={12} />
            <span>{t('promotionsPage.banner')}</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-black text-4xl md:text-5xl text-white uppercase tracking-tight mb-4"
          >
            {language === 'vi' ? (
              <>Chương Trình <span className="text-neon text-glow">Khuyến Mãi</span></>
            ) : (
              <>Promotions & <span className="text-neon text-glow">Offers</span></>
            )}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-sm md:text-base leading-relaxed"
          >
            {t('promotionsPage.subtitle')}
          </motion.p>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-neon border-r-2 border-transparent"></div>
            <p className="text-gray-500 text-sm mt-4 font-semibold">{t('promotionsPage.loading')}</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center shadow-xl"
          >
            <AlertCircle className="mx-auto text-red-400 mb-3" size={36} />
            <p className="text-gray-300 text-sm font-semibold">{error}</p>
          </motion.div>
        ) : promotions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto bg-surface/50 border border-gray-800 rounded-2xl p-8 text-center"
          >
            <Ticket className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-white font-bold text-lg mb-2">{t('promotionsPage.noPromos')}</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              {t('promotionsPage.noPromosDesc')}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo, idx) => {
              const isPercentage = promo.discountType === 'Percentage';
              const isCopied = copiedCode === promo.voucherCode;

              return (
                <motion.div
                  key={promo._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-neon/40 transition-all duration-300 relative group flex flex-col justify-between min-h-[260px]"
                >
                  {/* Top neon strip on hover */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-neon opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

                  <div className="p-6 space-y-4">
                    {/* Discount Value Badge */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-neon/10 rounded-xl text-neon border border-neon/20 group-hover:bg-neon group-hover:text-dark transition-all duration-300">
                          {isPercentage ? <Percent size={18} /> : <Tag size={18} />}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                            {promo.discountCategory || t('promotionsPage.promoCategory')}
                          </span>
                          <span className="text-xs text-neon font-bold">
                            {promo.usageLimit !== undefined 
                              ? t('promotionsPage.remaining', { count: promo.usageLimit - promo.usedCount }) 
                              : t('promotionsPage.unlimited')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-2xl font-black text-white font-display">
                          {isPercentage 
                            ? `${promo.discountValue}%` 
                            : `${(promo.discountValue / 1000).toLocaleString()}K`}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider mt-0.5">
                          {t('promotionsPage.discount')}
                        </span>
                      </div>
                    </div>

                    {/* Promotion Details */}
                    <div>
                      <h3 className="font-display font-black text-lg text-white group-hover:text-neon transition-colors uppercase leading-tight mb-2">
                        {promo.discountName}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                        {promo.description || t('promotionsPage.noDesc')}
                      </p>
                    </div>

                    {/* Conditions */}
                    <div className="pt-2 space-y-1.5 border-t border-white/5 text-[11px] text-gray-500">
                      {promo.minOrderAmount && promo.minOrderAmount > 0 ? (
                        <div className="flex justify-between">
                          <span>{language === 'vi' ? 'Đơn tối thiểu:' : 'Min Order:'}</span>
                          <span className="text-gray-300 font-semibold">
                            {t('promotionsPage.minOrder', { amount: promo.minOrderAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') }).replace('Đơn tối thiểu: ', '').replace('Min Order: ', '')}
                          </span>
                        </div>
                      ) : null}
                      {isPercentage && promo.maxDiscountAmount ? (
                        <div className="flex justify-between">
                          <span>{language === 'vi' ? 'Giảm tối đa:' : 'Max Discount:'}</span>
                          <span className="text-gray-300 font-semibold">
                            {t('promotionsPage.maxDiscount', { amount: promo.maxDiscountAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') }).replace('Giảm tối đa: ', '').replace('Max Discount: ', '')}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {language === 'vi' ? 'Hạn dùng:' : 'Expiry Date:'}
                        </span>
                        <span className="text-gray-300 font-semibold">{formatDate(promo.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Copy Button Action */}
                  <div className="p-4 bg-black/30 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="font-mono text-sm font-bold text-white bg-dark/50 border border-gray-800 rounded px-3 py-1.5 flex-grow text-center tracking-wider select-all">
                      {promo.voucherCode}
                    </div>
                    
                    <button
                      onClick={() => handleCopyCode(promo.voucherCode)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 shrink-0 cursor-pointer ${
                        isCopied 
                          ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                          : 'bg-neon text-dark hover:bg-[#bbf000] shadow-[0_0_10px_rgba(204,255,0,0.15)]'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} />
                          <span>{t('promotionsPage.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>{t('promotionsPage.copy')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
