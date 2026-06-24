import React, { useState, useEffect } from 'react';
import { systemService, SystemSetting } from '../../services/systemService';
import { Save, RefreshCw, Check, AlertCircle, Loader, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local state form editing
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getSettings();
      setSettings(data);
      
      // Initialize form values
      const values: Record<string, string> = {};
      data.forEach(item => {
        values[item.key] = item.value;
      });
      setFormValues(values);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Không thể lấy cấu hình hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (key: string, description?: string) => {
    setIsSaving(key);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = await systemService.updateSetting(key, formValues[key], description);
      
      // Update local settings list
      setSettings(prev => prev.map(s => s.key === key ? updated : s));
      
      setSuccessMessage(`Đã lưu cấu hình ${key} thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || `Lỗi khi lưu cấu hình ${key}`);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Banner alerts */}
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-tight mb-2">
              CẤU HÌNH HỆ THỐNG
            </h1>
            <p className="text-gray-400 text-sm">
              Quản lý các tham số cấu hình thanh toán VNPAY động trực tiếp từ Database
            </p>
          </div>

          <button
            onClick={loadSettings}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs bg-surface border border-gray-800 hover:border-neon hover:text-white px-4 py-3 rounded-lg text-gray-300 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Đang đồng bộ dữ liệu cấu hình từ máy chủ...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-neon to-transparent"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon/10 rounded-lg text-neon">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Cấu hình Cổng thanh toán VNPAY</h3>
                  <p className="text-xs text-gray-500">
                    Vui lòng cẩn trọng khi cập nhật. Các thông tin sai có thể làm gián đoạn cổng thanh toán đặt cọc.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {settings.map((setting) => {
                  const isVNPayKey = setting.key.startsWith('vnp_');
                  if (!isVNPayKey) return null;

                  return (
                    <div key={setting.key} className="border-b border-gray-850 pb-5 last:border-0 last:pb-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-sm font-bold text-gray-300 font-mono flex items-center gap-2">
                            {setting.key}
                            <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                          </label>
                          <p className="text-xs text-gray-500 font-medium">{setting.description}</p>
                          
                          <input
                            type="text"
                            value={formValues[setting.key] || ''}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            className="w-full bg-black/45 border border-gray-800 focus:border-neon/40 text-gray-200 text-sm font-mono rounded-lg px-4 py-3 mt-2 outline-none transition-all"
                          />
                        </div>

                        <div className="flex items-end justify-end md:self-end">
                          <button
                            onClick={() => handleSave(setting.key, setting.description)}
                            disabled={isSaving !== null}
                            className="flex items-center gap-2 bg-neon/10 border border-neon/30 text-neon hover:bg-neon hover:text-dark font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-40"
                          >
                            {isSaving === setting.key ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Lưu {isSaving === setting.key ? '...' : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-neon/5 border border-neon/15 rounded-xl p-4 flex gap-3 text-gray-400 text-xs">
              <span className="text-neon font-bold">ℹ️ Tip:</span>
              <p>
                Hệ thống tự động sử dụng cấu hình VNPAY động trong MongoDB Database trước. Nếu các cấu hình này bị xóa hoặc trống, Backend sẽ tự động fallback về các tham số môi trường trong tệp <code className="text-neon font-mono">.env</code> của Server.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
