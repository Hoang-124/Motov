import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';

/**
 * Validate booking input data
 */
export function validateBookingInput(data: any): { valid: boolean; error?: string } {
  const { vehicleId, pickupDateTime, returnDateTime, pickupLocation, returnLocation } = data;

  // Check required fields
  if (!vehicleId || !pickupDateTime || !returnDateTime) {
    return { valid: false, error: 'Vui lòng cung cấp đầy đủ thông tin: vehicleId, pickupDateTime, returnDateTime' };
  }

  // Validate dates
  const pickup = new Date(pickupDateTime);
  const returnDate = new Date(returnDateTime);
  const now = new Date();

  if (isNaN(pickup.getTime()) || isNaN(returnDate.getTime())) {
    return { valid: false, error: 'Định dạng ngày tháng không hợp lệ. Vui lòng sử dụng format ISO (YYYY-MM-DD)' };
  }

  // Check if pickup date is in the future (allow 30 minutes grace period for user operations)
  const minPickup = new Date(now.getTime() - 30 * 60 * 1000);
  if (pickup < minPickup) {
    return { valid: false, error: 'Ngày lấy xe phải là ngày trong tương lai (hoặc trễ không quá 30 phút)' };
  }

  // Check if return date is after pickup date
  if (returnDate <= pickup) {
    return { valid: false, error: 'Ngày trả xe phải sau ngày lấy xe' };
  }

  // Check minimum rental period (at least 1 hour)
  const minRentalHours = 1;
  const rentalHours = (returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60);
  if (rentalHours < minRentalHours) {
    return { valid: false, error: `Thời gian cho thuê tối thiểu là ${minRentalHours} giờ` };
  }

  // Maximum rental period (30 days)
  const maxRentalDays = 30;
  const rentalDays = Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
  if (rentalDays > maxRentalDays) {
    return { valid: false, error: `Thời gian cho thuê tối đa là ${maxRentalDays} ngày` };
  }

  // Validate location if provided
  if (pickupLocation && pickupLocation.coordinates) {
    if (!Array.isArray(pickupLocation.coordinates) || pickupLocation.coordinates.length !== 2) {
      return { valid: false, error: 'Tọa độ vị trí lấy xe không hợp lệ (phải là [longitude, latitude])' };
    }
  }

  if (returnLocation && returnLocation.coordinates) {
    if (!Array.isArray(returnLocation.coordinates) || returnLocation.coordinates.length !== 2) {
      return { valid: false, error: 'Tọa độ vị trí trả xe không hợp lệ (phải là [longitude, latitude])' };
    }
  }

  return { valid: true };
}

/**
 * Check if vehicle is available during the booking period
 */
export async function checkVehicleAvailability(
  vehicleId: string,
  pickupDateTime: string | Date,
  returnDateTime: string | Date
): Promise<boolean> {
  const pickup = new Date(pickupDateTime);
  const returnDate = new Date(returnDateTime);

  try {
    // Find overlapping bookings
    const overlappingBookings = await Booking.findOne({
      vehicleId,
      status: { $in: ['Confirmed', 'Ongoing'] }, // Only these statuses block availability
      $or: [
        // Overlap scenarios
        {
          // New booking starts during existing booking
          pickupDateTime: { $lt: returnDate },
          returnDateTime: { $gt: pickup }
        }
      ]
    });

    return !overlappingBookings;
  } catch (error) {
    console.error('Error checking vehicle availability:', error);
    return false;
  }
}

/**
 * Validate booking status transition
 */
export function validateUpdateBooking(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  const validTransitions: Record<string, string[]> = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Ongoing', 'Cancelled'],
    'Ongoing': ['Returning', 'Completed'],
    'Returning': ['Completed'],
    'Completed': [],
    'Cancelled': []
  };

  if (!validTransitions[currentStatus]) {
    return { valid: false, error: `Trạng thái hiện tại không hợp lệ: ${currentStatus}` };
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Không thể chuyển từ "${currentStatus}" sang "${newStatus}". Chuyển đổi hợp lệ: ${validTransitions[currentStatus].join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate booking cancellation
 */
export function validateCancellation(currentStatus: string): { valid: boolean; error?: string } {
  const cancellableStatuses = ['Pending', 'Confirmed'];

  if (!cancellableStatuses.includes(currentStatus)) {
    return {
      valid: false,
      error: `Không thể hủy booking ở trạng thái "${currentStatus}". Chỉ có thể hủy booking ở trạng thái Pending hoặc Confirmed.`
    };
  }

  return { valid: true };
}

export const calculateTotalAmount = (rentalPricePerDay: number, days: number): number =>
  Math.round(rentalPricePerDay * Math.max(1, days));

export const generateBookingCode = (): string =>
  `BK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.random().toString().slice(2, 8)}`;

/**
 * Validate surcharge data
 */
export function validateSurcharge(data: any): { valid: boolean; error?: string } {
  const { surchargeType, amount } = data;

  if (!surchargeType || amount === undefined) {
    return { valid: false, error: 'Vui lòng cung cấp surchargeType và amount' };
  }

  if (typeof amount !== 'number' || amount < 0) {
    return { valid: false, error: 'Số tiền phí phụ phải là số không âm' };
  }

  return { valid: true };
}

export const calculateLateFees = (returnedTime: Date, scheduledReturnTime: Date, hourlyRate: number): number =>
  Math.max(0, Math.ceil((returnedTime.getTime() - scheduledReturnTime.getTime()) / 36e5)) * hourlyRate;

/**
 * Calculate damage fees
 */
export function calculateDamageFees(damageType: string, vehicleValue: number): number {
  const damageFeePercentages: Record<string, number> = {
    'minor': 0.05,      // 5% - minor scratches
    'moderate': 0.15,   // 15% - dents, broken parts
    'severe': 0.50,     // 50% - major damage
    'total_loss': 1.0   // 100% - total loss
  };

  const percentage = damageFeePercentages[damageType] || 0.05;
  return Math.round(vehicleValue * percentage);
}

export default {
  validateBookingInput,
  checkVehicleAvailability,
  validateUpdateBooking,
  validateCancellation,
  calculateTotalAmount,
  generateBookingCode,
  validateSurcharge,
  calculateLateFees,
  calculateDamageFees
};
