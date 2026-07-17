import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { compareVehicles } from '../services/vehicleService';
import { CheckCircle, XCircle, ArrowLeft, Loader, SlidersHorizontal, Star, Zap, Users, Gauge, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function getImageUrl(vehicle: any) {
  if (vehicle.imageUrls && vehicle.imageUrls.length > 0) {
    const url = vehicle.imageUrls[0];
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  }
  return 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800';
}

function getCategory(vehicle: any) {
  if (typeof vehicle.category === 'object' && vehicle.category?.name) return vehicle.category.name;
  return vehicle.category || '—';
}

const TRANSMISSION_MAP: Record<string, string> = {
  Manual: 'Xe Côn Tay',
  Automatic: 'Xe Ga',
  'Semi-Automatic': 'Xe Số'
};

interface CompareRow {
  label: string;
  icon: React.ReactNode;
  getValue: (v: any) => string | React.ReactNode;
  highlight?: boolean; // True if lower = better, false if higher = better, undefined = no highlight
  higherIsBetter?: boolean;
}

const ROWS: CompareRow[] = [
  {
    label: 'Giá thuê / ngày',
    icon: <span className="text-neon">💰</span>,
    getValue: (v) => `${v.rentalPrice?.toLocaleString() || 0}đ`,
    highlight: true,
    higherIsBetter: false
  },
  {
    label: 'Hạng xe',
    icon: <SlidersHorizontal size={14} />,
    getValue: getCategory
  },
  {
    label: 'Hộp số',
    icon: <Zap size={14} />,
    getValue: (v) => TRANSMISSION_MAP[v.transmissionType] || v.transmissionType || '—'
  },
  {
    label: 'Số ghế',
    icon: <Users size={14} />,
    getValue: (v) => `${v.seats || 2} chỗ`,
    highlight: true,
    higherIsBetter: true
  },
  {
    label: 'Số km đã đi',
    icon: <Gauge size={14} />,
    getValue: (v) => `${(v.odometer || 0).toLocaleString()} km`,
    highlight: true,
    higherIsBetter: false
  },
  {
    label: 'Booking thành công',
    icon: <Star size={14} />,
    getValue: (v) => `${v.completedBookings || 0} lần`,
    highlight: true,
    higherIsBetter: true
  },
  {
    label: 'Tình trạng',
    icon: <CheckCircle size={14} />,
    getValue: (v) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        v.status === 'Available' ? 'bg-neon/10 text-neon border border-neon/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
      }`}>
        {v.status === 'Available' ? '✅ Sẵn sàng' : '❌ Không có sẵn'}
      </span>
    )
  },
  {
    label: 'Ngày thêm xe',
    icon: <Calendar size={14} />,
    getValue: (v) => v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : '—'
  }
];

export const CompareBikes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.length < 2) {
      setError('Cần ít nhất 2 xe để so sánh. Hãy quay lại và chọn xe.');
      setLoading(false);
      return;
    }
    compareVehicles(ids)
      .then(data => { setVehicles(data); setLoading(false); })
      .catch(() => { setError('Không thể tải thông tin xe.'); setLoading(false); });
  }, [searchParams]);

  // Find best value for numeric comparison
  function getBestIdx(row: CompareRow): number | null {
    if (!row.highlight) return null;
    const numericValues = vehicles.map(v => {
      const raw = row.getValue(v);
      if (typeof raw === 'string') {
        const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? null : num;
      }
      return null;
    });
    if (numericValues.some(v => v === null)) return null;
    const vals = numericValues as number[];
    if (row.higherIsBetter) {
      const max = Math.max(...vals);
      return vals.indexOf(max);
    } else {
      const min = Math.min(...vals);
      return vals.indexOf(min);
    }
  }

  return (
    <div className="min-h-screen bg-dark text-white py-8 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              <span className="text-neon">So Sánh</span> Xe Máy
            </h1>
            <p className="text-gray-400 text-sm">Chọn xe phù hợp nhất với bạn</p>
          </div>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-neon" size={40} />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center py-20 gap-4">
            <XCircle size={48} className="text-red-400" />
            <p className="text-gray-400">{error}</p>
            <Link to="/bikes" className="bg-neon text-dark font-bold px-6 py-2 rounded-full">
              Khám phá xe ngay
            </Link>
          </div>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

            {/* Vehicle Cards Header */}
            <div className={`grid gap-3 sm:gap-4 mb-6 ${
              vehicles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {vehicles.map((vehicle, idx) => (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-premium border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center relative"
                >
                  {idx === 0 && vehicles.length > 1 && (
                    <div className="absolute top-2 left-2 bg-neon/90 text-dark text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                      ⭐ Gợi ý
                    </div>
                  )}
                  <div className="relative mb-2 sm:mb-3 rounded-lg sm:rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={getImageUrl(vehicle)} alt={vehicle.vehicleModel} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-display font-bold text-xs sm:text-lg text-white mb-0.5 sm:mb-1 line-clamp-2">{vehicle.vehicleModel}</h3>
                  <p className="text-neon font-semibold text-xs sm:text-base">{vehicle.rentalPrice?.toLocaleString()}đ<span className="hidden sm:inline">/ngày</span></p>
                  <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 hidden sm:block">{vehicle.licensePlate}</p>
                  <Link
                    to={`/booking/${vehicle._id}`}
                    className={`mt-2 sm:mt-3 block w-full text-center font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all ${
                      vehicle.status === 'Available'
                        ? 'bg-neon text-dark hover:bg-[#bbf000] shadow-[0_0_12px_rgba(204,255,0,0.25)]'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    onClick={e => vehicle.status !== 'Available' && e.preventDefault()}
                  >
                    {vehicle.status === 'Available' ? 'Đặt xe' : 'Hết'}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="glass-premium border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/3 border-b border-white/5">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Thông Số So Sánh</span>
              </div>

              {ROWS.map((row, rowIdx) => {
                const bestIdx = getBestIdx(row);
                return (
                  <div
                    key={rowIdx}
                    className={`border-b border-white/5 last:border-0 ${rowIdx % 2 === 0 ? 'bg-white/1' : ''}`}
                  >
                    {/* Mobile: stacked label then values */}
                    <div className="sm:hidden">
                      <div className="flex items-center gap-2 px-4 py-2 text-gray-400 text-xs border-b border-white/5">
                        <span className="text-neon">{row.icon}</span>
                        {row.label}
                      </div>
                      <div className={`grid gap-0 ${
                        vehicles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                      }`}>
                        {vehicles.map((vehicle, vIdx) => {
                          const isBest = bestIdx === vIdx;
                          const val = row.getValue(vehicle);
                          return (
                            <div key={vehicle._id} className={`px-3 py-2 text-center text-xs font-medium border-r border-white/5 last:border-0 ${isBest ? 'text-neon' : 'text-white'}`}>
                              {typeof val === 'string' ? (
                                <span>
                                  {val}
                                  {isBest && <span className="ml-1 text-neon">✓</span>}
                                </span>
                              ) : val}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Desktop: side-by-side with label column */}
                    <div
                      className="hidden sm:grid items-center"
                      style={{ gridTemplateColumns: `180px repeat(${vehicles.length}, 1fr)` }}
                    >
                      <div className="flex items-center gap-2 px-5 py-3.5 text-gray-400 text-sm">
                        <span className="text-neon">{row.icon}</span>
                        {row.label}
                      </div>
                      {vehicles.map((vehicle, vIdx) => {
                        const isBest = bestIdx === vIdx;
                        const val = row.getValue(vehicle);
                        return (
                          <div key={vehicle._id} className={`px-4 py-3.5 text-center text-sm font-medium ${isBest ? 'text-neon' : 'text-white'}`}>
                            {typeof val === 'string' ? (
                              <span>
                                {val}
                                {isBest && (
                                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-neon/20 text-neon rounded-full text-xs">✓</span>
                                )}
                              </span>
                            ) : val}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Features row */}
              <div className="border-b border-white/5 bg-white/1">
                {/* Mobile features */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-400 text-xs border-b border-white/5">
                    <span className="text-neon">⚙️</span> Tính năng
                  </div>
                  <div className={`grid ${
                    vehicles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                  }`}>
                    {vehicles.map((vehicle) => (
                      <div key={vehicle._id} className="px-3 py-2 border-r border-white/5 last:border-0">
                        {vehicle.features && vehicle.features.length > 0 ? (
                          <ul className="space-y-0.5">
                            {vehicle.features.slice(0, 3).map((feat: string, fi: number) => (
                              <li key={fi} className="flex items-center gap-1 text-[10px] text-gray-300">
                                <span className="w-1 h-1 rounded-full bg-neon flex-shrink-0" />
                                {feat}
                              </li>
                            ))}
                            {vehicle.features.length > 3 && (
                              <li className="text-[10px] text-gray-500">+{vehicle.features.length - 3} khác</li>
                            )}
                          </ul>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop features */}
                <div
                  className="hidden sm:grid items-start"
                  style={{ gridTemplateColumns: `180px repeat(${vehicles.length}, 1fr)` }}
                >
                  <div className="flex items-center gap-2 px-5 py-3.5 text-gray-400 text-sm">
                    <span className="text-neon">⚙️</span>
                    Tính năng nổi bật
                  </div>
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="px-4 py-3.5">
                      {vehicle.features && vehicle.features.length > 0 ? (
                        <ul className="space-y-1">
                          {vehicle.features.slice(0, 4).map((feat: string, fi: number) => (
                            <li key={fi} className="flex items-center gap-1.5 text-xs text-gray-300">
                              <span className="w-1 h-1 rounded-full bg-neon flex-shrink-0" />
                              {feat}
                            </li>
                          ))}
                          {vehicle.features.length > 4 && (
                            <li className="text-xs text-gray-500">+{vehicle.features.length - 4} tính năng khác</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 sm:mt-8 text-center">
              <Link to="/bikes" className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Quay lại danh sách xe và tiếp tục chọn
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
