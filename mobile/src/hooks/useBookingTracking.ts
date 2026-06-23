import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../app/store';
import { API_BASE_URL } from '../constants/api';

export interface TrackingEvent {
  status: string;
  time: string | null;
  description: string;
  completed: boolean;
}

export const useBookingTracking = (bookingId: string | null) => {
  const [timeline, setTimeline] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = useAppSelector((state) => state.user.token);

  const fetchTracking = useCallback(async () => {
    if (!bookingId || !token) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/tracking`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch tracking data');
      }
      
      setTimeline(data.tracking || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  return {
    timeline,
    isLoading,
    error,
    refetch: fetchTracking
  };
};
