import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Motorbike } from '../services/vehicleService';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface BikeCardProps {
  bike: Motorbike;
  large?: boolean;
}

export const BikeCard = ({ bike, large = false }: BikeCardProps) => {
  const { language, t } = useLanguage();
  const ownerName = typeof bike.ownerId === 'string' 
    ? 'Unknown Owner' 
    : bike.ownerId && typeof bike.ownerId === 'object' && bike.ownerId.firstName
    ? `${bike.ownerId.firstName} ${bike.ownerId.lastName}`
    : 'Unknown Owner';

  const imageUrl = bike.imageUrls && bike.imageUrls.length > 0 
    ? bike.imageUrls[0] 
    : 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800';

  const translateCategory = (cat: string) => {
    if (language === 'vi') return cat;
    if (cat === 'Xe Côn Tay') return 'Clutch Bike';
    if (cat === 'Xe Máy Điện') return 'Electric Bike';
    if (cat === 'Xe Ga') return 'Scooter';
    if (cat === 'Xe Số') return 'Semi-Automatic';
    return cat;
  };

  const translateFeature = (feat: string) => {
    if (language === 'vi') return feat;
    if (feat === 'Động Cơ DOHC 150cc') return '150cc DOHC Engine';
    if (feat === 'Tư Thế Ngồi Thoải Mái') return 'Comfortable Position';
    if (feat === 'Động Cơ Điện 3000W') return '3000W Electric Motor';
    if (feat === 'Quãng Đường 198km') return '198km Range';
    if (feat === 'Quãng Đường 203km/Sạc') return '203km/Charge';
    if (feat === 'Pin LFP Tiên Tiến') return 'Advanced LFP Battery';
    return feat;
  };

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className={`bg-surface neon-border rounded-xl p-5 flex flex-col h-full group ${large ? 'lg:col-span-2' : ''}`}
    >
      <Link 
        to={`/motorbike/${bike._id}`}
        className={`relative mb-6 rounded-lg overflow-hidden bg-black block ${large ? 'aspect-video lg:aspect-[21/9]' : 'aspect-video'}`}
      >
        <img 
          src={imageUrl} 
          alt={bike.vehicleModel} 
          loading="lazy"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 cursor-pointer"
        />
        <div className="absolute top-3 left-3 bg-dark/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-neon border border-neon/30">
          {translateCategory(bike.category)}
        </div>
        <div className="absolute top-3 right-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            bike.status === 'Available' 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {bike.status}
          </div>
        </div>
      </Link>
      
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <Link 
            to={`/motorbike/${bike._id}`}
            className="group/title flex-grow"
          >
            <h3 className="font-display font-bold text-2xl text-white group-hover/title:text-neon transition-colors duration-300 cursor-pointer">
              {bike.vehicleModel}
            </h3>
          </Link>
        </div>
        <p className="text-neon font-semibold text-lg mb-1">
          {bike.rentalPrice ? bike.rentalPrice.toLocaleString() : '0'} VNĐ{' '}
          <span className="text-gray-400 text-xs font-normal">
            / {language === 'vi' ? 'Ngày' : 'Day'}
          </span>
        </p>
        
        {/* License Plate */}
        <p className="text-gray-400 text-xs mb-4">{t('bikesPage.plate', { plate: bike.licensePlate })}</p>
        
        <div className={`grid gap-2 mb-8 ${large ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
            {language === 'vi' ? bike.transmissionType : (bike.transmissionType === 'Manual' ? 'Manual' : bike.transmissionType === 'Automatic' ? 'Automatic' : bike.transmissionType)}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
            {t('bikesPage.seats', { seats: bike.seats })}
          </div>
          {bike.features && bike.features.slice(0, 2).map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
              {translateFeature(feature)}
            </div>
          ))}
        </div>

        {/* Owner Info */}
        <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
          <MapPin size={14} />
          {t('bikesPage.owner', { owner: ownerName })}
        </div>
        
        <div className="mt-auto">
          <Link 
            to={`/booking/${bike._id}`}
            className={`w-full text-center font-bold px-6 py-3 rounded-full transition-all duration-300 inline-block ${
              bike.status === 'Available'
                ? 'bg-neon text-dark hover:bg-[#bbf000] shadow-[0_0_12px_rgba(204,255,0,0.25)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)]'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => bike.status !== 'Available' && e.preventDefault()}
          >
            {bike.status === 'Available' ? t('bikesPage.bookNowBtn') : t('bikesPage.notAvailable')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
