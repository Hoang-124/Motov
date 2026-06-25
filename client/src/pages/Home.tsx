import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllMotorbikes, getRecommendations, Motorbike } from '../services/vehicleService';
import { BikeCard } from '../components/BikeCard';
import { useLanguage } from '../hooks/useLanguage';

const HeroSearch = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('Son Tra Peninsula');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to bikes page with search queries
    navigate(`/bikes?date=${encodeURIComponent(date)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="bg-surface/85 backdrop-blur-xl p-6 rounded-2xl border border-white/10 w-full max-w-sm relative z-20 shadow-2xl">
      <h3 className="text-white font-semibold mb-4 text-lg">{t('home.pickupReturn')}</h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Date Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarDays size={18} className="text-neon" />
          </div>
          <input 
            type="text" 
            placeholder={t('home.selectPickupReturn')} 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all duration-300"
          />
        </div>

        <div>
          <h3 className="text-white font-semibold mb-2 text-sm mt-2">{t('home.location')}</h3>
          
          <div className="space-y-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent flex items-center pl-10 pr-10 p-3 outline-none cursor-pointer transition-all duration-300 text-left relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-neon" />
                </div>
                <span>
                  {location === 'Son Tra Peninsula' && t('home.sonTra')}
                  {location === 'Da Nang Airport' && t('home.airport')}
                  {location === 'City Center' && t('home.cityCenter')}
                </span>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-neon' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
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
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer bg-transparent border-none ${
                            location === opt.value ? 'text-neon bg-neon/5 font-bold' : 'text-gray-300 hover:text-neon hover:bg-white/5'
                          }`}
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
        </div>

        <button 
          type="submit"
          className="w-full bg-neon text-dark font-bold py-3.5 mt-4 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_25px_rgba(204,255,0,0.6)] cursor-pointer"
        >
          {t('home.searchBikes')}
        </button>
      </form>
    </div>
  );
};

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2000" 
          alt="Motorcycle on road" 
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/85 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent"></div>
      </div>

      {/* Giant Typography */}
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[22vw] leading-none text-neon opacity-[0.06] mix-blend-screen pointer-events-none select-none z-10 w-full text-center tracking-tighter">
        MOTOV
      </h1>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <HeroSearch />
          </motion.div>
          <div className="hidden lg:block relative z-20 text-right pr-8">
            <h2 className="text-5xl font-display font-black text-white leading-tight uppercase">
              {t('home.freeToExplore')} <br />
              <span className="text-neon text-glow">{t('home.streets')}</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-sm ml-auto text-sm leading-relaxed">
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
  const { t } = useLanguage();
  const featuredBikes = bikes.slice(0, 3);
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-neon uppercase text-glow">
          {t('home.popularBikes')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredBikes.map((bike, idx) => (
          <BikeCard key={bike._id || idx} bike={bike} large={idx === 0} />
        ))}
      </div>
    </section>
  );
};

const HighQualitySection = ({ bikes }: SectionProps) => {
  const { t } = useLanguage();
  const otherBikes = bikes.slice(3, 6);
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white uppercase leading-tight">
              {t('home.highQualityTitle')}
            </h2>
            <p className="mt-6 text-gray-400 leading-relaxed text-sm">
              {t('home.highQualitySubtitle')}
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-neon/20 flex items-center justify-center text-neon">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{t('home.maintenance')}</h4>
                  <p className="text-xs text-gray-500">{t('home.maintenanceDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-neon/20 flex items-center justify-center text-neon">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{t('home.support')}</h4>
                  <p className="text-xs text-gray-500">{t('home.supportDesc')}</p>
                </div>
              </div>
            </div>
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <section className="py-24 border-y border-white/5 relative overflow-hidden bg-gradient-to-r from-neon/5 to-transparent">
      <div className="absolute inset-0 bg-neon/5 blur-3xl rounded-full translate-y-1/2 scale-150"></div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="font-display font-bold text-4xl md:text-5xl text-white uppercase leading-tight mb-8">
          {t('home.exploreYourWay')}
        </h2>
        <button 
          onClick={() => navigate('/bikes')}
          className="bg-neon text-dark font-bold px-10 py-4 rounded-full text-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_25px_rgba(204,255,0,0.5)] hover:shadow-[0_0_40px_rgba(204,255,0,0.8)] cursor-pointer"
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

  if (loading || recommendedBikes.length === 0) return null;

  return (
    <section className="py-16 border-b border-white/5 bg-gradient-to-b from-neon/0 to-neon/5 relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-neon text-[10px] font-bold uppercase tracking-widest font-mono border border-neon/20 px-3 py-1.5 rounded-full bg-neon/5">
              ✨ Gợi ý cá nhân hóa
            </span>
            <h2 className="font-display font-bold text-3xl text-white uppercase mt-4 tracking-tight">
              Xe máy đề xuất cho bạn
            </h2>
            <p className="text-gray-400 mt-2 text-xs font-semibold font-mono">
              {reason}
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
    </div>
  );
};
