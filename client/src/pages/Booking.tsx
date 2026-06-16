import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMotorbikeById, Motorbike } from '../services/vehicleService';
import { CalendarDays, MapPin, Phone, User, CreditCard, ArrowLeft, CheckCircle2, Ticket, X as XIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { bookingService } from '../services/bookingService'; // Import Service API
import { promotionService } from '../services/promotionService'; // Import Promotion Service

export const Booking = () => {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  
  const [bike, setBike] = useState<Motorbike | undefined>(undefined);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states chuẩn hóa theo Backend
  const [step, setStep] = useState(1);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [location, setLocation] = useState('Sân bay Đà Nẵng'); // Đổi value option sang tiếng Việt khớp text hiển thị
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(''); // Lưu lỗi từ server nếu có

  // Promotion states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const getRentalDays = () => {
    if (!pickupDate || !returnDate) return 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (start >= end) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const rentalDays = getRentalDays();
  const totalAmountBeforeDiscount = bike?.rentalPrice ? bike.rentalPrice * rentalDays : 0;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Vui lòng nhập mã giảm giá.');
      return;
    }
    if (totalAmountBeforeDiscount <= 0) {
      setPromoError('Vui lòng chọn thời gian thuê xe hợp lệ trước.');
      return;
    }

    setPromoError(null);
    setPromoSuccess(null);
    setValidatingPromo(true);

    try {
      const promo = await promotionService.validatePromoCode(promoCode, totalAmountBeforeDiscount);
      setAppliedPromo(promo);
      setPromoSuccess(`Áp dụng thành công! Được giảm ${promo.discountAmount.toLocaleString()} VNĐ`);
    } catch (err: any) {
      console.error(err);
      setPromoError(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  useEffect(() => {
    const fetchBike = async () => {
      if (!bikeId) return;
      try {
        setLoading(true);
        const data = await getMotorbikeById(bikeId);
        setBike(data);
        if (data.imageUrls && data.imageUrls.length > 0) {
          setActiveImage(data.imageUrls[0]);
        }
      } catch (err) {
        console.error('Error fetching bike details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBike();

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        let nameToSet = u.name || '';
        if (!nameToSet) {
          const parts = [];
          if (u.lastName && u.lastName !== 'undefined') parts.push(u.lastName);
          if (u.firstName && u.firstName !== 'undefined') parts.push(u.firstName);
          nameToSet = parts.join(' ');
        }
        setFullName(nameToSet.trim());
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

  // Hàm xử lý gửi Đơn lên Backend
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (step < 2) {
      // Validate ngày tháng ở bước 1 trước khi sang bước 2
      if (new Date(pickupDate) >= new Date(returnDate)) {
        setApiError('Ngày trả xe phải sau ngày nhận xe!');
        return;
      }
      setStep(step + 1);
    } else {
      try {
        setLoading(true);
        
        // Gọi API tạo đơn thuê xe thực tế
        await bookingService.createBooking({
          vehicleId: bike._id!, // ID xe liên kết database
          pickupDateTime: new Date(pickupDate).toISOString(),
          returnDateTime: new Date(returnDate).toISOString(),
          pickupLocation: { address: location },
          returnLocation: { address: location },
          promoCode: appliedPromo ? appliedPromo.voucherCode : undefined
        });

        setSuccess(true);
      } catch (error: any) {
        // Bắt mọi message thông báo lỗi (hết xe, trùng lịch, thiếu thông tin) từ BE trả về
        setApiError(error.response?.data?.message || 'Có lỗi xảy ra khi đặt xe. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
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
        
        <Link to="/bikes" className="inline-flex items-center gap-2 text-gray-400 hover:text-neon transition-colors mb-8 text-sm group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách xe
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-7 bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-neon text-dark' : 'bg-gray-800 text-gray-400'}`}>1</div>
              <div className={`h-0.5 flex-grow ${step >= 2 ? 'bg-neon' : 'bg-gray-800'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 2 ? 'bg-neon text-dark' : 'bg-gray-800 text-gray-400'}`}>2</div>
            </div>

            <h2 className="font-display font-black text-2xl text-white mb-6 uppercase">
              {step === 1 ? 'Thông Tin Nhận Xe' : 'Thông Tin Cá Nhân'}
            </h2>

            {apiError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                ⚠️ {apiError}
              </div>
            )}

            <form onSubmit={handleNextStep} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-300">Thời gian lấy xe</label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          required
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3.5 outline-none transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-300">Thời gian trả xe</label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          required
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3.5 outline-none transition-all duration-300"
                        />
                      </div>
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
                        <option value="Sân bay Đà Nẵng">Sân bay Đà Nẵng</option>
                        <option value="Ga Đà Nẵng">Ga Đà Nẵng</option>
                        <option value="Bán đảo Sơn Trà">Bán đảo Sơn Trà</option>
                        <option value="Khách sạn khu vực Mỹ Khê">Khách sạn khu vực Mỹ Khê</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Họ và tên khách hàng</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        disabled // Khóa lại vì BE lấy thông tin dựa trên Account Login
                        value={fullName}
                        className="w-full bg-gray-900/50 border border-gray-800 text-gray-500 text-sm rounded-lg block pl-10 p-3.5 outline-none"
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
                        placeholder="Nhập số điện thoại nhận xe"
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
                        placeholder="Nhập số GPLX đối chiếu"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                </>
              )}

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
                  disabled={loading}
                  className="flex-grow bg-neon text-dark font-bold py-3.5 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer text-center disabled:bg-gray-700"
                >
                  {loading ? 'ĐANG XỬ LÝ...' : step === 1 ? 'Tiếp Theo' : 'XÁC NHẬN ĐẶT XE'}
                </button>
              </div>
            </form>
          </div>

          {/* Bike Info Summary Side */}
          <div className="lg:col-span-5 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-display font-bold text-xl text-white uppercase border-b border-gray-800 pb-4">Tóm Tắt Đơn Thuê Xe</h3>
            <div className="space-y-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-gray-800 relative">
                <img src={activeImage} alt={bike.vehicleModel} className="w-full h-full object-cover" />
              </div>
            </div>

            <div>
              <span className="text-xs text-neon font-semibold uppercase px-2.5 py-1 rounded bg-neon/10 border border-neon/30">{bike.category}</span>
              <h2 className="font-display font-black text-2xl text-white mt-3">{bike.vehicleModel}</h2>
              <p className="text-neon font-semibold text-lg mt-1">{bike.rentalPrice ? bike.rentalPrice.toLocaleString() : '0'} VNĐ / Ngày</p>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Loại xe:</span>
                <span className="text-white font-medium">{bike.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bảo hiểm:</span>
                <span className="text-white font-medium">Bảo hiểm trách nhiệm dân sự</span>
              </div>
              {pickupDate && returnDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thời gian thuê:</span>
                  <span className="text-neon font-medium">
                    {new Date(pickupDate).toLocaleDateString('vi-VN')} - {new Date(returnDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Giao nhận tại:</span>
                <span className="text-white font-medium">{location}</span>
              </div>
            </div>

            {/* Promotion Section & Billing Details */}
            {pickupDate && returnDate && rentalDays > 0 ? (
              <div className="border-t border-gray-800 pt-4 space-y-4 animate-fade-in">
                {/* Apply Voucher Form */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Mã giảm giá (Promo Code)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Nhập mã code..."
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={appliedPromo !== null || validatingPromo}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-xs rounded-lg focus:ring-1 focus:ring-neon focus:border-transparent block p-3 outline-none uppercase font-mono tracking-wider disabled:opacity-60"
                      />
                      {appliedPromo && (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoSuccess(null);
                            setPromoCode('');
                          }}
                          className="absolute right-2 top-2.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <XIcon size={14} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={appliedPromo !== null || validatingPromo}
                      onClick={handleApplyPromo}
                      className="bg-surface border border-gray-800 text-white hover:border-neon hover:text-neon disabled:opacity-40 disabled:border-gray-800 disabled:text-gray-500 font-bold px-4 py-2.5 rounded-lg transition-all text-xs uppercase cursor-pointer shrink-0"
                    >
                      {validatingPromo ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  
                  {promoError && (
                    <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">⚠️ {promoError}</p>
                  )}
                  {promoSuccess && (
                    <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">✓ {promoSuccess}</p>
                  )}
                </div>

                {/* Bill details list */}
                <div className="bg-black/20 p-4 border border-gray-800 rounded-xl space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đơn giá xe:</span>
                    <span>{bike.rentalPrice ? bike.rentalPrice.toLocaleString() : '0'} đ/Ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Số ngày thuê:</span>
                    <span>{rentalDays} Ngày</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-white/5 pt-2.5">
                    <span className="text-gray-500">Tạm tính:</span>
                    <span>{totalAmountBeforeDiscount.toLocaleString()} VNĐ</span>
                  </div>
                  
                  {appliedPromo && (
                    <div className="flex justify-between text-green-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Ticket size={12} />
                        Giảm giá ({appliedPromo.voucherCode}):
                      </span>
                      <span>-{appliedPromo.discountAmount.toLocaleString()} VNĐ</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm text-neon border-t border-white/5 pt-2.5 text-glow">
                    <span>Tổng cộng:</span>
                    <span>
                      {(totalAmountBeforeDiscount - (appliedPromo ? appliedPromo.discountAmount : 0)).toLocaleString()} VNĐ
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-800 pt-4 text-center">
                <p className="text-gray-500 text-xs italic">Vui lòng chọn thời gian lấy/trả xe ở Bước 1 để hiển thị hóa đơn tính tiền.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};