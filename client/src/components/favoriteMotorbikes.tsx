import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Heart } from 'lucide-react';
import { Motorbike, getUserFavorites, removeFromFavorites } from '../services/vehicleService';
import { useLanguage } from '../hooks/useLanguage';

interface FavoriteMotorbikesProps {
  API_BASE_URL?: string; // Có thể giữ hoặc bỏ nếu đã dùng API_URL trong service
}

export const FavoriteMotorbikes: React.FC<FavoriteMotorbikesProps> = () => {
  const { language, t } = useLanguage();
  const [favorites, setFavorites] = useState<Motorbike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Hàm gọi API lấy danh sách xe đã thích
  const fetchFavorites = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const { token } = JSON.parse(storedUser);
      const res = await getUserFavorites(token);
      
      if (res.success && res.data) {
        setFavorites(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách xe yêu thích:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // 2. Hàm xử lý khi nhấn nút Thùng rác để xóa xe khỏi danh sách yêu thích
  const handleRemove = async (bikeId: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const { token } = JSON.parse(storedUser);
      const res = await removeFromFavorites(token, bikeId);
      if (res.success) {
        // Cập nhật nhanh UI bằng cách lọc bỏ xe vừa xóa ra khỏi State
        setFavorites((prev) => prev.filter((bike) => bike._id !== bikeId));
      }
    } catch (err) {
      console.error('Lỗi khi xóa xe yêu thích:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-gray-800 rounded-2xl p-6 text-center text-gray-400">
        Đang tải danh sách...
      </div>
    );
  }

  return (
    <div className="bg-surface border border-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Thanh sáng neon trên cùng giống thiết kế */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>

      <h2 className="font-display font-bold text-xl text-white uppercase tracking-wide mb-6 flex items-center gap-2">
        <Heart size={20} className="text-neon fill-neon" />
        {language === 'vi' ? 'Xe máy yêu thích của tôi' : 'My Favorite Motorbikes'}
      </h2>

      {favorites.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-black/20">
          <Heart size={40} className="text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">Danh sách yêu thích trống</p>
          <p className="text-gray-500 text-xs mb-4">Hãy khám phá các mẫu xe và nhấn nút trái tim để lưu lại nhé!</p>
          <Link
            to="/bikes"
            className="bg-gray-800 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            Xem danh sách xe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {favorites.map((bike) => {
            // Lấy ảnh đầu tiên hoặc ảnh mặc định
            const bikeImage = bike.imageUrls && bike.imageUrls.length > 0
              ? bike.imageUrls[0]
              : 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800';

            return (
              <div
                key={bike._id}
                className="bg-black/40 border border-gray-800 rounded-xl overflow-hidden flex flex-col group relative hover:border-gray-700 transition-all"
              >
                {/* Nút xóa nhanh (Thùng rác) nằm đè lên góc ảnh giống ảnh image_030b05.png */}
                <button
                  onClick={() => bike._id && handleRemove(bike._id)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-red-500 hover:scale-105 transition-all cursor-pointer"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 size={14} />
                </button>

                {/* Khu vực ảnh xe */}
                <div className="aspect-video w-full overflow-hidden bg-gray-900">
                  <img
                    src={bikeImage}
                    alt={bike.vehicleModel}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-102 transition-all duration-500"
                  />
                </div>

                {/* Khu vực thông tin chi tiết */}
                <div className="p-4 flex-grow flex flex-col">
                  {/* Tên dòng xe */}
                  <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide line-clamp-1">
                    {bike.vehicleModel}
                  </h3>

                  {/* Biển số xe */}
                  <p className="text-gray-400 text-xs mb-4">
                    Biển số: <span className="text-gray-300 font-mono font-medium">{bike.licensePlate || 'Chưa cập nhật'}</span>
                  </p>

                  {/* Giá và nút Thuê ngay ở đáy */}
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Giá thuê</p>
                      <p className="text-neon font-bold text-base">
                        {bike.rentalPrice ? bike.rentalPrice.toLocaleString('vi-VN') : '0'}đ
                        <span className="text-gray-500 text-xs font-normal">/ngày</span>
                      </p>
                    </div>

                    <Link
                      to={`/motorbike/${bike._id}`}
                      className="bg-neon/10 border border-neon/30 hover:bg-neon hover:text-dark text-neon text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-300 uppercase tracking-wider"
                    >
                      Thuê ngay
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};