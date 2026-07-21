import React, { useEffect, useState } from 'react';
import { promotionService, Promotion } from '../../services/promotionService';
import { Tag, Calendar, Plus, Edit2, Trash2, Search, Filter, X, ToggleLeft, ToggleRight, AlertCircle, Info, CalendarDays, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../hooks/useToast';

export const AdminPromotions = () => {
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, expired, upcoming
  const [typeFilter, setTypeFilter] = useState('all'); // all, Percentage, FixedAmount

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [discountName, setDiscountName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'FixedAmount'>('Percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [discountCategory, setDiscountCategory] = useState('');

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      };
      const data = await promotionService.getAdminPromotions(filters);
      setPromotions(data);
    } catch (err: any) {
      console.error('Error fetching admin promotions:', err);
      setError('Không thể tải danh sách chương trình khuyến mãi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPromotions();
  };

  const handleOpenCreateModal = () => {
    setEditingPromo(null);
    setDiscountName('');
    setDescription('');
    setDiscountType('Percentage');
    setDiscountValue(0);
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setVoucherCode('');
    setMinOrderAmount(0);
    setMaxDiscountAmount('');
    setUsageLimit('');
    setDiscountCategory('');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setDiscountName(promo.discountName);
    setDescription(promo.description || '');
    setDiscountType(promo.discountType);
    setDiscountValue(promo.discountValue);
    
    // Format dates for input datetime-local: YYYY-MM-DDTHH:mm
    const formatForInput = (dateStr: string) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartDate(formatForInput(promo.startDate));
    setEndDate(formatForInput(promo.endDate));
    setIsActive(promo.isActive);
    setVoucherCode(promo.voucherCode);
    setMinOrderAmount(promo.minOrderAmount || 0);
    setMaxDiscountAmount(promo.maxDiscountAmount !== undefined ? promo.maxDiscountAmount : '');
    setUsageLimit(promo.usageLimit !== undefined ? promo.usageLimit : '');
    setDiscountCategory(promo.discountCategory || '');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      await promotionService.updatePromotion(promo._id, {
        isActive: !promo.isActive
      });
      // Cập nhật state trực tiếp để UI nhanh nhạy
      setPromotions(promotions.map(p => p._id === promo._id ? { ...p, isActive: !p.isActive } : p));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể cập nhật trạng thái hoạt động.', 'error');
    }
  };

  const handleDeletePromotion = async (promo: Promotion) => {
    const isSoftDelete = promo.usedCount > 0;
    const confirmMessage = isSoftDelete
      ? `Chương trình này đã được sử dụng ${promo.usedCount} lần trong lịch sử. Hệ thống sẽ ẩn chương trình này (Soft Delete) để đảm bảo tính chính xác dữ liệu của khách hàng. Bạn đồng ý chứ?`
      : `Bạn chắc chắn muốn xóa vĩnh viễn mã khuyến mãi "${promo.voucherCode}" chứ?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await promotionService.deletePromotion(promo._id);
      fetchPromotions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa khuyến mãi.', 'error');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(true);

    // Validate client
    if (!discountName.trim() || !voucherCode.trim()) {
      setFormError('Tên khuyến mãi và Mã giảm giá không được để trống.');
      setFormLoading(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setFormError('Ngày bắt đầu khuyến mãi phải trước ngày kết thúc.');
      setFormLoading(false);
      return;
    }

    if (discountValue <= 0) {
      setFormError('Giá trị giảm giá phải lớn hơn 0.');
      setFormLoading(false);
      return;
    }

    if (discountType === 'Percentage' && discountValue > 100) {
      setFormError('Phần trăm giảm giá không được vượt quá 100%.');
      setFormLoading(false);
      return;
    }

    const data: Partial<Promotion> = {
      discountName: discountName.trim(),
      description: description.trim() || undefined,
      discountType,
      discountValue,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isActive,
      voucherCode: voucherCode.trim().toUpperCase().replace(/\s+/g, ''),
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: discountType === 'Percentage' && maxDiscountAmount !== '' ? Number(maxDiscountAmount) : undefined,
      usageLimit: usageLimit !== '' ? Number(usageLimit) : undefined,
      discountCategory: discountCategory.trim() || undefined
    };

    try {
      if (editingPromo) {
        // Cập nhật
        await promotionService.updatePromotion(editingPromo._id, data);
        setFormSuccess('Cập nhật khuyến mãi thành công!');
      } else {
        // Tạo mới
        await promotionService.createPromotion(data);
        setFormSuccess('Tạo chương trình khuyến mãi mới thành công!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        fetchPromotions();
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) {
      return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">Tắt hoạt động</span>;
    }
    if (now > end) {
      return <span className="bg-gray-800 text-gray-500 border border-gray-700 text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">Hết hạn</span>;
    }
    if (now < start) {
      return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">Sắp diễn ra</span>;
    }
    return <span className="bg-neon/10 text-neon border border-neon/20 text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">Đang chạy</span>;
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-tight">
              Quản lý khuyến mãi
            </h1>
            <p className="text-gray-400 text-xs mt-1">Thiết lập các mã voucher và ưu đãi giảm giá trên toàn hệ thống</p>
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="bg-neon text-dark font-bold px-5 py-2.5 rounded-lg hover:bg-[#bbf000] shadow-md hover:shadow-[0_0_12px_rgba(204,255,0,0.25)] transition-all duration-300 flex items-center gap-2 text-xs cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Thêm khuyến mãi</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-surface border border-gray-800 rounded-xl p-5 mb-8 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                placeholder="Tìm theo tên khuyến mãi hoặc mã code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block pl-9 p-3 outline-none transition-all duration-300"
              />
              <Search className="absolute left-3 top-3 text-gray-500" size={16} />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-2 bg-black/30 border border-gray-800 rounded-lg px-2">
              <Filter size={14} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-gray-400 text-xs py-2 px-1 outline-none cursor-pointer border-none"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="active">Đang chạy</option>
                <option value="inactive">Tắt hoạt động</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3 flex items-center gap-2 bg-black/30 border border-gray-800 rounded-lg px-2">
              <Tag size={14} className="text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-transparent text-gray-400 text-xs py-2 px-1 outline-none cursor-pointer border-none"
              >
                <option value="all">Mọi loại giảm</option>
                <option value="Percentage">Phần trăm (%)</option>
                <option value="FixedAmount">Tiền mặt (VNĐ)</option>
              </select>
            </div>

            {/* Search Action */}
            <button
              type="submit"
              className="md:col-span-1 bg-surface border border-gray-800 text-white font-bold p-3 rounded-lg hover:border-neon hover:text-neon transition-all duration-300 text-xs uppercase cursor-pointer"
            >
              Lọc
            </button>
          </form>
        </div>

        {/* List promotions table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 bg-surface/50 border border-gray-800 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon border-r-2 border-transparent"></div>
            <p className="text-gray-500 text-xs mt-3">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 text-center rounded-xl font-semibold text-xs">
            ⚠️ {error}
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-surface/50 border border-gray-800 p-12 text-center rounded-xl">
            <Ticket className="mx-auto text-gray-600 mb-3" size={40} />
            <h3 className="text-white font-bold text-sm mb-1">Không có khuyến mãi nào</h3>
            <p className="text-gray-500 text-xs">Hãy tạo khuyến mãi mới đầu tiên cho hệ thống bằng nút "Thêm khuyến mãi".</p>
          </div>
        ) : (
          <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/30 border-b border-gray-800 text-gray-400 font-semibold text-[10px]">
                    <th className="p-4">Khuyến mãi & Mã code</th>
                    <th className="p-4">Loại giảm giá</th>
                    <th className="p-4">Thời gian áp dụng</th>
                    <th className="p-4 text-center">Lượt dùng (Đã / Tổng)</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center">Hoạt động</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-xs text-gray-300">
                  {promotions.map((promo) => (
                    <tr key={promo._id} className="hover:bg-white/5 transition-colors">
                      {/* Name & Code */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-white text-sm">{promo.discountName}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono bg-dark px-2 py-0.5 rounded text-neon font-bold border border-gray-800 tracking-wider">
                            {promo.voucherCode}
                          </span>
                          {promo.discountCategory && (
                            <span className="text-[10px] text-gray-500 italic">#{promo.discountCategory}</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Discount Value */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold">
                          {promo.discountType === 'Percentage' 
                            ? `${promo.discountValue}%` 
                            : `${promo.discountValue.toLocaleString()} VNĐ`}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {promo.minOrderAmount && promo.minOrderAmount > 0 
                            ? `Đơn tối thiểu: ${promo.minOrderAmount.toLocaleString()}đ` 
                            : 'Không giới hạn đơn tối thiểu'}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="p-4 space-y-0.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="text-[10px] text-gray-500">Từ:</span>
                          <span>{new Date(promo.startDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="text-[10px] text-gray-500">Đến:</span>
                          <span>{new Date(promo.endDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>

                      {/* Usage Limit */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {promo.usedCount} / {promo.usageLimit !== undefined && promo.usageLimit !== null ? promo.usageLimit : '∞'}
                        </div>
                        {promo.usageLimit && promo.usedCount >= promo.usageLimit ? (
                          <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded font-bold uppercase mt-1 inline-block">Hết lượt</span>
                        ) : null}
                      </td>

                      {/* Timeline status badge */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {getStatusBadge(promo)}
                      </td>

                      {/* Toggle switch active */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(promo)}
                          className="text-gray-500 hover:text-neon transition-colors cursor-pointer"
                        >
                          {promo.isActive ? (
                            <ToggleRight size={26} className="text-neon" />
                          ) : (
                            <ToggleLeft size={26} className="text-gray-600" />
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(promo)}
                            className="p-2 bg-white/5 border border-gray-800 text-gray-400 hover:text-neon hover:border-neon rounded transition-all cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleDeletePromotion(promo)}
                            className="p-2 bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-all cursor-pointer"
                            title="Xóa/Ẩn"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Pop-up modal create/update promotion */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !formLoading && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
            >
              {/* Line indicator */}
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>

              {/* Header */}
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/10">
                <div>
                  <h3 className="font-display font-black text-xl text-white uppercase">
                    {editingPromo ? 'Cập Nhật Khuyến Mãi' : 'Thêm Khuyến Mãi Mới'}
                  </h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    {editingPromo ? `Đang chỉnh sửa mã: ${editingPromo.voucherCode}` : 'Điền thông tin chi tiết chương trình khuyến mãi mới'}
                  </p>
                </div>
                <button
                  onClick={() => !formLoading && setIsModalOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                  disabled={formLoading}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Scroll Container */}
              <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                
                {/* Form Alert Message */}
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle size={14} />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs flex items-center gap-2 font-semibold animate-pulse">
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Voucher code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mã giảm giá (Voucher Code) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: SUMMER50"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      disabled={editingPromo !== null && editingPromo.usedCount > 0}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all uppercase font-mono disabled:opacity-50"
                    />
                    {editingPromo && editingPromo.usedCount > 0 ? (
                      <p className="text-[10px] text-gray-500 flex items-center gap-1"><Info size={10} /> Đã được dùng, không thể sửa mã</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tên chương trình khuyến mãi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Giảm giá hè rực rỡ"
                      value={discountName}
                      onChange={(e) => setDiscountName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mô tả chi tiết</label>
                  <textarea
                    placeholder="Mô tả các điều kiện, thể lệ áp dụng chương trình khuyến mãi..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all resize-none"
                  />
                </div>

                {/* Category & Usage Limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nhãn danh mục (Category)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Xe Tay Ga, Giảm Hè, New User"
                      value={discountCategory}
                      onChange={(e) => setDiscountCategory(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Giới hạn tổng lượt sử dụng</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Bỏ trống nếu không giới hạn"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Type & Value & Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 p-4 border border-gray-800 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Loại hình giảm giá *</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      disabled={editingPromo !== null && editingPromo.usedCount > 0}
                      className="w-full bg-black border border-gray-800 text-gray-300 text-xs rounded-lg p-3 outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="Percentage">Phần trăm (%)</option>
                      <option value="FixedAmount">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Giá trị giảm giá *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      disabled={editingPromo !== null && editingPromo.usedCount > 0}
                      className="w-full bg-black border border-gray-800 text-gray-300 text-xs rounded-lg p-3 outline-none disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {discountType === 'Percentage' ? 'Giảm tối đa (VNĐ)' : 'Không áp dụng'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={discountType === 'Percentage' ? 'Ví dụ: 100.000' : 'Bị vô hiệu hóa'}
                      disabled={discountType !== 'Percentage'}
                      value={discountType === 'Percentage' ? maxDiscountAmount : ''}
                      onChange={(e) => setMaxDiscountAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-black border border-gray-800 text-gray-300 text-xs rounded-lg p-3 outline-none disabled:opacity-40 disabled:bg-gray-900/50"
                    />
                  </div>
                </div>

                {/* Min order amount & Active status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Giá trị đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-black/10 border border-gray-800 px-4 py-3 rounded-lg h-[46px] self-end">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className="text-neon outline-none"
                    >
                      {isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-600" />}
                    </button>
                    <span className="text-xs font-semibold text-gray-400">
                      Khuyến mãi này sẽ <strong className="text-white">{isActive ? 'KÍCH HOẠT' : 'TẠM ẨN'}</strong> ngay sau khi lưu
                    </span>
                  </div>
                </div>

                {/* Date constraints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Thời điểm bắt đầu *</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Thời điểm kết thúc *</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="pt-6 border-t border-gray-800 flex justify-end gap-3 bg-transparent">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={formLoading}
                    className="px-5 py-2.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2.5 rounded-lg bg-neon text-dark hover:bg-[#bbf000] font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)] disabled:bg-gray-700 disabled:text-gray-400 flex items-center justify-center"
                  >
                    {formLoading ? 'ĐANG LƯU...' : editingPromo ? 'CẬP NHẬT' : 'TẠO MỚI'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
