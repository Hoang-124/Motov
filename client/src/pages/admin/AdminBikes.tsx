import React, { useState, useEffect } from 'react';
import { getAllMotorbikes, createMotorbike, updateMotorbike, deleteMotorbike, Motorbike } from '../../services/vehicleService';
import { Plus, Edit2, Trash2, X, AlertCircle, Sparkles, User, Check, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminBikes = () => {
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBike, setCurrentBike] = useState<Partial<Motorbike> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form fields
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [category, setCategory] = useState('Scooter');
  const [imageUrlsInput, setImageUrlsInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [featuresInput, setFeaturesInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [rentalPrice, setRentalPrice] = useState('');
  const [seats, setSeats] = useState('2');
  const [transmissionType, setTransmissionType] = useState<'Manual' | 'Automatic' | 'Semi-Automatic'>('Manual');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Available' | 'Rented' | 'Maintenance' | 'PendingApproval'>('Available');
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);

  // Fetch bikes on component mount
  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMotorbikes();
      setBikes(data);
    } catch (err) {
      console.error('Failed to fetch bikes:', err);
      setErrorMessage('Failed to load bikes. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentBike(null);
    setVehicleModel('');
    setLicensePlate('');
    setCategory('Scooter');
    setImageUrls([]);
    setImageUrlsInput('');
    setFeatures([]);
    setFeaturesInput('');
    setRentalPrice('');
    setSeats('2');
    setTransmissionType('Manual');
    setDescription('');
    setStatus('Available');
    setIsModalOpen(true);
  };

  const openEditModal = (bike: Motorbike) => {
    setCurrentBike(bike);
    setVehicleModel(bike.vehicleModel);
    setLicensePlate(bike.licensePlate);
    setCategory(bike.category);
    setImageUrls(bike.imageUrls || []);
    setImageUrlsInput('');
    setFeatures(bike.features || []);
    setFeaturesInput('');
    setRentalPrice(bike.rentalPrice.toString());
    setSeats(bike.seats.toString());
    setTransmissionType(bike.transmissionType);
    setDescription(bike.description || '');
    setStatus(bike.status);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setBikeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bikeToDelete) return;
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token') || '';
      
      if (!token) {
        setErrorMessage('You must be logged in to delete bikes');
        return;
      }

      await deleteMotorbike(bikeToDelete, token);
      setBikes(bikes.filter(b => b._id !== bikeToDelete));
      setDeleteConfirmOpen(false);
      setBikeToDelete(null);
      setSuccessMessage('Bike deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting bike:', err);
      setErrorMessage('Failed to delete bike. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('token') || '';
      
      if (!token) {
        setErrorMessage('You must be logged in to perform this action');
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!vehicleModel.trim()) {
        setErrorMessage('Vehicle model is required');
        setIsSubmitting(false);
        return;
      }
      if (!licensePlate.trim()) {
        setErrorMessage('License plate is required');
        setIsSubmitting(false);
        return;
      }
      if (!category.trim()) {
        setErrorMessage('Category is required');
        setIsSubmitting(false);
        return;
      }
      if (rentalPrice === '' || parseFloat(rentalPrice) <= 0) {
        setErrorMessage('Rental price must be greater than 0');
        setIsSubmitting(false);
        return;
      }

      const bikeData = {
        vehicleModel,
        licensePlate,
        category,
        imageUrls,
        features,
        rentalPrice: parseFloat(rentalPrice),
        seats: parseInt(seats),
        transmissionType,
        description,
        status,
        odometer: 0,
        ownerId: '' // System will assign owner
      };

      if (currentBike && currentBike._id) {
        // Edit
        await updateMotorbike(currentBike._id, bikeData, token);
        setSuccessMessage('Bike updated successfully!');
      } else {
        // Create
        const newBike = await createMotorbike(bikeData, token);
        setSuccessMessage('Bike created successfully!');
        setBikes([...bikes, newBike]);
      }

      setIsModalOpen(false);
      await fetchBikes();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error saving bike:', err);
      setErrorMessage(err.message || 'Failed to save bike. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Notification Toasts */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full px-4"
            >
              <div className="bg-green-500 text-dark font-bold px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 border border-green-400/20 backdrop-blur-md">
                <Check size={18} />
                {successMessage}
              </div>
            </motion.div>
          )}
          
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full px-4"
            >
              <div className="bg-red-500 text-dark font-bold px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 border border-red-400/20 backdrop-blur-md">
                <AlertCircle size={18} />
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-4xl text-neon uppercase text-glow tracking-tight mb-2">
              Motorbike Management
            </h1>
            <p className="text-gray-400 text-sm">
              Create, edit, or delete motorbikes in the system
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={isLoading}
            className="flex items-center gap-2 bg-neon text-dark font-bold px-6 py-3.5 rounded-lg hover:bg-[#bbf000] transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-102 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            ADD NEW BIKE
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading bikes...</p>
            </div>
          </div>
        )}

        {/* Bikes Table/Grid */}
        {!isLoading && (
          <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-black/35">
                    <th className="py-4 px-6">Image</th>
                    <th className="py-4 px-6">Vehicle Model</th>
                    <th className="py-4 px-6">License Plate</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Rental Price</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {bikes.map(bike => (
                    <tr key={bike._id} className="hover:bg-black/20 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          onClick={() => openEditModal(bike)}
                          className="w-16 h-12 rounded overflow-hidden border border-gray-800 bg-black hover:border-neon/50 transition-all cursor-pointer group"
                        >
                          <img 
                            src={bike.imageUrls?.[0] || 'https://via.placeholder.com/200'} 
                            alt={bike.vehicleModel} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          />
                        </button>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <button
                          onClick={() => openEditModal(bike)}
                          className="hover:text-neon transition-colors cursor-pointer"
                        >
                          {bike.vehicleModel}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-gray-400">
                          {bike.licensePlate}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded text-xs bg-black text-neon border border-neon/15">
                          {bike.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-neon">{bike.rentalPrice.toLocaleString()} VNĐ</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          bike.status === 'Available' ? 'bg-green-500/20 text-green-400' :
                          bike.status === 'Rented' ? 'bg-blue-500/20 text-blue-400' :
                          bike.status === 'Maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {bike.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(bike)}
                            className="p-2 rounded bg-black hover:bg-gray-800 text-yellow-500 border border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(bike._id || '')}
                            className="p-2 rounded bg-black hover:bg-red-950/40 text-red-500 border border-gray-800 hover:border-red-500/30 transition-all cursor-pointer"
                            title="Delete"
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
                No bikes in the system. Click &ldquo;Add New Bike&rdquo; to create one.
              </div>
            )}
          </div>
        )}

        {/* Dynamic Edit/Create Modal overlay */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-gray-800 rounded-2xl w-full max-w-2xl p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
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
                    {currentBike ? 'Edit Motorbike' : 'Add New Motorbike'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Vehicle Model */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle Model *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Honda CB300R"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                      />
                    </div>

                    {/* License Plate */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">License Plate *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 29A-12345"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Sport, Scooter"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Transmission Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transmission *</label>
                      <select
                        value={transmissionType}
                        onChange={(e) => setTransmissionType(e.target.value as any)}
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Semi-Automatic">Semi-Automatic</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Rental Price */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rental Price (VNĐ) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g., 120000"
                        value={rentalPrice}
                        onChange={(e) => setRentalPrice(e.target.value)}
                        min="0"
                        step="1000"
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                    </div>

                    {/* Seats */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Seats</label>
                      <input
                        type="number"
                        placeholder="e.g., 2"
                        value={seats}
                        onChange={(e) => setSeats(e.target.value)}
                        min="1"
                        max="8"
                        className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                    <textarea
                      placeholder="Bike details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Image URLs */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Image URLs</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrlsInput}
                        onChange={(e) => setImageUrlsInput(e.target.value)}
                        className="flex-1 bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (imageUrlsInput.trim()) {
                            setImageUrls([...imageUrls, imageUrlsInput.trim()]);
                            setImageUrlsInput('');
                          }
                        }}
                        className="px-4 bg-neon/20 text-neon border border-neon/30 rounded-lg hover:bg-neon/30 transition-all cursor-pointer text-sm font-semibold"
                      >
                        Add
                      </button>
                    </div>
                    {imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {imageUrls.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded text-xs">
                            <span className="text-gray-400 truncate max-w-xs">{url}</span>
                            <button
                              type="button"
                              onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Features</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., ABS Brakes"
                        value={featuresInput}
                        onChange={(e) => setFeaturesInput(e.target.value)}
                        className="flex-1 bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (featuresInput.trim()) {
                            setFeatures([...features, featuresInput.trim()]);
                            setFeaturesInput('');
                          }
                        }}
                        className="px-4 bg-neon/20 text-neon border border-neon/30 rounded-lg hover:bg-neon/30 transition-all cursor-pointer text-sm font-semibold"
                      >
                        Add
                      </button>
                    </div>
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {features.map((feature, idx) => (
                          <span key={idx} className="bg-neon/20 text-neon px-3 py-1 rounded text-xs flex items-center gap-2">
                            {feature}
                            <button
                              type="button"
                              onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                              className="hover:text-neon/80"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-black/50 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-neon focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="Available">Available</option>
                      <option value="Rented">Rented</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="PendingApproval">Pending Approval</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-grow bg-neon text-dark font-bold py-3 rounded-lg hover:bg-[#bbf000] focus:ring-4 focus:ring-neon/30 transition-all shadow-[0_0_10px_rgba(204,255,0,0.2)] cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '⏳ Saving...' : 'SAVE CHANGES'}
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
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-surface border border-red-500/30 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl"
              >
                {/* Neon top line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>

                <h3 className="font-display font-black text-lg text-red-400 uppercase mb-3 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Confirm Delete
                </h3>

                <p className="text-gray-300 text-sm mb-6">
                  Are you sure you want to delete this bike? <strong>Customers will not be able to book this bike anymore.</strong> This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={isSubmitting}
                    className="flex-grow bg-transparent border border-gray-800 hover:border-gray-700 text-gray-300 font-bold py-2.5 rounded-lg transition-all cursor-pointer text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isSubmitting}
                    className="flex-grow bg-red-500 text-dark font-bold py-2.5 rounded-lg hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
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
