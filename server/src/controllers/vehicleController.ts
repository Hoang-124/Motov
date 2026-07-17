import { Request, Response } from 'express';
import { Vehicle, IVehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { Booking } from '../models/Booking.js';

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
  } else {
    const cleanPlate = data.licensePlate.trim().toUpperCase();
    const plateRegex = /^[0-9]{2}-?([A-Z][0-9]|[A-Z]{2})[\s-]?([0-9]{4}|[0-9]{5}|[0-9]{3}\.[0-9]{2})$/;
    if (!plateRegex.test(cleanPlate)) {
      errors.push('Biển số xe máy không hợp lệ. Ví dụ đúng: 43-C1 123.45 hoặc 43C1-12345 (phải có 4 hoặc 5 số).');
    }
  }
  const categoryStr = data.category ? data.category.toString().trim() : '';
  if (!categoryStr) {
    errors.push('Category is required');
  } else if (!mongoose.Types.ObjectId.isValid(categoryStr)) {
    errors.push('Invalid Category ID');
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
    
    const filter: any = { isDeleted: { $ne: true } };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (ownerId) filter.ownerId = ownerId;

    const vehicles = await Vehicle.find(filter)
      .populate('ownerId', 'firstName lastName email phoneNumber avatarUrl')
      .populate('category')
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

    const vehicle = await Vehicle.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('ownerId', 'firstName lastName email phoneNumber avatarUrl')
      .populate('category');

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
    // Check if user has permission (staff, admin, or owner)
    const isStaffOrAdmin = req.user?.roles?.some(role => role === 'Staff' || role === 'Admin');
    const isOwner = req.user?.roles?.includes('Owner');

    if (!isStaffOrAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only owners, staff, and admins can create vehicles'
      });
    }

    const { vehicleModel, licensePlate, seats, rentalPrice, category, transmissionType, description, imageUrls, features, ownerId, location } = req.body;

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

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'Selected Category does not exist'
      });
    }

    // Create new vehicle
    // If Owner, ownerId must be their own id and status is PendingApproval
    const vehicleOwnerId = isStaffOrAdmin ? (ownerId || req.user?.id) : req.user?.id;
    const initialStatus = isStaffOrAdmin ? 'Available' : 'PendingApproval';

    const newVehicle = new Vehicle({
      ownerId: vehicleOwnerId,
      vehicleModel,
      licensePlate,
      seats: seats || 2,
      rentalPrice,
      category,
      transmissionType,
      description,
      imageUrls: imageUrls || [],
      features: features || [],
      location: location || { type: 'Point', coordinates: [108.22, 16.068] },
      status: initialStatus
    });

    await newVehicle.save();

    // Populate owner info
    await newVehicle.populate('ownerId', 'firstName lastName email phoneNumber avatarUrl');
    await newVehicle.populate('category');

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

      // Check if updated category exists
      if (updateData.category && updateData.category !== vehicle.category.toString()) {
        const categoryExists = await Category.findById(updateData.category);
        if (!categoryExists) {
          return res.status(400).json({
            success: false,
            error: 'Selected Category does not exist'
          });
        }
      }
    }

    // Update allowed fields, including fields that the admin UI edits directly.
    const allowedFields = [
      'vehicleModel',
      'licensePlate',
      'seats',
      'odometer',
      'rentalPrice',
      'description',
      'status',
      'imageUrls',
      'features',
      'category',
      'transmissionType',
      'location'
    ];
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        (vehicle as any)[key] = updateData[key];
      }
    });

    await vehicle.save();
    await vehicle.populate('ownerId', 'firstName lastName email phoneNumber avatarUrl');
    await vehicle.populate('category');

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

    vehicle.isDeleted = true;
    vehicle.status = 'Maintenance';
    await vehicle.save();

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

    const vehicles = await Vehicle.find({ ownerId, isDeleted: { $ne: true } })
      .populate('ownerId', 'firstName lastName email phoneNumber')
      .populate('category')
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

    // Check permissions
    const isAdminOrStaff = req.user?.roles?.some(role => role === 'Admin' || role === 'Staff');
    const isOwner = vehicle.ownerId.toString() === req.user?.id;

    if (!isAdminOrStaff) {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không có quyền thay đổi trạng thái của xe này'
        });
      }

      // If owner, check restriction rules
      if (vehicle.status === 'PendingApproval') {
        return res.status(403).json({
          success: false,
          error: 'Xe đang chờ phê duyệt từ quản trị viên. Bạn không thể tự thay đổi trạng thái lúc này.'
        });
      }

      if (status !== 'Available' && status !== 'Maintenance') {
        return res.status(403).json({
          success: false,
          error: 'Chủ xe chỉ được phép thay đổi trạng thái xe giữa Sẵn sàng (Available) và Bảo trì (Maintenance)'
        });
      }
    }

    const oldStatus = vehicle.status;
    vehicle.status = status;
    await vehicle.save();
    await vehicle.populate('ownerId', 'firstName lastName email phoneNumber');
    await vehicle.populate('category');

    // Tạo thông báo cho Chủ xe nếu xe được phê duyệt hoặc thay đổi tình trạng hoạt động
    try {
      if (oldStatus === 'PendingApproval' && status === 'Available') {
        await Notification.create({
          userId: (vehicle.ownerId as any)._id,
          title: 'Xe của bạn đã được phê duyệt hoạt động',
          message: `Chúc mừng! Chiếc xe ${vehicle.vehicleModel} (Biển số: ${vehicle.licensePlate}) của bạn đã được nhân viên hệ thống duyệt hoạt động công khai.`,
          type: 'System'
        });
      } else if (status === 'Maintenance') {
        await Notification.create({
          userId: (vehicle.ownerId as any)._id,
          title: 'Xe đã chuyển sang chế độ Bảo trì',
          message: `Chiếc xe ${vehicle.vehicleModel} (Biển số: ${vehicle.licensePlate}) của bạn đã được cập nhật tình trạng sang Bảo trì.`,
          type: 'System'
        });
      } else if (status === 'Available' && oldStatus !== 'PendingApproval') {
        await Notification.create({
          userId: (vehicle.ownerId as any)._id,
          title: 'Xe đã sẵn sàng hoạt động trở lại',
          message: `Chiếc xe ${vehicle.vehicleModel} (Biển số: ${vehicle.licensePlate}) của bạn đã sẵn sàng cho thuê trở lại.`,
          type: 'System'
        });
      }
    } catch (notiErr) {
      console.error('Lỗi tạo thông báo trạng thái xe:', notiErr);
    }

    res.json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    });

    // Check low availability alert in background (non-blocking)
    if (oldStatus === 'Available' && status !== 'Available') {
      checkLowAvailabilityAlert(vehicle.vehicleModel, vehicle.ownerId).catch(err => 
        console.error('Error running checkLowAvailabilityAlert:', err)
      );
    }
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle status'
    });
  }
};

