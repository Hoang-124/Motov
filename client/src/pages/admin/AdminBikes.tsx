import React, { useState, useEffect } from 'react';
import { getBikes, saveBikes, Bike } from '../../data/bikes';
import { Plus, Edit2, Trash2, X, Star, AlertCircle, Sparkles, User, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminBikes = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Bike> | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('Scooter');
  const [image, setImage] = useState('');
  const [specsInput, setSpecsInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('system@motov.com');
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);

  useEffect(() => {
    setBikes(getBikes());
  }, []);

  const openAddModal = () => {
    setCurrentBike(null);
    setName('');
    setPrice('');
    setType('Scooter');
    setImage('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800');
    setSpecsInput('Bảo hiểm dân sự, Smartkey, Cốp rộng');
    setFeatured(false);
    setOwnerEmail('system@motov.com');
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Bike) => {
    setCurrentBike(bike);
    setName(bike.name);
    setPrice(bike.price);
    setType(bike.type);
    setImage(bike.image);
    setSpecsInput(bike.specs.join(', '));
    setFeatured(bike.featured);
    setOwnerEmail(bike.ownerEmail || 'system@motov.com');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setBikeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!bikeToDelete) return;
    
    try {
      const updated = bikes.filter(b => b.id !== bikeToDelete);
      setBikes(updated);
      saveBikes(updated);
      setDeleteConfirmOpen(false);
      setBikeToDelete(null);
      setSuccessMessage('Xe đã được xóa thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Lỗi khi xóa xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const parsedSpecs = specsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (currentBike && currentBike.id) {
        // Edit
        const updated = bikes.map(b => {
          if (b.id === currentBike.id) {
            return {
              ...b,
              name,
              price,
              type,
              image,
              specs: parsedSpecs,
              featured,
              ownerEmail
            };
          }
          return b;
        });
        setBikes(updated);
        saveBikes(updated);
        setSuccessMessage(`Xe "${name}" đã được cập nhật thành công!`);
      } else {
        // Create
        const newBike: Bike = {
          id: 'bk-' + Math.floor(1000 + Math.random() * 9000),
          name,
          price,
          type,
          specs: parsedSpecs,
          image: image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
          featured,
          ownerEmail: ownerEmail || 'system@motov.com'
        };
        const updated = [...bikes, newBike];
        setBikes(updated);
        saveBikes(updated);
        setSuccessMessage(`Xe "${name}" đã được thêm thành công!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage('Lỗi khi lưu thông tin xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
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
              Thêm mới, sửa đổi thông tin hoặc ngưng hoạt động các dòng xe máy trong hệ thống
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-neon text-dark font-bold px-6 py-3.5 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-102 cursor-pointer"
          >
            <Plus size={18} />
            THÊM XE MỚI
          </button>
        </div>

        {/* Bikes Table/Grid */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                  <th className="py-4 px-6">Hình ảnh</th>
                  <th className="py-4 px-6">Tên dòng xe</th>
                  <th className="py-4 px-6">Phân loại</th>
                  <th className="py-4 px-6">Chủ sở hữu (Owner)</th>
                  <th className="py-4 px-6">Giá thuê / ngày</th>
                  <th className="py-4 px-6">Đặc tả (Specs)</th>
                  <th className="py-4 px-6 text-center">Nổi bật</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {bikes.map(bike => (
                  <tr key={bike.id} className="hover:bg-black/20 transition-colors">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => openEditModal(bike)}
                        className="w-16 h-12 rounded overflow-hidden border border-gray-800 bg-black hover:border-neon/50 transition-all cursor-pointer group"
                      >
                        <img src={bike.image} alt={bike.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      <button
                        onClick={() => openEditModal(bike)}
                        className="hover:text-neon transition-colors cursor-pointer"
                      >
                        {bike.name}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15">
                        {bike.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <User size={13} className="text-neon" />
                        <span className="font-mono text-gray-400">
                          {bike.ownerEmail === 'system@motov.com' ? 'Hệ thống (System)' : bike.ownerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-neon">{bike.price} VNĐ</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {bike.specs.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-400">
                            {s}
                          </span>
                        ))}
                        {bike.specs.length > 3 && <span className="text-[10px] text-gray-500">+{bike.specs.length - 3}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {bike.featured ? (
                        <Star size={16} className="fill-neon text-neon mx-auto" />
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(bike)}
                          className="p-2 rounded bg-black hover:bg-gray-800 text-yellow-500 border border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(bike.id)}
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
              Không có xe nào trong cơ sở dữ liệu. Nhấn &ldquo;Thêm Xe Mới&rdquo; để khởi tạo.
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá thuê / ngày (VNĐ)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ví dụ: 120000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="1000"
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                      <p className="text-[10px] text-gray-500">Chỉ nhập số, không nhập dấu phẩy hoặc chữ</p>
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phân loại</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Scooter">Scooter (Xe ga)</option>
                        <option value="Classic">Classic (Cổ điển)</option>
                        <option value="Sport">Sport (Thể thao)</option>
                        <option value="Sport Cafe">Sport Cafe</option>
                        <option value="Underbone">Underbone (Xe số côn tay)</option>
                      </select>
                    </div>
                  </div>

                  {/* Owner Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Chủ Xe (Owner)</label>
                    <input
                      type="email"
                      required
                      placeholder="system@motov.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                    <p className="text-[10px] text-gray-500">Mặc định là system@motov.com nếu thuộc sở hữu của hệ thống.</p>
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

                  {/* Specs */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đặc tả (Specs - Cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      placeholder="Phanh ABS, Động cơ VVA, Smartkey, v.v."
                      value={specsInput}
                      onChange={(e) => setSpecsInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Featured Checkbox */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 bg-black border-gray-800 text-neon rounded focus:ring-neon accent-neon cursor-pointer"
                    />
                    <label htmlFor="featured" className="text-xs font-semibold text-gray-300 uppercase tracking-wider select-none cursor-pointer">
                      Đánh dấu là xe nổi bật (Featured)
                    </label>
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
