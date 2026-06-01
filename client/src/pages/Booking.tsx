import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBikes, Bike } from '../data/bikes';
import { CalendarDays, MapPin, Phone, User, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const Booking = () => {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  
  const [bike, setBike] = useState<Bike | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Form states
  const [step, setStep] = useState(1);
  const [dateRange, setDateRange] = useState('');
  const [location, setLocation] = useState('Da Nang Airport');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load dynamic bike
    const list = getBikes();
    const found = list.find(b => b.id === bikeId);
    setBike(found);
    setLoading(false);

    // Auto fill user details if logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setFullName(u.name || '');
      } catch (e) {}
    }
  }, [bikeId]);

  if (loading) {
    return (
      <div className="pt-28 pb-20 text-center min-h-screen bg-dark flex flex-col justify-center items-center">
        <p className="text-gray-400">Đang tải...</p>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="pt-28 pb-20 text-center min-h-screen bg-dark flex flex-col justify-center items-center">
        <p className="text-gray-400 mb-4">Không tìm thấy dòng xe được chọn.</p>
        <Link to="/bikes" className="bg-neon text-dark px-6 py-2.5 rounded-full font-bold">
          Quay lại danh sách xe
        </Link>
      </div>
    );
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
    } else {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Save order to localStorage
      const newBooking = {
        id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
        userEmail: currentUser.email || 'guest@example.com',
        bikeId: bike.id,
        bikeName: bike.name,
        image: bike.image,
        price: bike.price,
        date: dateRange || 'Hôm nay - Ngày mai',
        location,
        fullName,
        phone,
        license,
        status: 'Chờ duyệt',
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };

      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      existingBookings.unshift(newBooking);
      localStorage.setItem('bookings', JSON.stringify(existingBookings));

      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-neon"></div>
          <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-6 text-neon border border-neon/30">
            <CheckCircle2 size={44} />
          </div>
          <h2 className="font-display font-black text-3xl text-white mb-3">ĐẶT XE THÀNH CÔNG!</h2>
          <p className="text-gray-400 text-sm mb-8">
            Cảm ơn bạn đã lựa chọn dịch vụ của <strong>Motov</strong>. Đơn hàng của bạn đang được duyệt, chúng tôi sẽ liên hệ trong ít phút để bàn giao xe.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/bookings" className="bg-neon text-dark font-bold py-3.5 rounded-lg hover:bg-[#bbf000] transition-colors">
              XEM ĐƠN THUÊ XE
            </Link>
            <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
              Quay về Trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Back Button */}
        <Link to="/bikes" className="inline-flex items-center gap-2 text-gray-400 hover:text-neon transition-colors mb-8 text-sm group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách xe
        </Link>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-7 bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Progress Stepper */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-neon text-dark' : 'bg-gray-800 text-gray-400'}`}>
                1
              </div>
              <div className={`h-0.5 flex-grow ${step >= 2 ? 'bg-neon' : 'bg-gray-800'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 2 ? 'bg-neon text-dark' : 'bg-gray-800 text-gray-400'}`}>
                2
              </div>
            </div>

            <h2 className="font-display font-black text-2xl text-white mb-6 uppercase">
              {step === 1 ? 'Thông Tin Nhận Xe' : 'Thông Tin Cá Nhân'}
            </h2>

            <form onSubmit={handleNextStep} className="space-y-6">
              {step === 1 && (
                <>
                  {/* Step 1 Form fields */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Thời gian nhận & trả xe</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays size={18} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder="Ví dụ: 25/05 - 28/05"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Địa điểm giao nhận xe</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-neon" />
                      </div>
                      <select 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none appearance-none cursor-pointer transition-all duration-300"
                      >
                        <option value="Da Nang Airport">Sân bay Đà Nẵng</option>
                        <option value="Da Nang Train Station">Ga Đà Nẵng</option>
                        <option value="Son Tra Peninsula">Bán đảo Sơn Trà</option>
                        <option value="My Khe Beach Hotel">Khách sạn khu vực Mỹ Khê</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Step 2 Form fields */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Họ và tên của bạn</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder="Nhập đầy đủ họ tên"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Số điện thoại liên lạc</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-neon" />
                      </div>
                      <input 
                        type="tel" 
                        required
                        placeholder="Nhập số điện thoại"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Số giấy phép lái xe (GPLX)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard size={18} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder="Số GPLX để đối chiếu khi nhận xe"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                {step === 2 && (
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-grow bg-transparent border border-gray-800 text-gray-300 font-bold py-3.5 rounded-lg hover:border-gray-600 transition-all cursor-pointer text-center"
                  >
                    Quay Lại
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-grow bg-neon text-dark font-bold py-3.5 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer text-center"
                >
                  {step === 1 ? 'Tiếp Theo' : 'XÁC NHẬN ĐẶT XE'}
                </button>
              </div>
            </form>
          </div>

          {/* Bike Info Summary Side */}
          <div className="lg:col-span-5 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-display font-bold text-xl text-white uppercase border-b border-gray-800 pb-4">
              Tóm Tắt Đơn Thuê Xe
            </h3>

            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-gray-800">
              <img src={bike.image} alt={bike.name} className="w-full h-full object-cover" />
            </div>

            <div>
              <span className="text-xs text-neon font-semibold uppercase px-2.5 py-1 rounded bg-neon/10 border border-neon/30">
                {bike.type}
              </span>
              <h2 className="font-display font-black text-2xl text-white mt-3">{bike.name}</h2>
              <p className="text-neon font-semibold text-lg mt-1">{bike.price} VNĐ / Ngày</p>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Loại xe:</span>
                <span className="text-white font-medium">{bike.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bảo hiểm:</span>
                <span className="text-white font-medium">Bảo hiểm trách nhiệm dân sự</span>
              </div>
              {dateRange && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thời gian thuê:</span>
                  <span className="text-neon font-medium">{dateRange}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Giao nhận tại:</span>
                <span className="text-white font-medium">{location === 'Da Nang Airport' ? 'Sân bay Đà Nẵng' : location === 'Da Nang Train Station' ? 'Ga Đà Nẵng' : location === 'Son Tra Peninsula' ? 'Bán đảo Sơn Trà' : 'Khách sạn Mỹ Khê'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
