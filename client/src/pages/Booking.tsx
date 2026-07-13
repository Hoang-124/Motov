import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMotorbikeById, Motorbike } from '../services/vehicleService';
import { CalendarDays, MapPin, Phone, User, CreditCard, ArrowLeft, CheckCircle2, Ticket, X as XIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bookingService } from '../services/bookingService'; // Import Service API
import { promotionService } from '../services/promotionService'; // Import Promotion Service
import { useLanguage } from '../hooks/useLanguage';

const translateCategory = (cat: string, t: any) => {
  const c = (cat || '').toLowerCase().trim();
  if (c === 'xe máy điện' || c === 'electric' || c === 'xe may dien') return t('categories.electric');
  if (c === 'xe số' || c === 'manual' || c === 'xe so') return t('categories.manual');
  if (c === 'xe ga' || c === 'scooter') return t('categories.scooter');
  return cat;
};

const translateLocation = (loc: string, t: any) => {
  const l = (loc || '').toLowerCase().trim();
  if (l === 'sân bay đà nẵng' || l === 'da nang airport' || l === 'airport') return t('locations.airport');
  if (l === 'ga đà nẵng' || l === 'da nang railway station' || l === 'railway') return t('locations.railway');
  if (l === 'bán đảo sơn trà' || l === 'son tra peninsula' || l === 'son tra') return t('locations.sontra');
  if (l === 'khách sạn khu vực mỹ khê' || l === 'my khe area hotel' || l === 'my khe') return t('locations.mykhe');
  return loc;
};

