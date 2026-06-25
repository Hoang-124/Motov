import { useState } from 'react';
import { bookingService } from '../services/bookingService';
import DOMPurify from 'dompurify';

export const useReturnMotorbike = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const executeReturn = async (bookingId: string, actualReturnTime: string, endOdometer: number, returnReason?: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Sanitize input to prevent XSS
      const cleanTime = DOMPurify.sanitize(actualReturnTime);
      const cleanReason = returnReason ? DOMPurify.sanitize(returnReason) : undefined;
      
      const data = await bookingService.returnMotorbike(bookingId, cleanTime, endOdometer, cleanReason);
      setSuccess('Thu hồi xe thành công!');
      return data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Lỗi khi thu hồi xe';
      setError(errMsg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { executeReturn, isSubmitting, error, success, setError, setSuccess };
};
