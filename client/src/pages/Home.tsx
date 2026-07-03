import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, ChevronDown, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllMotorbikes, getRecommendations, Motorbike } from '../services/vehicleService';
import { BikeCard } from '../components/BikeCard';
import { useLanguage } from '../hooks/useLanguage';

const HeroSearch = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTomorrowString = (baseDateStr?: string) => {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    const tomorrow = new Date(base);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [pickupDate, setPickupDate] = useState(getTodayString());
  const [returnDate, setReturnDate] = useState(getTomorrowString());
  const [location, setLocation] = useState('Son Tra Peninsula');
  const [category, setCategory] = useState('All');
  const [isLocOpen, setIsLocOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to bikes page with search queries
    navigate(`/bikes?pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}&location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`);
  };

  const categoriesList = [
    { value: 'All', label: language === 'vi' ? 'Tất cả dòng xe' : 'All Categories' },
    { value: 'Xe Ga', label: language === 'vi' ? 'Xe Ga (Scooter)' : 'Scooter' },
    { value: 'Xe Số', label: language === 'vi' ? 'Xe Số (Semi-Auto)' : 'Semi-Automatic' },
    { value: 'Xe Côn Tay', label: language === 'vi' ? 'Xe Côn Tay (Clutch)' : 'Clutch Bike' },
    { value: 'Xe Máy Điện', label: language === 'vi' ? 'Xe Máy Điện (Electric)' : 'Electric Bike' }
  ];

  return (
    <div className="glass-premium p-6 rounded-2xl border border-white/10 w-full max-w-md relative z-20 shadow-2xl">
      <h3 className="text-white font-bold mb-5 text-lg flex items-center gap-2 border-b border-white/5 pb-3">
        <SlidersHorizontal size={18} className="text-neon" />
        {language === 'vi' ? 'Tìm Kiếm Xe Máy' : 'Search Motorbikes'}
      </h3>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Date Inputs Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {language === 'vi' ? 'Ngày Nhận' : 'Pickup Date'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={pickupDate}
                min={getTodayString()}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  // Auto adjust return date if it is before pickup date
                  if (new Date(e.target.value) >= new Date(returnDate)) {
                    setReturnDate(getTomorrowString(e.target.value));
                  }
                }}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all duration-300 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {language === 'vi' ? 'Ngày Trả' : 'Return Date'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={returnDate}
                min={getTomorrowString(pickupDate)}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all duration-300 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            {t('home.location')}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setIsLocOpen(!isLocOpen); setIsCatOpen(false); }}
              className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent flex items-center pl-10 pr-10 p-3 outline-none cursor-pointer transition-all duration-300 text-left relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-neon" />
              </div>
              <span className="truncate">
                {location === 'Son Tra Peninsula' && t('home.sonTra')}
                {location === 'Da Nang Airport' && t('home.airport')}
                {location === 'City Center' && t('home.cityCenter')}
              </span>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isLocOpen ? 'rotate-180 text-neon' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {isLocOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsLocOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-300 py-1 font-sans"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                    {[
                      { value: 'Son Tra Peninsula', label: t('home.sonTra') },
                      { value: 'Da Nang Airport', label: t('home.airport') },
                      { value: 'City Center', label: t('home.cityCenter') }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setLocation(opt.value);
                          setIsLocOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer bg-transparent border-none ${location === opt.value ? 'text-neon bg-neon/5 font-bold' : 'text-gray-300 hover:text-neon hover:bg-white/5'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            {language === 'vi' ? 'Dòng Xe' : 'Category'}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setIsCatOpen(!isCatOpen); setIsLocOpen(false); }}
              className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent flex items-center pl-10 pr-10 p-3 outline-none cursor-pointer transition-all duration-300 text-left relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SlidersHorizontal size={16} className="text-neon" />
              </div>
              <span className="truncate">
                {categoriesList.find(c => c.value === category)?.label}
              </span>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isCatOpen ? 'rotate-180 text-neon' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {isCatOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCatOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-300 py-1 font-sans"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                    {categoriesList.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setCategory(opt.value);
                          setIsCatOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer bg-transparent border-none ${category === opt.value ? 'text-neon bg-neon/5 font-bold' : 'text-gray-300 hover:text-neon hover:bg-white/5'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-neon text-dark font-black py-4 mt-6 rounded-xl hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] cursor-pointer flex items-center justify-center gap-2 group hover:scale-[1.02]"
        >
          <span>{language === 'vi' ? 'TÌM XE NGAY' : 'SEARCH BIKES'}</span>
          <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </form>
    </div>
  );
};