/**
 * Check if a vehicle model has low availability (<= 1 available)
 * and send in-app notification alerts to Admins, Staff, and the Owner.
 */
export const checkLowAvailabilityAlert = async (vehicleModel: string, ownerId: any) => {
  try {
    const availableCount = await Vehicle.countDocuments({
      vehicleModel,
      status: 'Available'
    });

    if (availableCount <= 1) {
      // Find all Admins and Staff
      const adminsAndStaff = await User.find({
        roles: { $in: ['Admin', 'Staff'] }
      });

      const message = `Cảnh báo: Dòng xe "${vehicleModel}" hiện chỉ còn lại ${availableCount} xe sẵn sàng (Available) trong hệ thống. Vui lòng kiểm tra và cập nhật thêm xe.`;

      // Create notification for Admin/Staff
      for (const u of adminsAndStaff) {
        await Notification.create({
          userId: u._id,
          title: 'Cảnh báo: Lượng xe sẵn sàng thấp',
          message,
          type: 'System'
        });
      }

      // Create notification for the Owner (if not Admin/Staff)
      if (ownerId) {
        const owner = await User.findById(ownerId);
        if (owner && !owner.roles.includes('Admin') && !owner.roles.includes('Staff')) {
          await Notification.create({
            userId: owner._id,
            title: 'Cảnh báo: Xe sẵn sàng còn lại rất ít',
            message: `Dòng xe "${vehicleModel}" của bạn hiện chỉ còn ${availableCount} xe sẵn sàng hoạt động. Hãy kết thúc bảo trì hoặc đăng tải xe mới để tối ưu doanh thu.`,
            type: 'System'
          });
        }
      }
      console.log(`[Low Availability Alert] Alerts triggered for model: "${vehicleModel}". Available: ${availableCount}`);
    }
  } catch (err) {
    console.error('Error checking low availability alert:', err);
  }
};

