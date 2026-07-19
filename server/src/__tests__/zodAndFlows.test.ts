import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Category } from '../models/Category.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { registerSchema, loginSchema, createBookingSchema } from '../validators/schemas.js';

let mongod: MongoMemoryServer | null = null;
const JWT_SECRET = 'test-jwt-secret';
const REFRESH_TOKEN_SECRET = 'test-refresh-secret';

vi.mock('../utils/emailService.js', () => ({
  sendPasswordReset: vi.fn().mockResolvedValue('https://mock-ethereal-link.com'),
  sendEmailVerification: vi.fn().mockResolvedValue('https://mock-ethereal-link.com'),
  sendOwnerRequestNotification: vi.fn().mockResolvedValue(true),
  sendBookingCreatedEmail: vi.fn().mockResolvedValue(true),
  sendNewBookingAlertToOwnerEmail: vi.fn().mockResolvedValue(true),
  sendBookingConfirmedEmail: vi.fn().mockResolvedValue(true),
  sendBookingCancelledEmail: vi.fn().mockResolvedValue(true)
}));

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  } catch (err) {
    await mongoose.connect('mongodb://localhost:27017/Motov_test');
  }
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;
  process.env.VNP_TMNCODE = 'TEST_TMN';
  process.env.VNP_HASHSECRET = 'TEST_SECRET';
  process.env.VNP_RETURNURL = 'http://localhost:3000/vnpay-return';
  process.env.MONGODB_URI = mongod ? mongod.getUri() : 'mongodb://localhost:27017/Motov_test';
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
  await Booking.deleteMany({});
  await Vehicle.deleteMany({});
});

describe('Zod Validation Middleware', () => {
  it('should validate and pass correct register data', async () => {
    const req: any = {
      body: {
        username: 'validuser',
        email: 'user@test.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '0987654321'
      }
    };
    const res: any = {
      status: () => res,
      json: () => res
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = validateRequest(registerSchema);
    await middleware(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it('should reject invalid register data with 400', async () => {
    const req: any = {
      body: {
        username: 'sh',
        email: 'invalid-email',
        password: '123'
      }
    };
    let statusSet = 200;
    const jsonBody: any = {};
    const res: any = {
      status: (code: number) => { statusSet = code; return res; },
      json: (body: any) => { Object.assign(jsonBody, body); return res; }
    };
    const next = () => {};

    const middleware = validateRequest(registerSchema);
    await middleware(req, res, next);
    expect(statusSet).toBe(400);
    expect(jsonBody.success).toBe(false);
    expect(jsonBody.error).toBeDefined();
  });
});

describe('Refresh Token Flow (Hashed)', () => {
  let login: any;
  let refreshAccessToken: any;
  beforeAll(async () => {
    ({ login, refreshAccessToken } = await import('../controllers/authController.js'));
  });

  it('should hash refresh token and verify on rotation', async () => {
    const userPassword = 'Password123!';
    const user = await User.create({
      username: 'refuser',
      email: 'ref@test.com',
      passwordHash: await import('bcryptjs').then(b => b.default.hashSync(userPassword, 10)),
      firstName: 'Ref',
      lastName: 'User',
      roles: ['Customer'],
      status: 'Active'
    });

    const loginReq: any = { body: { email: 'ref@test.com', password: userPassword } };
    const loginRes: any = {
      status: () => loginRes,
      json: (body: any) => { loginRes.body = body; return loginRes; }
    };

    await login(loginReq, loginRes);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.refreshToken).toBeDefined();

    const storedUser = await User.findById(user._id);
    const expectedHash = crypto.createHash('sha256').update(loginRes.body.refreshToken).digest('hex');
    expect(storedUser?.refreshToken).toBe(expectedHash);

    const refreshReq: any = { body: { refreshToken: loginRes.body.refreshToken } };
    const refreshRes: any = {
      status: () => refreshRes,
      json: (body: any) => { refreshRes.body = body; return refreshRes; }
    };

    await refreshAccessToken(refreshReq, refreshRes);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.token).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();
  });
});

describe('Booking Flow Integration', () => {
  let createBooking: any;
  let updateBooking: any;
  beforeAll(async () => {
    ({ createBooking, updateBooking } = await import('../controllers/bookingController.js'));
  });

  it('should complete a mock booking lifecycle (create -> confirm -> complete)', async () => {
    const customer = await User.create({
      username: 'booker',
      email: 'booker@test.com',
      roles: ['Customer'],
      status: 'Active',
      identityStatus: 'Verified'
    });

    const owner = await User.create({
      username: 'owner',
      email: 'owner@test.com',
      roles: ['Owner'],
      status: 'Active'
    });

    const category = await Category.create({ name: 'Xe Số', slug: 'xe-so' });

    const vehicle = await Vehicle.create({
      ownerId: owner._id,
      vehicleModel: 'Honda Wave',
      licensePlate: '43-C1 12345',
      rentalPrice: 150000,
      status: 'Available',
      location: { type: 'Point', coordinates: [108.2, 16.0] },
      category: category._id,
      transmissionType: 'Manual',
      imageUrls: ['https://example.com/image.jpg']
    });

    // 1. Create Booking
    const reqCreate: any = {
      user: { id: customer._id, email: customer.email, roles: ['Customer'] },
      body: {
        vehicleId: vehicle._id.toString(),
        pickupDateTime: new Date(Date.now() + 86400000).toISOString(),
        returnDateTime: new Date(Date.now() + 172800000).toISOString(),
        pickupLocation: { address: 'Đà Nẵng' },
        returnLocation: { address: 'Đà Nẵng' }
      }
    };
    const resCreate: any = {
      status: (code: number) => { resCreate.status = code; return resCreate; },
      json: (body: any) => { resCreate.body = body; return resCreate; }
    };
    await createBooking(reqCreate, resCreate);
    expect(resCreate.body).toEqual(expect.objectContaining({ success: true }));
    const bookingId = resCreate.body.booking.id;

    // 2. Confirm Booking (Owner/Staff)
    const reqConfirm: any = {
      user: { id: owner._id.toString(), email: owner.email, roles: ['Owner'] },
      params: { id: bookingId.toString() },
      body: { status: 'Confirmed' }
    };
    const resConfirm: any = {
      status: (code: number) => { resConfirm.status = code; return resConfirm; },
      json: (body: any) => { resConfirm.body = body; return resConfirm; }
    };
    await updateBooking(reqConfirm, resConfirm);
    expect(resConfirm.body).toEqual(expect.objectContaining({ success: true }));

    // 2.5 Start Booking (Ongoing)
    const reqOngoing: any = {
      user: { id: owner._id.toString(), email: owner.email, roles: ['Owner'] },
      params: { id: bookingId.toString() },
      body: { status: 'Ongoing' }
    };
    const resOngoing: any = {
      status: (code: number) => { resOngoing.status = code; return resOngoing; },
      json: (body: any) => { resOngoing.body = body; return resOngoing; }
    };
    await updateBooking(reqOngoing, resOngoing);
    expect(resOngoing.body).toEqual(expect.objectContaining({ success: true }));

    // 3. Complete Booking
    const reqComplete: any = {
      user: { id: owner._id.toString(), email: owner.email, roles: ['Owner'] },
      params: { id: bookingId.toString() },
      body: { status: 'Completed' }
    };
    const resComplete: any = {
      status: (code: number) => { resComplete.status = code; return resComplete; },
      json: (body: any) => { resComplete.body = body; return resComplete; }
    };
    await updateBooking(reqComplete, resComplete);
    expect(resComplete.body).toEqual(expect.objectContaining({ success: true }));
  });
});
