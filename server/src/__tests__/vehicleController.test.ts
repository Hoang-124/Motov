import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { 
  getAllVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  getOwnerVehicles,
  updateVehicleStatus
} from '../controllers/vehicleController.js';

describe('Vehicle Controller Tests', () => {
  let testVehicleId: string;
  let testUserId: string;
  let mockRequest: any;
  let mockResponse: any;

  beforeAll(async () => {
    // Connect to test database
    const mongoUrl = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/Motov-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl);
    }

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
        category: 'Sport',
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
        category: 'Sport',
        transmissionType: 'Manual',
        rentalPrice: 120000
      });
      await vehicle1.save();

      // Try to create duplicate
      mockRequest.body = {
        vehicleModel: 'Honda CB300R',
        licensePlate: '30B98765', // Duplicate
        category: 'Sport',
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
      mockRequest.query = { category: 'Sport' };

      await getAllVehicles(mockRequest, mockResponse);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      callArgs.data.forEach((vehicle: any) => {
        expect(vehicle.category).toBe('Sport');
      });
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
          category: 'Sport',
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
          category: 'Sport',
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
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle with valid ID', async () => {
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Delete Test',
        licensePlate: 'DELETE001',
        category: 'Sport',
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

      // Verify vehicle is deleted
      const deletedVehicle = await Vehicle.findById(vehicleIdToDelete);
      expect(deletedVehicle).toBeNull();
    });
  });

  describe('updateVehicleStatus', () => {
    it('should update vehicle status to valid status', async () => {
      const vehicle = new Vehicle({
        ownerId: testUserId,
        vehicleModel: 'Status Test',
        licensePlate: 'STATUS001',
        category: 'Sport',
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
        category: 'Sport',
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
});
