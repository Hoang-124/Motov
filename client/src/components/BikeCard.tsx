import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bike } from '../data/bikes';

interface BikeCardProps {
  bike: Bike;
  large?: boolean;
}

export const BikeCard = ({ bike, large = false }: BikeCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className={`bg-surface neon-border rounded-xl p-5 flex flex-col h-full group ${large ? 'lg:col-span-2' : ''}`}
    >
      <div className={`relative mb-6 rounded-lg overflow-hidden bg-black ${large ? 'aspect-video lg:aspect-[21/9]' : 'aspect-video'}`}>
        <img 
          src={bike.image} 
          alt={bike.name} 
          loading="lazy"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-dark/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-neon border border-neon/30">
          {bike.type}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-bold text-2xl text-white group-hover:text-neon transition-colors duration-300">
            {bike.name}
          </h3>
        </div>
        <p className="text-neon font-semibold text-lg mb-6">{bike.price} VNĐ <span className="text-gray-400 text-xs font-normal">/ Ngày</span></p>
        
        <div className={`grid gap-2 mb-8 ${large ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          {bike.specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
              {spec}
            </div>
          ))}
        </div>
        
        <div className="mt-auto">
          <Link 
            to={`/booking/${bike.id}`}
            className="w-full text-center bg-neon text-dark font-bold px-6 py-3 rounded-full hover:bg-[#bbf000] transition-all duration-300 inline-block shadow-[0_0_12px_rgba(204,255,0,0.25)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)]"
          >
            ĐẶT NGAY (BOOK NOW)
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
