import { Request, Response } from 'express';
import { Vehicle, IVehicle } from '../models/Vehicle.js';
import mongoose from 'mongoose';

// Type for authenticated request
interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    roles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
  };
}

// Validation helper functions
const validateVehicleInput = (data: any) => {
  const errors: string[] = [];

  if (!data.vehicleModel || data.vehicleModel.trim() === '') {
    errors.push('Vehicle model is required');
  }
  if (!data.licensePlate || data.licensePlate.trim() === '') {
    errors.push('License plate is required');
  }
  if (!data.category || data.category.trim() === '') {
    errors.push('Category is required');
  }
  if (!data.transmissionType) {
    errors.push('Transmission type is required');
  }
  if (typeof data.rentalPrice !== 'number' || data.rentalPrice < 0) {
    errors.push('Rental price must be a positive number');
  }
  if (data.seats && (typeof data.seats !== 'number' || data.seats < 1)) {
    errors.push('Seats must be a positive number');
  }

  return errors;
};

/**
 * Get all vehicles with optional filtering
 * Query params: category, status, ownerId
 */
export const getAllVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, ownerId, sortBy = '-createdAt' } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (ownerId) filter.ownerId = ownerId;

    const vehicles = await Vehicle.find(filter)
      .populate('ownerId', 'firstName lastName email phoneNumber avatarUrl')
      .sort(sortBy as string)
      .lean();

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id)
      .populate('ownerId', 'firstName lastName email phoneNumber avatarUrl');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle'
    });
  }
};

/**
 * Create a new vehicle
 * Only staff and admins can create vehicles
 */
export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission (staff or admin only)
    const hasPermission = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Only staff and admins can create vehicles'
      });
    }

    const { vehicleModel, licensePlate, seats, rentalPrice, category, transmissionType, description, imageUrls, features, ownerId } = req.body;

    // Validation
    const validationErrors = validateVehicleInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }

    // Check if license plate already exists
    const existingVehicle = await Vehicle.findOne({ licensePlate });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        error: 'License plate already exists'
      });
    }

    // Create new vehicle
    // If staff/admin provides ownerId, use it; otherwise set as system vehicle
    const newVehicle = new Vehicle({
      ownerId: ownerId || req.user?.id,
      vehicleModel,
      licensePlate,
      seats: seats || 2,
      rentalPrice,
      category,
      transmissionType,
      description,
      imageUrls: imageUrls || [],
      features: features || [],
      status: 'Available' // Staff/Admin created vehicles are available by default
    });

    await newVehicle.save();

    // Populate owner info
    await newVehicle.populate('ownerId', 'firstName lastName email phoneNumber avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: newVehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vehicle'
    });
  }
};

/**
 * Update a vehicle
 * Only the owner can update their vehicle
 */
export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check if user is the owner or admin/staff
    const isOwner = vehicle.ownerId.toString() === (req.user?.id || req.userId);
    const isAdmin = req.user?.roles?.some(role => role === 'Admin' || role === 'Staff');
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this vehicle'
      });
    }

    // Validate input if relevant fields are being updated
    if (updateData.vehicleModel || updateData.licensePlate || updateData.rentalPrice || updateData.category || updateData.transmissionType) {
      const validationErrors = validateVehicleInput({
        vehicleModel: updateData.vehicleModel || vehicle.vehicleModel,
        licensePlate: updateData.licensePlate || vehicle.licensePlate,
        category: updateData.category || vehicle.category,
        transmissionType: updateData.transmissionType || vehicle.transmissionType,
        rentalPrice: updateData.rentalPrice !== undefined ? updateData.rentalPrice : vehicle.rentalPrice,
        seats: updateData.seats || vehicle.seats
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: validationErrors
        });
      }

      // Check license plate uniqueness if being updated
      if (updateData.licensePlate && updateData.licensePlate !== vehicle.licensePlate) {
        const existingVehicle = await Vehicle.findOne({ licensePlate: updateData.licensePlate });
        if (existingVehicle) {
          return res.status(400).json({
            success: false,
            error: 'License plate already exists'
          });
        }
      }
    }

    // Update allowed fields
    const allowedFields = ['vehicleModel', 'seats', 'odometer', 'rentalPrice', 'description', 'status', 'imageUrls', 'features'];
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        (vehicle as any)[key] = updateData[key];
      }
    });

    await vehicle.save();
    await vehicle.populate('ownerId', 'firstName lastName email phoneNumber avatarUrl');

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle'
    });
  }
};

/**
 * Delete a vehicle
 * Only the owner can delete their vehicle
 */
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    // Check if user is the owner or admin/staff
    const isOwner = vehicle.ownerId.toString() === (req.user?.id || req.userId);
    const isAdmin = req.user?.roles?.some(role => role === 'Admin' || role === 'Staff');
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this vehicle'
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vehicle'
    });
  }
};

/**
 * Get vehicles by owner
 */
export const getOwnerVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const { ownerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID'
      });
    }

    const vehicles = await Vehicle.find({ ownerId })
      .populate('ownerId', 'firstName lastName email phoneNumber')
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching owner vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
};

/**
 * Update vehicle status (Admin/Owner only)
 */
export const updateVehicleStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Available', 'Rented', 'Maintenance', 'PendingApproval'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vehicle ID'
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    vehicle.status = status;
    await vehicle.save();
    await vehicle.populate('ownerId', 'firstName lastName email phoneNumber');

    res.json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle status'
    });
  }
};
