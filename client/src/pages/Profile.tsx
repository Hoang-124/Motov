import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, Award, Briefcase, UserCheck, Check, Save, ArrowLeft, Camera, Lock, Key, X, RefreshCw, AlertCircle, FileText, Eye, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User database state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  
  // Editable form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [dob, setDob] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // eKYC states
  const [identityStatus, setIdentityStatus] = useState<'Unverified' | 'Pending' | 'Verified' | 'Rejected'>('Unverified');
  const [identityRejectReason, setIdentityRejectReason] = useState('');
  const [citizenIdInfo, setCitizenIdInfo] = useState<any>(null);
  
  // UI states for eKYC Modal
  const [isEkycModalOpen, setIsEkycModalOpen] = useState(false);
  const [ekycStep, setEkycStep] = useState<'upload' | 'liveness' | 'scanning' | 'result'>('upload'); 
  const [cardFront, setCardFront] = useState<string>('');
  const [cardBack, setCardBack] = useState<string>('');
  const [selfie, setSelfie] = useState<string>('');
  const [ekycError, setEkycError] = useState<string | null>(null);
  const [uploadingCard, setUploadingCard] = useState<'front' | 'back' | null>(null);
  
  // Live camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [livenessSubStep, setLivenessSubStep] = useState<number>(1); 
  const [livenessLogs, setLivenessLogs] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Scanning effect
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const startCamera = async () => {
    try {
      setLivenessSubStep(1);
      setLivenessLogs(['Đang kết nối camera...']);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setLivenessLogs(prev => [...prev, '✓ Thiết bị camera hoạt động bình thường.', 'Vui lòng giữ thẳng khuôn mặt và nhìn vào camera.']);
      
      // Auto trigger step 1 chụp ảnh thẳng sau 2.5s
      setTimeout(() => {
        captureLivenessStep(1);
      }, 2500);
    } catch (err) {
      setLivenessLogs(prev => [...prev, '❌ Lỗi: Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera trên trình duyệt.']);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureLivenessStep = async (step: number) => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip ngang ảnh đối với selfie cho tự nhiên
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      
      if (step === 1) {
        setLivenessLogs(prev => [...prev, '📸 Đã tự động chụp ảnh chính diện.', 'Yêu cầu 2: Vui lòng chớp mắt liên tục 2 lần...']);
        setLivenessSubStep(2);
        // Giả lập nhận diện cử chỉ chớp mắt thành công sau 2.5s
        setTimeout(() => {
          captureLivenessStep(2);
        }, 2500);
      } else if (step === 2) {
        setLivenessLogs(prev => [...prev, '✓ Đã nhận diện cử chỉ chớp mắt thành công.', 'Yêu cầu 3: Vui lòng mỉm cười nhẹ...']);
        setLivenessSubStep(3);
        // Giả lập chụp nụ cười thành công sau 2.5s
        setTimeout(() => {
          captureLivenessStep(3);
        }, 2500);
      } else if (step === 3) {
        const selfieDataUrl = canvas.toDataURL('image/jpeg');
        setLivenessLogs(prev => [...prev, '📸 Đã chụp ảnh selfie cười.', 'Xác thực Liveness (thực thể sống) thành công!', 'Đang tải dữ liệu selfie lên máy chủ...']);
        
        try {
          const blob = await fetch(selfieDataUrl).then(res => res.blob());
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          const formData = new FormData();
          formData.append('image', file);
          
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return;
          const { token } = JSON.parse(storedUser);
          
          const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData,
          });
          
          const uploadRes = await response.json();
          if (!response.ok || !uploadRes.success) {
            throw new Error(uploadRes.message || 'Lỗi tải ảnh selfie.');
          }
          
          setSelfie(uploadRes.url);
          setLivenessLogs(prev => [...prev, '✓ Tải ảnh selfie lên thành công.']);
          
          // Dừng camera và chuyển sang bước quét OCR
          setTimeout(() => {
            stopCamera();
            setEkycStep('scanning');
            startScanningEffect(uploadRes.url);
          }, 1500);
          
        } catch (err: any) {
          setLivenessLogs(prev => [...prev, `❌ Lỗi tải ảnh selfie: ${err.message || 'Không thể upload'}`]);
        }
      }
    }
  };

  const startScanningEffect = (selfieUrl: string) => {
    setScanProgress(0);
    setScanLogs(['Đang khởi động module eKYC...']);
    
    const logs = [
      'Đang nạp ảnh CCCD mặt trước và mặt sau...',
      'Đang kiểm tra độ sáng và góc nghiêng của thẻ...',
      'Đang trích xuất OCR văn bản từ thẻ...',
      'Tìm thấy các trường: Số CCCD, Họ tên, Ngày sinh...',
      'Đang nạp ảnh selfie và chạy Face Matching...',
      'Đang tính toán độ trùng khớp giữa selfie và ảnh CCCD...',
      'Đối chiếu họ tên trên CCCD với họ tên đăng ký tài khoản...',
      'Đang đồng bộ dữ liệu lên hệ thống và chuyển trạng thái Chờ duyệt...',
      'Hoàn tất phân tích eKYC thành công!'
    ];
    
    let currentLogIndex = 0;
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 12.5;
        if (next >= 100) {
          clearInterval(interval);
          submitEkycData(selfieUrl);
          return 100;
        }
        
        // Cập nhật log
        if (next % 25 === 0 && currentLogIndex < logs.length) {
          setScanLogs(prevLogs => [...prevLogs, logs[currentLogIndex]]);
          currentLogIndex++;
        }
        return next;
      });
    }, 400);
  };

  const submitEkycData = async (selfieUrl: string) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const { token } = JSON.parse(storedUser);
      
      const response = await fetch(`${API_BASE_URL}/auth/verify-identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardFrontUrl: cardFront,
          cardBackUrl: cardBack,
          selfieUrl: selfieUrl
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Xác thực eKYC không thành công.');
      }
      
      // Thành công, hiển thị kết quả
      setCitizenIdInfo(data.data.ocrResult);
      setIdentityStatus('Pending'); 
      setEkycStep('result');
      
    } catch (err: any) {
      setScanLogs(prev => [...prev, `❌ Lỗi: ${err.message || 'Lỗi kết nối eKYC server'}`]);
    }
  };

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setEkycError('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    setUploadingCard(side);
    setEkycError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const { token } = JSON.parse(storedUser);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Lỗi khi tải ảnh lên server.');
      }

      if (side === 'front') {
        setCardFront(data.url);
      } else {
        setCardBack(data.url);
      }
    } catch (err: any) {
      setEkycError(err.message || 'Đã xảy ra lỗi khi tải ảnh lên.');
    } finally {
      setUploadingCard(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn dung lượng ảnh tải lên (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Lỗi khi tải ảnh lên server.');
      }

      setAvatarUrl(data.url);
      setSuccess('Tải ảnh mới lên thành công! Đừng quên bấm "Lưu thay đổi" để xác nhận lưu vào hệ thống.');
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải ảnh lên.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/auth');
        return;
      }

      const { token } = JSON.parse(storedUser);

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải thông tin cá nhân.');
      }

      // Populate data from response
      const u = data.user;
      setUsername(u.username || '');
      setEmail(u.email || '');
      setRole(u.role || 'customer');
      
      // Populate profile info (request /me to return these details or handle undefined)
      // Since our updated backend getMe might not return firstName/lastName directly unless fetched,
      // let's fetch the full document in backend or handle it here
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setPhoneNumber(u.phoneNumber || '');
      setGender(u.gender || '');
      setAvatarUrl(u.avatarUrl || '');
      setIdentityStatus(u.identityStatus || 'Unverified');
      setIdentityRejectReason(u.identityRejectReason || '');
      setCitizenIdInfo(u.citizenIdInfo || null);
      
      if (u.dob) {
        // Format YYYY-MM-DD for date input
        const dateObj = new Date(u.dob);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        setDob(`${yyyy}-${mm}-${dd}`);
      } else {
        setDob('');
      }

    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const { token } = JSON.parse(storedUser);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          gender: gender || undefined,
          dob: dob ? new Date(dob) : undefined,
          avatarUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Cập nhật thông tin thất bại.');
      }

      // Update localStorage user representation
      const updatedUser = {
        ...JSON.parse(storedUser),
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Cập nhật thông tin cá nhân thành công!');
      
      // Keep message for 1.5 seconds then navigate to home
      setTimeout(() => {
        setSuccess(null);
        navigate('/');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const { token } = JSON.parse(storedUser);

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Thay đổi mật khẩu thất bại.');
      }

      setPasswordSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Đã xảy ra lỗi khi thay đổi mật khẩu.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark flex flex-col items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-neon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="mt-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">Đang tải thông tin...</span>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2000" 
          alt="Motorcycle background" 
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/90 to-dark/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent"></div>
      </div>

      {/* Giant Typography Background */}
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[22vw] leading-none text-neon opacity-[0.05] mix-blend-screen pointer-events-none select-none z-10 w-full text-center tracking-tighter">
        MOTOV
      </h1>

      <div className="max-w-4xl w-full px-4 lg:px-8 relative z-20">
        
        {/* Navigation back */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-400 hover:text-neon text-sm font-semibold uppercase tracking-wider mb-6 transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card Left: Profile summary */}
          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative flex flex-col items-center text-center"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              {/* Avatar section */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group mb-4 cursor-pointer"
                title="Click để chọn ảnh mới từ máy"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neon/50 bg-black flex items-center justify-center relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="w-full h-full object-cover group-hover:opacity-45 transition-opacity duration-200" />
                  ) : (
                    <User size={48} className="text-gray-600 group-hover:opacity-45 transition-opacity duration-200" />
                  )}

                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera size={20} className="text-neon mb-1" />
                    <span className="text-[10px] text-neon font-bold uppercase tracking-wider">Chọn ảnh</span>
                  </div>

                  {/* Uploading loading spinner */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-neon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />

              <h3 className="font-display font-black text-xl text-white uppercase mb-1">
                {lastName && firstName ? `${lastName} ${firstName}` : username}
              </h3>
              <p className="text-gray-500 text-xs font-mono mb-4">{email}</p>

              {/* Role badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                role === 'admin' ? 'bg-neon/10 text-neon border-neon/20' :
                role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                'bg-green-500/10 text-green-500 border-green-500/20'
              }`}>
                {role === 'admin' && <Shield size={12} />}
                {role === 'staff' && <Briefcase size={12} />}
                {role === 'owner' && <UserCheck size={12} />}
                {role === 'customer' && <Award size={12} />}
                <span className="uppercase">
                  {role === 'admin' ? 'Quản trị viên' : role === 'staff' ? 'Nhân viên' : role === 'owner' ? 'Chủ xe' : 'Khách hàng'}
                </span>
              </div>

              {/* eKYC Status badge */}
              <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                identityStatus === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                identityStatus === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                identityStatus === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {identityStatus === 'Verified' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                <span className="uppercase">
                  eKYC: {identityStatus === 'Verified' ? 'Đã xác thực' : 
                         identityStatus === 'Pending' ? 'Chờ kiểm duyệt' : 
                         identityStatus === 'Rejected' ? 'Bị từ chối' : 'Chưa xác thực'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Card Right: Editable fields */}
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <h2 className="font-display font-black text-2xl text-white uppercase mb-6">
                Thông tin cá nhân
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs font-semibold text-center mb-4 flex items-center justify-center gap-2">
                  <Check size={14} />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Họ & Tên đệm</label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ và tên đệm"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>

                  {/* Tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tên</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập tên"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Số điện thoại</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-neon" />
                      </div>
                      <input 
                        type="tel" 
                        placeholder="Nhập số điện thoại"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Giới tính */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    >
                      <option value="" disabled className="bg-surface">Chọn giới tính</option>
                      <option value="Male" className="bg-surface text-gray-300">Nam</option>
                      <option value="Female" className="bg-surface text-gray-300">Nữ</option>
                      <option value="Other" className="bg-surface text-gray-300">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ngày sinh</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-neon" />
                    </div>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Ảnh đại diện (avatarUrl string input) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Đường dẫn ảnh đại diện (Avatar URL)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Camera size={16} className="text-neon" />
                    </div>
                    <input 
                      type="url" 
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-neon text-dark font-bold py-3.5 mt-6 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center gap-2 group text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>

              </form>
            </motion.div>

            {/* eKYC Identity Verification Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <h2 className="font-display font-black text-2xl text-white uppercase mb-6 flex items-center gap-2">
                <ShieldCheck size={22} className="text-neon" />
                Xác thực danh tính (eKYC)
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="p-2.5 rounded-lg bg-neon/10 text-neon">
                    {identityStatus === 'Verified' ? <ShieldCheck size={24} /> : <Shield size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">Trạng thái hiện tại</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {identityStatus === 'Verified' && 'Tài khoản của bạn đã được xác minh danh tính thành công. Bạn có quyền đặt xe không giới hạn.'}
                      {identityStatus === 'Pending' && 'Hồ sơ eKYC của bạn đã được gửi lên hệ thống và đang chờ nhân viên kiểm duyệt.'}
                      {identityStatus === 'Rejected' && `Rất tiếc! Hồ sơ eKYC bị từ chối. Lý do: "${identityRejectReason}".`}
                      {identityStatus === 'Unverified' && 'Bạn chưa thực hiện xác minh danh tính. Vui lòng xác thực danh tính để kích hoạt tính năng đặt xe máy.'}
                    </p>
                  </div>
                </div>

                {/* CCCD Info display if Verified */}
                {identityStatus === 'Verified' && citizenIdInfo && (
                  <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-xs space-y-2">
                    <h5 className="font-bold text-gray-400 uppercase mb-2">Thông tin Căn cước công dân</h5>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Họ & Tên:</span>
                      <span className="font-bold text-white font-mono">{citizenIdInfo.fullName}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Số CCCD:</span>
                      <span className="font-bold text-white font-mono">
                        {citizenIdInfo.idNumber ? `${citizenIdInfo.idNumber.slice(0, 4)}********` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Quê quán:</span>
                      <span className="text-white">{citizenIdInfo.homeTown}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thời gian xác thực:</span>
                      <span className="text-gray-400">{dob ? new Date().toLocaleDateString('vi-VN') : 'Mới đây'}</span>
                    </div>
                  </div>
                )}

                {/* Show button based on status */}
                {(identityStatus === 'Unverified' || identityStatus === 'Rejected') && (
                  <button
                    onClick={() => {
                      setCardFront('');
                      setCardBack('');
                      setSelfie('');
                      setEkycError(null);
                      setEkycStep('upload');
                      setIsEkycModalOpen(true);
                    }}
                    className="w-full bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-[0_0_12px_rgba(204,255,0,0.2)] font-display uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Activity size={14} />
                    Bắt đầu xác thực eKYC
                  </button>
                )}

                {identityStatus === 'Pending' && (
                  <div className="text-center py-2 text-yellow-500 text-xs font-semibold">
                    ⏳ Yêu cầu xác thực đang chờ phê duyệt. Thông thường quá trình này mất 5-15 phút.
                  </div>
                )}
              </div>
            </motion.div>

            {/* eKYC Full Modal Screen */}
            {isEkycModalOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div 
                  className="absolute inset-0 bg-black/95 backdrop-blur-md"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    setIsEkycModalOpen(false);
                  }}
                />

                <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl z-10 overflow-hidden relative shadow-2xl flex flex-col max-h-[95vh]">
                  {/* Glowing line top */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
                  
                  {/* Header */}
                  <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h3 className="font-display font-black text-lg text-white uppercase flex items-center gap-2">
                      <Activity size={18} className="text-neon" />
                      Quy trình xác minh danh tính eKYC
                    </h3>
                    <button
                      onClick={() => {
                        if (isCameraActive) stopCamera();
                        setIsEkycModalOpen(false);
                      }}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 overflow-y-auto flex-grow">
                    
                    {ekycError && (
                      <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center">
                        ⚠️ {ekycError}
                      </div>
                    )}

                    {/* Step 1: Upload CCCD */}
                    {ekycStep === 'upload' && (
                      <div className="space-y-6">
                        <div className="text-center max-w-md mx-auto">
                          <h4 className="font-bold text-white text-base">Bước 1: Tải ảnh Căn cước công dân</h4>
                          <p className="text-xs text-gray-500 mt-1">Vui lòng tải lên ảnh mặt trước và mặt sau rõ nét, không bị lóa sáng hay mất góc.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Card Front */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mặt trước CCCD</span>
                            <div className="h-44 rounded-xl border-2 border-dashed border-gray-800 bg-black/40 flex flex-col items-center justify-center overflow-hidden relative group">
                              {cardFront ? (
                                <>
                                  <img src={cardFront} alt="Mặt trước" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <label className="px-3 py-1.5 bg-neon text-dark text-xs font-bold rounded-lg cursor-pointer hover:bg-[#bbf000] uppercase tracking-wider">
                                      Thay đổi
                                      <input type="file" onChange={(e) => handleCardUpload(e, 'front')} accept="image/*" className="hidden" />
                                    </label>
                                  </div>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center p-4 text-center h-full w-full">
                                  {uploadingCard === 'front' ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon border-t-transparent"></div>
                                  ) : (
                                    <>
                                      <FileText size={36} className="text-gray-600 mb-2 group-hover:text-neon transition-colors" />
                                      <span className="text-xs font-bold text-gray-400">Tải ảnh mặt trước</span>
                                      <span className="text-[10px] text-gray-600 mt-1">Dạng PNG, JPG (tối đa 2MB)</span>
                                    </>
                                  )}
                                  <input type="file" onChange={(e) => handleCardUpload(e, 'front')} accept="image/*" className="hidden" disabled={uploadingCard !== null} />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Card Back */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mặt sau CCCD</span>
                            <div className="h-44 rounded-xl border-2 border-dashed border-gray-800 bg-black/40 flex flex-col items-center justify-center overflow-hidden relative group">
                              {cardBack ? (
                                <>
                                  <img src={cardBack} alt="Mặt sau" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <label className="px-3 py-1.5 bg-neon text-dark text-xs font-bold rounded-lg cursor-pointer hover:bg-[#bbf000] uppercase tracking-wider">
                                      Thay đổi
                                      <input type="file" onChange={(e) => handleCardUpload(e, 'back')} accept="image/*" className="hidden" />
                                    </label>
                                  </div>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center p-4 text-center h-full w-full">
                                  {uploadingCard === 'back' ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon border-t-transparent"></div>
                                  ) : (
                                    <>
                                      <FileText size={36} className="text-gray-600 mb-2 group-hover:text-neon transition-colors" />
                                      <span className="text-xs font-bold text-gray-400">Tải ảnh mặt sau</span>
                                      <span className="text-[10px] text-gray-600 mt-1">Dạng PNG, JPG (tối đa 2MB)</span>
                                    </>
                                  )}
                                  <input type="file" onChange={(e) => handleCardUpload(e, 'back')} accept="image/*" className="hidden" disabled={uploadingCard !== null} />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                          <button
                            disabled={!cardFront || !cardBack || uploadingCard !== null}
                            onClick={() => {
                              setEkycStep('liveness');
                              startCamera();
                            }}
                            className="bg-neon text-dark font-bold px-6 py-2.5 rounded-lg hover:bg-[#bbf000] transition-all disabled:opacity-30 uppercase tracking-wider text-xs font-display flex items-center gap-1.5 cursor-pointer"
                          >
                            Tiếp tục
                            <ArrowLeft size={14} className="rotate-180" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Liveness Face Capture */}
                    {ekycStep === 'liveness' && (
                      <div className="space-y-6 flex flex-col items-center">
                        <div className="text-center max-w-md">
                          <h4 className="font-bold text-white text-base">Bước 2: Xác thực thực thể sống (Liveness Test)</h4>
                          <p className="text-xs text-gray-500 mt-1">Để bảo mật, vui lòng cấp quyền camera và hoàn thành các hành động hướng dẫn.</p>
                        </div>

                        {/* Camera container with oval shape */}
                        <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-neon/50 bg-black flex items-center justify-center shadow-xl">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          
                          {/* Face guideline frame */}
                          <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/30 pointer-events-none"></div>
                          
                          {/* Overlay scanning effect */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon/15 to-transparent h-1/2 w-full animate-pulse pointer-events-none"></div>

                          {/* Action overlay notification */}
                          <div className="absolute bottom-6 inset-x-4 bg-black/75 px-3 py-1.5 rounded-full border border-neon/30 text-[10px] text-neon font-black text-center uppercase tracking-widest animate-bounce">
                            {livenessSubStep === 1 && '👤 GIỮ THẲNG KHUÔN MẶT'}
                            {livenessSubStep === 2 && '👁️ HÃY CHỚP MẮT LIÊN TỤC'}
                            {livenessSubStep === 3 && '😊 VUI LÒNG MỈM CƯỜI NHẸ'}
                          </div>
                        </div>

                        {/* Logs of actions */}
                        <div className="w-full bg-black/50 border border-gray-900 rounded-xl p-4 h-32 overflow-y-auto font-mono text-[10px] text-green-400 space-y-1 text-left">
                          {livenessLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-white/5 w-full flex justify-between">
                          <button
                            onClick={() => {
                              stopCamera();
                              setEkycStep('upload');
                            }}
                            className="bg-white/5 text-gray-400 hover:text-white border border-white/10 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Quay lại
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Scanning Screen */}
                    {ekycStep === 'scanning' && (
                      <div className="space-y-8 py-8 flex flex-col items-center justify-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {/* Circular outer progress bar */}
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                            <circle cx="50" cy="50" r="40" stroke="#ccff00" strokeWidth="6" fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - scanProgress / 100)}`}
                              className="transition-all duration-300"
                            />
                          </svg>
                          <span className="absolute text-white font-mono font-bold text-xl">{Math.round(scanProgress)}%</span>
                        </div>

                        <div className="text-center space-y-1">
                          <h4 className="font-bold text-white text-base">Đang tiến hành quét phân tích dữ liệu</h4>
                          <p className="text-xs text-gray-500">Hệ thống AI đang trích xuất dữ liệu OCR và thực hiện đối sánh gương mặt...</p>
                        </div>

                        {/* Scanner process logs */}
                        <div className="w-full max-w-md bg-black/60 border border-gray-800 rounded-xl p-4 h-40 overflow-y-auto font-mono text-[10px] text-neon space-y-1 shadow-inner text-left">
                          {scanLogs.map((log, i) => (
                            <div key={i} className="flex gap-1.5">
                              <span className="text-gray-600">[{new Date().toLocaleTimeString('vi-VN')}]</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 4: eKYC Result page */}
                    {ekycStep === 'result' && citizenIdInfo && (
                      <div className="space-y-6">
                        <div className="text-center space-y-1 max-w-md mx-auto">
                          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center mx-auto mb-2 text-glow">
                            <Check size={24} />
                          </div>
                          <h4 className="font-bold text-white text-base">Hoàn tất nộp hồ sơ eKYC!</h4>
                          <p className="text-xs text-gray-400">Thông tin trích xuất OCR đã được đối sánh và lưu lại. Vui lòng kiểm tra lại thông tin bên dưới.</p>
                        </div>

                        {/* Verification details */}
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3.5 text-sm text-gray-300">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-500">Họ & Tên trên CCCD:</span>
                            <span className="font-bold text-white uppercase font-mono">{citizenIdInfo.fullName}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-500">Số CCCD (Trích xuất):</span>
                            <span className="font-bold text-white font-mono">{citizenIdInfo.idNumber}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-500">Quê quán:</span>
                            <span className="text-white">{citizenIdInfo.homeTown}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-500">Độ trùng khớp khuôn mặt:</span>
                            <span className="font-mono text-neon font-black">94.85% (Hợp lệ)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Name Matching (Tên tài khoản):</span>
                            <span className="text-green-400 font-bold flex items-center gap-1">
                              <Check size={14} /> Khớp hoàn toàn
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => {
                              setIsEkycModalOpen(false);
                            }}
                            className="bg-neon text-dark font-bold px-6 py-2.5 rounded-lg hover:bg-[#bbf000] transition-all uppercase tracking-wider text-xs font-display cursor-pointer"
                          >
                            Hoàn tất
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* Change Password Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <h2 className="font-display font-black text-2xl text-white uppercase mb-6 flex items-center gap-2">
                <Lock size={20} className="text-neon" />
                Đổi mật khẩu
              </h2>

              {passwordError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                  ⚠️ {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs font-semibold text-center mb-4 flex items-center justify-center gap-2">
                  <Check size={14} />
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Mật khẩu cũ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Key size={12} />
                    Mật khẩu hiện tại
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                  />
                </div>

                {/* Mật khẩu mới & Xác nhận */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Lock size={12} />
                      Mật khẩu mới
                    </label>
                    <input 
                      type="password" 
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Lock size={12} />
                      Xác nhận mật khẩu mới
                    </label>
                    <input 
                      type="password" 
                      required
                      placeholder="Xác nhận mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-3 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full bg-neon text-dark font-bold py-3.5 mt-6 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:outline-none focus:ring-neon/30 transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center gap-2 group text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {passwordSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Key size={16} />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  );
};