/**
 * Reset vehicle maintenance status (Admin/Staff/Owner of vehicle)
 * PUT /api/vehicles/:id/maintenance-reset
 */
export const resetMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID xe không hợp lệ' });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe máy' });
    }

    // Check authorization: Admin, Staff, or Owner of the vehicle
    const isOwner = vehicle.ownerId.toString() === userId;
    const isAdminOrStaff = userRoles.includes('Admin') || userRoles.includes('Staff');

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
    }

    // Reset cờ bảo dưỡng
    vehicle.lastMaintenanceOdometer = vehicle.odometer;
    vehicle.requiresMaintenance = false;
    
    // Nếu xe đang ở trạng thái Bảo trì, tự động cho hoạt động trở lại
    if (vehicle.status === 'Maintenance') {
      vehicle.status = 'Available';
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Đặt lại chu kỳ bảo dưỡng và tắt cảnh báo thành công',
      data: vehicle
    });
  } catch (error: any) {
    console.error('Error resetting maintenance:', error);
    res.status(500).json({ success: false, error: 'Thao tác đặt lại bảo dưỡng thất bại' });
  }
};

/**
 * Get recommended vehicles for current user based on preferences/rental history,
 * or general popular/top rated vehicles for new users.
 * GET /api/vehicles/recommendations
 */
export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    let recommendedVehicles: any[] = [];
    let reason = 'Được nhiều người dùng yêu thích';

    if (userId) {
      // 1. Tìm lịch sử đơn thuê Completed hoặc Ongoing của user
      const userBookings = await Booking.find({
        userId,
        status: { $in: ['Completed', 'Ongoing'] }
      }).populate('vehicleId');

      if (userBookings && userBookings.length > 0) {
        // Gom các Category và TransmissionType của các xe đã thuê
        const categoriesCount: Record<string, number> = {};
        const transmissionCount: Record<string, number> = {};
        let totalRentalPrice = 0;
        let rentedCount = 0;

        for (const booking of userBookings) {
          const v = booking.vehicleId as any;
          if (v) {
            const catId = v.category ? v.category.toString() : '';
            if (catId) categoriesCount[catId] = (categoriesCount[catId] || 0) + 1;
            
            const trans = v.transmissionType;
            if (trans) transmissionCount[trans] = (transmissionCount[trans] || 0) + 1;
            
            totalRentalPrice += v.rentalPrice || 0;
            rentedCount++;
          }
        }

        // Tìm Category và Transmission Type thuê nhiều nhất
        let favCategory = '';
        let maxCat = 0;
        for (const cat in categoriesCount) {
          if (categoriesCount[cat] > maxCat) {
            maxCat = categoriesCount[cat];
            favCategory = cat;
          }
        }

        let favTransmission = '';
        let maxTrans = 0;
        for (const trans in transmissionCount) {
          if (transmissionCount[trans] > maxTrans) {
            maxTrans = transmissionCount[trans];
            favTransmission = trans;
          }
        }

        // Truy vấn các xe phù hợp sở thích:
        // Cùng category hoặc cùng loại hộp số, đang Available, không phải của chính mình (nếu mình là owner),
        // và loại trừ các xe đang thuê
        const rentedVehicleIds = userBookings.map(b => b.vehicleId.toString());

        const query: any = {
          status: 'Available',
          _id: { $nin: rentedVehicleIds }
        };

        // Ưu tiên sở thích
        const orConditions: any[] = [];
        if (favCategory) orConditions.push({ category: favCategory });
        if (favTransmission) orConditions.push({ transmissionType: favTransmission });
        
        if (orConditions.length > 0) {
          query.$or = orConditions;
        }

        recommendedVehicles = await Vehicle.find(query)
          .populate('category', 'name')
          .limit(5);

        if (favTransmission) {
          const transLabel = favTransmission === 'Manual' ? 'xe số' : favTransmission === 'Automatic' ? 'xe ga' : 'xe côn tay';
          reason = `Gợi ý theo sở thích chạy ${transLabel} của bạn`;
        } else if (favCategory) {
          reason = `Dòng xe tương tự các chuyến đi trước của bạn`;
        }
      }
    }

    // 2. Fallback: Nếu không tìm được đề xuất theo sở thích (hoặc khách chưa đăng nhập / khách mới)
    if (recommendedVehicles.length === 0) {
      // Đề xuất các xe phổ biến nhất: Tìm các xe có lượt thuê nhiều nhất trong Booking
      const popularVehiclesGroup = await Booking.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: '$vehicleId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const popularIds = popularVehiclesGroup.map(g => g._id);

      if (popularIds.length > 0) {
        recommendedVehicles = await Vehicle.find({
          _id: { $in: popularIds },
          status: 'Available'
        })
        .populate('category', 'name')
        .limit(5);
        
        reason = 'Dòng xe phổ biến có lượt thuê cao nhất';
      }

      // Nếu vẫn chưa có (ví dụ hệ thống chưa có booking nào), lấy các xe có điểm đánh giá rating cao nhất hoặc xe ngẫu nhiên
      if (recommendedVehicles.length === 0) {
        // Tìm xe Available ngẫu nhiên/mới nhất
        recommendedVehicles = await Vehicle.find({ status: 'Available' })
          .populate('category', 'name')
          .sort({ createdAt: -1 })
          .limit(5);

        reason = 'Các dòng xe máy mới nổi bật của hệ thống';
      }
    }

    res.status(200).json({
      success: true,
      reason,
      vehicles: recommendedVehicles
    });
  } catch (error: any) {
    console.error('Error fetching recommended vehicles:', error);
    res.status(500).json({ success: false, error: 'Không thể lấy danh sách đề xuất xe' });
  }
};

