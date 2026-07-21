import React, { useState, useEffect } from 'react';
import {
  getAllMotorbikes,
  createMotorbike,
  updateMotorbike,
  deleteMotorbike,
  updateMotorbikeStatus,
  resetMaintenance,
  Motorbike
} from '../../services/vehicleService';
import { getAllCategories, Category } from '../../services/categoryService';
import { Plus, Edit2, Trash2, X, AlertCircle, Sparkles, User, Check, RefreshCw, Loader, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';

export const AdminBikes = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Motorbike> | null>(null);
  const [inspectingBike, setInspectingBike] = useState<Motorbike | null>(null);

  // Form fields
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrlsInput, setImageUrlsInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [featuresInput, setFeaturesInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [rentalPrice, setRentalPrice] = useState('');
  const [seats, setSeats] = useState('2');
  const [transmissionType, setTransmissionType] = useState<'Manual' | 'Automatic' | 'Semi-Automatic'>('Automatic');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Available' | 'Rented' | 'Maintenance' | 'PendingApproval'>('Available');

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
      setIsLoading(true);
      const filters = filterStatus === 'All' ? {} : { status: filterStatus };
      const data = await getAllMotorbikes(filters);
      setBikes(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ để tải danh sách xe!');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBikes();
  }, [filterStatus]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setCurrentBike(null);
    setVehicleModel('');
    setLicensePlate('');
    setCategory('');
    setImageUrls([DEFAULT_IMAGE]);
    setImageUrlsInput('');
    setFeatures(['Bảo hiểm dân sự', 'Smartkey', 'Cốp rộng']);
    setFeaturesInput('');
    setRentalPrice('');
    setSeats('2');
    setTransmissionType('Automatic');
    setDescription('');
    setStatus('Available');
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Motorbike) => {
    setCurrentBike(bike);
    setVehicleModel(bike.vehicleModel);
    setLicensePlate(bike.licensePlate);
    setCategory(typeof bike.category === 'object' && bike.category !== null ? (bike.category as any)._id : bike.category || '');
    setImageUrls(bike.imageUrls || []);
    setImageUrlsInput('');
    setFeatures(bike.features || []);
    setFeaturesInput('');
    setRentalPrice(bike.rentalPrice.toString());
    setSeats((bike.seats || 2).toString());
    setTransmissionType(bike.transmissionType || 'Automatic');
    setDescription(bike.description || '');
    setStatus(bike.status);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setBikeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bikeToDelete) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token') || '';

      if (!token) {
        setErrorMessage('Bạn cần đăng nhập để xóa xe.');
        return;
      }

      await deleteMotorbike(bikeToDelete, token);
      setDeleteConfirmOpen(false);
      setBikeToDelete(null);
      setSuccessMessage('Xe đã được xóa thành công!');
      await loadBikes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting bike:', err);
      setErrorMessage(err.message || 'Lỗi khi xóa xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveBike = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || '';

      if (!token) {
        setErrorMessage('Bạn cần đăng nhập để phê duyệt xe.');
        return;
      }

      await updateMotorbikeStatus(id, 'Available', token);
      setSuccessMessage('Phê duyệt xe hoạt động thành công!');
      await loadBikes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi phê duyệt xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleRejectBike = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối đăng ký xe này?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      if (!token) {
        setErrorMessage('Bạn cần đăng nhập để thực hiện.');
        return;
      }
      await deleteMotorbike(id, token);
      setSuccessMessage('Đã từ chối và xóa đăng ký xe thành công!');
      await loadBikes();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi từ chối đăng ký xe');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleResetMaintenance = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || '';

      if (!token) {
        setErrorMessage('Bạn cần đăng nhập để thực hiện.');
        return;
      }

      await resetMaintenance(id, token);
      setSuccessMessage('Xác nhận bảo dưỡng xe thành công! Chu kỳ Odometer đã được đặt lại.');
      await loadBikes();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi xác nhận bảo dưỡng xe.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const getOwnerDisplay = (owner: Motorbike['ownerId']) => {
    if (!owner) return 'Hệ thống (System)';
    if (typeof owner === 'string') return owner;
    const name = `${owner.lastName || ''} ${owner.firstName || ''}`.trim();
    return name ? `${name} (${owner.email})` : owner.email;
  };

  const addImageUrl = () => {
    const url = imageUrlsInput.trim();
    if (!url) return;
    setImageUrls(prev => [...prev, url]);
    setImageUrlsInput('');
  };

  const addFeature = () => {
    const value = featuresInput.trim();
    if (!value) return;
    const newFeatures = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    setFeatures(prev => [...prev, ...newFeatures]);
    setFeaturesInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token') || '';

      if (!token) {
        setErrorMessage('Bạn cần đăng nhập để thực hiện thao tác này.');
        return;
      }

      // Lỗi 87: Validate tất cả trường bắt buộc, báo lỗi tổng hợp
      if (!vehicleModel.trim() || !licensePlate.trim() || !category.trim() || !transmissionType || rentalPrice === '' || Number(rentalPrice) <= 0) {
        setErrorMessage('Vui lòng điền đầy đủ các trường thông tin bắt buộc (Tên xe, Biển số, Phân loại, Hộp số, Giá thuê).');
        return;
      }

      // Lỗi 88: Validate định dạng biển số xe Việt Nam
      // Chuẩn: 2 số + 1-2 chữ cái + 1 số + dấu gạch ngang + 4-5 số (VD: 29A1-99999, 43H1-12345, 51G-12345)
      const vnLicensePlateRegex = /^[0-9]{2}[A-Z]{1,2}[0-9]?-[0-9]{4,5}$|^[0-9]{2}[A-Z]{1,2}[0-9]?-[0-9]{3}\.[0-9]{2}$/i;
      if (!vnLicensePlateRegex.test(licensePlate.trim().replace(/\s/g, ''))) {
        setErrorMessage('Biển số xe không đúng định dạng Việt Nam. Ví dụ hợp lệ: 29A1-99999, 43H1-12345, 51G-12345.');
        return;
      }

      if (rentalPrice === '' || Number(rentalPrice) <= 0) {
        setErrorMessage('Giá thuê phải lớn hơn 0.');
        return;
      }

      const normalizedImageUrls = imageUrls.map(url => url.trim()).filter(Boolean);
      const normalizedFeatures = features.map(feature => feature.trim()).filter(Boolean);
      const parsedSeats = Number.parseInt(seats, 10);

      const bikeData: Partial<Motorbike> = {
        vehicleModel: vehicleModel.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        category,
        imageUrls: normalizedImageUrls,
        features: normalizedFeatures,
        rentalPrice: Number(rentalPrice),
        seats: Number.isNaN(parsedSeats) ? 2 : parsedSeats,
        transmissionType,
        description,
        status,
        odometer: currentBike?.odometer || 0
      };

      if (currentBike && currentBike._id) {
        await updateMotorbike(currentBike._id, bikeData, token);
        setSuccessMessage(`Xe "${vehicleModel}" đã được cập nhật thành công!`);
      } else {
        await createMotorbike({
          ...bikeData,
          ownerId: ''
        } as Omit<Motorbike, '_id' | 'createdAt' | 'updatedAt'>, token);
        setSuccessMessage(`Xe "${vehicleModel}" đã được thêm thành công!`);
      }

      setIsModalOpen(false);
      await loadBikes();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error saving bike:', err);
      setErrorMessage(err.message || 'Lỗi khi lưu thông tin xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
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

        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-3xl text-white tracking-tight mb-2">
              Quản lý dòng xe
            </h1>
            <p className="text-gray-400 text-sm">
              Xem danh sách, kiểm duyệt xe mới của chủ xe đối tác hoặc cập nhật thông tin dòng xe máy
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadBikes}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-3 rounded-lg text-gray-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={openAddModal}
              disabled={isLoading}
              className="flex items-center gap-2 bg-neon text-dark font-bold px-5 py-3 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-md hover:shadow-[0_0_12px_rgba(204,255,0,0.25)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus size={18} />
              THÊM XE MỚI
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-900/60">
          {[
            { key: 'All', label: 'Tất cả xe' },
            { key: 'PendingApproval', label: 'Chờ phê duyệt' },
            { key: 'Available', label: 'Đang hoạt động' },
            { key: 'Rented', label: 'Đang cho thuê' },
            { key: 'Maintenance', label: 'Đang bảo trì' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === item.key ? 'bg-neon text-dark font-bold' : 'bg-surface border border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Đang đồng bộ danh sách xe từ máy chủ...</p>
            </div>
          </div>
        )}

        {!isLoading && (
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
                          <img
                            src={bike.imageUrls?.[0] || DEFAULT_IMAGE}
                            alt={bike.vehicleModel}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
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
                              Sắp hết xe
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono block mt-1">
                          Biển số: {bike.licensePlate} • Odo: {bike.odometer?.toLocaleString('vi-VN')} km
                        </span>
                        {bike.requiresMaintenance && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/25 font-bold shrink-0 inline-flex items-center gap-1 mt-1.5 animate-pulse">
                            🚨 Cần bảo dưỡng
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15 whitespace-nowrap">
                          {typeof bike.category === 'object' && bike.category !== null ? (bike.category as any).name : bike.category}
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
                      <td className="py-4 px-6 font-medium text-neon whitespace-nowrap">{bike.rentalPrice.toLocaleString('vi-VN')} VNĐ</td>
                      <td className="py-4 px-6">
                        <div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                            bike.status === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            bike.status === 'PendingApproval' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            bike.status === 'Rented' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {bike.status === 'Available' ? 'Đang hoạt động' :
                             bike.status === 'PendingApproval' ? 'Chờ phê duyệt' :
                             bike.status === 'Rented' ? 'Đang cho thuê' : 'Bảo trì'}
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
                              onClick={() => setInspectingBike(bike)}
                              className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              title="Đối chiếu thông tin & Phê duyệt"
                            >
                              <Eye size={14} /> Đối chiếu & Phê duyệt
                            </button>
                          )}
                          {bike.requiresMaintenance && (
                            <button
                              onClick={() => handleResetMaintenance(bike._id!)}
                              className="p-2 rounded bg-black hover:bg-neon/10 text-neon border border-gray-800 hover:border-neon/30 transition-all cursor-pointer"
                              title="Xác nhận đã bảo dưỡng (Reset Odometer)"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(bike)}
                            className="p-2 rounded bg-black hover:bg-neon/10 text-neon border border-gray-800 hover:border-neon/30 transition-all cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(bike._id || '')}
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

            {bikes.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle size={32} className="mx-auto mb-2 text-gray-600" />
                Không tìm thấy dòng xe nào phù hợp bộ lọc.
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-2xl p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên dòng xe *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Yamaha Exciter 155"
                        value={vehicleModel}
                        onChange={e => setVehicleModel(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Biển số xe *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 29A1-99999"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phân loại *</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="" className="text-gray-500">-- Chọn phân loại --</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id} className="text-white bg-dark">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hộp số *</label>
                      <select
                        value={transmissionType}
                        onChange={e => setTransmissionType(e.target.value as any)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Automatic">Automatic (Xe ga)</option>
                        <option value="Manual">Manual (Côn tay)</option>
                        <option value="Semi-Automatic">Semi-Automatic (Xe số)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá thuê / ngày (VNĐ) *</label>
                      <input
                        type="number"
                        required
                        placeholder="Ví dụ: 120000"
                        value={rentalPrice}
                        onChange={e => setRentalPrice(e.target.value)}
                        min="0"
                        step="1000"
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số ghế</label>
                      <input
                        type="number"
                        placeholder="Ví dụ: 2"
                        value={seats}
                        onChange={e => setSeats(e.target.value)}
                        min="1"
                        max="8"
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Available">Available</option>
                        <option value="Rented">Rented</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="PendingApproval">Pending Approval</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đường dẫn hình ảnh (URL)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={imageUrlsInput}
                        onChange={e => setImageUrlsInput(e.target.value)}
                        className="flex-1 bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        className="px-4 bg-neon/20 text-neon border border-neon/30 rounded-lg hover:bg-neon/30 transition-all cursor-pointer text-sm font-semibold"
                      >
                        Thêm
                      </button>
                    </div>
                    {imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {imageUrls.map((url, idx) => (
                          <div key={`${url}-${idx}`} className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded text-xs">
                            <span className="text-gray-400 truncate max-w-xs">{url}</span>
                            <button
                              type="button"
                              onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả xe</label>
                    <textarea
                      placeholder="Nhập mô tả chi tiết về tình trạng xe, điều khoản cho thuê..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiện ích</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Phanh ABS, Động cơ VVA, Smartkey, v.v."
                        value={featuresInput}
                        onChange={e => setFeaturesInput(e.target.value)}
                        className="flex-1 bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        className="px-4 bg-neon/20 text-neon border border-neon/30 rounded-lg hover:bg-neon/30 transition-all cursor-pointer text-sm font-semibold"
                      >
                        Thêm
                      </button>
                    </div>
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {features.map((feature, idx) => (
                          <span key={`${feature}-${idx}`} className="bg-neon/20 text-neon px-3 py-1 rounded text-xs flex items-center gap-2">
                            {feature}
                            <button
                              type="button"
                              onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                              className="hover:text-neon/80"
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

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
                      {isSubmitting ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
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
                    disabled={isSubmitting}
                    className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-2.5 rounded-lg transition-all cursor-pointer text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isSubmitting}
                    className="flex-grow bg-red-500 text-dark font-bold py-2.5 rounded-lg hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xóa
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Inspection & Document Comparison Modal */}
        <AnimatePresence>
          {inspectingBike && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6"
              >
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Eye className="text-neon" size={20} /> Đối Chiếu Thông Tin Đăng Ký Xe
                  </h3>
                  <button
                    onClick={() => setInspectingBike(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 1. Actual Bike Image */}
                  <div>
                    <h4 className="text-xs font-bold text-neon uppercase tracking-wider mb-2">1. Ảnh chụp thực tế của xe</h4>
                    <div className="rounded-xl overflow-hidden border border-gray-800 h-48 bg-black">
                      <img
                        src={inspectingBike.imageUrls?.[0] || (inspectingBike as any).image || DEFAULT_IMAGE}
                        alt={inspectingBike.vehicleModel}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* 2. Registration Certificate Image */}
                  <div>
                    <h4 className="text-xs font-bold text-neon uppercase tracking-wider mb-2">2. Ảnh cà vẹt / Giấy đăng ký xe</h4>
                    {inspectingBike.regCertificateUrl ? (
                      <div className="rounded-xl overflow-hidden border border-gray-800 h-48 bg-black">
                        <img
                          src={inspectingBike.regCertificateUrl}
                          alt="Cà vẹt xe"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-gray-800 bg-black/50 text-center text-xs text-gray-500">
                        ⚠️ Chủ xe chưa tải lên hình ảnh cà vẹt / đăng ký xe.
                      </div>
                    )}
                  </div>

                  {/* 3. Specs Details */}
                  <div>
                    <h4 className="text-xs font-bold text-neon uppercase tracking-wider mb-2">3. Thông tin kỹ thuật xe</h4>
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Mẫu xe:</span> <span className="text-white font-bold">{inspectingBike.vehicleModel}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Biển số:</span> <span className="text-neon font-bold">{inspectingBike.licensePlate}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Giá thuê:</span> <span className="text-white font-bold">{inspectingBike.rentalPrice.toLocaleString('vi-VN')} VNĐ/ngày</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Hộp số:</span> <span className="text-white">{inspectingBike.transmissionType === 'Manual' ? 'Xe số' : inspectingBike.transmissionType === 'Automatic' ? 'Xe ga' : 'Xe côn'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Địa chỉ:</span> <span className="text-white">{(inspectingBike as any).address || (inspectingBike.location as any)?.address || 'Chưa cập nhật'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Mô tả:</span> <span className="text-white">{inspectingBike.description || 'Không có mô tả'}</span></div>
                    </div>
                  </div>

                  {/* 4. Owner Info */}
                  <div>
                    <h4 className="text-xs font-bold text-neon uppercase tracking-wider mb-2">4. Thông tin chủ xe (Đối tác)</h4>
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Chủ sở hữu:</span>
                        <span className="text-white font-bold">
                          {typeof inspectingBike.ownerId === 'object' && inspectingBike.ownerId
                            ? `${inspectingBike.ownerId.firstName || ''} ${inspectingBike.ownerId.lastName || ''}`.trim() || inspectingBike.ownerId.email
                            : 'Chủ xe'}
                        </span>
                      </div>
                      {typeof inspectingBike.ownerId === 'object' && inspectingBike.ownerId && (
                        <>
                          <div className="flex justify-between"><span className="text-gray-400">Email:</span> <span className="text-white">{inspectingBike.ownerId.email}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">SĐT:</span> <span className="text-white">{inspectingBike.ownerId.phoneNumber || 'N/A'}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => {
                        const id = inspectingBike._id!;
                        setInspectingBike(null);
                        handleRejectBike(id);
                      }}
                      className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-500 font-bold text-xs hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      TỪ CHỐI ĐĂNG KÝ
                    </button>
                    <button
                      onClick={() => {
                        const id = inspectingBike._id!;
                        setInspectingBike(null);
                        handleApproveBike(id);
                      }}
                      className="flex-1 py-3 rounded-xl bg-neon text-dark font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-neon/20"
                    >
                      PHÊ DUYỆT XE MỚI
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
