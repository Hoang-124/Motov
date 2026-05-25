import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer id="footer" className="bg-surface pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div>
            <Link to="/" className="font-display font-black text-2xl text-neon mb-6 block">
              Motov
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Dịch vụ cho thuê xe máy cao cấp tại Đà Nẵng. Đồng hành cùng bạn trên mọi nẻo đường và mang lại trải nghiệm tuyệt vời nhất.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Liên Kết Nhanh</h5>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-neon transition-colors">Trang Chủ</Link></li>
              <li><Link to="/bikes" className="hover:text-neon transition-colors">Dòng Xe</Link></li>
              <li><Link to="/bookings" className="hover:text-neon transition-colors">Đơn Thuê Của Bạn</Link></li>
              <li><a href="#" className="hover:text-neon transition-colors">Hướng Dẫn Đặt Xe</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Kết Nối</h5>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-gray-400 hover:text-neon hover:bg-black transition-all duration-300">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-gray-400 hover:text-neon hover:bg-black transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-gray-400 hover:text-neon hover:bg-black transition-all duration-300">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div>
             <h5 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Liên Hệ</h5>
             <ul className="space-y-3 text-gray-400 text-sm">
              <li className="font-semibold text-white">Motov Da Nang</li>
              <li>Hotline: 098 765 4321</li>
              <li>Email: hello@motov.com</li>
              <li>Địa chỉ: 123 Đường Ven Biển, Sơn Trà, Đà Nẵng</li>
            </ul>
          </div>

        </div>
        
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} - Motov Da Nang. All rights reserved.</p>
          <p>Thiết kế bởi Motov Studio</p>
        </div>
      </div>
    </footer>
  );
};
