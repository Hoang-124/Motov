import React, { useState, useEffect } from 'react';
import { getBikes, saveBikes, Bike } from '../../data/bikes';
import { ShieldCheck, ShieldAlert, Wrench, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'motion/react';

// Extended Bike interface inside component for status handling
interface BikeWithStatus extends Bike {
  status?: 'Sẵn sàng' | 'Đang cho thuê' | 'Đang bảo trì';
}

export const StaffBikes = () => {
  const [bikes, setBikes] = useState<BikeWithStatus[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const list = getBikes() as BikeWithStatus[];
    // Ensure every bike has a status
    const initialized = list.map(b => ({
      ...b,
      status: b.status || 'Sẵn sàng'
    }));
    setBikes(initialized);
  }, []);

  const handleUpdateStatus = (id: string, newStatus: 'Sẵn sàng' | 'Đang cho thuê' | 'Đang bảo trì') => {
    const updated = bikes.map(b => {
      if (b.id === id) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBikes(updated);
    saveBikes(updated);
  };

  const types = ['All', ...Array.from(new Set(bikes.map(b => b.type)))];

  const filteredBikes = bikes.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || b.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
              <Layers size={36} />
              Trạng Thái Đội Xe
            </h1>
            <p className="text-gray-400 text-sm">
              Xem và thay đổi trạng thái hoạt động thực tế của từng xe máy trong kho
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Tìm xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-gray-800 text-gray-300 text-xs rounded-lg p-3 outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
            />
            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-surface border border-gray-800 text-gray-300 text-xs rounded-lg p-3 outline-none cursor-pointer"
            >
              {types.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'Tất cả phân loại' : t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bikes Grid */}
        {filteredBikes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map(bike => {
              const currentStatus = bike.status || 'Sẵn sàng';
              return (
                <motion.div 
                  key={bike.id}
                  whileHover={{ y: -4 }}
                  className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col h-full relative"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                      currentStatus === 'Sẵn sàng' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      currentStatus === 'Đang cho thuê' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {currentStatus === 'Sẵn sàng' && <ShieldCheck size={12} />}
                      {currentStatus === 'Đang cho thuê' && <ShieldAlert size={12} />}
                      {currentStatus === 'Đang bảo trì' && <Wrench size={12} />}
                      {currentStatus}
                    </span>
                  </div>

                  {/* Bike Image */}
                  <div className="relative mb-4 aspect-video rounded-lg overflow-hidden bg-black border border-gray-900">
                    <img src={bike.image} alt={bike.name} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute bottom-2 left-2 bg-dark/70 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] text-gray-400">
                      {bike.type}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col">
                    <h3 className="font-display font-bold text-lg text-white mb-1">{bike.name}</h3>
                    <p className="text-neon font-semibold text-sm mb-4">{bike.price} VNĐ / ngày</p>

                    {/* Quick Specs */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {bike.specs.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-black/40 text-gray-500 border border-gray-900 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Status Actions */}
                    <div className="mt-auto border-t border-gray-800 pt-4">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2 text-center">Cập nhật tình trạng</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => handleUpdateStatus(bike.id, 'Sẵn sàng')}
                          className={`py-1.5 px-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'Sẵn sàng'
                              ? 'bg-green-600 text-white font-black'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          Sẵn Sàng
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(bike.id, 'Đang cho thuê')}
                          className={`py-1.5 px-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'Đang cho thuê'
                              ? 'bg-yellow-600 text-white font-black'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          Thuê Xe
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(bike.id, 'Đang bảo trì')}
                          className={`py-1.5 px-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'Đang bảo trì'
                              ? 'bg-red-800 text-white font-black'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          Bảo Trì
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
            <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy xe máy nào</h3>
            <p className="text-gray-500 text-sm">Hãy thử tìm với từ khóa khác.</p>
          </div>
        )}

      </div>
    </div>
  );
};
