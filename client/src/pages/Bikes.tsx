import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BikeCard } from '../components/BikeCard';
import { SlidersHorizontal, Search, AlertCircle, Loader } from 'lucide-react';
import { getAllMotorbikes, Motorbike } from '../services/vehicleService';
import { useLanguage } from '../hooks/useLanguage';

export const Bikes = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  const initialDate = searchParams.get('date') || '';

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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceSort, setPriceSort] = useState('Default');

  // Available bike categories
  const categories = useMemo(() => {
    const allCategories = bikes.map(bike => bike.category);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [bikes]);

  // Filter and sort bikes
  const filteredBikes = useMemo(() => {
    let result = [...bikes];

    // Search query filter
    if (searchQuery.trim() !== '') {
      result = result.filter(bike => 
        bike.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bike.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bike.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(bike => bike.category === selectedCategory);
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
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
            {t('bikesPage.title')}
          </h1>
          <p className="text-gray-400 text-sm">
            {initialLocation && t('bikesPage.searchingAt', { location: initialLocation })}
            {initialDate && ` • ${t('bikesPage.date', { date: initialDate })}`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-red-300">{error}</p>
          </div>
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
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent p-3 outline-none appearance-none cursor-pointer transition-all duration-300"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'All' ? t('bikesPage.all') : c}</option>
                  ))}
                </select>
              </div>

              {/* Sort by Price */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:inline">{t('bikesPage.priceSort')}</span>
                <select 
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value)}
                  className="bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent p-3 outline-none appearance-none cursor-pointer transition-all duration-300"
                >
                  <option value="Default">{t('bikesPage.defaultSort')}</option>
                  <option value="LowToHigh">{t('bikesPage.lowToHigh')}</option>
                  <option value="HighToLow">{t('bikesPage.highToLow')}</option>
                </select>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map(bike => (
              <BikeCard key={bike._id} bike={bike} />
            ))}
          </div>
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
