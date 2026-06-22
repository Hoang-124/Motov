/**
 * Vehicle/Motorbike Validation
 * Validation rules for creating and updating vehicles
 */

export interface VehicleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate vehicle input data
 * @param data - Vehicle data to validate
 * @returns Validation result with errors and warnings
 */
export const validateVehicleInput = (data: any): VehicleValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!data.vehicleModel || typeof data.vehicleModel !== 'string' || data.vehicleModel.trim() === '') {
    errors.push('Vehicle model is required and must be a non-empty string');
  }

  if (!data.licensePlate || typeof data.licensePlate !== 'string' || data.licensePlate.trim() === '') {
    errors.push('License plate is required and must be a non-empty string');
  } else if (!/^[A-Z0-9]{6,10}$/.test(data.licensePlate.toUpperCase())) {
    warnings.push('License plate format may be invalid');
  }

  if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
    errors.push('Category is required and must be a non-empty string');
  }

  if (!data.transmissionType || !['Manual', 'Automatic', 'Semi-Automatic'].includes(data.transmissionType)) {
    errors.push('Transmission type must be one of: Manual, Automatic, Semi-Automatic');
  }

  if (typeof data.rentalPrice !== 'number' || data.rentalPrice < 0) {
    errors.push('Rental price must be a positive number');
  }

  // Optional fields validation with appropriate ranges
  if (data.seats && (typeof data.seats !== 'number' || data.seats < 1 || data.seats > 8)) {
    errors.push('Seats must be a number between 1 and 8');
  }

  if (data.odometer && (typeof data.odometer !== 'number' || data.odometer < 0)) {
    errors.push('Odometer must be a positive number');
  }

  // Status validation
  if (data.status && !['Available', 'Rented', 'Maintenance', 'PendingApproval'].includes(data.status)) {
    errors.push('Status must be one of: Available, Rented, Maintenance, PendingApproval');
  }

  // Description validation
  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  } else if (data.description && data.description.length > 500) {
    warnings.push('Description is quite long (over 500 characters)');
  }

  // Arrays validation
  if (data.imageUrls && !Array.isArray(data.imageUrls)) {
    errors.push('Image URLs must be an array');
  } else if (data.imageUrls && data.imageUrls.length > 10) {
    warnings.push('You have more than 10 images, consider limiting to 10');
  }

  if (data.features && !Array.isArray(data.features)) {
    errors.push('Features must be an array');
  } else if (data.features && data.features.length > 20) {
    warnings.push('You have more than 20 features, consider limiting to 20');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate vehicle update data (partial validation)
 * @param data - Partial vehicle data to validate
 * @returns Validation result with errors
 */
export const validateVehicleUpdate = (data: any): VehicleValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate fields that are being updated
  if (data.vehicleModel !== undefined) {
    if (typeof data.vehicleModel !== 'string' || data.vehicleModel.trim() === '') {
      errors.push('Vehicle model must be a non-empty string');
    }
  }

  if (data.licensePlate !== undefined) {
    if (typeof data.licensePlate !== 'string' || data.licensePlate.trim() === '') {
      errors.push('License plate must be a non-empty string');
    }
  }

  if (data.category !== undefined) {
    if (typeof data.category !== 'string' || data.category.trim() === '') {
      errors.push('Category must be a non-empty string');
    }
  }

  if (data.transmissionType !== undefined) {
    if (!['Manual', 'Automatic', 'Semi-Automatic'].includes(data.transmissionType)) {
      errors.push('Transmission type must be one of: Manual, Automatic, Semi-Automatic');
    }
  }

  if (data.rentalPrice !== undefined) {
    if (typeof data.rentalPrice !== 'number' || data.rentalPrice < 0) {
      errors.push('Rental price must be a positive number');
    }
  }

  if (data.seats !== undefined) {
    if (typeof data.seats !== 'number' || data.seats < 1 || data.seats > 8) {
      errors.push('Seats must be a number between 1 and 8');
    }
  }

  if (data.odometer !== undefined) {
    if (typeof data.odometer !== 'number' || data.odometer < 0) {
      errors.push('Odometer must be a positive number');
    }
  }

  if (data.status !== undefined) {
    if (!['Available', 'Rented', 'Maintenance', 'PendingApproval'].includes(data.status)) {
      errors.push('Status must be one of: Available, Rented, Maintenance, PendingApproval');
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      warnings.push('Description is quite long (over 500 characters)');
    }
  }

  if (data.imageUrls !== undefined) {
    if (!Array.isArray(data.imageUrls)) {
      errors.push('Image URLs must be an array');
    }
  }

  if (data.features !== undefined) {
    if (!Array.isArray(data.features)) {
      errors.push('Features must be an array');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate license plate format
 * @param licensePlate - License plate string to validate
 * @returns true if valid format
 */
export const isValidLicensePlate = (licensePlate: string): boolean => {
  const pattern = /^[A-Z0-9]{6,10}$/;
  return pattern.test(licensePlate.toUpperCase());
};

/**
 * Validate transmission type
 * @param type - Transmission type to validate
 * @returns true if valid type
 */
export const isValidTransmissionType = (type: string): boolean => {
  return ['Manual', 'Automatic', 'Semi-Automatic'].includes(type);
};

/**
 * Validate vehicle status
 * @param status - Status to validate
 * @returns true if valid status
 */
export const isValidVehicleStatus = (status: string): boolean => {
  return ['Available', 'Rented', 'Maintenance', 'PendingApproval'].includes(status);
};
