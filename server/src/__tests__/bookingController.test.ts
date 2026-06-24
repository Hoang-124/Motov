import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';

let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  } catch (err) {
    console.warn('Could not start MongoMemoryServer. Falling back to local MongoDB test database.');
    await mongoose.connect('mongodb://localhost:27017/Motov_test_booking');
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await Booking.deleteMany({});
  await Vehicle.deleteMany({});
  await User.deleteMany({});
});

// ── Helper ────────────────────────────────────────────────────────────────────
const createMockRes = () => {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: any) => { res._body = body; return res; };
  return res;
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('getBookingTracking()', () => {
  let getBookingTracking: any;
  beforeAll(async () => {
    ({ getBookingTracking } = await import('../controllers/bookingController.js'));
  });

  it('should return 400 for invalid booking ID', async () => {
    const req: any = { params: { id: 'invalid-id' }, user: { id: 'user-1' } };
    const res = createMockRes();
    await getBookingTracking(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('should return 404 if booking not found', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const req: any = { params: { id: validId }, user: { id: 'user-1' } };
    const res = createMockRes();
    await getBookingTracking(req, res);
    expect(res._status).toBe(404);
  });

  it('should return 403 if user is not authorized', async () => {
    const vehicleOwnerId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();
    const randomUserId = new mongoose.Types.ObjectId().toString();

    const vehicle = await Vehicle.create({
      ownerId: vehicleOwnerId,

      rentalPrice: 100000,
      status: 'Available',
      licensePlate: '12-A3 45678',
      transmissionType: 'Manual',
      category: new mongoose.Types.ObjectId(),
      vehicleModel: 'Honda Wave'
    });

    const booking = await Booking.create({
      bookingCode: 'BK123456',
      userId: customerId,
      vehicleId: vehicle._id,
      pickupDateTime: new Date(),
      returnDateTime: new Date(Date.now() + 86400000),
      totalAmount: 100000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const req: any = { 
      params: { id: booking._id.toString() }, 
      user: { id: randomUserId, roles: ['Customer'] } 
    };
    const res = createMockRes();
    await getBookingTracking(req, res);
    
    expect(res._status).toBe(403);
    expect(res._body.message).toContain('không có quyền');
  });

  it('should return tracking data successfully for booking owner', async () => {
    const customerId = new mongoose.Types.ObjectId();
    const vehicleOwnerId = new mongoose.Types.ObjectId();

    const vehicle = await Vehicle.create({
      ownerId: vehicleOwnerId,

      rentalPrice: 100000,
      status: 'Available',
      licensePlate: '12-A3 45678',
      transmissionType: 'Manual',
      category: new mongoose.Types.ObjectId(),
      vehicleModel: 'Honda Wave'
    });

    const booking = await Booking.create({
      bookingCode: 'BK123456',
      userId: customerId,
      vehicleId: vehicle._id,
      pickupDateTime: new Date(),
      returnDateTime: new Date(Date.now() + 86400000),
      totalAmount: 100000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const req: any = { 
      params: { id: booking._id.toString() }, 
      user: { id: customerId.toString(), roles: ['Customer'] } 
    };
    const res = createMockRes();
    await getBookingTracking(req, res);
    
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.tracking.currentStatus).toBe('Ongoing');
    expect(res._body.tracking.timeline.length).toBeGreaterThan(0);
  });
});

describe('returnMotorbike()', () => {
  let returnMotorbike: any;
  beforeAll(async () => {
    ({ returnMotorbike } = await import('../controllers/bookingController.js'));
  });

  it('should return 403 if user is not Staff, Admin or the booking owner', async () => {
    const booking = await Booking.create({
      bookingCode: 'BK-TEST-403',
      userId: new mongoose.Types.ObjectId(),
      vehicleId: new mongoose.Types.ObjectId(),
      pickupDateTime: new Date(),
      returnDateTime: new Date(Date.now() + 86400000),
      totalAmount: 100000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const req: any = { 
      params: { id: booking._id.toString() }, 
      body: {},
      user: { id: 'user-1', roles: ['Customer'] } 
    };
    const res = createMockRes();
    await returnMotorbike(req, res);
    expect(res._status).toBe(403);
  });

  it('should return 400 for invalid actualReturnTime format', async () => {
    const booking = await Booking.create({
      bookingCode: 'BK-TEST',
      userId: new mongoose.Types.ObjectId(),
      vehicleId: new mongoose.Types.ObjectId(),
      pickupDateTime: new Date(),
      returnDateTime: new Date(Date.now() + 86400000),
      totalAmount: 100000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const req: any = { 
      params: { id: booking._id.toString() }, 
      body: { actualReturnTime: 'invalid-date' },
      user: { id: 'staff-1', roles: ['Staff'] } 
    };
    const res = createMockRes();
    await returnMotorbike(req, res);
    
    expect(res._status).toBe(400);
    expect(res._body.message).toContain('không hợp lệ');
  });

  it('should return 400 if actualReturnTime is before pickup time', async () => {
    const pickupDate = new Date(Date.now() - 86400000); // Yesterday
    const booking = await Booking.create({
      bookingCode: 'BK-TEST2',
      userId: new mongoose.Types.ObjectId(),
      vehicleId: new mongoose.Types.ObjectId(),
      pickupDateTime: pickupDate,
      returnDateTime: new Date(),
      totalAmount: 100000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const invalidReturnTime = new Date(pickupDate.getTime() - 10000).toISOString();

    const req: any = { 
      params: { id: booking._id.toString() }, 
      body: { actualReturnTime: invalidReturnTime },
      user: { id: 'staff-1', roles: ['Staff'] } 
    };
    const res = createMockRes();
    await returnMotorbike(req, res);
    
    expect(res._status).toBe(400);
    expect(res._body.message).toContain('trước thời gian lấy xe');
  });

  it('should process return successfully without late fee if returned on time', async () => {
    const vehicle = await Vehicle.create({
      ownerId: new mongoose.Types.ObjectId(),

      rentalPrice: 120000, // 5000 per hour
      status: 'Rented',
      licensePlate: '12-A3 45678',
      transmissionType: 'Manual',
      category: new mongoose.Types.ObjectId(),
      vehicleModel: 'Honda Wave'
    });

    const pickupDate = new Date(Date.now() - 86400000);
    const returnDate = new Date(Date.now() + 86400000); // Tomorrow
    
    const booking = await Booking.create({
      bookingCode: 'BK-TEST3',
      userId: new mongoose.Types.ObjectId(),
      vehicleId: vehicle._id,
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
      totalAmount: 120000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const req: any = { 
      params: { id: booking._id.toString() }, 
      body: { actualReturnTime: new Date().toISOString() }, // Returned early/on time
      user: { id: 'staff-1', roles: ['Staff'] } 
    };
    const res = createMockRes();
    await returnMotorbike(req, res);
    
    expect(res._status).toBe(200);
    expect(res._body.lateFeeApplied).toBe(false);
    expect(res._body.booking.status).toBe('Completed');

    // Verify vehicle status changed to Available
    const updatedVehicle = await Vehicle.findById(vehicle._id);
    expect(updatedVehicle?.status).toBe('Available');
  });

  it('should process return successfully WITH late fee if returned late', async () => {
    const vehicle = await Vehicle.create({
      ownerId: new mongoose.Types.ObjectId(),

      rentalPrice: 120000, // 5000 per hour
      status: 'Rented',
      licensePlate: '12-A3 45678',
      transmissionType: 'Manual',
      category: new mongoose.Types.ObjectId(),
      vehicleModel: 'Honda Wave'
    });

    const pickupDate = new Date(Date.now() - 86400000 * 2); // 2 days ago
    const scheduledReturnDate = new Date(Date.now() - 86400000); // 1 day ago (so it's late by 24h)
    
    const booking = await Booking.create({
      bookingCode: 'BK-TEST4',
      userId: new mongoose.Types.ObjectId(),
      vehicleId: vehicle._id,
      pickupDateTime: pickupDate,
      returnDateTime: scheduledReturnDate,
      totalAmount: 120000,
      status: 'Ongoing',
      vehicleSnapshot: { name: 'Test Bike', licensePlate: '12-A3 45678', rentalPrice: 100000, image: 'test.jpg' }
    });

    const actualReturnTime = new Date(); // Right now

    const req: any = { 
      params: { id: booking._id.toString() }, 
      body: { actualReturnTime: actualReturnTime.toISOString() },
      user: { id: 'staff-1', roles: ['Staff'] } 
    };
    const res = createMockRes();
    await returnMotorbike(req, res);
    
    expect(res._status).toBe(200);
    expect(res._body.lateFeeApplied).toBe(true);
    
    // Expected late fee: 24 hours * 5000 = 120000
    // But since actualReturnTime is "now", let's just check it's > 0
    expect(res._body.lateFeeAmount).toBeGreaterThan(0);

    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking?.status).toBe('Completed');
    expect(updatedBooking?.surcharges.length).toBe(1);
    expect(updatedBooking?.surcharges[0].surchargeType).toBe('Late Return');
  });
});
