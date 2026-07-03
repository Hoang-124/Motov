import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BikeCard } from '../components/BikeCard';
import { SlidersHorizontal, Search, AlertCircle, Loader, ChevronDown, MapPin, Sparkles } from 'lucide-react';
import { getAllMotorbikes, getRecommendations, Motorbike } from '../services/vehicleService';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'motion/react';

export const Bikes = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  const pickupDate = searchParams.get('pickupDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bikes from API
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllMotorbikes({ status: 'Available' });
        setBikes(data);
      } catch (err) {
        setError(language === 'vi' ? 'Không thể tải danh sách xe máy. Vui lòng thử lại sau.' : 'Failed to load motorbikes. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBikes();
  }, [language]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceSort, setPriceSort] = useState('Default');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Available bike categories
  const categories = useMemo(() => {
    const allCategories = bikes.map(bike => {
      if (typeof bike.category === 'object' && bike.category !== null) {
        return (bike.category as any).name;
      }
      return bike.category;
    }).filter(Boolean);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [bikes]);

  // Filter and sort bikes
  const filteredBikes = useMemo(() => {
    let result = [...bikes];

    // Search query filter
    if (searchQuery.trim() !== '') {
      result = result.filter(bike => {
        const catName = typeof bike.category === 'object' && bike.category !== null
          ? (bike.category as any).name
          : bike.category;
        return bike.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (catName && catName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          bike.description?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(bike => {
        const catName = typeof bike.category === 'object' && bike.category !== null
          ? (bike.category as any).name
          : bike.category;
        return catName === selectedCategory;
      });
    }

    // Sort by price
    if (priceSort === 'LowToHigh') {
      result.sort((a, b) => a.rentalPrice - b.rentalPrice);
    } else if (priceSort === 'HighToLow') {
      result.sort((a, b) => b.rentalPrice - a.rentalPrice);
    }

    return result;
  }, [bikes, searchQuery, selectedCategory, priceSort]);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2" style={{ textWrap: 'balance' }}>
            {t('bikesPage.title')}
          </h1>
          <p className="text-gray-300 text-sm">
            {initialLocation && t('bikesPage.searchingAt', { location: initialLocation })}
            {pickupDate && returnDate && ` • ${pickupDate} → ${returnDate}`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Personalized recommendations */}
        {searchQuery === '' && selectedCategory === 'All' && (
          <BikesRecommendations />
        )}

        {/* Filter and Search Bar */}
        {!loading && (
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between shadow-lg">
            {/* Search bar */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder={t('bikesPage.searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Filter by Category */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:inline">{t('bikesPage.categoryFilter')}</span>
                <div className="relative">
                  <button 
                    onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsSortOpen(false); }}
                    className="flex items-center justify-between gap-3 bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg hover:border-neon focus:ring-2 focus:ring-neon focus:border-transparent px-4 py-3 min-w-[150px] transition-all duration-300 cursor-pointer text-left"
                  >
                    <span>{selectedCategory === 'All' ? t('bikesPage.all') : selectedCategory}</span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180 text-neon' : ''}`} />
                  </button>
                  
                  {isCategoryOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCategoryOpen(false)} />
                      <div className="absolute right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-48 overflow-hidden text-gray-300 py-1 font-sans">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                        {categories.map(c => (
                          <button
                            key={c}
                            onClick={() => {
                              setSelectedCategory(c);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer bg-transparent border-none ${
                              selectedCategory === c ? 'text-neon bg-neon/5 font-bold' : 'text-gray-300 hover:text-neon hover:bg-white/5'
                            }`}
                          >
                            {c === 'All' ? t('bikesPage.all') : c}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sort by Price */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:inline">{t('bikesPage.priceSort')}</span>
                <div className="relative">
                  <button 
                    onClick={() => { setIsSortOpen(!isSortOpen); setIsCategoryOpen(false); }}
                    className="flex items-center justify-between gap-3 bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg hover:border-neon focus:ring-2 focus:ring-neon focus:border-transparent px-4 py-3 min-w-[150px] transition-all duration-300 cursor-pointer text-left"
                  >
                    <span>
                      {priceSort === 'Default' && t('bikesPage.defaultSort')}
                      {priceSort === 'LowToHigh' && t('bikesPage.lowToHigh')}
                      {priceSort === 'HighToLow' && t('bikesPage.highToLow')}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-neon' : ''}`} />
                  </button>
                  
                  {isSortOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSortOpen(false)} />
                      <div className="absolute right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-48 overflow-hidden text-gray-300 py-1 font-sans">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                        {[
                          { value: 'Default', label: t('bikesPage.defaultSort') },
                          { value: 'LowToHigh', label: t('bikesPage.lowToHigh') },
                          { value: 'HighToLow', label: t('bikesPage.highToLow') }
                        ].map(item => (
                          <button
                            key={item.value}
                            onClick={() => {
                              setPriceSort(item.value);
                              setIsSortOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer bg-transparent border-none ${
                              priceSort === item.value ? 'text-neon bg-neon/5 font-bold' : 'text-gray-300 hover:text-neon hover:bg-white/5'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Nút xem bản đồ xe máy */}
              <button
                onClick={() => navigate('/bikes-map')}
                className="flex items-center gap-2 bg-neon/10 border border-neon/20 hover:bg-neon hover:text-dark text-neon text-xs font-bold rounded-lg px-4 py-3.5 transition-all duration-300 cursor-pointer whitespace-nowrap shadow-[0_0_10px_rgba(204,255,0,0.1)]"
                title="Xem các xe máy gần bạn trên bản đồ"
              >
                <MapPin size={14} />
                <span>Bản đồ xe</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
              <p className="text-gray-400">{t('bikesPage.loading')}</p>
            </div>
          </div>
        )}

        {/* Bikes Grid */}
        {!loading && filteredBikes.length > 0 ? (
          <motion.div 
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBikes.map(bike => (
              <motion.div 
                key={bike._id} 
                variants={{
                  hidden: { opacity: 0, y: 25, filter: 'blur(3px)' },
                  show: { 
                    opacity: 1, 
                    y: 0, 
                    filter: 'blur(0px)',
                    transition: { type: 'spring', stiffness: 90, damping: 14 } 
                  }
                }}
              >
                <BikeCard bike={bike} />
              </motion.div>
            ))}
          </motion.div>
        ) : !loading && (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-surface/50">
            <p className="text-gray-500 mb-2">{t('bikesPage.noBikes')}</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setPriceSort('Default'); }}
              className="text-neon text-sm underline hover:text-white transition-colors"
            >
              {t('bikesPage.resetFilter')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const BikesRecommendations = () => {
  const [recommended, setRecommended] = useState<Motorbike[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        let token = undefined;
        if (storedUser) {
          token = JSON.parse(storedUser).token;
        }
        const res = await getRecommendations(token);
        setRecommended(res.vehicles);
        setReason(res.reason);
      } catch (err) {
        console.error('Error loading recommendations on bikes page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  const { t } = useLanguage();

  const translateReason = (resStr: string) => {
    if (!resStr) return '';
    const r = resStr.trim();
    if (r === 'Được nhiều người dùng yêu thích') return t('recommendations.reasonPopular');
    if (r === 'Dòng xe phổ biến có lượt thuê cao nhất') return t('recommendations.reasonTopRentals');
    if (r === 'Các dòng xe máy mới nổi bật của hệ thống') return t('recommendations.reasonNewFeatured');
    if (r === 'Dòng xe tương tự các chuyến đi trước của bạn') return t('recommendations.reasonSimilar');
    if (r === 'Gợi ý theo sở thích chạy xe số của bạn') return t('recommendations.reasonPreferenceManual');
    if (r === 'Gợi ý theo sở thích chạy xe ga của bạn') return t('recommendations.reasonPreferenceAutomatic');
    if (r === 'Gợi ý theo sở thích chạy xe côn tay của bạn') return t('recommendations.reasonPreferenceClutch');
    return resStr;
  };

  if (loading || recommended.length === 0) return null;

  return (
    <div className="bg-surface border border-gray-800 rounded-2xl p-6 mb-10 bg-gradient-to-r from-neon/0 via-neon/5 to-transparent shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <span className="text-neon text-[10px] font-bold uppercase tracking-widest font-mono border border-neon/20 px-3 py-1.5 rounded-full bg-neon/5 w-fit flex items-center gap-1.5">
          <Sparkles size={12} className="text-neon" />
          {t('recommendations.personalizedTitle')}
        </span>
        <span className="text-xs text-gray-400 font-mono">({translateReason(reason)})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recommended.slice(0, 3).map(bike => (
          <BikeCard key={bike._id} bike={bike} />
        ))}
      </div>
    </div>
  );
};
