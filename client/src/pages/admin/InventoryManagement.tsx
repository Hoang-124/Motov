import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Minus, Edit2, Trash2, X, AlertCircle, 
  RefreshCw, Search, Filter, Check, Info, MapPin, DollarSign, Archive, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { inventoryService, InventoryItem } from '../../services/inventoryService';

export const InventoryManagement = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('5');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Stock update quick state
  const [stockDelta, setStockDelta] = useState('1');
  const [stockAction, setStockAction] = useState<'in' | 'out'>('in'); // 'in' for import, 'out' for export
  
  const [saving, setSaving] = useState(false);

  // Load inventory
  const fetchInventory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const filters = {
        search: search,
        lowStock: lowStockFilter ? 'true' : 'false'
      };
      const data = await inventoryService.getAllInventory(filters);
      setItems(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể kết nối đến máy chủ để tải kho phụ tùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, lowStockFilter]);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openAddModal = () => {
    setSelectedItem(null);
    setName('');
    setSku('');
    setQuantity('0');
    setMinQuantity('5');
    setPrice('');
    setLocation('');
    setDescription('');
    setIsFormOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setName(item.name);
    setSku(item.sku);
    setQuantity(item.quantity.toString());
    setMinQuantity(item.minQuantity.toString());
    setPrice(item.price.toString());
    setLocation(item.location || '');
    setDescription(item.description || '');
    setIsFormOpen(true);
  };

  const openStockModal = (item: InventoryItem, action: 'in' | 'out') => {
    setSelectedItem(item);
    setStockAction(action);
    setStockDelta('1');
    setIsStockOpen(true);
  };

  const openDeleteModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  // Handler chặn ký tự không phải số cho các trường number
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Cho phép: số 0-9, Backspace, Delete, Tab, Enter, mũi tên, Home, End, dấu chấm/phẩy
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', '.'];
    if (allowedKeys.includes(e.key)) return;
    // Cho phép Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) return;
    // Chặn nếu không phải số
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Submit Add/Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Tên phụ tùng và mã SKU là bắt buộc.', true);
      return;
    }

    if (price === '' || Number(price) < 0) {
      showToast('Đơn giá không hợp lệ.', true);
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) !== undefined ? Number(minQuantity) : 5,
        price: Number(price),
        location: location.trim(),
        description: description.trim()
      };

      if (selectedItem && selectedItem._id) {
        await inventoryService.updateInventory(selectedItem._id, data);
        showToast(`Đã cập nhật phụ tùng "${name}" thành công.`);
      } else {
        await inventoryService.createInventory(data);
        showToast(`Đã thêm mới phụ tùng "${name}" thành công.`);
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Lỗi khi lưu thông tin phụ tùng.', true);
    } finally {
      setSaving(false);
    }
  };

  // Submit Quick Stock Update
  const handleStockUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedItem._id) return;

    const deltaNum = Number(stockDelta);
    if (isNaN(deltaNum) || deltaNum <= 0) {
      showToast('Số lượng nhập/xuất phải lớn hơn 0.', true);
      return;
    }

    setSaving(true);
    try {
      const delta = stockAction === 'in' ? deltaNum : -deltaNum;
      await inventoryService.updateStock(selectedItem._id, { delta });
      showToast(`${stockAction === 'in' ? 'Nhập kho' : 'Xuất kho'} thành công.`);
      setIsStockOpen(false);
      fetchInventory();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Lỗi khi cập nhật kho hàng.', true);
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete Action
  const handleDeleteConfirm = async () => {
    if (!selectedItem || !selectedItem._id) return;
    setSaving(true);
    try {
      await inventoryService.deleteInventory(selectedItem._id);
      showToast('Đã xóa phụ tùng ra khỏi kho thành công.');
      setIsDeleteOpen(false);
      fetchInventory();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Lỗi khi xóa phụ tùng.', true);
      setIsDeleteOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa cập nhật';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-tight mb-2 flex items-center gap-3">
              <Package className="text-neon" size={32} />
              Quản lý kho phụ tùng
            </h1>
            <p className="text-gray-400 text-sm">
              Quản lý danh mục thiết bị, linh kiện xe máy, kiểm soát tồn kho thực tế và cảnh báo nhập hàng
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-neon text-dark font-bold px-5 py-3 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-md hover:shadow-[0_0_12px_rgba(204,255,0,0.25)] cursor-pointer whitespace-nowrap"
          >
            <Plus size={18} />
            THÊM LINH KIỆN MỚI
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface border border-gray-800 p-4 rounded-2xl mb-6 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-grow max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm phụ tùng theo tên hoặc mã SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-xl focus:ring-1 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-4 h-4 rounded border-gray-800 bg-black text-neon focus:ring-neon cursor-pointer"
              />
              <span>Cảnh báo sắp hết hàng</span>
            </label>
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="flex items-center gap-2 text-xs bg-black/40 border border-gray-800 hover:border-neon hover:text-white px-4 py-3 rounded-lg text-gray-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Toast alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-500 text-dark font-black text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg max-w-md mx-auto mb-6 border border-green-400/20"
            >
              <Check size={16} />
              {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg max-w-md mx-auto mb-6 border border-red-400/20"
            >
              <AlertCircle size={16} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List table */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <RefreshCw size={36} className="text-neon animate-spin mb-4" />
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Đang kết nối kho hàng...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <Archive size={40} className="mx-auto mb-3 text-gray-700" />
              <p className="font-semibold text-sm">Không tìm thấy linh kiện nào trong kho</p>
              <p className="text-xs text-gray-600 mt-1">Hãy thử thêm mới phụ tùng hoặc chỉnh sửa bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-black/35">
                    <th className="py-4 px-6">Tên linh kiện</th>
                    <th className="py-4 px-6">Mã SKU</th>
                    <th className="py-4 px-6">Đơn giá nhập</th>
                    <th className="py-4 px-6">Vị trí kho</th>
                    <th className="py-4 px-6 text-center">Tồn kho / Ngưỡng</th>
                    <th className="py-4 px-6">Cập nhật cuối</th>
                    <th className="py-4 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {items.map(item => {
                    const isLowStock = item.quantity <= item.minQuantity;

                    return (
                      <tr key={item._id} className={`hover:bg-black/20 transition-colors ${
                        isLowStock ? 'bg-red-500/[0.02]' : ''
                      }`}>
                        {/* Name */}
                        <td className="py-4 px-6 font-bold text-white">
                          <div>
                            {item.name}
                            {item.description && (
                              <span className="block text-[10px] font-normal text-gray-500 mt-1 truncate max-w-xs">{item.description}</span>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded bg-black text-neon border border-neon/15 font-mono text-xs uppercase">
                            {item.sku}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-200">
                          {item.price.toLocaleString('vi-VN')} VNĐ
                        </td>

                        {/* Location */}
                        <td className="py-4 px-6 text-xs text-gray-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-neon" />
                            <span>{item.location || 'Chưa cập nhật'}</span>
                          </div>
                        </td>

                        {/* Quantity / MinQuantity */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="inline-block">
                            <div className="flex items-center justify-center gap-1.5 font-mono">
                              <span className={`text-base font-black ${isLowStock ? 'text-red-500' : 'text-green-500'}`}>
                                {item.quantity}
                              </span>
                              <span className="text-gray-600 text-xs">/ {item.minQuantity}</span>
                            </div>
                            {isLowStock && (
                              <span className="block text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.2 rounded font-bold uppercase mt-1 animate-pulse">
                                Sắp hết hàng
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last Restocked At */}
                        <td className="py-4 px-6 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>{formatDate(item.lastRestockedAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openStockModal(item, 'in')}
                              className="p-2 rounded bg-black hover:bg-green-950/40 text-green-500 border border-gray-800 hover:border-green-500/30 transition-all cursor-pointer"
                              title="Nhập thêm kho"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              onClick={() => openStockModal(item, 'out')}
                              className="p-2 rounded bg-black hover:bg-yellow-950/40 text-yellow-500 border border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
                              title="Xuất kho sử dụng"
                            >
                              <Minus size={13} />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded bg-black hover:bg-gray-800 text-gray-300 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                              title="Xóa phụ tùng"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 1. ADD / EDIT DIALOG MODAL                                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-bold text-lg text-white uppercase mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
                <Package className="text-neon" size={20} />
                {selectedItem ? 'Cập nhật thông tin linh kiện' : 'Thêm linh kiện mới vào kho'}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Tên linh kiện *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Lốp Michelin City"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Mã SKU *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: LOP-MIC-01"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Số lượng ban đầu</label>
                    <input
                      type="number"
                      required
                      disabled={!!selectedItem} // Disable in edit mode, must use quick import/export
                      min="0"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    />
                    {!!selectedItem && (
                      <p className="text-[10px] text-yellow-500/80 flex items-center gap-1 mt-1">
                        <Info size={10} className="shrink-0" />
                        Chỉ đọc khi cập nhật. Dùng nút <strong>Nhập / Xuất kho</strong> để điều chỉnh số lượng tồn kho.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Ngưỡng tối thiểu</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={minQuantity}
                      onKeyDown={handleNumberKeyDown}
                      onChange={e => setMinQuantity(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Đơn giá nhập (VNĐ)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ví dụ: 120000"
                      value={price}
                      onKeyDown={handleNumberKeyDown}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-400 uppercase tracking-wider">Vị trí lưu kho</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kệ A, Ngăn 2"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-400 uppercase tracking-wider">Mô tả linh kiện</label>
                  <textarea
                    placeholder="Mô tả thông số kỹ thuật, hãng sản xuất, dòng xe tương thích..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    disabled={saving}
                    className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all cursor-pointer text-center"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-grow bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer text-center disabled:opacity-50"
                  >
                    {saving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 2. QUICK STOCK IMPORT / EXPORT MODAL                            */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isStockOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStockOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsStockOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-bold text-lg text-white uppercase mb-4 border-b border-gray-800 pb-3">
                {stockAction === 'in' ? '📈 Nhập thêm hàng vào kho' : '📉 Xuất kho linh kiện'}
              </h3>

              <div className="bg-black/40 border border-gray-800 p-3 rounded-xl mb-4 space-y-1 text-xs">
                <div>Linh kiện: <span className="text-white font-bold">{selectedItem.name}</span></div>
                <div>Mã SKU: <span className="text-neon font-mono font-bold">{selectedItem.sku}</span></div>
                <div>Tồn kho hiện tại: <span className="text-white font-mono font-bold">{selectedItem.quantity}</span></div>
              </div>

              <form onSubmit={handleStockUpdateSubmit} className="space-y-4 text-xs text-gray-300">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-400 uppercase tracking-wider">
                    {stockAction === 'in' ? 'Số lượng nhập thêm *' : 'Số lượng xuất kho *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockDelta}
                    onChange={e => setStockDelta(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono text-center text-lg"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsStockOpen(false)}
                    disabled={saving}
                    className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-2.5 rounded-lg transition-all cursor-pointer text-center"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex-grow font-bold py-2.5 rounded-lg transition-all shadow-md cursor-pointer text-center disabled:opacity-50 ${
                      stockAction === 'in'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                    }`}
                  >
                    {saving ? 'ĐANG CẬP NHẬT...' : stockAction === 'in' ? 'NHẬP KHO' : 'XUẤT KHO'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 3. DELETE CONFIRMATION DIALOG MODAL                            */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isDeleteOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteOpen(false)}
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
                Xác Nhận Xóa Phụ Tùng
              </h3>

              <p className="text-gray-300 text-sm mb-4">
                Bạn có chắc chắn muốn xóa phụ tùng <strong>"{selectedItem.name}"</strong> (SKU: {selectedItem.sku}) ra khỏi danh mục kho hàng không? Hành động này không thể hoàn tác.
              </p>

              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={saving}
                  className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-2.5 rounded-lg transition-all cursor-pointer text-center"
                >
                  HỦY
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={saving}
                  className="flex-grow bg-red-500 text-dark font-bold py-2.5 rounded-lg hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer text-center"
                >
                  XÓA VĨNH VIỄN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
