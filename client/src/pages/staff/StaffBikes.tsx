import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Wrench, RefreshCw, Layers, Check, X, Search, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getAllMotorbikes, updateMotorbikeStatus, deleteMotorbike, resetMaintenance, Motorbike } from '../../services/vehicleService.js';

export const StaffBikes = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthToken = (): string => {
    let token = localStorage.getItem('token') || '';
    if (!token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          token = user?.token || '';
        } catch (e) {
          console.error(e);
        }
      }
    }
    return token;
  };

  const loadMotorbikes = async () => {
    try {
      setLoading(true);
      setError('');
      // Load all vehicles from server without filters first, filtering is done locally
      const list = await getAllMotorbikes();
      setBikes(list);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ để tải danh sách xe!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMotorbikes();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'Available' | 'Maintenance') => {
    const token = getAuthToken();
    if (!token) {
      window.alert('Yêu cầu đăng nhập!');
      return;
    }

    try {
      setLoading(true);
      await updateMotorbikeStatus(id, newStatus, token);
      window.alert('Cập nhật trạng thái xe thành công!');
      await loadMotorbikes();
    } catch (err: any) {
      window.alert(err.message || 'Lỗi khi cập nhật trạng thái xe!');
      setLoading(false);
    }
  };

  const handleApproveBike = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    const confirm = window.confirm('Bạn có chắc chắn muốn phê duyệt chiếc xe này hoạt động trên hệ thống?');
    if (!confirm) return;

    try {
      setLoading(true);
      await updateMotorbikeStatus(id, 'Available', token);
      window.alert('Đã phê duyệt xe hoạt động thành công!');
      await loadMotorbikes();
    } catch (err: any) {
      window.alert(err.message || 'Lỗi khi phê duyệt xe!');
      setLoading(false);
    }
  };

  const handleRejectBike = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    const confirm = window.confirm('Bạn có chắc chắn muốn từ chối duyệt và xóa chiếc xe này khỏi hệ thống?');
    if (!confirm) return;

    try {
      setLoading(true);
      await deleteMotorbike(id, token);
      window.alert('Đã từ chối duyệt và xóa xe thành công.');
      await loadMotorbikes();
    } catch (err: any) {
      window.alert(err.message || 'Lỗi khi từ chối xe!');
      setLoading(false);
    }
  };

  const handleResetMaintenance = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    const confirm = window.confirm('Xác nhận chiếc xe này đã được bảo dưỡng, thay dầu xong và muốn đặt lại chu kỳ Odometer mới?');
    if (!confirm) return;

    try {
      setLoading(true);
      await resetMaintenance(id, token);
      window.alert('Đã xác nhận bảo dưỡng xe thành công!');
      await loadMotorbikes();
    } catch (err: any) {
      window.alert(err.message || 'Lỗi khi xác nhận bảo dưỡng xe!');
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Available': return 'Sẵn sàng';
      case 'Rented': return 'Đang cho thuê';
      case 'Maintenance': return 'Đang bảo trì';
      case 'PendingApproval': return 'Chờ duyệt xe';
      default: return status;
    }
  };

  const filteredBikes = bikes.filter(b => {
    const categoryName = typeof b.category === 'object' && b.category !== null ? (b.category as any).name : (b.category || '');
    const matchesSearch = b.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pt-28 pb-20 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-neon uppercase text-glow tracking-tight flex items-center gap-3">
              <Layers size={32} />
              Kiểm Soát & Phê Duyệt Đội Xe
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Phê duyệt xe ký gửi từ đối tác và cập nhật tình trạng kỹ thuật thực tế của xe
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm mẫu xe, biển số..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface border border-gray-800 text-gray-300 text-xs rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all w-full sm:w-60"
              />
            </div>
            <button
              onClick={loadMotorbikes}
              className="flex items-center justify-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-2.5 rounded-lg text-gray-300 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center text-sm flex items-center justify-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
          {[
            { key: 'All', label: 'Tất cả xe' },
            { key: 'PendingApproval', label: 'Chờ phê duyệt' },
            { key: 'Available', label: 'Sẵn sàng' },
            { key: 'Rented', label: 'Đang cho thuê' },
            { key: 'Maintenance', label: 'Đang bảo trì' }
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => setFilterStatus(status.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === status.key ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Bikes Grid */}
        {loading && bikes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Đang tải danh sách xe máy...</div>
        ) : filteredBikes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map(bike => {
              const currentStatus = bike.status || 'Available';
              const owner = typeof bike.ownerId === 'object' ? bike.ownerId : null;
              const ownerName = owner ? `${owner.lastName} ${owner.firstName}` : 'Hệ thống';

              return (
                <motion.div 
                  key={bike._id}
                  whileHover={{ y: -4 }}
                  className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col h-full relative overflow-hidden"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                      currentStatus === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      currentStatus === 'Rented' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      currentStatus === 'Maintenance' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {currentStatus === 'Available' && <ShieldCheck size={12} />}
                      {currentStatus === 'Rented' && <ShieldCheck size={12} />}
                      {currentStatus === 'Maintenance' && <Wrench size={12} />}
                      {currentStatus === 'PendingApproval' && <RefreshCw size={12} className="animate-pulse" />}
                      {getStatusLabel(currentStatus)}
                    </span>
                  </div>

                  {/* Bike Image */}
                  <div className="relative mb-4 aspect-video rounded-lg overflow-hidden bg-black border border-gray-900">
                    <img 
                      src={bike.imageUrls?.[0] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500'} 
                      alt={bike.vehicleModel} 
                      className="w-full h-full object-cover opacity-80" 
                    />
                    <div className="absolute bottom-2 left-2 bg-dark/70 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] text-neon font-bold">
                      {typeof bike.category === 'object' && bike.category !== null ? (bike.category as any).name : bike.category}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col">
                    <h3 className="font-display font-bold text-lg text-white mb-1">{bike.vehicleModel}</h3>
                    <p className="text-neon font-semibold text-sm mb-3">
                      {bike.rentalPrice.toLocaleString('vi-VN')} VNĐ / ngày
                    </p>

                    {/* Specs & Info */}
                    <div className="p-3 bg-black/40 border border-gray-900 rounded-xl mb-4 space-y-1 text-xs text-gray-400">
                      <div>Biển số: <span className="text-white font-mono font-bold">{bike.licensePlate}</span></div>
                      <div>Odometer: <span className="text-white font-mono font-bold">{bike.odometer?.toLocaleString('vi-VN')} km</span></div>
                      <div className="flex items-center gap-1">
                        <User size={12} /> Chủ xe: <span className="text-gray-300 font-medium">{ownerName}</span>
                      </div>
                      {owner?.phoneNumber && (
                        <div className="text-[11px]">SĐT: <span className="text-gray-400 font-mono">{owner.phoneNumber}</span></div>
                      )}
                      {bike.requiresMaintenance && (
                        <div className="pt-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/25 font-bold inline-flex items-center gap-1 animate-pulse">
                            🚨 Cần bảo dưỡng
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto border-t border-gray-800 pt-4">
                      {currentStatus === 'PendingApproval' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleApproveBike(bike._id!)}
                            disabled={loading}
                            className="flex items-center justify-center gap-1 bg-neon text-dark font-bold py-2 rounded-lg text-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check size={14} /> Phê duyệt
                          </button>
                          <button
                            onClick={() => handleRejectBike(bike._id!)}
                            disabled={loading}
                            className="flex items-center justify-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X size={14} /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mb-2 text-center">
                            Cập nhật tình trạng kỹ thuật
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleUpdateStatus(bike._id!, 'Available')}
                              disabled={loading || currentStatus === 'Rented'}
                              className={`py-2 px-1 rounded text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 disabled:opacity-50 ${
                                currentStatus === 'Available'
                                  ? 'bg-green-600 text-white font-black'
                                  : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                              }`}
                            >
                              <ShieldCheck size={12} /> Sẵn Sàng
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(bike._id!, 'Maintenance')}
                              disabled={loading || currentStatus === 'Rented'}
                              className={`py-2 px-1 rounded text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 disabled:opacity-50 ${
                                currentStatus === 'Maintenance'
                                  ? 'bg-red-800 text-white font-black'
                                  : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                              }`}
                            >
                              <Wrench size={12} /> Bảo Trì
                            </button>
                          </div>
                          {bike.requiresMaintenance && (
                            <button
                              type="button"
                              onClick={() => handleResetMaintenance(bike._id!)}
                              className="w-full mt-2 py-2 bg-neon/10 hover:bg-neon hover:text-dark border border-neon/20 hover:border-neon text-neon text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw size={12} /> Đã bảo dưỡng xong (Reset Odo)
                            </button>
                          )}
                          {currentStatus === 'Rented' && (
                            <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                              * Không thể đổi trạng thái khi xe đang được thuê
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-surface/30">
            <Layers size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy xe máy nào</h3>
            <p className="text-gray-500 text-sm">Hãy thử tìm kiếm với bộ lọc hoặc từ khóa khác.</p>
          </div>
        )}

      </div>
    </div>
  );
};
