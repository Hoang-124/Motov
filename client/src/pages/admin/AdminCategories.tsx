import React, { useState, useEffect } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory, Category } from '../../services/categoryService';
import { Plus, Edit2, Trash2, Check, AlertCircle, Loader, RefreshCw, X, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await getAllCategories();
      setCategories(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tải danh sách danh mục xe máy.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category);
    setErrorMessage(null);
    setShowDeleteConfirm(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeletingCategory(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Tên danh mục là bắt buộc');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      let token = '';
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user.token || '';
        } catch (err) {}
      }

      if (!token) {
        setErrorMessage('Bạn cần phải đăng nhập để thực hiện tác vụ này');
        return;
      }

      if (editingCategory && editingCategory._id) {
        // Edit mode
        const updated = await updateCategory(editingCategory._id, formData, token);
        setCategories(prev => prev.map(c => c._id === editingCategory._id ? updated : c));
        setSuccessMessage(`Đã cập nhật danh mục "${formData.name}" thành công!`);
      } else {
        // Create mode
        const created = await createCategory(formData, token);
        setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccessMessage(`Đã thêm mới danh mục "${formData.name}" thành công!`);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu danh mục xe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory || !deletingCategory._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      let token = '';
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user.token || '';
        } catch (err) {}
      }

      if (!token) {
        setErrorMessage('Bạn cần phải đăng nhập để thực hiện tác vụ này');
        return;
      }

      await deleteCategory(deletingCategory._id, token);
      setCategories(prev => prev.filter(c => c._id !== deletingCategory._id));
      setSuccessMessage(`Đã xóa danh mục "${deletingCategory.name}" thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCloseDeleteModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi xóa danh mục xe máy. Có thể danh mục này đang có xe liên kết.');
      setTimeout(() => setErrorMessage(null), 5000);
      handleCloseDeleteModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Banner Toast Alerts */}
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

          {errorMessage && !showModal && !showDeleteConfirm && (
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-neon uppercase text-glow tracking-tight mb-2 flex items-center gap-2">
              🏍️ Quản lý danh mục xe
            </h1>
            <p className="text-gray-400 text-sm">
              Xem, sửa, xóa và thêm mới các phân loại dòng xe máy trong hệ thống Motov
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadCategories}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-3 rounded-lg text-gray-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 text-xs bg-neon text-dark hover:bg-[#bbf000] font-black px-4 py-3 rounded-lg transition-all shadow-[0_0_12px_rgba(204,255,0,0.15)] cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              Thêm danh mục
            </button>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Đang đồng bộ danh mục từ máy chủ...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-850 rounded-2xl bg-surface/40">
            <Folder size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có danh mục xe máy nào trên hệ thống.</p>
            <button 
              onClick={handleOpenAdd}
              className="bg-neon/15 border border-neon/30 text-neon hover:bg-neon hover:text-dark px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Tạo danh mục đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/40 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Tên danh mục</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Mô tả</th>
                    <th className="p-4">Ngày tạo</th>
                    <th className="p-4 pr-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {categories.map((category) => (
                    <tr key={category._id} className="hover:bg-white/5 transition-colors duration-150">
                      <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-neon"></span>
                        {category.name}
                      </td>
                      <td className="p-4 font-mono text-xs text-neon/90">{category.slug}</td>
                      <td className="p-4 text-gray-400 max-w-xs truncate" title={category.description}>
                        {category.description || <span className="italic text-gray-600 text-xs">Chưa có mô tả</span>}
                      </td>
                      <td className="p-4 text-gray-400 text-xs font-mono">
                        {category.createdAt ? new Date(category.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(category)}
                            title="Sửa danh mục"
                            className="p-2 bg-blue-600/10 border border-blue-500/20 hover:border-blue-400 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(category)}
                            title="Xóa danh mục"
                            className="p-2 bg-red-600/10 border border-red-500/20 hover:border-red-400 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Table Footer / Summary */}
            <div className="p-4 bg-black/20 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center px-6">
              <span>Tổng số danh mục: <strong>{categories.length}</strong></span>
              <span>Hệ thống Motov</span>
            </div>
          </div>
        )}

      </div>

      {/* CREATE & EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-gray-800 rounded-2xl shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Neon top line indicator */}
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={20} />
              </button>

              <div className="p-6 md:p-8">
                <h3 className="font-display font-black text-xl text-neon uppercase mb-6">
                  {editingCategory ? '✏️ Cập nhật danh mục' : '➕ Thêm danh mục mới'}
                </h3>

                {/* Form-level Error Message */}
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 mb-6 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Tên danh mục *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Xe Tay Ga, Xe Côn Tay"
                      className="w-full bg-black/50 border border-gray-800 focus:border-neon text-gray-200 text-sm rounded-lg px-4 py-3 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Mô tả danh mục
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Nhập mô tả ngắn gọn về danh mục xe máy..."
                      rows={4}
                      className="w-full bg-black/50 border border-gray-800 focus:border-neon text-gray-200 text-sm rounded-lg px-4 py-3 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold rounded-lg transition-all text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-neon text-dark font-black rounded-lg hover:bg-[#bbf000] transition-all text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(204,255,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting && <Loader size={12} className="animate-spin" />}
                      {isSubmitting ? 'Đang lưu...' : editingCategory ? 'Lưu cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && deletingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDeleteModal}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            {/* Confirmation Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-red-500/20 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Red indicator top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
              
              <button 
                onClick={handleCloseDeleteModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-red-500 uppercase mb-4 flex items-center gap-2">
                🗑️ Xóa danh mục xe
              </h3>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 mb-5 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <p>
                  Hành động này không thể hoàn tác. Các danh mục xe máy đã gán cho xe máy hoạt động không thể bị xóa để tránh lỗi dữ liệu.
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-300">Bạn chuẩn bị xóa danh mục:</p>
                <div className="bg-black/35 p-3 rounded-lg border border-white/5">
                  <div className="font-bold text-white text-sm mb-1">{deletingCategory.name}</div>
                  <div className="text-xs text-gray-400 font-mono">Slug: {deletingCategory.slug}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader size={12} className="animate-spin" />}
                  {isSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
