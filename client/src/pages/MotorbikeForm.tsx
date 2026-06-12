import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Motorbike, createMotorbike, updateMotorbike, getMotorbikeById } from '../services/vehicleService';

export const MotorbikeForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  // Check if it's edit mode (URL contains /edit or from /bike-edit/:id)
  const isEditMode = !!id && id !== 'new';

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBikeId, setSuccessBikeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vehicleModel: '',
    licensePlate: '',
    seats: 2,
    odometer: 0,
    rentalPrice: 0,
    category: '',
    transmissionType: 'Manual' as 'Manual' | 'Automatic' | 'Semi-Automatic',
    description: '',
    imageUrls: [] as string[],
    features: [] as string[],
    ownerId: '',
    status: 'Available' as 'Available' | 'Rented' | 'Maintenance' | 'PendingApproval'
  });

  const [imageInput, setImageInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  // Load existing motorbike if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchMotorbike = async () => {
        try {
          setLoading(true);
          const data = await getMotorbikeById(id);
          setFormData({
            vehicleModel: data.vehicleModel,
            licensePlate: data.licensePlate,
            seats: data.seats,
            odometer: data.odometer,
            rentalPrice: data.rentalPrice,
            category: data.category,
            transmissionType: (data.transmissionType || 'Manual') as 'Manual' | 'Automatic' | 'Semi-Automatic',
            description: data.description || '',
            imageUrls: data.imageUrls || [],
            features: data.features || [],
            ownerId: typeof data.ownerId === 'string' ? data.ownerId : data.ownerId?._id || '',
            status: data.status || 'Available'
          });
        } catch (err) {
          setError('Failed to load motorbike data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchMotorbike();
    }
  }, [id, isEditMode]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.vehicleModel.trim()) errors.vehicleModel = 'Vehicle model is required';
    if (!formData.licensePlate.trim()) errors.licensePlate = 'License plate is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (formData.rentalPrice <= 0) errors.rentalPrice = 'Rental price must be greater than 0';
    if (formData.seats < 1) errors.seats = 'Seats must be at least 1';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['seats', 'odometer', 'rentalPrice'].includes(name) ? parseFloat(value) : value
    }));
    // Clear error for this field
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem('token') || '';

      if (!token) {
        setError('You must be logged in to perform this action');
        return;
      }

      if (isEditMode && id) {
        await updateMotorbike(id, formData, token);
        setSuccessMessage('Motorbike updated successfully!');
        setSuccessBikeId(id);
      } else {
        const result = await createMotorbike(formData, token);
        setSuccessMessage('Motorbike created successfully!');
        setSuccessBikeId(result._id || null);
      }
      
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save motorbike');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    if (successBikeId) {
      navigate(`/motorbike/${successBikeId}`);
    }
  };

  if (loading) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-2xl mx-auto px-4 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(isEditMode ? `/motorbike/${id}` : '/bikes')}
          className="flex items-center gap-2 text-neon hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          {isEditMode ? 'Back to Motorbike' : 'Back to Bikes'}
        </button>

        {/* Error Toast Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full px-4"
            >
              <div className="bg-red-500 text-dark font-bold px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 border border-red-400/20 backdrop-blur-md">
                <AlertCircle size={18} />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <div className="bg-surface border border-gray-800 rounded-2xl p-8">
          <h1 className="font-display font-black text-3xl text-neon mb-6">
            {isEditMode ? 'Edit Motorbike' : 'Add New Motorbike'}
          </h1>

          {/* Form Alert Message - Only for validation errors, not API errors */}
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Validation Errors</p>
                <p className="text-red-300 text-xs mt-1">Please check the highlighted fields and fix them.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Basic Information</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Vehicle Model *
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="e.g., Honda CB300R"
                    className={`w-full bg-black/50 border rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all ${
                      formErrors.vehicleModel ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {formErrors.vehicleModel && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.vehicleModel}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="e.g., 29A-12345"
                    className={`w-full bg-black/50 border rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all ${
                      formErrors.licensePlate ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {formErrors.licensePlate && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.licensePlate}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Sport, Scooter, Underbone"
                    className={`w-full bg-black/50 border rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all ${
                      formErrors.category ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {formErrors.category && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Transmission Type *
                  </label>
                  <select
                    name="transmissionType"
                    value={formData.transmissionType}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Semi-Automatic">Semi-Automatic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rental & Specs */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Pricing & Specifications</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Rental Price (VNĐ/day) *
                  </label>
                  <input
                    type="number"
                    name="rentalPrice"
                    value={formData.rentalPrice}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={`w-full bg-black/50 border rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all ${
                      formErrors.rentalPrice ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {formErrors.rentalPrice && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.rentalPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Seats *
                  </label>
                  <input
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    placeholder="2"
                    min="1"
                    className={`w-full bg-black/50 border rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all ${
                      formErrors.seats ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {formErrors.seats && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.seats}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Odometer (km)
                </label>
                <input
                  type="number"
                  name="odometer"
                  value={formData.odometer}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the motorbike..."
                rows={4}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Images</h2>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-grow bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="bg-neon text-dark font-bold px-4 py-2 rounded-lg hover:bg-[#bbf000] transition-colors"
                >
                  Add
                </button>
              </div>

              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"
                      >
                        <span className="text-red-400 font-bold">Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Features</h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="e.g., ABS Brakes, LED Lights"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-grow bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-neon focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="bg-neon text-dark font-bold px-4 py-2 rounded-lg hover:bg-[#bbf000] transition-colors"
                >
                  Add
                </button>
              </div>

              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-neon/20 border border-neon/50 text-neon px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="hover:text-white transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-neon text-dark font-bold px-6 py-3 rounded-lg hover:bg-[#bbf000] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)]"
              >
                {submitting ? '⏳ Saving...' : isEditMode ? 'Update Motorbike' : 'Create Motorbike'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => navigate(isEditMode ? `/motorbike/${id}` : '/bikes')}
                className="bg-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {}}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-surface border border-green-500/30 rounded-2xl p-8 shadow-2xl relative w-full max-w-md z-10 overflow-hidden"
            >
              {/* Green top line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              
              <button 
                onClick={handleSuccessModalConfirm}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center animate-pulse">
                  <Check size={32} className="text-green-500" />
                </div>
              </div>

              <h3 className="font-display font-black text-2xl text-green-400 uppercase mb-3 text-center">
                Thành Công!
              </h3>

              <p className="text-sm text-gray-300 text-center mb-6">
                Xe {isEditMode ? 'đã được cập nhật' : 'đã được thêm'} vào hệ thống thành công.
              </p>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-xs text-green-400 mb-6 flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1"></div>
                <p>
                  Xe này hiện đã sẵn sàng cho khách hàng đặt và có thể được xem trong danh sách các dòng xe.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 px-4 py-2 bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 font-bold rounded-lg transition-all text-sm uppercase tracking-wider cursor-pointer"
                >
                  Tiếp tục
                </button>
                <button
                  onClick={handleSuccessModalConfirm}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-sm uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.2)] cursor-pointer"
                >
                  Xem Chi Tiết
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
