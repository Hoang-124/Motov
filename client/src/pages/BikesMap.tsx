import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, RefreshCw, Compass, AlertCircle, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

interface NearbyBike {
  _id: string;
  id?: string;
  vehicleModel: string;
  licensePlate: string;
  rentalPrice: number;
  transmissionType: 'Manual' | 'Automatic' | 'Semi-Automatic';
  imageUrls: string[];
  distance: number;
  category?: {
    name: string;
  };
  location?: {
    type: string;
    coordinates: number[];
  };
}


export const BikesMap = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [bikes, setBikes] = useState<NearbyBike[]>([]);
  const [mapRadius, setMapRadius] = useState<number>(5000); // 5km radius
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Dynamic Loader for Leaflet JS & CSS
  const loadLeaflet = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).L) {
        resolve((window as any).L);
        return;
      }

      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => resolve((window as any).L);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  };

  // Get user GPS coordinates
  const getUserLocation = (): Promise<[number, number]> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve([16.068, 108.22]);
        return;
      }

      setIsGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGpsLoading(false);
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.warn('Geolocation access denied/failed, falling back to Da Nang center.', err);
          setIsGpsLoading(false);
          resolve([16.068, 108.22]); // Da Nang default
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  // Fetch nearby vehicles
  const fetchNearbyBikes = async (lat: number, lng: number, radius: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setBikes(data.data || []);
      } else {
        throw new Error(data.message || 'Không thể tải danh sách xe máy xung quanh.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối máy chủ.');
    }
  };

  // Initialize Map and Load Data
  useEffect(() => {
    const initFlow = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get GPS coordinates
        const coords = await getUserLocation();
        setUserCoords(coords);

        // 2. Fetch nearby vehicles
        await fetchNearbyBikes(coords[0], coords[1], mapRadius);

        // 3. Load Leaflet library
        const L = await loadLeaflet();

        // 4. Initialize Map container if not already initialized
        if (!mapRef.current) {
          const map = L.map('bikes-leaflet-map').setView(coords, 14);

          // Add CartoDB Dark Matter tile layer for premium Dark Mode Look
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(map);

          mapRef.current = map;
        } else {
          mapRef.current.setView(coords, mapRef.current.getZoom());
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Không thể khởi tạo bản đồ.');
        setLoading(false);
      }
    };

    initFlow();

    return () => {
      // Clean up map resources on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers on Map when coords, bikes, or mapRadius changes
  useEffect(() => {
    if (loading || !mapRef.current || !userCoords) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear old vehicle markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // 1. Plot User Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="background-color: #00e5ff; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 15px #00e5ff;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const userMarker = L.marker(userCoords, { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup(`<div style="color: #00e5ff; font-weight: bold; text-align: center; font-size: 12px; font-family: sans-serif; padding: 4px;">Vị trí của bạn</div>`);
    userMarkerRef.current = userMarker;

    // 2. Plot Bikes Markers
    bikes.forEach(bike => {
      const bikeLng = bike.location?.coordinates?.[0];
      const bikeLat = bike.location?.coordinates?.[1];

      if (bikeLng && bikeLat) {
        const bikeIcon = L.divIcon({
          className: 'custom-bike-marker',
          html: `<div style="background-color: #ccff00; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #000; box-shadow: 0 0 12px #ccff00; display: flex; align-items: center; justify-content: center; color: #000; font-size: 8px; font-weight: bold;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const bikeImage = bike.imageUrls?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=200';
        const popupHtml = `
          <div style="font-family: sans-serif; width: 220px; color: #fff; background-color: #0d0d0d; border-radius: 8px; overflow: hidden; font-size: 13px; border: 1px solid #222;">
            <img src="${bikeImage}" style="width: 100%; height: 120px; object-fit: cover; display: block;" />
            <div style="padding: 12px;">
              <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #ccff00; text-transform: uppercase;">${bike.vehicleModel}</h4>
              <div style="color: #777; font-size: 11px; margin-bottom: 6px; font-mono">Biển số: ${bike.licensePlate}</div>
              <div style="font-weight: bold; font-size: 14px; color: #fff; margin-bottom: 8px;">${bike.rentalPrice.toLocaleString('vi-VN')} VNĐ/ngày</div>
              <div style="color: #00e5ff; font-size: 12px; font-weight: bold; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                <span>📍 Cách bạn ${bike.distance} km</span>
              </div>
              <a href="/bikes/${bike._id || bike.id}" style="display: block; text-align: center; background-color: #ccff00; color: #000; font-weight: bold; padding: 8px 0; border-radius: 6px; text-decoration: none; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; transition: opacity 0.2s;">Thuê ngay</a>
            </div>
          </div>
        `;

        const marker = L.marker([bikeLat, bikeLng], { icon: bikeIcon })
          .addTo(mapRef.current)
          .bindPopup(popupHtml, {
            maxWidth: 240,
            closeButton: false
          });

        markersRef.current.push(marker);
      }
    });
  }, [loading, bikes, userCoords]);

  // Recenter map to user location
  const handleRecenter = async () => {
    if (!mapRef.current) return;
    try {
      setError(null);
      const coords = await getUserLocation();
      setUserCoords(coords);
      mapRef.current.setView(coords, mapRef.current.getZoom());
      await fetchNearbyBikes(coords[0], coords[1], mapRadius);
    } catch (err: any) {
      setError(err.message || 'Không thể định vị GPS.');
    }
  };

  // Handle radius change
  const handleRadiusChange = async (radius: number) => {
    setMapRadius(radius);
    if (userCoords) {
      setLoading(true);
      await fetchNearbyBikes(userCoords[0], userCoords[1], radius);
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-black text-white relative">
      <style>{`
        /* Styles to theme Leaflet popup to dark cyberpunk mode */
        .leaflet-popup-content-wrapper {
          background: #0d0d0d !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.8) !important;
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip {
          background: #0d0d0d !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .leaflet-container {
          background: #000 !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Navigation back and Title */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-gray-400 hover:text-neon text-xs font-bold uppercase tracking-wider mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              Quay lại danh sách
            </button>
            <h1 className="text-3xl font-display font-black text-neon uppercase tracking-tight text-glow flex items-center gap-3">
              <Compass className="text-neon" size={32} />
              Bản Đồ Định Vị Xe Gần Bạn
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Xem trực quan vị trí các xe máy đối tác đang rảnh và khoảng cách để lựa chọn thuận tiện nhất
            </p>
          </div>

          {/* Quick filters for search radius */}
          <div className="flex items-center gap-2 bg-surface/50 border border-gray-800 rounded-xl p-1.5 select-none">
            <span className="text-[10px] text-gray-500 font-bold uppercase px-2">Bán kính:</span>
            {[
              { label: '1 km', value: 1000 },
              { label: '3 km', value: 3000 },
              { label: '5 km', value: 5000 },
              { label: '10 km', value: 10000 }
            ].map(r => (
              <button
                key={r.value}
                onClick={() => handleRadiusChange(r.value)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  mapRadius === r.value 
                    ? 'bg-neon text-dark font-black shadow-[0_0_10px_rgba(204,255,0,0.3)]' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm flex items-center justify-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Left panel: list of nearby vehicles with details */}
          <div className="lg:col-span-1 bg-surface/40 border border-gray-800 rounded-2xl p-4 flex flex-col max-h-[600px] overflow-hidden">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-3 flex items-center justify-between border-b border-gray-800/80 pb-2.5">
              <span>Xe máy gần nhất ({bikes.length})</span>
              <button 
                onClick={handleRecenter}
                disabled={isGpsLoading || loading}
                className="text-neon hover:text-white transition-colors cursor-pointer"
                title="Cập nhật GPS và làm mới"
              >
                <RefreshCw size={14} className={isGpsLoading || loading ? 'animate-spin' : ''} />
              </button>
            </h3>

            <div className="overflow-y-auto space-y-3 flex-grow pr-1">
              {loading ? (
                <div className="text-center py-20 text-gray-500 text-xs">Đang dò tìm xe...</div>
              ) : bikes.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-xs">Không tìm thấy xe máy nào trong phạm vi này. Thử tăng bán kính tìm kiếm.</div>
              ) : (
                bikes.map(bike => (
                  <div 
                    key={bike._id} 
                    onClick={() => {
                      if (mapRef.current) {
                        const bikeLng = bike.location?.coordinates?.[0];
                        const bikeLat = bike.location?.coordinates?.[1];
                        if (bikeLng && bikeLat) {
                          mapRef.current.setView([bikeLat, bikeLng], 16);
                        }
                      }
                    }}
                    className="p-3 bg-black/40 border border-gray-900 rounded-xl hover:border-neon transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <img 
                        src={bike.imageUrls?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=200'} 
                        alt={bike.vehicleModel} 
                        className="w-14 h-14 object-cover rounded-lg border border-gray-800 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-xs truncate group-hover:text-neon transition-colors">{bike.vehicleModel}</h4>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{bike.category?.name || 'Xe ga/số'} • {bike.licensePlate}</div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[11px] font-bold text-gray-200">{bike.rentalPrice.toLocaleString('vi-VN')}đ</span>
                          <span className="text-[10px] text-neon font-bold">📍 {bike.distance} km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Map container */}
          <div className="lg:col-span-3 bg-surface/30 border border-gray-800 rounded-3xl overflow-hidden relative shadow-2xl min-h-[500px] lg:min-h-[600px]">
            {loading && !mapRef.current && (
              <div className="absolute inset-0 bg-black/85 z-10 flex flex-col items-center justify-center">
                <RefreshCw size={36} className="text-neon animate-spin mb-3" />
                <span className="text-xs uppercase tracking-widest text-neon font-bold">Đang tải bản đồ & định vị GPS...</span>
              </div>
            )}
            
            {/* The Leaflet Map element */}
            <div id="bikes-leaflet-map" className="w-full h-full min-h-[500px] lg:min-h-[600px] z-0"></div>

            {/* Float Recenter Button */}
            {!loading && (
              <button 
                onClick={handleRecenter}
                disabled={isGpsLoading}
                className="absolute bottom-5 right-5 z-[5] bg-neon hover:bg-[#bbf000] text-dark p-3 rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center disabled:opacity-50"
                title="Quay lại vị trí của tôi"
              >
                <Compass size={20} className={isGpsLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
