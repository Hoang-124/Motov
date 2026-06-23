import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Tự động đóng sau 3.5 giây
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-neon shrink-0" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500 shrink-0" size={20} />;
      case 'warning':
        return <ShieldAlert className="text-amber-500 shrink-0" size={20} />;
      default:
        return <Info className="text-blue-400 shrink-0" size={20} />;
    }
  };

  const getBorderColorClass = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-neon';
      case 'error':
        return 'border-l-4 border-l-red-500';
      case 'warning':
        return 'border-l-4 border-l-amber-500';
      default:
        return 'border-l-4 border-l-blue-400';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Container hiển thị Toasts */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`bg-surface/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-between gap-3 pointer-events-auto ${getBorderColorClass(toast.type)}`}
            >
              <div className="flex items-center gap-3">
                {getIcon(toast.type)}
                <span className="text-sm font-semibold text-gray-200">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded-full hover:bg-white/5 cursor-pointer bg-transparent border-none"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
