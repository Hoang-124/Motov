import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BIKES } from '../data/bikes';
import { BikeCard } from '../components/BikeCard';
import { SlidersHorizontal, Search } from 'lucide-react';

export const Bikes = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  const initialDate = searchParams.get('date') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [priceSort, setPriceSort] = useState('Default');

  // Available bike types
  const types = useMemo(() => {
    const allTypes = BIKES.map(bike => bike.type);
    return ['All', ...Array.from(new Set(allTypes))];
  }, []);

  // Filter and sort bikes
  const filteredBikes = useMemo(() => {
    let result = [...BIKES];

    // Search query filter
    if (searchQuery.trim() !== '') {
      result = result.filter(bike => 
        bike.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bike.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'All') {
      result = result.filter(bike => bike.type === selectedType);
    }

    // Sort by price
    if (priceSort === 'LowToHigh') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (priceSort === 'HighToLow') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return result;
  }, [searchQuery, selectedType, priceSort]);

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
            Danh Sách Xe Máy
          </h1>
          <p className="text-gray-400 text-sm">
            {initialLocation && `Đang tìm xe nhận tại: ${initialLocation}`}
            {initialDate && ` • Ngày: ${initialDate}`}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface border border-gray-800 rounded-2xl p-6 mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between shadow-lg">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm dòng xe..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filter by Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:inline">Phân loại:</span>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent p-3 outline-none appearance-none cursor-pointer transition-all duration-300"
              >
                {types.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'Tất cả dòng xe' : t}</option>
                ))}
              </select>
            </div>

            {/* Sort by Price */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:inline">Sắp xếp giá:</span>
              <select 
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                className="bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent p-3 outline-none appearance-none cursor-pointer transition-all duration-300"
              >
                <option value="Default">Mặc định</option>
                <option value="LowToHigh">Từ thấp đến cao</option>
                <option value="HighToLow">Từ cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bikes Grid */}
        {filteredBikes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map(bike => (
              <BikeCard key={bike.id} bike={bike} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-surface/50">
            <p className="text-gray-500 mb-2">Không tìm thấy dòng xe phù hợp với bộ lọc.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedType('All'); setPriceSort('Default'); }}
              className="text-neon text-sm underline hover:text-white transition-colors"
            >
              Reset bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
