import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../app/store';
import { API_BASE_URL } from '../constants/api';
import { returnBookingWithFees } from '../features/bookings/bookingsSlice';
import { apiFetch } from '../utils/api';

export const useReturnMotorbike = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = useAppSelector((state) => state.user.token);
  const dispatch = useAppDispatch();

  // Basic sanitization to strip potentially dangerous characters (e.g., <, >)
  // Even though it's React Native, it's good practice for defense in depth.
  const sanitizeInput = (input: string) => {
    if (!input) return '';
    return input.replace(/[<>]/g, '');
  };

  const executeReturn = useCallback(async (bookingId: string, actualReturnTime: string) => {
    setIsSubmitting(true);
    setError(null);

    const sanitizedTime = sanitizeInput(actualReturnTime);

    try {
      const response = await apiFetch(`/bookings/${bookingId}/return`, {
        method: 'PUT',
        body: JSON.stringify({ actualReturnTime: sanitizedTime }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to return motorbike');
      }
      
      // Update Redux state to reflect the return and late fee
      dispatch(returnBookingWithFees({
        id: bookingId,
        lateFee: data.lateFee || 0,
        returnTime: sanitizedTime
      }));

      return { success: true, lateFee: data.lateFee || 0 };
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [token, dispatch]);

  return {
    executeReturn,
    isSubmitting,
    error,
  };
};
