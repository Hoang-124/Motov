import React, { useState, useEffect } from 'react';
import { 
  getAllMotorbikes, 
  createMotorbike, 
  updateMotorbike, 
  deleteMotorbike, 
  updateMotorbikeStatus,
  Motorbike 
} from '../../services/vehicleService';
import { Plus, Edit2, Trash2, X, Star, AlertCircle, Sparkles, User, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminBikes = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Motorbike> | null>(null);
  
  // Form fields
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [category, setCategory] = useState('Scooter');
  const [transmissionType, setTransmissionType] = useState<'Manual' | 'Automatic' | 'Semi-Automatic'>('Automatic');
  const [image, setImage] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [description, setDescription] = useState('');
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);

  const getAvailableCountForModel = (modelName: string) => {
    return bikes.filter(b => b.vehicleModel === modelName && b.status === 'Available').length;
  };

  const loadBikes = async () => {
    try {
      setLoading(true);
      const filters = filterStatus === 'All' ? {} : { status: filterStatus };
      const data = await getAllMotorbikes(filters);
      setBikes(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ để tải danh sách xe!');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBikes();
  }, [filterStatus]);

  const openAddModal = () => {
    setCurrentBike(null);
    setVehicleModel('');
    setLicensePlate('');
    setRentalPrice('');
    setCategory('Scooter');
    setTransmissionType('Automatic');
    setImage('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800');
    setFeaturesInput('Bảo hiểm dân sự, Smartkey, Cốp rộng');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Motorbike) => {
    setCurrentBike(bike);
    setVehicleModel(bike.vehicleModel);
    setLicensePlate(bike.licensePlate);
    setRentalPrice(bike.rentalPrice.toString());
    setCategory(bike.category);
    setTransmissionType(bike.transmissionType || 'Automatic');
    setImage(bike.imageUrls?.[0] || '');
    setFeaturesInput(bike.features ? bike.features.join(', ') : '');
    setDescription(bike.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setBikeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bikeToDelete) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await deleteMotorbike(bikeToDelete, token);
      setDeleteConfirmOpen(false);
      setBikeToDelete(null);
      setSuccessMessage('Xe đã được xóa thành công!');
      loadBikes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi xóa xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleApproveBike = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      await updateMotorbikeStatus(id, 'Available', token);
      setSuccessMessage('Phê duyệt xe hoạt động thành công!');
      loadBikes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi phê duyệt xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const getOwnerDisplay = (owner: any) => {
    if (!owner) return 'Hệ thống (System)';
    if (typeof owner === 'string') return owner;
    const name = `${owner.lastName || ''} ${owner.firstName || ''}`.trim();
    return name ? `${name} (${owner.email})` : owner.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const parsedFeatures = featuresInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const token = localStorage.getItem('token') || '';

      if (currentBike && currentBike._id) {
        // Edit
        const updatedData: Partial<Motorbike> = {
          vehicleModel,
          licensePlate,
          rentalPrice: Number(rentalPrice),
          category,
          transmissionType,
          imageUrls: [image],
          features: parsedFeatures,
          description
        };
        await updateMotorbike(currentBike._id, updatedData, token);
        setSuccessMessage(`Xe "${vehicleModel}" đã được cập nhật thành công!`);
      } else {
        // Create
        const newData: Omit<Motorbike, '_id' | 'createdAt' | 'updatedAt'> = {
          ownerId: '', // Sẽ do backend lấy id người đăng nhập (Admin)
          vehicleModel,
          licensePlate,
          seats: 2,
          odometer: 0,
          rentalPrice: Number(rentalPrice),
          status: 'Available',
          category,
          transmissionType,
          imageUrls: [image],
          features: parsedFeatures,
          description
        };
        await createMotorbike(newData, token);
        setSuccessMessage(`Xe "${vehicleModel}" đã được thêm thành công!`);
      }

      setIsModalOpen(false);
      loadBikes();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu thông tin xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Notification Toasts */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full px-4"
            >
              <div className="bg-green-500 text-dark font-bold px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 border border-green-400/20 backdrop-blur-md">
                <Check size={18} />
                {successMessage}
              </div>
            </motion.div>
          )}
          
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full px-4"
            >
              <div className="bg-red-500 text-dark font-bold px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 border border-red-400/20 backdrop-blur-md">
                <AlertCircle size={18} />
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
              Quản Lý Dòng Xe
            </h1>
            <p className="text-gray-400 text-sm">
              Xem danh sách, kiểm duyệt xe mới của chủ xe đối tác hoặc cập nhật thông tin dòng xe máy
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={loadBikes}
              className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-3 rounded-lg text-gray-300 transition-all cursor-pointer h-full"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-neon text-dark font-bold px-6 py-3.5 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-102 cursor-pointer whitespace-nowrap"
            >
              <Plus size={18} />
              THÊM XE MỚI
            </button>
          </div>
        </div>

        {/* Filter quick status */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
          {[
            { key: 'All', label: 'Tất cả xe' },
            { key: 'PendingApproval', label: '⏳ Chờ phê duyệt' },
            { key: 'Available', label: '✓ Đang hoạt động' },
            { key: 'Rented', label: '🚴 Đang cho thuê' },
            { key: 'Maintenance', label: '🔧 Đang bảo trì' }
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => setFilterStatus(status.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === status.key ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Bikes Table/Grid */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                  <th className="py-4 px-6">Hình ảnh</th>
                  <th className="py-4 px-6">Tên dòng xe / Biển số</th>
                  <th className="py-4 px-6">Phân loại</th>
                  <th className="py-4 px-6">Chủ sở hữu (Owner)</th>
                  <th className="py-4 px-6">Giá thuê / ngày</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {bikes.map(bike => (
                  <tr key={bike._id} className="hover:bg-black/20 transition-colors">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => openEditModal(bike)}
                        className="w-16 h-12 rounded overflow-hidden border border-gray-800 bg-black hover:border-neon/50 transition-all cursor-pointer group"
                      >
                        <img src={bike.imageUrls?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'} alt={bike.vehicleModel} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(bike)}
                          className="hover:text-neon transition-colors cursor-pointer text-left block font-bold"
                        >
                          {bike.vehicleModel}
                        </button>
                        {bike.status === 'Available' && getAvailableCountForModel(bike.vehicleModel) <= 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 border border-red-500/25 font-bold shrink-0 animate-pulse">
                            ⚠️ Sắp hết xe
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono block mt-1">Biển số: {bike.licensePlate}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15">
                        {bike.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <User size={13} className="text-neon shrink-0" />
                        <span className="font-mono text-gray-400 truncate max-w-[200px]" title={getOwnerDisplay(bike.ownerId)}>
                          {getOwnerDisplay(bike.ownerId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-neon">{bike.rentalPrice.toLocaleString('vi-VN')} VNĐ</td>
                    <td className="py-4 px-6">
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          bike.status === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          bike.status === 'PendingApproval' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          bike.status === 'Rented' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {bike.status === 'Available' ? '✓ Đang hoạt động' :
                           bike.status === 'PendingApproval' ? '⏳ Chờ phê duyệt' :
                           bike.status === 'Rented' ? '🚴 Đang cho thuê' : '🔧 Bảo trì'}
                        </span>
                        {bike.status === 'Available' && getAvailableCountForModel(bike.vehicleModel) <= 1 && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                            <span>Chỉ còn {getAvailableCountForModel(bike.vehicleModel)} xe trống</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {bike.status === 'PendingApproval' && (
                          <button
                            onClick={() => handleApproveBike(bike._id!)}
                            className="p-2 rounded bg-black hover:bg-green-950/40 text-green-500 border border-gray-800 hover:border-green-500/30 transition-all cursor-pointer"
                            title="Phê duyệt xe hoạt động"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(bike)}
                          className="p-2 rounded bg-black hover:bg-gray-800 text-yellow-500 border border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(bike._id!)}
                          className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                          title="Xóa xe"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <RefreshCw size={32} className="mx-auto mb-2 text-neon animate-spin" />
              Đang đồng bộ danh sách xe từ máy chủ...
            </div>
          ) : bikes.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <AlertCircle size={32} className="mx-auto mb-2 text-gray-600" />
              Không tìm thấy dòng xe nào phù hợp bộ lọc.
            </div>
          )}
        </div>

        {/* Dynamic Edit/Create Modal overlay */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                  <Sparkles size={18} className="text-neon" />
                  <h3 className="font-display font-bold text-xl text-white uppercase">
                    {currentBike ? 'Chỉnh Sửa Thông Tin Xe' : 'Thêm Dòng Xe Mới'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên dòng xe</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Yamaha Exciter 155"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  {/* License Plate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Biển số xe</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 29A1-99999"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phân loại</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Scooter">Scooter (Xe ga)</option>
                        <option value="Classic">Classic (Cổ điển)</option>
                        <option value="Sport">Sport (Thể thao)</option>
                        <option value="Sport Cafe">Sport Cafe</option>
                        <option value="Underbone">Underbone (Xe số côn tay)</option>
                      </select>
                    </div>

                    {/* Transmission Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hộp số</label>
                      <select
                        value={transmissionType}
                        onChange={(e) => setTransmissionType(e.target.value as any)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Automatic">Automatic (Xe ga)</option>
                        <option value="Manual">Manual (Côn tay)</option>
                        <option value="Semi-Automatic">Semi-Automatic (Xe số)</option>
                      </select>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá thuê / ngày (VNĐ)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ví dụ: 120000"
                      value={rentalPrice}
                      onChange={(e) => setRentalPrice(e.target.value)}
                      min="0"
                      step="1000"
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                  </div>

                  {/* Image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đường dẫn hình ảnh (URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả xe</label>
                    <textarea
                      placeholder="Nhập mô tả chi tiết về tình trạng xe, điều khoản cho thuê..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Specs / Features */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiện ích (Cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      placeholder="Phanh ABS, Động cơ VVA, Smartkey, v.v."
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-grow bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '⏳ Đang lưu...' : 'LƯU THAY ĐỔI'}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                {/* Neon top line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>

                <h3 className="font-display font-black text-lg text-red-400 uppercase mb-3 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Xác Nhận Xóa Xe
                </h3>

                <p className="text-gray-300 text-sm mb-6">
                  Bạn có chắc chắn muốn xóa dòng xe này không? <strong>Khách hàng sẽ không thể đặt xe này nữa.</strong> Hành động này không thể hoàn tác.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-2.5 rounded-lg transition-all cursor-pointer text-center text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-grow bg-red-500 text-dark font-bold py-2.5 rounded-lg hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer text-center text-sm"
                  >
                    Xóa
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
