import React, { useState, useEffect } from 'react';
import {
  getOwnerMotorbikes,
  createMotorbike,
  updateMotorbike,
  deleteMotorbike,
  Motorbike
} from '../../services/vehicleService';
import { getAllCategories, Category } from '../../services/categoryService';
import { Plus, Edit2, Trash2, X, AlertCircle, Sparkles, Loader, FileText, CheckCircle, HelpCircle, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';

export const OwnerBikes = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Motorbike> | null>(null);

  // Form fields
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [category, setCategory] = useState('');
  const [transmissionType, setTransmissionType] = useState<'Manual' | 'Automatic' | 'Semi-Automatic'>('Automatic');
  const [rentalPrice, setRentalPrice] = useState('');
  const [seats, setSeats] = useState('2');
  const [description, setDescription] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');

  // Status/Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);

  // Location and address fields for geocoding
  const [profileUser, setProfileUser] = useState<any>(null);
  const [bikeAddress, setBikeAddress] = useState('');
  const [latitude, setLatitude] = useState('16.068');
  const [longitude, setLongitude] = useState('108.22');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.token) return;

    setIsUploadingImage(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success && result.url) {
        setImageInput(result.url);
        setSuccessMsg('Tải ảnh xe máy lên thành công!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(result.message || 'Không thể tải ảnh lên.');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (error) {
      console.error('Lỗi khi upload ảnh:', error);
      setErrorMsg('Đã xảy ra lỗi khi tải ảnh lên. Vui lòng thử lại.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const modalMapRef = React.useRef<any>(null);
  const modalMarkerRef = React.useRef<any>(null);

  const DANANG_BOUNDS = {
    minLat: 15.88,
    maxLat: 16.28,
    minLng: 107.75,
    maxLng: 108.35
  };

  const checkInDaNang = (lat: number, lng: number) => {
    return lat >= DANANG_BOUNDS.minLat && lat <= DANANG_BOUNDS.maxLat &&
           lng >= DANANG_BOUNDS.minLng && lng <= DANANG_BOUNDS.maxLng;
  };

  const loadLeaflet = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).L) {
        resolve((window as any).L);
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => resolve((window as any).L);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setBikeAddress(data.display_name);
      }
    } catch (e) {
      console.error('Lỗi giải mã ngược địa chỉ:', e);
    }
  };

  // Geocoding helper function using OpenStreetMap Nominatim
  const geocodeAddress = async (addr: string) => {
    if (!addr.trim()) return;
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);

        if (checkInDaNang(lat, lng)) {
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));

          // Move map and marker if initialized
          if (modalMapRef.current && modalMarkerRef.current) {
            modalMapRef.current.setView([lat, lng], 14);
            modalMarkerRef.current.setLatLng([lat, lng]);
          }
        } else {
          setErrorMsg('Vị trí tìm thấy nằm ngoài địa phận Đà Nẵng!');
          setTimeout(() => setErrorMsg(null), 4000);
        }
      } else {
        setErrorMsg('Không tìm thấy tọa độ cho địa chỉ này.');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (error) {
      console.error('Lỗi định vị địa chỉ:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Fetch all initial data
  const loadInitialData = async (currentUser = user) => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      // Fetch categories
      const cats = await getAllCategories();
      setCategories(cats);

      // Fetch owner's motorbikes
      const data = await getOwnerMotorbikes(currentUser.id);
      setBikes(data);

      // Fetch full user profile details for eKYC address defaulting
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      const profileData = await res.json();
      if (profileData.success) {
        setProfileUser(profileData.user);
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setErrorMsg(err.message || 'Không thể tải danh sách xe. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const currentUser = JSON.parse(storedUser);
      setUser(currentUser);
      loadInitialData(currentUser);
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }, []);
  useEffect(() => {
    if (!isModalOpen) {
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
      }
      modalMarkerRef.current = null;
      return;
    }

    // Initialize map after the modal is rendered in DOM
    const initModalMap = async () => {
      try {
        const L = await loadLeaflet();
        
        setTimeout(() => {
          const mapEl = document.getElementById('modal-leaflet-map');
          if (!mapEl || modalMapRef.current) return;

          const startLat = parseFloat(latitude) || 16.068;
          const startLng = parseFloat(longitude) || 108.22;

          const map = L.map('modal-leaflet-map').setView([startLat, startLng], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          // Restrict map panning bounds to Da Nang region
          const southWest = L.latLng(DANANG_BOUNDS.minLat, DANANG_BOUNDS.minLng);
          const northEast = L.latLng(DANANG_BOUNDS.maxLat, DANANG_BOUNDS.maxLng);
          const bounds = L.latLngBounds(southWest, northEast);
          map.setMaxBounds(bounds);
          map.on('drag', () => {
            map.panInsideBounds(bounds, { animate: false });
          });

          // Custom indicator marker
          const bikeIcon = L.divIcon({
            className: 'modal-bike-marker',
            html: `<div style="background-color: #ccff00; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #000; box-shadow: 0 0 10px #ccff00;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = L.marker([startLat, startLng], {
            icon: bikeIcon,
            draggable: true
          }).addTo(map);

          modalMarkerRef.current = marker;
          modalMapRef.current = map;

          // Drag marker to update coordinates
          marker.on('dragend', async () => {
            const position = marker.getLatLng();
            const lat = position.lat;
            const lng = position.lng;

            if (checkInDaNang(lat, lng)) {
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
              reverseGeocode(lat, lng);
            } else {
              setErrorMsg('Vị trí phải nằm trong địa phận Đà Nẵng!');
              marker.setLatLng([parseFloat(latitude), parseFloat(longitude)]);
              setTimeout(() => setErrorMsg(null), 4000);
            }
          });

          // Click map to reposition marker
          map.on('click', (e: any) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            if (checkInDaNang(lat, lng)) {
              marker.setLatLng(e.latlng);
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
              reverseGeocode(lat, lng);
            } else {
              setErrorMsg('Vị trí chọn phải nằm trong địa phận Đà Nẵng!');
              setTimeout(() => setErrorMsg(null), 4000);
            }
          });

        }, 400); // Wait for modal animation to complete
      } catch (err) {
        console.error('Lỗi khởi tạo bản đồ modal:', err);
      }
    };

    initModalMap();
  }, [isModalOpen]);
  const openAddModal = () => {
    setErrorMsg(null);
    setCurrentBike(null);
    setVehicleModel('');
    setLicensePlate('');
    setCategory(categories[0]?._id || '');
    setTransmissionType('Automatic');
    setRentalPrice('');
    setSeats('2');
    setDescription('');
    setImageInput(DEFAULT_IMAGE);
    setFeaturesInput('Mới 99%, Tiết kiệm xăng, Khóa Smartkey');
    
    // Default location to profile address if exists
    if (profileUser?.citizenIdInfo?.address) {
      const defaultAddr = profileUser.citizenIdInfo.address;
      setBikeAddress(defaultAddr);
      geocodeAddress(defaultAddr);
    } else {
      setBikeAddress('Đà Nẵng, Việt Nam');
      setLatitude('16.068');
      setLongitude('108.22');
    }
    
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Motorbike) => {
    setErrorMsg(null);
    setCurrentBike(bike);
    setVehicleModel(bike.vehicleModel);
    setLicensePlate(bike.licensePlate);
    setCategory(typeof bike.category === 'object' && bike.category !== null ? (bike.category as any)._id : bike.category || '');
    setTransmissionType(bike.transmissionType || 'Automatic');
    setRentalPrice(bike.rentalPrice.toString());
    setSeats((bike.seats || 2).toString());
    setImageInput(bike.imageUrls && bike.imageUrls.length > 0 ? bike.imageUrls[0] : '');
    setFeaturesInput(bike.features ? bike.features.join(', ') : '');
    
    // Set location fields
    const coords = bike.location?.coordinates || [108.22, 16.068];
    setLongitude(coords[0].toString());
    setLatitude(coords[1].toString());
    
    // Parse address from description if it matches "Địa chỉ xe: ..."
    const addressMatch = bike.description?.match(/Địa chỉ xe: (.*?)(?:\n|$)/);
    if (addressMatch) {
      setBikeAddress(addressMatch[1]);
      const cleanDesc = bike.description?.replace(/Địa chỉ xe: .*?(\n|$)/, '');
      setDescription(cleanDesc || '');
    } else {
      setBikeAddress('');
      setDescription(bike.description || '');
    }
    
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setBikeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bikeToDelete || !user?.token) return;

    try {
      setIsSubmitting(true);
      await deleteMotorbike(bikeToDelete, user.token);
      
      setDeleteConfirmOpen(false);
      setBikeToDelete(null);
      setSuccessMsg('Đã hủy đăng ký xe thành công!');
      
      // Reload list
      const data = await getOwnerMotorbikes(user.id);
      setBikes(data);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error deleting bike:', err);
      setErrorMsg(err.message || 'Lỗi khi xóa xe. Vui lòng thử lại.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.token) {
      setErrorMsg('Bạn cần đăng nhập để thực hiện.');
      return;
    }

    // Validate inputs
    if (!vehicleModel || vehicleModel.trim() === '') {
      setErrorMsg('Tên dòng xe máy không được để trống.');
      return;
    }

    const cleanPlate = licensePlate.trim().toUpperCase();
    if (!cleanPlate) {
      setErrorMsg('Biển số xe không được để trống.');
      return;
    }
    
    // Strict regular expression for Vietnamese motorcycle license plates:
    // Region code (2 digits) + Series (either Letter+Number like C1 or 2 Letters like AA) + Separator (space/hyphen/empty) + Number (4 digits, 5 digits, or 3 digits + dot + 2 digits)
    const plateRegex = /^[0-9]{2}-?([A-Z][0-9]|[A-Z]{2})[\s-]?([0-9]{4}|[0-9]{5}|[0-9]{3}\.[0-9]{2})$/;
    if (!plateRegex.test(cleanPlate)) {
      setErrorMsg('Biển số xe máy không hợp lệ. Ví dụ đúng: 43-C1 123.45 hoặc 43C1-12345 (phải có 4 hoặc 5 số).');
      return;
    }

    if (!category) {
      setErrorMsg('Vui lòng chọn danh mục nhóm xe.');
      return;
    }

    // Process price
    const parsedPrice = parseFloat(rentalPrice.toString().replace(/\./g, '').replace(/,/g, ''));
    if (isNaN(parsedPrice) || parsedPrice < 30000 || parsedPrice > 5000000) {
      setErrorMsg('Giá thuê phải nằm trong khoảng từ 30.000 VNĐ đến 5.000.000 VNĐ / ngày.');
      return;
    }

    if (!bikeAddress || bikeAddress.trim() === '') {
      setErrorMsg('Địa chỉ đặt xe máy không được để trống.');
      return;
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);
    if (isNaN(latVal) || isNaN(lngVal) || !checkInDaNang(latVal, lngVal)) {
      setErrorMsg('Vị trí xe máy phải nằm trong địa phận Đà Nẵng. Vui lòng định vị lại trên bản đồ.');
      return;
    }

    if (!imageInput || !imageInput.startsWith('http')) {
      setErrorMsg('Đường dẫn hình ảnh xe máy (URL) không hợp lệ (phải bắt đầu bằng http:// hoặc https://).');
      return;
    }

    if (!description || description.trim().length < 10) {
      setErrorMsg('Mô tả chi tiết tình trạng xe phải có ít nhất 10 ký tự.');
      return;
    }

    const parsedFeatures = featuresInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const imageUrls = [imageInput || DEFAULT_IMAGE];

    const bikeData: any = {
      vehicleModel,
      licensePlate: licensePlate.trim().toUpperCase(),
      seats: parseInt(seats) || 2,
      rentalPrice: parsedPrice,
      category,
      transmissionType,
      description: bikeAddress ? `Địa chỉ xe: ${bikeAddress}\n${description}` : description,
      imageUrls,
      features: parsedFeatures,
      odometer: currentBike?.odometer || 0,
      requiresMaintenance: currentBike?.requiresMaintenance || false,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 108.22, parseFloat(latitude) || 16.068]
      }
    };

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (currentBike && currentBike._id) {
        // Edit bike
        await updateMotorbike(currentBike._id, bikeData, user.token);
        setSuccessMsg('Đã cập nhật thông tin xe thành công!');
      } else {
        // Create new bike
        await createMotorbike(bikeData, user.token);
        setSuccessMsg('Đăng ký xe mới thành công! Vui lòng chờ Admin duyệt.');
      }

      setIsModalOpen(false);
      
      // Reload list
      const data = await getOwnerMotorbikes(user.id);
      setBikes(data);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving bike:', err);
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin xe. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/10 text-green-400 border-green-500/25';
      case 'Rented':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'Maintenance':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25';
      case 'PendingApproval':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/25';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Available':
        return 'Sẵn sàng';
      case 'Rented':
        return 'Đang thuê';
      case 'Maintenance':
        return 'Bảo trì';
      case 'PendingApproval':
        return 'Chờ duyệt';
      default:
        return status;
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-950/40 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-3"
            >
              <CheckCircle size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
              Xe Cho Thuê Của Tôi
            </h1>
            <p className="text-gray-400 text-sm">
              Đăng ký thêm xe mới hoặc điều chỉnh danh sách xe tự có của bạn trên hệ thống
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="flex items-center gap-2 bg-neon text-dark font-bold px-6 py-3.5 rounded-lg hover:bg-[#bbf000] disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-102 cursor-pointer"
          >
            <Plus size={18} />
            ĐĂNG KÝ THÊM XE
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader className="w-10 h-10 animate-spin text-neon mb-4" />
            <p className="text-sm">Đang tải danh sách xe của bạn...</p>
          </div>
        ) : (
          /* Bikes Grid / Table */
          <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                    <th className="py-4 px-6">Hình ảnh</th>
                    <th className="py-4 px-6">Dòng xe máy</th>
                    <th className="py-4 px-6">Biển số</th>
                    <th className="py-4 px-6">Loại hộp số</th>
                    <th className="py-4 px-6">Giá thuê / ngày</th>
                    <th className="py-4 px-6">Đặc điểm (Specs)</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {bikes.map(bike => {
                    const bikeImage = bike.imageUrls && bike.imageUrls.length > 0 ? bike.imageUrls[0] : DEFAULT_IMAGE;
                    const catName = typeof bike.category === 'object' && bike.category !== null ? (bike.category as any).name : 'Chưa phân loại';
                    const transLabel = bike.transmissionType === 'Automatic' ? 'Xe ga' : bike.transmissionType === 'Manual' ? 'Xe số' : 'Xe côn tay';

                    return (
                      <tr key={bike._id} className="hover:bg-black/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="w-16 h-12 rounded overflow-hidden border border-gray-800 bg-black">
                            <img src={bikeImage} alt={bike.vehicleModel} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-white">
                          <div>{bike.vehicleModel}</div>
                          <div className="text-[10px] text-gray-500 font-normal">{catName}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-neon/90 font-bold uppercase">{bike.licensePlate}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15">
                            {transLabel}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-neon">{bike.rentalPrice.toLocaleString('vi-VN')} VNĐ</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {bike.features.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-400">
                                {s}
                              </span>
                            ))}
                            {bike.features.length > 3 && (
                              <span className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-neon font-bold">
                                +{bike.features.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(bike.status)}`}>
                            {getStatusLabel(bike.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(bike)}
                              className="p-2 rounded bg-black hover:bg-gray-800 text-yellow-500 border border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
                              title="Chỉnh sửa xe"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => bike._id && handleDeleteClick(bike._id)}
                              className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                              title="Hủy đăng ký"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {bikes.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle size={32} className="mx-auto mb-2 text-gray-600" />
                Bạn chưa đăng ký chiếc xe nào trên hệ thống. Nhấn &ldquo;Đăng Ký Thêm Xe&rdquo; để bắt đầu chia sẻ xe và kiếm thu nhập.
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                {!isSubmitting && (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                )}

                <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                  <Sparkles size={18} className="text-neon" />
                  <h3 className="font-display font-bold text-xl text-white uppercase">
                    {currentBike ? 'Chỉnh Sửa Xe Cho Thuê' : 'Đăng Ký Xe Đối Tác'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  {/* Model & Plate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên dòng xe máy</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ví dụ: Honda Vision"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Biển số xe</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ví dụ: 43-C1 123.45"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Category & Transmission */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục nhóm xe</label>
                      <select
                        value={category}
                        disabled={isSubmitting}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
                      >
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hộp số</label>
                      <select
                        value={transmissionType}
                        disabled={isSubmitting}
                        onChange={(e) => setTransmissionType(e.target.value as any)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="Automatic">Xe tay ga (Auto)</option>
                        <option value="Manual">Xe côn tay (Manual)</option>
                        <option value="Semi-Automatic">Xe số (Semi-Auto)</option>
                      </select>
                    </div>
                  </div>

                  {/* Price & Seats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá thuê / ngày (VNĐ)</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ví dụ: 120.000"
                        value={rentalPrice}
                        onChange={(e) => setRentalPrice(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số chỗ ngồi</label>
                      <select
                        value={seats}
                        disabled={isSubmitting}
                        onChange={(e) => setSeats(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="1">1 chỗ</option>
                        <option value="2">2 chỗ</option>
                      </select>
                    </div>
                  </div>

                  {/* Địa chỉ và Định vị */}
                  <div className="space-y-3 p-3 bg-black/30 border border-gray-800 rounded-xl">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={14} className="text-neon" />
                        Địa chỉ đặt xe máy
                      </label>
                      {profileUser?.citizenIdInfo?.address && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setBikeAddress(profileUser.citizenIdInfo.address);
                            geocodeAddress(profileUser.citizenIdInfo.address);
                          }}
                          className="text-[10px] text-neon hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Lấy địa chỉ từ CCCD
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={isSubmitting}
                        placeholder="Nhập địa chỉ xe, ví dụ: 120 Hùng Vương, Đà Nẵng"
                        value={bikeAddress}
                        onChange={(e) => setBikeAddress(e.target.value)}
                        className="flex-grow bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        disabled={isSubmitting || isGeocoding || !bikeAddress}
                        onClick={() => geocodeAddress(bikeAddress)}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer disabled:opacity-50"
                      >
                        {isGeocoding ? (
                          <Loader size={12} className="animate-spin" />
                        ) : (
                          <Search size={12} />
                        )}
                        Định vị
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Kinh độ (Longitude)</label>
                        <input
                          type="text"
                          required
                          placeholder="108.22"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Vĩ độ (Latitude)</label>
                        <input
                          type="text"
                          required
                          placeholder="16.068"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <div id="modal-leaflet-map" style={{ height: '200px', width: '100%', borderRadius: '8px', marginTop: '12px', border: '1px solid #374151', zIndex: 10 }}></div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      * Nhấn &ldquo;Định vị&rdquo; để tự động xác định từ địa chỉ, hoặc kéo ghim/click trực tiếp trên bản đồ để chọn vị trí đỗ xe máy (chỉ giới hạn trong khu vực Đà Nẵng).
                    </p>
                  </div>

                  {/* Image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Hình ảnh xe máy</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-black/30 border border-gray-800 rounded-xl">
                      {imageInput ? (
                        <div className="relative w-28 h-20 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shrink-0">
                          <img src={imageInput} alt="Xe máy preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-28 h-20 bg-gray-950 rounded-lg border border-dashed border-gray-800 flex items-center justify-center text-gray-600 shrink-0 text-xs font-semibold">
                          Chưa có ảnh
                        </div>
                      )}
                      
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex gap-2 items-center">
                          <label className="shrink-0">
                            <span className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all disabled:opacity-50 select-none">
                              {isUploadingImage ? (
                                <>
                                  <Loader size={12} className="animate-spin" />
                                  Đang tải...
                                </>
                              ) : (
                                <>
                                  <Plus size={12} />
                                  Chọn ảnh từ máy
                                </>
                              )}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingImage || isSubmitting}
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="Hoặc nhập URL ảnh tại đây..."
                            disabled={isSubmitting || isUploadingImage}
                            value={imageInput}
                            onChange={(e) => setImageInput(e.target.value)}
                            className="flex-grow bg-black/50 border border-gray-800 text-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">Hỗ trợ định dạng JPG, PNG, WEBP. Ảnh tự tải lên sẽ được lưu trữ trực tiếp trên máy chủ.</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đặc điểm xe (Cách nhau bởi dấu phẩy)</label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      placeholder="Ví dụ: Khóa Smartkey, Đèn LED, Cốp rộng 25L"
                      value={featuresInput}
                      onChange={(e) => setFeaturesInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</label>
                    <textarea
                      rows={3}
                      disabled={isSubmitting}
                      placeholder="Mô tả tình trạng xe, điều kiện thuê, v.v..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all disabled:opacity-50 resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 mt-4 animate-pulse">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all cursor-pointer text-center disabled:opacity-50"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-grow bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader size={16} className="animate-spin" />}
                      <span>{currentBike ? 'LƯU XE' : 'ĐĂNG KÝ XE'}</span>
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSubmitting && setDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl text-center"
              >
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                  Xác nhận hủy đăng ký xe?
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Chiếc xe này sẽ bị rút khỏi hệ thống tìm kiếm thuê xe và chuyển trạng thái hoạt động. Tác vụ này không thể khôi phục.
                </p>

                <div className="flex gap-3">
                  <button
                    disabled={isSubmitting}
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex-1 bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 py-3 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader size={16} className="animate-spin" />}
                    <span>XÁC NHẬN XÓA</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
