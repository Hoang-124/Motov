import React, { useState, useEffect } from 'react';
import { getBikes, saveBikes, Bike } from '../../data/bikes';
import { Plus, Edit2, Trash2, X, Star, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OwnerBikes = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Bike> | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('Scooter');
  const [image, setImage] = useState('');
  const [specsInput, setSpecsInput] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const currentUser = JSON.parse(storedUser);
    setUser(currentUser);

    const list = getBikes();
    // Filter bikes owned by this owner
    setBikes(list.filter(b => b.ownerEmail === currentUser.email));
  }, []);

  const reloadBikes = (currentUser = user) => {
    if (!currentUser) return;
    const list = getBikes();
    setBikes(list.filter(b => b.ownerEmail === currentUser.email));
  };

  const openAddModal = () => {
    setCurrentBike(null);
    setName('');
    setPrice('');
    setType('Scooter');
    setImage('https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800');
    setSpecsInput('Mới 99%, Khóa thông minh, Tiết kiệm xăng');
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Bike) => {
    setCurrentBike(bike);
    setName(bike.name);
    setPrice(bike.price);
    setType(bike.type);
    setImage(bike.image);
    setSpecsInput(bike.specs.join(', '));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa xe này khỏi danh sách cho thuê không?')) {
      const allBikes = getBikes();
      const updated = allBikes.filter(b => b.id !== id);
      saveBikes(updated);
      reloadBikes();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedSpecs = specsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const allBikes = getBikes();

    if (currentBike && currentBike.id) {
      // Edit existing bike
      const updated = allBikes.map(b => {
        if (b.id === currentBike.id) {
          return {
            ...b,
            name,
            price,
            type,
            image,
            specs: parsedSpecs
          };
        }
        return b;
      });
      saveBikes(updated);
    } else {
      // Create new bike under this owner's email
      const newBike: Bike = {
        id: 'bk-' + Math.floor(1000 + Math.random() * 9000),
        name,
        price,
        type,
        specs: parsedSpecs,
        image: image || 'https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800',
        featured: false,
        ownerEmail: user.email
      };
      saveBikes([...allBikes, newBike]);
    }

    reloadBikes();
    setIsModalOpen(false);
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
              Xe Cho Thuê Của Tôi
            </h1>
            <p className="text-gray-400 text-sm">
              Đăng ký thêm xe mới hoặc điều chỉnh danh sách xe tự có của bạn
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-neon text-dark font-bold px-6 py-3.5 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-102 cursor-pointer"
          >
            <Plus size={18} />
            ĐĂNG KÝ THÊM XE
          </button>
        </div>

        {/* Bikes Grid */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                  <th className="py-4 px-6">Hình ảnh</th>
                  <th className="py-4 px-6">Dòng xe máy</th>
                  <th className="py-4 px-6">Phân loại</th>
                  <th className="py-4 px-6">Giá thuê / ngày</th>
                  <th className="py-4 px-6">Đặc điểm (Specs)</th>
                  <th className="py-4 px-6 text-right">Quản lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {bikes.map(bike => (
                  <tr key={bike.id} className="hover:bg-black/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="w-16 h-12 rounded overflow-hidden border border-gray-800 bg-black">
                        <img src={bike.image} alt={bike.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">{bike.name}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15">
                        {bike.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-neon">{bike.price} VNĐ</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {bike.specs.map((s, i) => (
                          <span key={i} className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-400">
                            {s}
                          </span>
                        ))}
                      </div>
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
                          onClick={() => handleDelete(bike.id)}
                          className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                          title="Hủy đăng ký"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                  <Sparkles size={18} className="text-neon" />
                  <h3 className="font-display font-bold text-xl text-white uppercase">
                    {currentBike ? 'Chỉnh Sửa Xe Cho Thuê' : 'Đăng Ký Xe Đối Tác'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên dòng xe máy</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Yamaha Exciter 155"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá thuê / ngày (VNĐ)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 120.000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phân loại</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Scooter">Scooter (Xe ga)</option>
                        <option value="Classic">Classic (Cổ điển)</option>
                        <option value="Sport">Sport (Thể thao)</option>
                        <option value="Sport Cafe">Sport Cafe</option>
                        <option value="Underbone">Underbone (Xe côn/số)</option>
                      </select>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hình ảnh xe máy (URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                    />
                  </div>

                  {/* Specs */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đặc điểm xe (Cách nhau bởi dấu phẩy)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Xe đời mới, Khóa Smartkey, Cố rộng, Động cơ êm"
                      value={specsInput}
                      onChange={(e) => setSpecsInput(e.target.value)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all cursor-pointer text-center"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="flex-grow bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer text-center"
                    >
                      {currentBike ? 'LƯU XE' : 'ĐĂNG KÝ XE'}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
