import React, { useEffect, useState } from 'react';

interface InteractiveMapProps {
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';
  pickupAddress?: string;
  returnAddress?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ status, pickupAddress, returnAddress }) => {
  const [progress, setProgress] = useState(0);

  // Animate the bike along the path if the booking is Ongoing
  useEffect(() => {
    if (status !== 'Ongoing') {
      setProgress(0);
      return;
    }

    let animationFrameId: number;
    let startTime = Date.now();
    const duration = 12000; // 12 seconds loop for simulation

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = (elapsed % duration) / duration;
      setProgress(currentProgress);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  // Path coordinates representing a stylized route in Da Nang (Dragon Bridge area to Son Tra / Beach)
  // Dragon Bridge: (150, 200) -> Han River Bridge: (150, 100) -> My Khe Beach Store: (300, 150) -> Son Tra: (350, 50)
  // SVG size: 400x300
  const pathD = "M 150 220 Q 140 150 160 100 T 300 130 T 330 60";

  // Calculate position along path based on progress
  // Stylized interpolation along control points
  const getBikeCoordinates = () => {
    if (status === 'Pending' || status === 'Cancelled') {
      return { x: 150, y: 220 }; // Store / Pickup start
    }
    if (status === 'Confirmed') {
      return { x: 155, y: 160 }; // Getting ready
    }
    if (status === 'Completed') {
      return { x: 330, y: 60 }; // Destination
    }

    // Ongoing: Calculate path coordinates dynamically along the Bezier curve
    // For simplicity of SVG simulation, we can interpolate along the coordinates:
    // P0(150,220) -> P1(140,150) -> P2(160,100) -> P3(300,130) -> P4(330,60)
    const t = progress;
    // We split into 3 segments for approximation
    if (t < 0.33) {
      const localT = t / 0.33;
      return {
        x: 150 + (160 - 150) * localT,
        y: 220 + (100 - 220) * localT
      };
    } else if (t < 0.66) {
      const localT = (t - 0.33) / 0.33;
      return {
        x: 160 + (300 - 160) * localT,
        y: 100 + (130 - 100) * localT
      };
    } else {
      const localT = (t - 0.66) / 0.34;
      return {
        x: 300 + (330 - 300) * localT,
        y: 130 + (60 - 130) * localT
      };
    }
  };

  const bikePos = getBikeCoordinates();

  return (
    <div className="w-full bg-dark/65 border border-gray-800 rounded-xl p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
          Bản đồ hành trình Live (Đà Nẵng Map)
        </span>
        <span className="text-[10px] text-neon bg-neon/10 px-2 py-0.5 rounded border border-neon/20 font-bold font-mono">
          {status === 'Ongoing' ? 'ĐANG DI CHUYỂN' : status === 'Completed' ? 'ĐÃ ĐẾN NƠI' : 'CHỜ DI CHUYỂN'}
        </span>
      </div>

      <div className="relative w-full aspect-[4/3] bg-black/40 rounded-lg overflow-hidden border border-gray-900">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Background Grid Lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Han River (Sông Hàn) - Decorative Blue Curved Area */}
          <path 
            d="M 120 0 C 130 100 110 200 130 300 L 160 300 C 140 200 160 100 150 0 Z" 
            fill="rgba(59, 130, 246, 0.15)" 
            stroke="rgba(59, 130, 246, 0.25)"
            strokeWidth="2"
          />
          <text x="100" y="270" fill="rgba(59, 130, 246, 0.4)" fontSize="10" fontWeight="bold" transform="rotate(-78, 100, 270)">SÔNG HÀN</text>

          {/* Sea Area (Biển Mỹ Khê) - Right Side */}
          <path 
            d="M 330 0 C 340 100 320 200 340 300 L 400 300 L 400 0 Z" 
            fill="rgba(6, 182, 212, 0.08)"
          />
          <text x="360" y="150" fill="rgba(6, 182, 212, 0.3)" fontSize="10" fontWeight="bold" transform="rotate(90, 360, 150)">BIỂN MỸ KHÊ</text>

          {/* Dragon Bridge (Cầu Rồng) */}
          <line x1="100" y1="210" x2="180" y2="210" stroke="rgba(234, 179, 8, 0.6)" strokeWidth="4" strokeLinecap="round" />
          <text x="75" y="205" fill="rgba(234, 179, 8, 0.7)" fontSize="8" fontWeight="bold">Cầu Rồng</text>

          {/* Han River Bridge (Cầu Sông Hàn) */}
          <line x1="100" y1="110" x2="180" y2="110" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" />
          <text x="65" y="105" fill="rgba(255, 255, 255, 0.5)" fontSize="8" fontWeight="bold">Cầu Sông Hàn</text>

          {/* Stylized Routes (Đường đi chính) */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="rgba(255,255,255,0.08)" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#route-grad)" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          <defs>
            <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Store Pin (Trụ sở Motov) */}
          <circle cx="150" cy="220" r="14" fill="rgba(204, 255, 0, 0.15)" stroke="#CCFF00" strokeWidth="1" />
          <circle cx="150" cy="220" r="5" fill="#CCFF00" />
          <text x="150" y="244" fill="#white" fontSize="8" fontWeight="black" textAnchor="middle">MOTOV STORE</text>

          {/* Customer Destination Pin */}
          <circle cx="330" cy="60" r="14" fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth="1" />
          <circle cx="330" cy="60" r="5" fill="#EF4444" />
          <text x="330" y="82" fill="#white" fontSize="8" fontWeight="bold" textAnchor="middle">ĐIỂM GIAO XE</text>

          {/* Son Tra Peninsula label */}
          <text x="320" y="25" fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontWeight="bold" fontStyle="italic">BÁN ĐẢO SƠN TRÀ</text>

          {/* Interactive Bike Node */}
          <g transform={`translate(${bikePos.x - 10}, ${bikePos.y - 10})`}>
            {/* Pulsing ring around the bike */}
            <circle cx="10" cy="10" r="12" fill="rgba(204, 255, 0, 0.25)" className="animate-ping" style={{ transformOrigin: 'center' }} />
            {/* Bike base circle */}
            <circle cx="10" cy="10" r="8" fill="#CCFF00" stroke="#000" strokeWidth="1.5" />
            {/* Inner dot representing the bike */}
            <circle cx="10" cy="10" r="3" fill="#000" />
          </g>
        </svg>

        {/* Floating coordinates indicator */}
        <div className="absolute bottom-2 left-2 bg-black/85 px-2.5 py-1 rounded text-[9px] font-mono text-gray-500 border border-gray-900 flex flex-col">
          <span>LAT: 16.0544° N</span>
          <span>LNG: 108.2022° E</span>
        </div>

        {/* Delivery Details Overlay */}
        <div className="absolute top-2 right-2 bg-black/85 px-3 py-2 rounded text-[10px] text-gray-400 border border-gray-900 max-w-[160px]">
          <div className="font-bold text-white mb-0.5 truncate">
            {status === 'Ongoing' ? 'Đang trên đường...' : status === 'Completed' ? 'Đã hoàn thành' : 'Đang chuẩn bị xe'}
          </div>
          <div className="truncate text-gray-500" title={pickupAddress || 'Motov Store, Đà Nẵng'}>
            Từ: {pickupAddress || 'Motov Store, Đà Nẵng'}
          </div>
          <div className="truncate text-gray-500" title={returnAddress || 'My Khe, Đà Nẵng'}>
            Đến: {returnAddress || 'My Khe, Đà Nẵng'}
          </div>
        </div>
      </div>
    </div>
  );
};
