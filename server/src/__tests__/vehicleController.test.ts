import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { 
  getAllVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  getOwnerVehicles,
  updateVehicleStatus,
  resetMaintenance,
  getRecommendations,
  getNearbyVehicles
} from '../controllers/vehicleController.js';

describe('Vehicle Controller Tests', () => {
  let testVehicleId: string;
  let testUserId: string;
  let testCategoryId: string;
  let mockRequest: any;
  let mockResponse: any;

  beforeAll(async () => {
    // Connect to test database
    const mongoUrl = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/Motov-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl);
    }

    // Create test category
    const testCategory = new Category({
      name: 'Sport',
      slug: 'sport',
      description: 'Sport category for test'
    });
    const savedCategory = await testCategory.save();
    testCategoryId = savedCategory._id?.toString() || '';

    // Create test user
    const testUser = new User({
      username: 'testuser123',
      email: 'testuser@motov.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '0901234567',
      roles: ['Staff'],
      status: 'Active'
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id?.toString() || '';
  });

  afterAll(async () => {
    // Clean up test data
    await Vehicle.deleteMany({});
    await User.deleteMany({ email: 'testuser@motov.com' });
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(() => {
    mockResponse = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    };

    mockRequest = {
      user: {
        id: testUserId,
        email: 'testuser@motov.com',
        roles: ['Staff']
      }
    };
  });

  describe('createVehicle', () => {
    it('should create a new vehicle with valid data', async () => {
      mockRequest.body = {
        vehicleModel: 'Honda CB300R',
        licensePlate: '29A12345',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 150000,
        seats: 2,
        imageUrls: ['https://example.com/image.jpg'],
        features: ['ABS', 'LED Lights']
      };

      await createVehicle(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data).toBeDefined();
      expect(callArgs.data.vehicleModel).toBe('Honda CB300R');
      
      testVehicleId = callArgs.data._id.toString();
    });

    it('should reject vehicle creation without required fields', async () => {
      mockRequest.body = {
        vehicleModel: 'Honda CB300R'
        // Missing required fields
      };

      await createVehicle(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(false);
      expect(callArgs.errors).toBeDefined();
    });

    it('should prevent duplicate license plates', async () => {
      // Create first vehicle
      const vehicle1 = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Yamaha Exciter',
        licensePlate: '30B98765',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 120000
      });
      await vehicle1.save();

      // Try to create duplicate
      mockRequest.body = {
        vehicleModel: 'Honda CB300R',
        licensePlate: '30B98765', // Duplicate
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 150000
      };

      await createVehicle(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.error).toContain('License plate already exists');
    });
  });

  describe('getAllVehicles', () => {
    it('should return all vehicles', async () => {
      mockRequest.query = {};

      await getAllVehicles(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(Array.isArray(callArgs.data)).toBe(true);
    });

    it('should filter vehicles by status', async () => {
      mockRequest.query = { status: 'Available' };

      await getAllVehicles(mockRequest, mockResponse);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      callArgs.data.forEach((vehicle: any) => {
        expect(vehicle.status).toBe('Available');
      });
    });

    it('should filter vehicles by category', async () => {
      mockRequest.query = { category: testCategoryId };

      await getAllVehicles(mockRequest, mockResponse);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      callArgs.data.forEach((vehicle: any) => {
        expect(vehicle.category._id.toString()).toBe(testCategoryId);
      });
    });

    it('should filter vehicles by Odometer range (Case 4)', async () => {
      // Create test vehicles with different odometers
      const v1 = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Odo Bike 1',
        licensePlate: 'ODO001',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 100000,
        odometer: 5000
      });
      const v2 = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Odo Bike 2',
        licensePlate: 'ODO002',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 150000,
        odometer: 15000
      });
      const v3 = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Odo Bike 3',
        licensePlate: 'ODO003',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 120000,
        odometer: 25000
      });
      await v1.save();
      await v2.save();
      await v3.save();

      mockRequest.query = { minOdometer: '10000', maxOdometer: '20000' };
      await getAllVehicles(mockRequest, mockResponse);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      
      // Should find Odo Bike 2 (odometer 15000)
      const foundOdo = callArgs.data.filter((v: any) => v.licensePlate.startsWith('ODO'));
      expect(foundOdo.length).toBe(1);
      expect(foundOdo[0].licensePlate).toBe('ODO002');
      expect(foundOdo[0].odometer).toBeGreaterThanOrEqual(10000);
      expect(foundOdo[0].odometer).toBeLessThanOrEqual(20000);
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle by valid ID', async () => {
      if (!testVehicleId) {
        // Create a test vehicle first
        const vehicle = new Vehicle({
          ownerId: testUserId,
          vehicleModel: 'Test Vehicle',
          licensePlate: 'TEST001',
          category: testCategoryId,
          transmissionType: 'Manual',
          rentalPrice: 100000
        });
        const saved = await vehicle.save();
        testVehicleId = saved._id?.toString() || '';
      }

      mockRequest.params = { id: testVehicleId };

      await getVehicleById(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data._id.toString()).toBe(testVehicleId);
    });

    it('should return 400 for invalid ObjectId', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await getVehicleById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const validButNonExistentId = new mongoose.Types.ObjectId();
      mockRequest.params = { id: validButNonExistentId.toString() };

      await getVehicleById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle with valid data', async () => {
      if (!testVehicleId) {
        const vehicle = new Vehicle({
          ownerId: testUserId,
          vehicleModel: 'Update Test',
          licensePlate: 'UPDATE001',
          category: testCategoryId,
          transmissionType: 'Manual',
          rentalPrice: 100000
        });
        const saved = await vehicle.save();
        testVehicleId = saved._id?.toString() || '';
      }

      mockRequest.params = { id: testVehicleId };
      mockRequest.body = { rentalPrice: 200000, description: 'Updated vehicle' };

      await updateVehicle(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data.rentalPrice).toBe(200000);
    });

    it('should update category, license plate and transmission type for admin edits', async () => {
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Edit Test Bike',
        brand: 'Honda',
        licensePlate: '43C1-99999',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 110000
      });
      const saved = await vehicle.save();

      mockRequest.params = { id: saved._id?.toString() };
      mockRequest.body = {
        vehicleModel: 'Edited Bike',
        licensePlate: '43C1-88888',
        category: testCategoryId,
        transmissionType: 'Automatic'
      };

      await updateVehicle(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data.vehicleModel).toBe('Edited Bike');
      expect(callArgs.data.licensePlate).toBe('43C1-88888');
      expect(callArgs.data.transmissionType).toBe('Automatic');
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle with valid ID', async () => {
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Delete Test',
        licensePlate: 'DELETE001',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 100000
      });
      const saved = await vehicle.save();
      const vehicleIdToDelete = saved._id?.toString() || '';

      mockRequest.params = { id: vehicleIdToDelete };

      await deleteVehicle(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);

      // Verify vehicle is soft-deleted and hidden from normal queries
      const deletedVehicle = await Vehicle.findById(vehicleIdToDelete);
      expect(deletedVehicle).not.toBeNull();
      expect(deletedVehicle?.isDeleted).toBe(true);
      const visibleVehicles = await Vehicle.find({ _id: vehicleIdToDelete, isDeleted: { $ne: true } });
      expect(visibleVehicles).toHaveLength(0);
    });
  });

  describe('updateVehicleStatus', () => {
    it('should update vehicle status to valid status', async () => {
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Status Test',
        licensePlate: 'STATUS001',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 100000,
        status: 'Available'
      });
      const saved = await vehicle.save();

      mockRequest.params = { id: saved._id?.toString() };
      mockRequest.body = { status: 'Rented' };

      await updateVehicleStatus(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data.status).toBe('Rented');
    });

    it('should reject invalid status', async () => {
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Invalid Status Test',
        licensePlate: 'INVALID001',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 100000
      });
      const saved = await vehicle.save();

      mockRequest.params = { id: saved._id?.toString() };
      mockRequest.body = { status: 'InvalidStatus' };

      await updateVehicleStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOwnerVehicles', () => {
    it('should return vehicles for specific owner', async () => {
      mockRequest.params = { ownerId: testUserId };

      await getOwnerVehicles(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(Array.isArray(callArgs.data)).toBe(true);
    });
  });

  describe('resetMaintenance', () => {
    it('should reset maintenance requirements and update lastMaintenanceOdometer', async () => {
      // Create a vehicle that requires maintenance
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Maintenance Test Bike',
        licensePlate: 'MAINT001',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 130000,
        odometer: 5000,
        lastMaintenanceOdometer: 2000,
        requiresMaintenance: true,
        status: 'Maintenance'
      });
      const savedVehicle = await vehicle.save();
      const vehicleId = savedVehicle._id?.toString() || '';

      mockRequest.params = { id: vehicleId };
      mockRequest.user = {
        id: testUserId,
        roles: ['Staff']
      };

      await resetMaintenance(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data.requiresMaintenance).toBe(false);
      expect(callArgs.data.lastMaintenanceOdometer).toBe(5000);
      expect(callArgs.data.status).toBe('Available');
    });

    it('should block non-authorized users from resetting maintenance', async () => {
      const vehicle = new Vehicle({
        ownerId: new mongoose.Types.ObjectId().toString(), // not testUserId
        vehicleModel: 'Auth Test Bike',
        licensePlate: 'AUTH001',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 130000,
        odometer: 1000,
        lastMaintenanceOdometer: 0,
        requiresMaintenance: true
      });
      const savedVehicle = await vehicle.save();

      mockRequest.params = { id: savedVehicle._id?.toString() };
      mockRequest.user = {
        id: testUserId, // not owner
        roles: ['Customer'] // not Admin or Staff
      };

      await resetMaintenance(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getRecommendations', () => {
    it('should return recommended vehicles with a reason', async () => {
      // Create a few available vehicles
      const bike1 = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Rec Bike 1',
        licensePlate: 'REC001',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 100000,
        status: 'Available'
      });
      const bike2 = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Rec Bike 2',
        licensePlate: 'REC002',
        category: testCategoryId,
        transmissionType: 'Manual',
        rentalPrice: 100000,
        status: 'Available'
      });
      await bike1.save();
      await bike2.save();

      mockRequest.user = {
        id: testUserId
      };

      await getRecommendations(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.vehicles).toBeDefined();
      expect(callArgs.vehicles.length).toBeGreaterThan(0);
      expect(callArgs.reason).toBeDefined();
    });
  });

  describe('getNearbyVehicles', () => {
    it('should return nearby available vehicles sorted by distance', async () => {
      await Vehicle.deleteMany({}); // Clear database for isolated coordinate testing

      // Create test vehicles at specific coordinates
      // Customer is at Da Nang center (16.068, 108.22)
      const nearBike = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Near Bike',
        licensePlate: 'NEAR001',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 120000,
        status: 'Available',
        location: {
          type: 'Point',
          coordinates: [108.225, 16.070] // Close (~600m)
        }
      });
      const farBike = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Far Bike',
        licensePlate: 'FAR001',
        category: testCategoryId,
        transmissionType: 'Automatic',
        rentalPrice: 120000,
        status: 'Available',
        location: {
          type: 'Point',
          coordinates: [108.250, 16.100] // Further (~4.5km)
        }
      });
      await nearBike.save();
      await farBike.save();

      mockRequest.query = {
        lat: '16.068',
        lng: '108.22',
        radius: '5000'
      };

      await getNearbyVehicles(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.data).toBeDefined();
      expect(callArgs.data.length).toBeGreaterThanOrEqual(2);

      // Verify that sorting matches proximity
      expect(callArgs.data[0].vehicleModel).toBe('Near Bike');
      expect(callArgs.data[0].distance).toBeLessThan(1);
      expect(callArgs.data[1].vehicleModel).toBe('Far Bike');
      expect(callArgs.data[1].distance).toBeGreaterThan(1);
    });

    it('should return 400 if coordinates are invalid', async () => {
      mockRequest.query = {
        lat: 'invalid',
        lng: '108.22'
      };

      await getNearbyVehicles(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
