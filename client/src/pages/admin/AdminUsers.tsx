import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Shield, Briefcase, Award, Check, UserCheck, 
  Search, Filter, Plus, Eye, Edit2, Lock, Unlock, X, AlertCircle, Sparkles, Calendar, Key, Mail, Phone, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SystemUser {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  role: 'admin' | 'staff' | 'owner' | 'customer';
  status: 'Active' | 'Suspended' | 'Unverified';
  createdAt: string;
  updatedAt: string;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [isUnbanOpen, setIsUnbanOpen] = useState(false);

  // Form states (For Create/Edit)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'owner' | 'customer'>('customer');
  const [status, setStatus] = useState<'Active' | 'Suspended' | 'Unverified'>('Active');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Get current logged in user details
  const getLoggedInUser = () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getLoggedInUser();

  // Load user list
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!currentUser?.token) {
        throw new Error('Bạn cần đăng nhập để thực hiện tác vụ này');
      }

      // Build query params
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải danh sách thành viên.');
      }

      setUsers(data.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when search/filters change
  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  // Display Toast messages
  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Open User Details
  const handleOpenDetail = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setGender('');
    setDob('');
    setRole('customer');
    setStatus('Active');
    setAvatarUrl('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Create User Action
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);

    try {
      if (!username || !email || !password) {
        throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      }

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
          gender: gender || undefined,
          dob: dob ? new Date(dob) : undefined,
          role,
          status,
          avatarUrl
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo thành viên mới.');
      }

      setIsCreateOpen(false);
      showToast('Đã tạo thành viên mới thành công!');
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tạo thành viên');
    } finally {
      setFormSaving(false);
    }
  };

  // Open Edit Form
  const handleOpenEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // Empty to not change password unless entered
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhoneNumber(user.phoneNumber);
    setGender(user.gender);
    setRole(user.role);
    setStatus(user.status);
    setAvatarUrl(user.avatarUrl);
    setFormError(null);

    if (user.dob) {
      const dateObj = new Date(user.dob);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      setDob(`${yyyy}-${mm}-${dd}`);
    } else {
      setDob('');
    }

    setIsEditOpen(true);
  };

  // Edit User Action
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);

    try {
      if (!selectedUser) return;

      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password: password || undefined, // Only send if updating password
          firstName,
          lastName,
          phoneNumber,
          gender: gender || undefined,
          dob: dob ? new Date(dob) : undefined,
          role,
          status,
          avatarUrl
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật thành viên.');
      }

      setIsEditOpen(false);
      showToast('Đã cập nhật thông tin thành viên thành công!');
      
      // If updating own profile, update localstorage info
      if (selectedUser.id === currentUser.id) {
        const updatedUser = {
          ...currentUser,
          name: data.user.name,
          avatarUrl: data.user.avatarUrl,
          role: data.user.role // It should stay admin but just in case
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi cập nhật thành viên');
    } finally {
      setFormSaving(false);
    }
  };

  // Open Ban Confirmation
  const handleOpenBan = (user: SystemUser) => {
    setSelectedUser(user);
    setIsBanOpen(true);
  };

  // Open Unban Confirmation
  const handleOpenUnban = (user: SystemUser) => {
    setSelectedUser(user);
    setIsUnbanOpen(true);
  };

  // Ban User Action
  const handleBanUser = async () => {
    if (!selectedUser) return;
    setFormSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể khóa thành viên.');
      }

      setIsBanOpen(false);
      showToast('Đã khóa tài khoản thành viên thành công.');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi khóa tài khoản thành viên', true);
      setIsBanOpen(false);
    } finally {
      setFormSaving(false);
    }
  };

  // Unban User Action
  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    setFormSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/unban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể mở khóa thành viên.');
      }

      setIsUnbanOpen(false);
      showToast('Đã mở khóa tài khoản thành viên thành công.');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi mở khóa tài khoản thành viên', true);
      setIsUnbanOpen(false);
    } finally {
      setFormSaving(false);
    }
  };


  const getRoleBadge = (role: 'admin' | 'staff' | 'owner' | 'customer') => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-neon/10 text-neon border-neon/20 flex items-center gap-1 w-fit">
            <Shield size={10} /> Quản Trị Viên
          </span>
        );
      case 'staff':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1 w-fit">
            <Briefcase size={10} /> Nhân Viên
          </span>
        );
      case 'owner':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 flex items-center gap-1 w-fit">
            <UserCheck size={10} /> Chủ Xe
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1 w-fit">
            <Award size={10} /> Khách Hàng
          </span>
        );
    }
  };

  const getStatusBadge = (status: 'Active' | 'Suspended' | 'Unverified') => {
    switch (status) {
      case 'Active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/25">
            ● Hoạt động
          </span>
        );
      case 'Suspended':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/25">
            ● Đã khóa
          </span>
        );
      case 'Unverified':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/25">
            ● Chưa xác minh
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark text-white relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
              Quản Lý Thành Viên
            </h1>
            <p className="text-gray-400 text-sm">
              Tìm kiếm, xem thông tin chi tiết, chỉnh sửa thông tin hoặc thay đổi trạng thái tài khoản người dùng
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-neon text-dark font-bold rounded-xl hover:bg-[#bbf000] transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.25)] hover:scale-[1.02] cursor-pointer text-sm uppercase tracking-wider"
          >
            <Plus size={16} /> Thêm thành viên
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface/60 backdrop-blur-xl border border-white/5 p-4 rounded-2xl mb-6 shadow-lg flex flex-col md:flex-row gap-4">
          {/* Search field */}
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, tên đăng nhập hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all"
            />
          </div>

          {/* Role dropdown filter */}
          <div className="relative min-w-[180px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Filter size={14} />
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/5 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản Trị Viên</option>
              <option value="staff">Nhân Viên</option>
              <option value="owner">Chủ Xe</option>
              <option value="customer">Khách Hàng</option>
            </select>
          </div>

          {/* Status dropdown filter */}
          <div className="relative min-w-[180px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Filter size={14} />
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/5 text-gray-300 text-sm rounded-xl focus:ring-2 focus:ring-neon focus:border-transparent block pl-10 p-3 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động</option>
              <option value="Suspended">Đã khóa</option>
              <option value="Unverified">Chưa xác minh</option>
            </select>
          </div>
        </div>

        {/* Success / Error toast banner in absolute container */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-500 text-dark font-black text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg max-w-md mx-auto mb-6 border border-green-400/20"
            >
              <Check size={16} />
              {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg max-w-md mx-auto mb-6 border border-red-400/20"
            >
              <AlertCircle size={16} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User list table container */}
        <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-neon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">Đang tải danh sách...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 text-gray-600" />
              <p className="font-semibold text-sm">Không tìm thấy thành viên nào phù hợp</p>
              <p className="text-xs text-gray-500 mt-1">Vui lòng điều chỉnh lại từ khóa hoặc bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-black/20">
                    <th className="py-4 px-6">Họ & Tên / Username</th>
                    <th className="py-4 px-6">Email / SĐT</th>
                    <th className="py-4 px-6">Vai trò</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6">Ngày tạo</th>
                    <th className="py-4 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      
                      {/* Name / Username / Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <Users size={16} className="text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {user.name} 
                              {currentUser && currentUser.id === user.id && (
                                <span className="text-[9px] bg-white/10 text-gray-400 px-1 py-0.2 rounded font-mono">Tôi</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email / Phone */}
                      <td className="py-4 px-6 font-mono text-xs">
                        <div className="text-gray-300">{user.email}</div>
                        <div className="text-gray-500 text-[11px] mt-0.5">{user.phoneNumber || 'Chưa cung cấp SĐT'}</div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Join Date */}
                      <td className="py-4 px-6 text-xs text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(user)}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-neon hover:bg-white/10 transition-all cursor-pointer"
                            title="Sửa thành viên"
                          >
                            <Edit2 size={14} />
                          </button>
                          {user.status === 'Suspended' ? (
                            <button
                              onClick={() => handleOpenUnban(user)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-green-500 hover:bg-white/10 transition-all cursor-pointer"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenBan(user)}
                              disabled={currentUser && currentUser.id === user.id}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-500 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                              title={currentUser && currentUser.id === user.id ? "Không thể tự khóa chính bạn" : "Khóa tài khoản"}
                            >
                              <Lock size={14} />
                            </button>
                          )}
                        </div>
                      </td>


                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 1. USER DETAIL MODAL (Glassmorphism Overlay)                  */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isDetailOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-lg z-10 overflow-hidden"
            >
              {/* Neon top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-white uppercase mb-6 flex items-center gap-2">
                <Info className="text-neon" size={18} /> Chi tiết thành viên
              </h3>

              {/* Detail body */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-white/5 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-neon/50 bg-black flex items-center justify-center mb-3">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={32} className="text-gray-500" />
                  )}
                </div>
                <h4 className="font-bold text-lg text-white">{selectedUser.name}</h4>
                <p className="text-xs text-gray-500 font-mono">@{selectedUser.username}</p>
                <div className="flex gap-2 mt-3">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>

              <div className="space-y-3.5 text-sm text-gray-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5"><Mail size={14} /> Email:</span>
                  <span className="font-mono text-xs">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5"><Phone size={14} /> Số điện thoại:</span>
                  <span className="font-mono text-xs">{selectedUser.phoneNumber || 'Chưa cung cấp'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={14} /> Ngày sinh:</span>
                  <span>{formatDate(selectedUser.dob)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5"><Sparkles size={14} /> Giới tính:</span>
                  <span>{selectedUser.gender === 'Male' ? 'Nam' : selectedUser.gender === 'Female' ? 'Nữ' : selectedUser.gender === 'Other' ? 'Khác' : 'Chưa cung cấp'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">Ngày gia nhập:</span>
                  <span className="text-xs text-gray-400">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cập nhật cuối:</span>
                  <span className="text-xs text-gray-400">{formatDate(selectedUser.updatedAt)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 2. CREATE USER MODAL                                          */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-2xl z-10 overflow-y-auto max-h-[90vh]"
            >
              {/* Neon top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-white uppercase mb-5 flex items-center gap-2">
                <Plus className="text-neon" size={18} /> Thêm thành viên mới
              </h3>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                
                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Tên đăng nhập *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email đăng ký *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Mật khẩu khởi tạo *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neon/60">
                        <Key size={12} />
                      </span>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-8 p-2.5 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile detail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Họ & Tên đệm</label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ và tên đệm"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Tên</label>
                    <input 
                      type="text" 
                      placeholder="Nhập tên"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="0912345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Ngày sinh</label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Vai trò phân quyền *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-black/50 border border-gray-800 text-neon font-bold text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all cursor-pointer"
                    >
                      <option value="customer" className="text-gray-300">Khách Hàng</option>
                      <option value="owner" className="text-gray-300">Chủ Xe</option>
                      <option value="staff" className="text-gray-300">Nhân Viên</option>
                      <option value="admin" className="text-gray-300">Quản Trị Viên (Admin)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Trạng thái tài khoản *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all cursor-pointer"
                    >
                      <option value="Active">Hoạt động (Active)</option>
                      <option value="Suspended">Đã khóa (Suspended)</option>
                      <option value="Unverified">Chưa xác minh (Unverified)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Ảnh đại diện (Avatar URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                  />
                </div>

                {/* Form Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2 bg-neon text-dark font-bold hover:bg-[#bbf000] rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer disabled:opacity-50"
                  >
                    {formSaving ? 'Đang tạo...' : 'Tạo thành viên'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 3. EDIT USER MODAL                                            */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isEditOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative w-full max-w-2xl z-10 overflow-y-auto max-h-[90vh]"
            >
              {/* Neon top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-neon shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
              
              <button 
                onClick={() => setIsEditOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-white uppercase mb-5 flex items-center gap-2">
                <Edit2 className="text-neon" size={18} /> Chỉnh sửa thành viên
              </h3>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleEditUser} className="space-y-4">
                
                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Tên đăng nhập</label>
                    <input 
                      type="text" 
                      required
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Mật khẩu mới (Bỏ trống nếu giữ nguyên)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neon/60">
                        <Key size={12} />
                      </span>
                      <input 
                        type="password" 
                        placeholder="Mật khẩu mới"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block pl-8 p-2.5 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile detail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Họ & Tên đệm</label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ và tên đệm"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Tên</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập tên"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="0912345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-medium"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Ngày sinh</label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Vai trò phân quyền *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      disabled={currentUser && currentUser.id === selectedUser.id}
                      className="w-full bg-black/50 border border-gray-800 text-neon font-bold text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="customer" className="text-gray-300">Khách Hàng</option>
                      <option value="owner" className="text-gray-300">Chủ Xe</option>
                      <option value="staff" className="text-gray-300">Nhân Viên</option>
                      <option value="admin" className="text-gray-300">Quản Trị Viên (Admin)</option>
                    </select>
                    {currentUser && currentUser.id === selectedUser.id && (
                      <p className="text-[10px] text-gray-500">Bạn không thể hạ cấp vai trò Admin của chính bạn ở đây.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Trạng thái tài khoản *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      disabled={currentUser && currentUser.id === selectedUser.id}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="Active">Hoạt động (Active)</option>
                      <option value="Suspended">Đã khóa (Suspended)</option>
                      <option value="Unverified">Chưa xác minh (Unverified)</option>
                    </select>
                    {currentUser && currentUser.id === selectedUser.id && (
                      <p className="text-[10px] text-gray-500">Bạn không thể tạm khóa trạng thái của chính bạn ở đây.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Ảnh đại diện (Avatar URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-neon focus:border-transparent block p-2.5 outline-none transition-all font-mono"
                  />
                </div>

                {/* Form Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2 bg-neon text-dark font-bold hover:bg-[#bbf000] rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer disabled:opacity-50"
                  >
                    {formSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 4. BAN CONFIRMATION MODAL                                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isBanOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBanOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-red-500/20 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Red top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
              
              <button 
                onClick={() => setIsBanOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-red-500 uppercase mb-4 flex items-center gap-2">
                🔒 Khóa tài khoản thành viên
              </h3>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 mb-4 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>
                  Thành viên bị khóa sẽ <strong>không thể đăng nhập</strong> hoặc thực hiện bất kỳ giao dịch thuê xe nào trên hệ thống Motov cho đến khi được mở khóa lại.
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-300">Xác nhận khóa tài khoản thành viên sau:</p>
                <div className="bg-black/35 p-3 rounded-lg flex items-center gap-3 border border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center shrink-0">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={16} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{selectedUser.name}</div>
                    <div className="text-xs text-gray-500 font-mono">@{selectedUser.username} ({selectedUser.email})</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBanOpen(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleBanUser}
                  disabled={formSaving}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {formSaving ? 'Đang khóa...' : 'Đồng ý khóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 5. UNBAN CONFIRMATION MODAL                                   */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isUnbanOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnbanOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-green-500/20 rounded-2xl p-6 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Green top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              
              <button 
                onClick={() => setIsUnbanOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="font-display font-black text-xl text-green-500 uppercase mb-4 flex items-center gap-2">
                🔓 Mở khóa tài khoản thành viên
              </h3>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-xs text-green-400 mb-4 flex items-start gap-2.5">
                <Check size={16} className="shrink-0 mt-0.5 text-green-400" />
                <p>
                  Tài khoản thành viên sẽ được khôi phục về trạng thái <strong>Hoạt động</strong> và có thể tiếp tục đăng nhập, sử dụng các dịch vụ của Motov.
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-300">Xác nhận mở khóa tài khoản thành viên sau:</p>
                <div className="bg-black/35 p-3 rounded-lg flex items-center gap-3 border border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center shrink-0">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={16} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{selectedUser.name}</div>
                    <div className="text-xs text-gray-500 font-mono">@{selectedUser.username} ({selectedUser.email})</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnbanOpen(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg transition-all text-xs font-bold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUnbanUser}
                  disabled={formSaving}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {formSaving ? 'Đang mở khóa...' : 'Đồng ý mở khóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};