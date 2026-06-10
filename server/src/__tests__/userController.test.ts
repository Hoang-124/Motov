import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// ── Helper ────────────────────────────────────────────────────────────────────
const createMockRes = () => {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: any) => { res._body = body; return res; };
  return res;
};

const makeAdminReq = (extras = {}) => ({ user: { id: 'admin-id', roles: ['Admin'] }, ...extras });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('getAllUsers()', () => {
  let getAllUsers: any;
  beforeAll(async () => {
    ({ getAllUsers } = await import('../controllers/userController.js'));
  });

  afterEach(async () => { await User.deleteMany({}); });

  it('should return all users', async () => {
    await User.create({ username: 'u1', email: 'u1@example.com', roles: ['Customer'], status: 'Active' });
    await User.create({ username: 'u2', email: 'u2@example.com', roles: ['Owner'], status: 'Active' });
    const req: any = { user: { id: 'a', roles: ['Admin'] }, query: {} };
    const res = createMockRes();
    await getAllUsers(req, res);
    expect(res._status).toBe(200);
    expect(res._body.users.length).toBe(2);
  });

  it('should filter by role', async () => {
    await User.create({ username: 'ua', email: 'ua@example.com', roles: ['Admin'], status: 'Active' });
    await User.create({ username: 'uc', email: 'uc@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { user: { id: 'x', roles: ['Admin'] }, query: { role: 'customer' } };
    const res = createMockRes();
    await getAllUsers(req, res);
    expect(res._body.users.length).toBe(1);
    expect(res._body.users[0].role).toBe('customer');
  });

  it('should safely handle ReDoS-style regex search (BUG-9)', async () => {
    // This should NOT hang
    const req: any = { user: { id: 'x', roles: ['Admin'] }, query: { search: 'a+a+a+a+a+b' } };
    const res = createMockRes();
    await getAllUsers(req, res);
    expect(res._status).toBe(200); // should return, not hang
  });
});

describe('banUser() / unbanUser()', () => {
  let banUser: any;
  let unbanUser: any;

  beforeAll(async () => {
    ({ banUser, unbanUser } = await import('../controllers/userController.js'));
  });

  it('should ban a user', async () => {
    const user = await User.create({ username: 'victim', email: 'v@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { user: { id: 'admin-id' }, params: { id: user._id.toString() } };
    const res = createMockRes();
    await banUser(req, res);
    expect(res._status).toBe(200);
    expect(res._body.user.status).toBe('Suspended');
  });

  it('should prevent self-ban', async () => {
    const req: any = { user: { id: 'self-id' }, params: { id: 'self-id' } };
    const res = createMockRes();
    await banUser(req, res);
    expect(res._status).toBe(400);
  });

  it('should unban a suspended user', async () => {
    const user = await User.create({ username: 'sus', email: 's@example.com', roles: ['Customer'], status: 'Suspended' });
    const req: any = { user: { id: 'admin-id' }, params: { id: user._id.toString() } };
    const res = createMockRes();
    await unbanUser(req, res);
    expect(res._status).toBe(200);
    expect(res._body.user.status).toBe('Active');
  });
});

describe('updateUser() — self-protection checks', () => {
  let updateUser: any;
  beforeAll(async () => {
    ({ updateUser } = await import('../controllers/userController.js'));
  });

  it('should prevent admin from self-banning via updateUser', async () => {
    const user = await User.create({ username: 'selfadmin', email: 'sa@example.com', roles: ['Admin'], status: 'Active' });
    const id = user._id.toString();
    const req: any = {
      user: { id },
      params: { id },
      body: { status: 'Suspended' }
    };
    const res = createMockRes();
    await updateUser(req, res);
    expect(res._status).toBe(400);
  });
});
