import React, { useState, useEffect } from 'react';
import {
  getOwnerMotorbikes,
  createMotorbike,
  updateMotorbike,
  deleteMotorbike,
  Motorbike
} from '../../services/vehicleService';
import { getAllCategories, Category } from '../../services/categoryService';
import { Plus, Edit2, Trash2, X, AlertCircle, Sparkles, Loader, FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';

export const OwnerBikes = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Motorbike> | null>(null);

  // Form fields
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [category, setCategory] = useState('');
  const [transmissionType, setTransmissionType] = useState<'Manual' | 'Automatic' | 'Semi-Automatic'>('Automatic');
  const [rentalPrice, setRentalPrice] = useState('');
  const [seats, setSeats] = useState('2');
  const [description, setDescription] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');

  // Status/Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);

  // Fetch all initial data
  const loadInitialData = async (currentUser = user) => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      // Fetch categories
      const cats = await getAllCategories();
      setCategories(cats);

      // Fetch owner's motorbikes
      const data = await getOwnerMotorbikes(currentUser.id);
      setBikes(data);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setErrorMsg(err.message || 'Không thể tải danh sách xe. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const currentUser = JSON.parse(storedUser);
      setUser(currentUser);
      loadInitialData(currentUser);
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }, []);

  const openAddModal = () => {
    setCurrentBike(null);
    setVehicleModel('');
    setLicensePlate('');
    setCategory(categories[0]?._id || '');
    setTransmissionType('Automatic');
    setRentalPrice('');
    setSeats('2');
    setDescription('');
    setImageInput(DEFAULT_IMAGE);
    setFeaturesInput('Mới 99%, Tiết kiệm xăng, Khóa Smartkey');
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Motorbike) => {
    setCurrentBike(bike);
    setVehicleModel(bike.vehicleModel);
    setLicensePlate(bike.licensePlate);
    setCategory(typeof bike.category === 'object' && bike.category !== null ? (bike.category as any)._id : bike.category || '');
    setTransmissionType(bike.transmissionType || 'Automatic');
    setRentalPrice(bike.rentalPrice.toString());
    setSeats((bike.seats || 2).toString());
    setDescription(bike.description || '');
    setImageInput(bike.imageUrls && bike.imageUrls.length > 0 ? bike.imageUrls[0] : '');
    setFeaturesInput(bike.features ? bike.features.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setBikeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bikeToDelete || !user?.token) return;

    try {
      setIsSubmitting(true);
      await deleteMotorbike(bikeToDelete, user.token);
      
      setDeleteConfirmOpen(false);
      setBikeToDelete(null);
      setSuccessMsg('Đã hủy đăng ký xe thành công!');
      
      // Reload list
      const data = await getOwnerMotorbikes(user.id);
      setBikes(data);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error deleting bike:', err);
      setErrorMsg(err.message || 'Lỗi khi xóa xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.token) {
      setErrorMsg('Bạn cần đăng nhập để thực hiện.');
      return;
    }

    // Process inputs
    const parsedPrice = parseFloat(rentalPrice.replace(/\./g, '').replace(/,/g, ''));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Giá thuê phải là một số dương hợp lệ.');
      return;
    }

    const parsedFeatures = featuresInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const imageUrls = [imageInput || DEFAULT_IMAGE];

    const bikeData: any = {
      vehicleModel,
      licensePlate: licensePlate.trim().toUpperCase(),
      seats: parseInt(seats) || 2,
      rentalPrice: parsedPrice,
      category,
      transmissionType,
      description,
      imageUrls,
      features: parsedFeatures,
      odometer: currentBike?.odometer || 0,
      requiresMaintenance: currentBike?.requiresMaintenance || false,
      location: currentBike?.location || { type: 'Point', coordinates: [108.22, 16.068] }
    };

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (currentBike && currentBike._id) {
        // Edit bike
        await updateMotorbike(currentBike._id, bikeData, user.token);
        setSuccessMsg('Đã cập nhật thông tin xe thành công!');
      } else {
        // Create new bike
        await createMotorbike(bikeData, user.token);
        setSuccessMsg('Đăng ký xe mới thành công! Vui lòng chờ Admin duyệt.');
      }

      setIsModalOpen(false);
      
      // Reload list
      const data = await getOwnerMotorbikes(user.id);
      setBikes(data);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving bike:', err);
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin xe. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/10 text-green-400 border-green-500/25';
      case 'Rented':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'Maintenance':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25';
      case 'PendingApproval':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Available':
        return 'Sẵn sàng';
      case 'Rented':
        return 'Đang thuê';
      case 'Maintenance':
        return 'Bảo trì';
      case 'PendingApproval':
        return 'Chờ duyệt';
      default:
        return status;
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-950/40 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-3"
            >
              <CheckCircle size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
              Xe Cho Thuê Của Tôi
            </h1>
            <p className="text-gray-400 text-sm">
              Đăng ký thêm xe mới hoặc điều chỉnh danh sách xe tự có của bạn trên hệ thống
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="flex items-center gap-2 bg-neon text-dark font-bold px-6 py-3.5 rounded-lg hover:bg-[#bbf000] disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-102 cursor-pointer"
          >
            <Plus size={18} />
            ĐĂNG KÝ THÊM XE
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader className="w-10 h-10 animate-spin text-neon mb-4" />
            <p className="text-sm">Đang tải danh sách xe của bạn...</p>
          </div>
        ) : (
          /* Bikes Grid / Table */
          <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                    <th className="py-4 px-6">Hình ảnh</th>
                    <th className="py-4 px-6">Dòng xe máy</th>
                    <th className="py-4 px-6">Biển số</th>
                    <th className="py-4 px-6">Loại hộp số</th>
                    <th className="py-4 px-6">Giá thuê / ngày</th>
                    <th className="py-4 px-6">Đặc điểm (Specs)</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {bikes.map(bike => {
                    const bikeImage = bike.imageUrls && bike.imageUrls.length > 0 ? bike.imageUrls[0] : DEFAULT_IMAGE;
                    const catName = typeof bike.category === 'object' && bike.category !== null ? (bike.category as any).name : 'Chưa phân loại';
                    const transLabel = bike.transmissionType === 'Automatic' ? 'Xe ga' : bike.transmissionType === 'Manual' ? 'Xe số' : 'Xe côn tay';

                    return (
                      <tr key={bike._id} className="hover:bg-black/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="w-16 h-12 rounded overflow-hidden border border-gray-800 bg-black">
                            <img src={bikeImage} alt={bike.vehicleModel} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-white">
                          <div>{bike.vehicleModel}</div>
                          <div className="text-[10px] text-gray-500 font-normal">{catName}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-neon/90 font-bold uppercase">{bike.licensePlate}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15">
                            {transLabel}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-neon">{bike.rentalPrice.toLocaleString('vi-VN')} VNĐ</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {bike.features.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-400">
                                {s}
                              </span>
                            ))}
                            {bike.features.length > 3 && (
                              <span className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-neon font-bold">
                                +{bike.features.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(bike.status)}`}>
                            {getStatusLabel(bike.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(bike)}
                              className="p-2 rounded bg-black hover:bg-gray-800 text-yellow-500 border border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
                              title="Chỉnh sửa xe"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => bike._id && handleDeleteClick(bike._id)}
                              className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                              title="Hủy đăng ký"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {bikes.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle size={32} className="mx-auto mb-2 text-gray-600" />
                Bạn chưa đăng ký chiếc xe nào trên hệ thống. Nhấn &ldquo;Đăng Ký Thêm Xe&rdquo; để bắt đầu chia sẻ xe và kiếm thu nhập.
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                {!isSubmitting && (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                )}

                <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                  <Sparkles size={18} className="text-neon" />
                  <h3 className="font-display font-bold text-xl text-white uppercase">
                    {currentBike ? 'Chỉnh Sửa Xe Cho Thuê' : 'Đăng Ký Xe Đối Tác'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  {/* Model & Plate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên dòng xe máy</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ví dụ: Honda Vision"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Biển số xe</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ví dụ: 43-C1 123.45"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Category & Transmission */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục nhóm xe</label>
                      <select
                        value={category}
                        disabled={isSubmitting}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
                      >
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hộp số</label>
                      <select
                        value={transmissionType}
                        disabled={isSubmitting}
                        onChange={(e) => setTransmissionType(e.target.value as any)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="Automatic">Xe tay ga (Auto)</option>
                        <option value="Manual">Xe côn tay (Manual)</option>
                        <option value="Semi-Automatic">Xe số (Semi-Auto)</option>
                      </select>
                    </div>
                  </div>

                  {/* Price & Seats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá thuê / ngày (VNĐ)</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ví dụ: 120.000"
                        value={rentalPrice}
                        onChange={(e) => setRentalPrice(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số chỗ ngồi</label>
                      <select
                        value={seats}
                        disabled={isSubmitting}
                        onChange={(e) => setSeats(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="1">1 chỗ</option>
                        <option value="2">2 chỗ</option>
                      </select>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hình ảnh xe máy (URL)</label>
                    <input
                      type="url"
                      disabled={isSubmitting}
                      placeholder="https://images.unsplash.com/..."
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 font-mono"
                    />
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đặc điểm xe (Cách nhau bởi dấu phẩy)</label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      placeholder="Ví dụ: Khóa Smartkey, Đèn LED, Cốp rộng 25L"
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</label>
                    <textarea
                      rows={3}
                      disabled={isSubmitting}
                      placeholder="Mô tả tình trạng xe, điều kiện thuê, v.v..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all cursor-pointer text-center disabled:opacity-50"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-grow bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader size={16} className="animate-spin" />}
                      <span>{currentBike ? 'LƯU XE' : 'ĐĂNG KÝ XE'}</span>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl text-center"
              >
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                  Xác nhận hủy đăng ký xe?
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Chiếc xe này sẽ bị rút khỏi hệ thống tìm kiếm thuê xe và chuyển trạng thái hoạt động. Tác vụ này không thể khôi phục.
                </p>

                <div className="flex gap-3">
                  <button
                    disabled={isSubmitting}
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex-1 bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 py-3 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader size={16} className="animate-spin" />}
                    <span>XÁC NHẬN XÓA</span>
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
