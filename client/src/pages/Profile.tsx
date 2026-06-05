import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, Award, Briefcase, UserCheck, Check, Save, ArrowLeft, Camera } from 'lucide-react';
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

  const API_BASE_URL = 'http://localhost:5000/api';

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
            </motion.div>
          </div>

          {/* Card Right: Editable fields */}
          <div className="md:col-span-2">
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
          </div>

        </div>

      </div>
    </div>
  );
};
