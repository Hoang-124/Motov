import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { getBikes, Bike } from '../data/bikes';
import { BikeCard } from '../components/BikeCard';

const HeroSearch = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('Son Tra Peninsula');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to bikes page with search queries
    navigate(`/bikes?date=${encodeURIComponent(date)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="bg-surface/85 backdrop-blur-xl p-6 rounded-2xl border border-white/10 w-full max-w-sm relative z-20 shadow-2xl">
      <h3 className="text-white font-semibold mb-4 text-lg">Ngày Nhận/Trả</h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Date Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarDays size={18} className="text-neon" />
          </div>
          <input 
            type="text" 
            placeholder="Chọn ngày nhận & trả" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all duration-300"
          />
        </div>

        <div>
          <h3 className="text-white font-semibold mb-2 text-sm mt-2">Địa Điểm</h3>
          
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={18} className="text-neon" />
              </div>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none appearance-none cursor-pointer transition-all duration-300"
              >
                <option value="Son Tra Peninsula">Bán đảo Sơn Trà</option>
                <option value="Da Nang Airport">Sân bay Đà Nẵng</option>
                <option value="City Center">Trung tâm Thành phố</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-neon text-dark font-bold py-3.5 mt-4 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_25px_rgba(204,255,0,0.6)] cursor-pointer"
        >
          TÌM XE (SEARCH)
        </button>
      </form>
    </div>
  );
};

const HeroSection = () => {
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
              Tự Do <br /> Khám Phá <br />
              <span className="text-neon text-glow">Đường Phố</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-sm ml-auto text-sm leading-relaxed">
              Trải nghiệm dịch vụ thuê xe máy cao cấp chất lượng hàng đầu. Giao nhận xe tận nơi nhanh chóng, thủ tục đơn giản.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface SectionProps {
  bikes: Bike[];
}

const PopularSection = ({ bikes }: SectionProps) => {
  const featuredBikes = bikes.filter(b => b.featured);
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-neon uppercase text-glow">
          CÁC DÒNG XE ĐƯỢC YÊU THÍCH
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredBikes.map((bike, idx) => (
          <BikeCard key={bike.id} bike={bike} large={idx === 0} />
        ))}
      </div>
    </section>
  );
};

const HighQualitySection = ({ bikes }: SectionProps) => {
  const otherBikes = bikes.filter(b => !b.featured).slice(0, 3);
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white uppercase leading-tight">
              THUÊ XE ĐÀ NẴNG <br/><span className="text-neon text-glow">CHẤT LƯỢNG CAO</span>
            </h2>
            <p className="mt-6 text-gray-400 leading-relaxed text-sm">
              Trải nghiệm những dòng xe hiện đại, được bảo dưỡng định kỳ, đảm bảo an toàn tuyệt đối cho mọi chuyến đi của bạn. Khám phá thành phố biển xinh đẹp không giới hạn.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-neon/20 flex items-center justify-center text-neon">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Bảo Dưỡng Định Kỳ</h4>
                  <p className="text-xs text-gray-500">Mỗi xe đều được kiểm tra kỹ lưỡng trước khi giao</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-neon/20 flex items-center justify-center text-neon">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Hỗ Trợ 24/7</h4>
                  <p className="text-xs text-gray-500">Đội ngũ kỹ thuật hỗ trợ tận nơi trên mọi hành trình</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherBikes.map(bike => (
                  <BikeCard key={bike.id} bike={bike} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BannerCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 border-y border-white/5 relative overflow-hidden bg-gradient-to-r from-neon/5 to-transparent">
      <div className="absolute inset-0 bg-neon/5 blur-3xl rounded-full translate-y-1/2 scale-150"></div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="font-display font-bold text-4xl md:text-5xl text-white uppercase leading-tight mb-8">
          KHÁM PHÁ ĐÀ NẴNG <br/> THEO CÁCH THUỘC VỀ <span className="text-neon text-glow">RIÊNG BẠN</span>
        </h2>
        <button 
          onClick={() => navigate('/bikes')}
          className="bg-neon text-dark font-bold px-10 py-4 rounded-full text-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_25px_rgba(204,255,0,0.5)] hover:shadow-[0_0_40px_rgba(204,255,0,0.8)] cursor-pointer"
        >
          ĐẶT CHỖ NGAY (BOOK NOW)
        </button>
      </div>
    </section>
  );
};

export const Home = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);

  useEffect(() => {
    setBikes(getBikes());
  }, []);

  return (
    <div className="flex-grow">
      <HeroSection />
      <PopularSection bikes={bikes} />
      <HighQualitySection bikes={bikes} />
      <BannerCTA />
    </div>
  );
};
