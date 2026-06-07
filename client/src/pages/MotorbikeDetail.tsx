import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader, Edit2, Trash2, MapPin, Users, Zap } from 'lucide-react';
import { getMotorbikeById, Motorbike, deleteMotorbike } from '../services/vehicleService';

export const MotorbikeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [motorbike, setMotorbike] = useState<Motorbike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchMotorbike = async () => {
      if (!id) {
        setError('Invalid motorbike ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getMotorbikeById(id);
        setMotorbike(data);
      } catch (err) {
        setError('Failed to load motorbike details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMotorbike();
  }, [id]);

  const handleDelete = async () => {
    if (!motorbike?._id) return;

    const confirmed = window.confirm('Are you sure you want to delete this motorbike?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token') || '';
      await deleteMotorbike(motorbike._id, token);
      navigate('/bikes');
    } catch (err) {
      alert('Failed to delete motorbike');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const ownerName = motorbike && typeof motorbike.ownerId !== 'string'
    ? `${motorbike.ownerId.firstName} ${motorbike.ownerId.lastName}`
    : 'Unknown Owner';

  const imageUrl = motorbike?.imageUrls?.[0] || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1200';

  if (loading) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-neon animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading motorbike details...</p>
        </div>
      </div>
    );
  }

  if (error || !motorbike) {
    return (
      <div className="pt-28 pb-20 min-h-screen bg-dark">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/bikes')}
            className="flex items-center gap-2 text-neon hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Bikes
          </button>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-3">
            <AlertCircle size={24} className="text-red-500" />
            <p className="text-red-300">{error || 'Motorbike not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen bg-dark">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/bikes')}
          className="flex items-center gap-2 text-neon hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Bikes
        </button>

        {/* Main Content */}
        <div className="bg-surface border border-gray-800 rounded-2xl overflow-hidden">
          {/* Image Gallery */}
          <div className="relative aspect-video bg-black overflow-hidden">
            <img
              src={imageUrl}
              alt={motorbike.vehicleModel}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <div className={`px-4 py-2 rounded-full font-semibold text-sm backdrop-blur-md border ${
                motorbike.status === 'Available'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : motorbike.status === 'Rented'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {motorbike.status}
              </div>
              <div className="bg-dark/70 backdrop-blur-md px-4 py-2 rounded-full font-semibold text-sm text-neon border border-neon/30">
                {motorbike.category}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="font-display font-black text-4xl text-neon mb-2">
                  {motorbike.vehicleModel}
                </h1>
                <p className="text-gray-400">License Plate: {motorbike.licensePlate}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-neon">
                  {motorbike.rentalPrice.toLocaleString()} VNĐ
                </p>
                <p className="text-gray-400 text-sm">per day</p>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-black/50 border border-gray-800 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm">OWNER</p>
              <p className="text-white font-semibold">{ownerName}</p>
              {typeof motorbike.ownerId !== 'string' && motorbike.ownerId.phoneNumber && (
                <p className="text-gray-400 text-sm">{motorbike.ownerId.phoneNumber}</p>
              )}
            </div>

            {/* Description */}
            {motorbike.description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                <p className="text-gray-400 leading-relaxed">{motorbike.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Specifications</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Users size={18} className="text-neon" />
                    <span>Seats: {motorbike.seats}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Zap size={18} className="text-neon" />
                    <span>Transmission: {motorbike.transmissionType}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin size={18} className="text-neon" />
                    <span>Odometer: {motorbike.odometer.toLocaleString()} km</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {motorbike.features && motorbike.features.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Features</h2>
                  <div className="space-y-2">
                    {motorbike.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-neon"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => navigate(`/bike-edit/${motorbike._id}`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Edit Motorbike
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                {deleting ? 'Deleting...' : 'Delete Motorbike'}
              </button>
              <button
                onClick={() => navigate('/bikes')}
                className="flex items-center gap-2 bg-neon text-dark hover:bg-[#bbf000] font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Back to Listing
              </button>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        {motorbike.imageUrls && motorbike.imageUrls.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">More Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {motorbike.imageUrls.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-neon transition-colors cursor-pointer">
                  <img src={url} alt={`${motorbike.vehicleModel} ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