const StatsSection = () => {
  const { language } = useLanguage();
  return (
    <section className="py-12 border-y border-white/5 relative bg-black/40">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '1,500+', label: language === 'vi' ? 'Lượt thuê thành công' : 'Rides Completed' },
            { value: '50+', label: language === 'vi' ? 'Dòng xe cao cấp' : 'Premium Motorbikes' },
            { value: '99%', label: language === 'vi' ? 'Khách hàng hài lòng' : 'Happy Customers' },
            { value: '24/7', label: language === 'vi' ? 'Hỗ trợ sự cố khẩn cấp' : 'Roadside Support' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass-premium p-6 rounded-xl border border-white/5 hover:border-neon/30 transition-all duration-300"
            >
              <h3 className="text-3xl font-display font-black text-neon text-glow mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroSection = () => {
  const { t, language } = useLanguage();
  return (
    <section className="relative pt-20 pb-12 lg:pt-28 lg:pb-20 min-h-[75vh] flex items-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2000"
          alt="Motorcycle on road"
          className="w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/90 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent"></div>
      </div>

      {/* Giant Typography Background */}
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[22vw] leading-none text-neon opacity-[0.02] mix-blend-screen pointer-events-none select-none z-10 w-full text-center tracking-tighter" style={{ textWrap: 'balance' }}>
        RIDE FREE
      </h1>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <HeroSearch />
          </motion.div>
          <div className="lg:col-span-7 lg:pl-4 text-left">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-display font-black text-white leading-[1.15] uppercase mb-4" style={{ textWrap: 'balance' }}>
              {t('home.freeToExplore')} <br />
              <span className="bg-gradient-to-r from-neon via-[#ddff44] to-white bg-clip-text text-transparent text-glow">{t('home.streets')}</span>
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg mb-6">
              {t('home.heroSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface SectionProps {
  bikes: Motorbike[];
}

const PopularSection = ({ bikes }: SectionProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const featuredBikes = bikes.slice(0, 3);

  // Framer motion variants for stagger
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 80, damping: 15 }
    }
  };

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 lg:px-8">
      <div className="flex justify-between items-end mb-12">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-neon uppercase text-glow">
          {t('home.popularBikes')}
        </h2>
        <button
          onClick={() => navigate('/bikes')}
          className="text-neon hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border-none bg-transparent"
        >
          {language === 'vi' ? 'Xem tất cả' : language === 'ko' ? '모두 보기' : 'View All'}
          <ArrowRight size={14} />
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {featuredBikes.map((bike, idx) => (
          <motion.div key={bike._id || idx} variants={itemVariants}>
            <BikeCard bike={bike} large={idx === 0} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

const HighQualitySection = ({ bikes }: SectionProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const otherBikes = bikes.slice(3, 6);
  return (
    <section className="py-24 border-t border-white/5 bg-black/20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 text-left">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white uppercase leading-tight" style={{ textWrap: 'balance' }}>
              {t('home.highQualityTitle')}
            </h2>
            <p className="mt-6 text-gray-300 leading-relaxed text-sm">
              {t('home.highQualitySubtitle')}
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-neon/20 flex items-center justify-center text-neon font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{t('home.maintenance')}</h4>
                  <p className="text-xs text-gray-400">{t('home.maintenanceDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-neon/20 flex items-center justify-center text-neon font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{t('home.support')}</h4>
                  <p className="text-xs text-gray-400">{t('home.supportDesc')}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/bikes')}
              className="mt-8 bg-neon/10 text-neon hover:bg-neon hover:text-dark px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 w-fit border border-neon/20 hover:border-neon"
            >
              {language === 'vi' ? 'Khám phá tất cả xe' : language === 'ko' ? '모든 바이크 둘러보기' : 'Explore All Bikes'}
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherBikes.map((bike, idx) => (
                <BikeCard key={bike._id || idx} bike={bike} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BannerCTA = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  return (
    <section className="py-28 relative overflow-hidden bg-[#0c0c0d] border-y border-white/5">
      {/* Curved glowing vector backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-neon/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <span className="text-neon text-xs font-mono font-bold uppercase tracking-widest mb-4 inline-block">
          {language === 'vi' ? 'Khởi hành ngay hôm nay' : 'Start Your Adventure'}
        </span>
        <h2 className="font-display font-black text-4xl md:text-6xl text-white uppercase leading-[1.1] mb-8" style={{ textWrap: 'balance' }}>
          {t('home.exploreYourWay')}
        </h2>
        <button
          onClick={() => navigate('/bikes')}
          className="bg-neon text-dark font-black px-12 py-5 rounded-full text-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_30px_rgba(204,255,0,0.5)] hover:shadow-[0_0_50px_rgba(204,255,0,0.8)] hover:scale-105 cursor-pointer"
        >
          {t('home.bookNow')}
        </button>
      </div>
    </section>
  );
};

const RecommendationsSection = () => {
  const [recommendedBikes, setRecommendedBikes] = useState<Motorbike[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        let token = undefined;
        if (storedUser) {
          token = JSON.parse(storedUser).token;
        }
        const res = await getRecommendations(token);
        setRecommendedBikes(res.vehicles);
        setReason(res.reason);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
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

  if (loading || recommendedBikes.length === 0) return null;

  return (
    <section className="py-16 border-b border-white/5 bg-gradient-to-b from-neon/0 to-neon/5 relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-neon text-[10px] font-bold uppercase tracking-widest font-mono border border-neon/20 px-3 py-1.5 rounded-full bg-neon/5 inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-neon" />
              {t('recommendations.personalizedTitle')}
            </span>
            <h2 className="font-display font-bold text-3xl text-white uppercase mt-4 tracking-tight">
              {t('recommendations.homeSubTitle')}
            </h2>
            <p className="text-gray-400 mt-2 text-xs font-semibold font-mono">
              {translateReason(reason)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedBikes.slice(0, 3).map((bike, idx) => (
            <BikeCard key={bike._id || idx} bike={bike} />
          ))}
        </div>
      </div>
    </section>
  );
};

export const Home = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const data = await getAllMotorbikes({ status: 'Available' });
        setBikes(data);
      } catch (err) {
        console.error('Error loading home page motorbikes:', err);
      }
    };
    fetchBikes();
  }, []);

  return (
    <div className="flex-grow">
      <HeroSection />
      <RecommendationsSection />
      {bikes.length > 0 && <PopularSection bikes={bikes} />}
      {bikes.length > 3 && <HighQualitySection bikes={bikes} />}
      <BannerCTA />
      <StatsSection />
    </div>
  );
};
