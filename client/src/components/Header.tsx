import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X, ChevronDown } from 'lucide-react';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 w-full z-50 bg-dark/85 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="font-display font-black text-3xl tracking-tight text-neon transition-transform hover:scale-105 duration-200">
          Motov
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          <Link 
            to="/" 
            className={`${isActive('/') ? 'text-neon text-glow' : 'text-gray-300 hover:text-white'} transition-all duration-300 uppercase`}
          >
            Trang Chủ
          </Link>
          <Link 
            to="/bikes" 
            className={`${isActive('/bikes') ? 'text-neon text-glow' : 'text-gray-300 hover:text-white'} transition-all duration-300 uppercase`}
          >
            Dòng Xe
          </Link>
          <Link 
            to="/bookings" 
            className={`${isActive('/bookings') ? 'text-neon text-glow' : 'text-gray-300 hover:text-white'} transition-all duration-300 uppercase`}
          >
            Đơn Thuê
          </Link>
          <a 
            href="#footer" 
            className="text-gray-300 hover:text-white transition-all duration-300 uppercase"
          >
            Liên Hệ
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link 
            to="/auth" 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-800 text-sm font-medium text-gray-300 hover:border-neon hover:text-white transition-all duration-300"
          >
            <User size={16} />
            Đăng Nhập
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-lg border-b border-gray-800 px-4 py-6 flex flex-col gap-4">
          <Link 
            to="/" 
            onClick={() => setIsOpen(false)}
            className={`font-medium ${isActive('/') ? 'text-neon' : 'text-gray-300'}`}
          >
            TRANG CHỦ
          </Link>
          <Link 
            to="/bikes" 
            onClick={() => setIsOpen(false)}
            className={`font-medium ${isActive('/bikes') ? 'text-neon' : 'text-gray-300'}`}
          >
            DÒNG XE
          </Link>
          <Link 
            to="/bookings" 
            onClick={() => setIsOpen(false)}
            className={`font-medium ${isActive('/bookings') ? 'text-neon' : 'text-gray-300'}`}
          >
            ĐƠN THUÊ
          </Link>
          <a 
            href="#footer" 
            onClick={() => setIsOpen(false)}
            className="text-gray-300 font-medium"
          >
            LIÊN HỆ
          </a>
          <Link 
            to="/auth" 
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-lg bg-neon text-dark font-bold text-center"
          >
            <User size={16} />
            ĐĂNG NHẬP
          </Link>
        </div>
      )}
    </header>
  );
};
