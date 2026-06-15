import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

export interface TrackingEvent {
  status: string;
  timestamp: string;
  description?: string;
  location?: string;
  actor?: string;
}

export const useBookingTracking = (bookingId: string | null) => {
  const [timeline, setTimeline] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;

    const fetchTracking = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await bookingService.getBookingTracking(bookingId);
        if (isMounted) {
          // If the backend returns { timeline: [...] } or just an array
          setTimeline(Array.isArray(data) ? data : data.timeline || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Lỗi khi tải lịch trình');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTracking();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  return { timeline, loading, error };
};