export const Booking = () => {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  const [bike, setBike] = useState<Motorbike | undefined>(undefined);
  
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPickupPicker = () => {
    if (pickupInputRef.current) {
      try {
        pickupInputRef.current.showPicker();
      } catch (e) {
        pickupInputRef.current.focus();
      }
    }
  };

  const handleOpenReturnPicker = () => {
    if (returnInputRef.current) {
      try {
        returnInputRef.current.showPicker();
      } catch (e) {
        returnInputRef.current.focus();
      }
    }
  };
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
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Banking'>('Banking');
  const [deliveryMethod, setDeliveryMethod] = useState<'StorePickup' | 'HomeDelivery'>('StorePickup');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
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

  const [identityStatus, setIdentityStatus] = useState<'Unverified' | 'Pending' | 'Verified' | 'Rejected'>('Verified');

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
        
        // Gọi API kiểm tra identityStatus của user
        const checkIdentity = async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api'}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${u.token}`
              }
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
              setIdentityStatus(resData.user.identityStatus || 'Unverified');
              if (resData.user.phoneNumber) {
                setPhone(resData.user.phoneNumber);
              }
              if (resData.user.citizenIdInfo?.idNumber) {
                setLicense(resData.user.citizenIdInfo.idNumber);
              }
              let nameVal = resData.user.citizenIdInfo?.fullName;
              if (!nameVal) {
                const parts = [];
                if (resData.user.lastName) parts.push(resData.user.lastName);
                if (resData.user.firstName) parts.push(resData.user.firstName);
                nameVal = parts.join(' ');
              }
              if (nameVal && nameVal.trim()) {
                setFullName(nameVal.trim());
              }
            }
          } catch (err) {
            console.error('Lỗi kiểm tra eKYC:', err);
          }
        };
        checkIdentity();
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

  const validateDates = (pickup: string, dropoff: string) => {
    const now = new Date();
    const start = new Date(pickup);
    const end = new Date(dropoff);

    if (isNaN(start.getTime())) {
      return 'Thời gian lấy xe không hợp lệ!';
    }
    if (isNaN(end.getTime())) {
      return 'Thời gian trả xe không hợp lệ!';
    }

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const currentYear = now.getFullYear();

    if (startYear < currentYear || startYear > 2100) {
      return `Năm lấy xe không hợp lệ! Vui lòng chọn năm từ ${currentYear} đến 2100.`;
    }
    if (endYear < currentYear || endYear > 2100) {
      return `Năm trả xe không hợp lệ! Vui lòng chọn năm từ ${currentYear} đến 2100.`;
    }

    // Cho phép sai lệch lùi 30 phút để bù trừ thời gian thao tác điền form
    const minPickup = new Date(now.getTime() - 30 * 60 * 1000);
    if (start < minPickup) {
      return 'Thời gian lấy xe không được ở trong quá khứ (trễ không quá 30 phút)!';
    }

    // Thời gian trả xe phải sau thời gian lấy xe ít nhất 1 giờ
    const minDropoff = new Date(start.getTime() + 60 * 60 * 1000);
    if (end < minDropoff) {
      return 'Thời gian trả xe phải sau thời gian lấy xe ít nhất 1 giờ!';
    }

    // Thời gian thuê tối đa là 30 ngày
    const maxRentalDays = 30;
    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (rentalDays > maxRentalDays) {
      return `Thời gian cho thuê tối đa là ${maxRentalDays} ngày!`;
    }

    return null;
  };

  // Hàm xử lý gửi Đơn lên Backend
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setApiError('');

    if (step < 2) {
      // Validate ngày tháng ở bước 1 trước khi sang bước 2
      const dateError = validateDates(pickupDate, returnDate);
      if (dateError) {
        setApiError(dateError);
        return;
      }
      setStep(step + 1);
    } else {
      // Validate bước 2
      if (!phone.trim()) {
        setApiError('Vui lòng nhập số điện thoại liên lạc!');
        return;
      }
      const phoneRegex = /^(03|05|07|08|09)([0-9]{8})$/;
      if (!phoneRegex.test(phone.trim())) {
        setApiError('Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)!');
        return;
      }
      if (!license.trim()) {
        setApiError('Vui lòng nhập số giấy phép lái xe!');
        return;
      }
      if (license.trim().length < 6) {
        setApiError('Số giấy phép lái xe không hợp lệ (tối thiểu 6 ký tự)!');
        return;
      }

      // Re-validate dates before calling API (in case user stayed on step 2 too long)
      const dateError = validateDates(pickupDate, returnDate);
      if (dateError) {
        setApiError(dateError);
        setStep(1); // Auto redirect back to step 1
        return;
      }

      try {
        setLoading(true);
        
        // Gửi thông tin tạo đơn
        const response = await bookingService.createBooking({
          vehicleId: bike._id!,
          pickupDateTime: new Date(pickupDate).toISOString(),
          returnDateTime: new Date(returnDate).toISOString(),
          pickupLocation: { address: deliveryMethod === 'StorePickup' ? 'Nhận tại cửa hàng Motov' : location },
          returnLocation: { address: deliveryMethod === 'StorePickup' ? 'Trả tại cửa hàng Motov' : location },
          promoCode: appliedPromo ? appliedPromo.voucherCode : undefined,
          paymentMethod,
          deliveryMethod
        });

        if (paymentMethod === 'Banking') {
          const resUrl = await bookingService.getVNPayUrl(response.booking.id);
          if (resUrl.paymentUrl) {
            window.location.href = resUrl.paymentUrl;
            return;
          }
        }

        setSuccess(true);
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đặt xe. Vui lòng thử lại!';
        setApiError(errorMsg);
        
        // Auto redirect to step 1 if the backend error is related to dates/times
        const lowerMsg = errorMsg.toLowerCase();
        if (
          lowerMsg.includes('ngày') || 
          lowerMsg.includes('thời gian') || 
          lowerMsg.includes('quá khứ') || 
          lowerMsg.includes('tương lai') ||
          lowerMsg.includes('date') || 
          lowerMsg.includes('time') || 
          lowerMsg.includes('past') || 
          lowerMsg.includes('future')
        ) {
          setStep(1);
        }
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
          <h2 className="font-display font-black text-3xl text-white mb-3">{t('bookingPage.successTitle')}</h2>
          <p className="text-gray-400 text-sm mb-8">
            {t('bookingPage.successSubtitle')}
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/bookings" className="bg-neon text-dark font-bold py-3.5 rounded-lg hover:bg-[#bbf000] transition-colors">
              {t('bookingPage.viewBookingsBtn')}
            </Link>
            <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
              {t('bookingPage.backHomeBtn')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="w-full max-w-[95%] xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 lg:px-8 2xl:px-12">
        
        <Link to={`/motorbike/${bikeId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-neon transition-colors mb-8 text-sm group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('bookingPage.backBtn')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-7 bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-neon text-dark' : 'bg-gray-800 text-gray-400'}`}>1</div>
              <div className={`h-0.5 flex-grow ${step >= 2 ? 'bg-neon' : 'bg-gray-800'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 2 ? 'bg-neon text-dark' : 'bg-gray-800 text-gray-400'}`}>2</div>
            </div>

            <h2 className="font-display font-black text-2xl text-white mb-6 uppercase">
              {step === 1 ? t('bookingPage.step1Title') : t('bookingPage.step2Title')}
            </h2>

            {apiError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                ⚠️ {apiError}
              </div>
            )}

            {identityStatus !== 'Verified' && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col gap-2 text-left">
                <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                  ⚠️ {t('bookingPage.ekycWarning')}
                </p>
                <p className="text-[11px] text-gray-400">
                  {identityStatus === 'Unverified' && t('bookingPage.ekycUnverified')}
                  {identityStatus === 'Pending' && t('bookingPage.ekycPending')}
                  {identityStatus === 'Rejected' && t('bookingPage.ekycRejected')}
                </p>
                {(identityStatus === 'Unverified' || identityStatus === 'Rejected') && (
                  <Link 
                    to="/profile" 
                    className="mt-1 px-4 py-2 bg-neon text-dark font-black text-center rounded-lg text-[10px] uppercase tracking-wider hover:bg-[#bbf000] w-fit transition-all duration-300"
                  >
                    {t('bookingPage.ekycBtn')}
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleNextStep} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.pickupTime')}</label>
                      <div 
                        onClick={handleOpenPickupPicker}
                        className="relative flex items-center bg-black/50 border border-gray-800 rounded-lg hover:border-neon focus-within:ring-2 focus-within:ring-neon focus-within:border-transparent transition-all duration-300 cursor-pointer"
                      >
                        <div className="pl-3.5 pointer-events-none">
                          <CalendarDays size={18} className="text-neon" />
                        </div>
                        <input 
                          type="datetime-local" 
                          ref={pickupInputRef}
                          required
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent text-gray-300 text-sm block pl-3 p-3.5 outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.returnTime')}</label>
                      <div 
                        onClick={handleOpenReturnPicker}
                        className="relative flex items-center bg-black/50 border border-gray-800 rounded-lg hover:border-neon focus-within:ring-2 focus-within:ring-neon focus-within:border-transparent transition-all duration-300 cursor-pointer"
                      >
                        <div className="pl-3.5 pointer-events-none">
                          <CalendarDays size={18} className="text-neon" />
                        </div>
                        <input 
                          type="datetime-local" 
                          ref={returnInputRef}
                          required
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent text-gray-300 text-sm block pl-3 p-3.5 outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.paymentMethod')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('Banking');
                        }}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          paymentMethod === 'Banking'
                            ? 'bg-neon/10 border-neon text-neon shadow-[0_0_10px_rgba(204,255,0,0.1)]'
                            : 'bg-black/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        <CreditCard size={18} />
                        {t('bookingPage.paymentOnline').replace(' (Online)', '')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('Cash');
                          setDeliveryMethod('StorePickup'); // Auto force store pickup
                        }}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          paymentMethod === 'Cash'
                            ? 'bg-neon/10 border-neon text-neon shadow-[0_0_10px_rgba(204,255,0,0.1)]'
                            : 'bg-black/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        <User size={18} />
                        {t('bookingPage.paymentCash').replace(' (Trực tiếp)', '')}
                      </button>
                    </div>
                  </div>

                  {/* Delivery Method */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.deliveryMethod')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('StorePickup')}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          deliveryMethod === 'StorePickup'
                            ? 'bg-neon/10 border-neon text-neon shadow-[0_0_10px_rgba(204,255,0,0.1)]'
                            : 'bg-black/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        {t('bookingPage.storePickup')}
                      </button>
                      <button
                        type="button"
                        disabled={paymentMethod === 'Cash'}
                        onClick={() => setDeliveryMethod('HomeDelivery')}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          deliveryMethod === 'HomeDelivery'
                            ? 'bg-neon/10 border-neon text-neon shadow-[0_0_10px_rgba(204,255,0,0.1)]'
                            : 'bg-black/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        {t('bookingPage.homeDelivery')}
                      </button>
                    </div>
                    {paymentMethod === 'Cash' && (
                      <p className="text-[10px] text-yellow-500/80 italic">
                        * {t('bookingPage.paymentCash')} {t('bookingPage.cashInstruction')}
                      </p>
                    )}
                  </div>

                  {/* Delivery Location Selection */}
                  {deliveryMethod === 'HomeDelivery' && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.deliveryAddress')}</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                          className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent flex items-center pl-10 pr-10 p-3.5 outline-none cursor-pointer transition-all duration-300 text-left relative"
                        >
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin size={18} className="text-neon" />
                          </div>
                          <span>
                            {location === 'Sân bay Đà Nẵng' && t('locations.airport')}
                            {location === 'Ga Đà Nẵng' && t('locations.railway')}
                            {location === 'Bán đảo Sơn Trà' && t('locations.sontra')}
                            {location === 'Khách sạn khu vực Mỹ Khê' && t('locations.mykhe')}
                          </span>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isLocationDropdownOpen ? 'rotate-180 text-neon' : ''}`} />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isLocationDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsLocationDropdownOpen(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 mt-2 z-50 bg-surface/98 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-300 py-1 font-sans"
                              >
                                <div className="absolute top-0 inset-x-0 h-[2px] bg-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                                {[
                                  { value: 'Sân bay Đà Nẵng', label: t('locations.airport') },
                                  { value: 'Ga Đà Nẵng', label: t('locations.railway') },
                                  { value: 'Bán đảo Sơn Trà', label: t('locations.sontra') },
                                  { value: 'Khách sạn khu vực Mỹ Khê', label: t('locations.mykhe') }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setLocation(opt.value);
                                      setIsLocationDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer bg-transparent border-none ${
                                      location === opt.value ? 'text-neon bg-neon/5 font-bold' : 'text-gray-300 hover:text-neon hover:bg-white/5'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.fullName')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.phone')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-neon" />
                      </div>
                      <input 
                        type="tel" 
                        required
                        placeholder={language === 'vi' ? 'Nhập số điện thoại nhận xe' : 'Enter phone number'}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3.5 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">{t('bookingPage.license')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard size={18} className="text-neon" />
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder={language === 'vi' ? 'Nhập số GPLX đối chiếu' : 'Enter driver license number'}
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
                    {t('bookingPage.prevBtn')}
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={loading || identityStatus !== 'Verified'}
                  className="flex-grow bg-neon text-dark font-bold py-3.5 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer text-center disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (language === 'vi' ? 'ĐANG XỬ LÝ...' : language === 'ko' ? '처리 중...' : 'PROCESSING...') : step === 1 ? t('bookingPage.nextBtn') : t('bookingPage.confirmBtn')}
                </button>
              </div>
            </form>
          </div>

          {/* Bike Info Summary Side */}
          <div className="lg:col-span-5 bg-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-display font-bold text-xl text-white uppercase border-b border-gray-800 pb-4">{t('bookingPage.summaryTitle')}</h3>
            <div className="space-y-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-gray-800 relative">
                <img src={activeImage} alt={bike.vehicleModel} className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <span className="text-xs text-neon font-semibold uppercase px-2.5 py-1 rounded bg-neon/10 border border-neon/30">
                {translateCategory(typeof bike.category === 'object' && bike.category !== null ? (bike.category as any).name : bike.category, t)}
              </span>
              <h2 className="font-display font-black text-2xl text-white mt-3">{bike.vehicleModel}</h2>
              <p className="text-neon font-semibold text-lg mt-1">{bike.rentalPrice ? bike.rentalPrice.toLocaleString() : '0'} VNĐ / {t('bookingPage.billingUnit').replace('đ/', '')}</p>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('bookingPage.bikeType')}</span>
                <span className="text-white font-medium">
                  {translateCategory(typeof bike.category === 'object' && bike.category !== null ? (bike.category as any).name : bike.category, t)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('bookingPage.insurance')}</span>
                <span className="text-white font-medium">{t('bookingPage.insuranceDesc')}</span>
              </div>
              {pickupDate && returnDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('bookingPage.rentalPeriod')}</span>
                  <span className="text-neon font-medium">
                    {new Date(pickupDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} - {new Date(returnDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('bookingPage.deliveryType')}</span>
                <span className="text-white font-medium">{deliveryMethod === 'StorePickup' ? t('bookingPage.storePickup') : t('bookingPage.homeDelivery')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('bookingPage.deliveryAt')}</span>
                <span className="text-white font-medium">{deliveryMethod === 'StorePickup' ? t('bookingPage.storeAddress') : translateLocation(location, t)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('bookingPage.payBy')}</span>
                <span className="text-neon font-medium">{paymentMethod === 'Banking' ? t('bookingPage.paymentOnline') : t('bookingPage.paymentCash')}</span>
              </div>
            </div>

            {/* Promotion Section & Billing Details */}
            {pickupDate && returnDate && rentalDays > 0 ? (
              <div className="border-t border-gray-800 pt-4 space-y-4 animate-fade-in">
                {/* Apply Voucher Form */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('bookingPage.promoLabel')}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder={t('bookingPage.promoPlaceholder')}
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
                      {validatingPromo ? '...' : t('bookingPage.applyBtn')}
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
                    <span className="text-gray-500">{t('myBookingsPage.totalPay').split(':')[0]}:</span>
                    <span>{bike.rentalPrice ? bike.rentalPrice.toLocaleString() : '0'} {t('bookingPage.billingUnit')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('bookingPage.billingDays')}</span>
                    <span>{rentalDays} {language === 'vi' ? 'Ngày' : language === 'ko' ? '일' : 'Days'}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-white/5 pt-2.5">
                    <span className="text-gray-500">{t('bookingPage.billingSubtotal')}</span>
                    <span>{totalAmountBeforeDiscount.toLocaleString()} VNĐ</span>
                  </div>
                  
                  {appliedPromo && (
                    <div className="flex justify-between text-green-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Ticket size={12} />
                        {t('bookingPage.billingDiscount').replace('{code}', appliedPromo.voucherCode)}
                      </span>
                      <span>-{appliedPromo.discountAmount.toLocaleString()} VNĐ</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm text-neon border-t border-white/5 pt-2.5 text-glow">
                    <span>{t('bookingPage.billingTotal')}</span>
                    <span>
                      {(totalAmountBeforeDiscount - (appliedPromo ? appliedPromo.discountAmount : 0)).toLocaleString()} VNĐ
                    </span>
                  </div>
                  
                  {paymentMethod === 'Banking' ? (
                    <>
                      <div className="flex justify-between text-xs text-yellow-400 font-bold border-t border-dashed border-white/5 pt-2.5">
                        <span>{t('bookingPage.billingDeposit')}</span>
                        <span>
                          {Math.round((totalAmountBeforeDiscount - (appliedPromo ? appliedPromo.discountAmount : 0)) * 0.3).toLocaleString()} VNĐ
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>{t('bookingPage.billingRemaining')}</span>
                        <span>
                          {((totalAmountBeforeDiscount - (appliedPromo ? appliedPromo.discountAmount : 0)) - Math.round((totalAmountBeforeDiscount - (appliedPromo ? appliedPromo.discountAmount : 0)) * 0.3)).toLocaleString()} VNĐ
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-yellow-400 font-bold border-t border-dashed border-white/5 pt-2.5">
                        <span>{t('bookingPage.billingCashDeposit')}</span>
                        <span>{t('bookingPage.billingCashNoDeposit')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>{t('bookingPage.billingCashRemaining')}</span>
                        <span>
                          {(totalAmountBeforeDiscount - (appliedPromo ? appliedPromo.discountAmount : 0)).toLocaleString()} VNĐ
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-800 pt-4 text-center">
                <p className="text-gray-500 text-xs italic">{t('bookingPage.billingInstruction')}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};