import React, { useState, useEffect } from 'react';
import { Users, UserCog, Shield, Briefcase, Award, Check, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | 'owner';
  createdAt: string;
}

const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'usr-1001',
    name: 'Quản Trị Viên',
    email: 'admin@motov.com',
    role: 'admin',
    createdAt: '25/05/2026'
  },
  {
    id: 'usr-1002',
    name: 'Nhân Viên Phòng Vé',
    email: 'nhanvien@motov.com',
    role: 'staff',
    createdAt: '26/05/2026'
  },
  {
    id: 'usr-1003',
    name: 'Nguyễn Văn Khách',
    email: 'khachhang@motov.com',
    role: 'customer',
    createdAt: '27/05/2026'
  },
  {
    id: 'usr-1004',
    name: 'Nguyễn Chủ Xe',
    email: 'owner@motov.com',
    role: 'owner',
    createdAt: '28/05/2026'
  }
];

export const AdminUsers = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('motov_users');
    if (!stored) {
      localStorage.setItem('motov_users', JSON.stringify(DEFAULT_USERS));
      setUsers(DEFAULT_USERS);
    } else {
      try {
        setUsers(JSON.parse(stored));
      } catch (e) {
        setUsers(DEFAULT_USERS);
      }
    }
  }, []);

  const handleChangeRole = (userId: string, newRole: 'customer' | 'staff' | 'admin' | 'owner') => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('motov_users', JSON.stringify(updated));

    // Also update currently logged in user if they changed their own role!
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const userToChange = users.find(u => u.id === userId);
    if (currentUser && userToChange && currentUser.email === userToChange.email) {
      currentUser.role = newRole;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }

    setSuccessMsg(`Đã cập quyền thành công thành viên: ${userToChange?.name}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left relative">
          <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
            Phân Quyền Thành Viên
          </h1>
          <p className="text-gray-400 text-sm">
            Quản lý vai trò bảo mật và phân quyền hệ thống cho từng tài khoản thành viên
          </p>

          {/* Toast Notification */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bg-green-500 text-dark font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg animate-pulse"
            >
              <Check size={14} />
              {successMsg}
            </motion.div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                  <th className="py-4 px-6">Mã ID</th>
                  <th className="py-4 px-6">Thành viên</th>
                  <th className="py-4 px-6">Email đăng ký</th>
                  <th className="py-4 px-6">Vai trò hiện tại</th>
                  <th className="py-4 px-6">Ngày tham gia</th>
                  <th className="py-4 px-6 text-right">Phân quyền nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-black/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-gray-500 font-semibold">{user.id}</td>
                    <td className="py-4 px-6 font-bold text-white">{user.name}</td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-400">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border flex items-center gap-1.5 w-fit ${
                        user.role === 'admin' ? 'bg-neon/10 text-neon border-neon/20' :
                        user.role === 'staff' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        user.role === 'owner' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        'bg-green-500/10 text-green-500 border-green-500/20'
                      }`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {user.role === 'staff' && <Briefcase size={12} />}
                        {user.role === 'owner' && <UserCheck size={12} />}
                        {user.role === 'customer' && <Award size={12} />}
                        {user.role === 'admin' ? 'Quản Trị Viên' : user.role === 'staff' ? 'Nhân Viên' : user.role === 'owner' ? 'Chủ Xe (Owner)' : 'Khách Hàng'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">{user.createdAt}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleChangeRole(user.id, 'customer')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            user.role === 'customer'
                              ? 'bg-green-600 text-white'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          Khách
                        </button>
                        <button
                          onClick={() => handleChangeRole(user.id, 'owner')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            user.role === 'owner'
                              ? 'bg-cyan-600 text-white font-black'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          Chủ Xe
                        </button>
                        <button
                          onClick={() => handleChangeRole(user.id, 'staff')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            user.role === 'staff'
                              ? 'bg-yellow-600 text-white font-black'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          N.Viên
                        </button>
                        <button
                          onClick={() => handleChangeRole(user.id, 'admin')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            user.role === 'admin'
                              ? 'bg-neon text-dark font-black'
                              : 'bg-black text-gray-500 border border-gray-900 hover:text-white'
                          }`}
                        >
                          Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
