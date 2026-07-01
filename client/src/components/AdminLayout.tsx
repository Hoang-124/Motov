import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { 
  Activity, 
  Bike, 
  Folder, 
  Archive, 
  ClipboardList, 
  Users, 
  Ticket, 
  MessageSquare, 
  Settings,
  ArrowLeft
} from 'lucide-react';

export const AdminLayout = () => {
  const { t, language } = useLanguage();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: t('nav.dashboard'), icon: Activity },
    { path: '/admin/bikes', label: t('nav.manageBikes'), icon: Bike },
    { path: '/admin/categories', label: t('nav.manageCategories') || 'Quản lý danh mục', icon: Folder },
    { path: '/admin/inventory', label: t('nav.manageInventory') || 'Quản lý kho', icon: Archive },
    { path: '/admin/bookings', label: t('nav.allBookings'), icon: ClipboardList },
    { path: '/admin/users', label: t('nav.roles'), icon: Users },
    { path: '/admin/promotions', label: t('nav.promotions'), icon: Ticket },
    { path: '/admin/feedbacks', label: t('nav.feedbacks'), icon: MessageSquare },
    { path: '/admin/settings', label: 'Cấu hình hệ thống', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const sidebarTitle = language === 'vi' ? 'Hệ thống Quản trị' : language === 'ko' ? '관리자 메뉴' : 'Admin Panel';

  return (
    <div className="flex min-h-screen bg-dark text-white font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex fixed top-20 left-0 bottom-0 w-64 bg-surface border-r border-white/5 backdrop-blur-md z-40 overflow-y-auto flex-col py-6 px-4">
        <div className="space-y-4">
          {/* Header Title & Back Button */}
          <div className="px-3 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {sidebarTitle}
            </span>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-neon hover:text-white transition-colors duration-200"
            >
              <ArrowLeft size={14} />
              <span>Quay lại Trang chủ</span>
            </Link>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 group border ${
                    active
                      ? 'bg-neon/10 text-neon border-neon/20 shadow-[0_0_15px_rgba(204,255,0,0.05)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Icon 
                    size={16} 
                    className={`transition-colors duration-200 shrink-0 ${
                      active ? 'text-neon' : 'text-gray-400 group-hover:text-white'
                    }`} 
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 w-full md:pl-64">
        <Outlet />
      </div>
    </div>
  );
};