// Tính khoảng cách Haversine (km)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Khoảng cách (km)
};

// Lấy danh sách xe máy gần vị trí khách hàng
export const getNearbyVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusInMeters = radius ? parseInt(radius as string) : 5000; // Mặc định 5km

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Tọa độ vị trí khách hàng không hợp lệ' });
    }

    const isUnlimited = radiusInMeters <= 0;

    // Tìm các xe Available gần nhất trong bán kính bằng GeoJSON $near
    const query: any = {
      status: 'Available',
      isDeleted: { $ne: true }
    };

    if (!isUnlimited) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    const vehicles = await Vehicle.find(query)
    .populate('ownerId', 'firstName lastName email phoneNumber avatarUrl')
    .populate('category')
    .lean();

    // Map thêm khoảng cách thực tế tính bằng km
    const formattedVehicles = vehicles.map((v: any) => {
      const vLng = v.location?.coordinates?.[0] ?? 108.22;
      const vLat = v.location?.coordinates?.[1] ?? 16.068;
      const distance = getDistance(latitude, longitude, vLat, vLng);
      return {
        ...v,
        distance: parseFloat(distance.toFixed(2)) // làm tròn 2 số thập phân
      };
    });

    // Sắp xếp khoảng cách tăng dần
    formattedVehicles.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách xe máy gần nhất:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm kiếm danh sách xe máy gần đây.',
    });
  }
};

/**
 * So sánh nhiều xe (max 3 xe)
 * POST /api/vehicles/compare
 * Body: { vehicleIds: string[] }
 */
export const compareVehicles = async (req: Request, res: Response) => {
  try {
    const { vehicleIds } = req.body;

    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Cần ít nhất 2 xe để so sánh' });
    }

    if (vehicleIds.length > 3) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể so sánh tối đa 3 xe cùng một lúc' });
    }

    const validIds = vehicleIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== vehicleIds.length) {
      return res.status(400).json({ success: false, message: 'Một hoặc nhiều ID xe không hợp lệ' });
    }

    const vehicles = await Vehicle.find({
      _id: { $in: validIds },
      isDeleted: { $ne: true }
    })
      .populate('ownerId', 'firstName lastName username avatarUrl')
      .populate('category', 'name slug')
      .lean();

    // Lấy thống kê booking cho mỗi xe
    const vehiclesWithStats = await Promise.all(
      vehicles.map(async (vehicle) => {
        const completedBookings = await Booking.countDocuments({ vehicleId: vehicle._id, status: 'Completed' });
        const totalBookings = await Booking.countDocuments({ vehicleId: vehicle._id });
        return { ...vehicle, completedBookings, totalBookings };
      })
    );

    res.status(200).json({
      success: true,
      data: vehiclesWithStats
    });
  } catch (error: any) {
    console.error('Lỗi khi so sánh xe:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi so sánh xe' });
  }
};
