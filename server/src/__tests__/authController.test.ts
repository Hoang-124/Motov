import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models/User.js';
import { PasswordResetToken } from '../../models/PasswordResetToken.js';

// ── Setup in-memory MongoDB ───────────────────────────────────────────────────
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Required for JWT_SECRET guard in authController
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await PasswordResetToken.deleteMany({});
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const createMockRes = () => {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: any) => { res._body = body; return res; };
  return res;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('register()', () => {
  let register: any;
  beforeAll(async () => {
    ({ register } = await import('../../controllers/authController.js'));
  });

  it('should create a user and return a JWT token', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'password123' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(201);
    expect(res._body.success).toBe(true);
    expect(res._body.token).toBeDefined();
    expect(res._body.user.role).toBe('customer');
  });

  it('should reject duplicate email', async () => {
    await User.create({ username: 'u1', email: 'dup@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { username: 'u2', email: 'dup@example.com', password: 'password123' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('should ignore admin/staff role from request body (SEC-4)', async () => {
    const req: any = { body: { username: 'hacker', email: 'hacker@example.com', password: 'password123', role: 'admin' } };
    const res = createMockRes();
    await register(req, res);
    // Should succeed but demote to customer
    expect(res._body.user.role).toBe('customer');
  });

  it('should allow owner role from request body', async () => {
    const req: any = { body: { username: 'owneruser', email: 'owner@example.com', password: 'password123', role: 'owner' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._body.user.role).toBe('owner');
  });

  it('should return 400 when required fields are missing', async () => {
    const req: any = { body: { username: 'incomplete' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
  });
});

describe('login()', () => {
  let login: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ login } = await import('../../controllers/authController.js'));
    bcrypt = (await import('bcryptjs')).default;
  });

  it('should return JWT token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    await User.create({ username: 'logintest', email: 'login@example.com', passwordHash, roles: ['Customer'], status: 'Active' });
    const req: any = { body: { email: 'login@example.com', password: 'password123' } };
    const res = createMockRes();
    await login(req, res);
    expect(res._status).toBe(200);
    expect(res._body.token).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct', 10);
    await User.create({ username: 'wrongpass', email: 'wp@example.com', passwordHash, roles: ['Customer'], status: 'Active' });
    const req: any = { body: { email: 'wp@example.com', password: 'wrong' } };
    const res = createMockRes();
    await login(req, res);
    expect(res._status).toBe(400);
  });

  it('should reject suspended accounts', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    await User.create({ username: 'suspended', email: 'sus@example.com', passwordHash, roles: ['Customer'], status: 'Suspended' });
    const req: any = { body: { email: 'sus@example.com', password: 'password123' } };
    const res = createMockRes();
    await login(req, res);
    expect(res._status).toBe(403);
  });

  it('should reject google-only accounts trying to use password login', async () => {
    await User.create({ username: 'guser', email: 'g@example.com', googleId: 'gid123', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { email: 'g@example.com', password: 'anypassword' } };
    const res = createMockRes();
    await login(req, res);
    expect(res._status).toBe(400);
    expect(res._body.message).toContain('Google');
  });
});

describe('changePassword()', () => {
  let changePassword: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ changePassword } = await import('../../controllers/authController.js'));
    bcrypt = (await import('bcryptjs')).default;
  });

  it('should change password successfully', async () => {
    const passwordHash = await bcrypt.hash('oldpass', 10);
    const user = await User.create({ username: 'changepw', email: 'cpw@example.com', passwordHash, roles: ['Customer'], status: 'Active' });
    const req: any = { user: { id: user._id.toString() }, body: { oldPassword: 'oldpass', newPassword: 'newpass123' } };
    const res = createMockRes();
    await changePassword(req, res);
    expect(res._status).toBe(200);
  });

  it('should reject wrong old password', async () => {
    const passwordHash = await bcrypt.hash('correctold', 10);
    const user = await User.create({ username: 'cpw2', email: 'cpw2@example.com', passwordHash, roles: ['Customer'], status: 'Active' });
    const req: any = { user: { id: user._id.toString() }, body: { oldPassword: 'wrong', newPassword: 'newpass123' } };
    const res = createMockRes();
    await changePassword(req, res);
    expect(res._status).toBe(400);
  });

  it('should reject new password shorter than 6 characters', async () => {
    const passwordHash = await bcrypt.hash('oldpass', 10);
    const user = await User.create({ username: 'cpw3', email: 'cpw3@example.com', passwordHash, roles: ['Customer'], status: 'Active' });
    const req: any = { user: { id: user._id.toString() }, body: { oldPassword: 'oldpass', newPassword: '123' } };
    const res = createMockRes();
    await changePassword(req, res);
    expect(res._status).toBe(400);
  });
});

describe('forgotPassword()', () => {
  let forgotPassword: any;
  beforeAll(async () => {
    ({ forgotPassword } = await import('../../controllers/authController.js'));
  });

  it('should always return 200 regardless of email existence (anti-enumeration)', async () => {
    const req: any = { body: { email: 'nonexistent@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  it('should create a PasswordResetToken for existing email', async () => {
    await User.create({ username: 'forgetme', email: 'forget@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { email: 'forget@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);
    const token = await PasswordResetToken.findOne({});
    expect(token).not.toBeNull();
    expect(token!.isUsed).toBe(false);
  });
});

describe('resetPassword()', () => {
  let resetPassword: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ resetPassword } = await import('../../controllers/authController.js'));
    bcrypt = (await import('bcryptjs')).default;
  });

  it('should reset password with a valid token', async () => {
    const user = await User.create({ username: 'resetme', email: 'reset@example.com', roles: ['Customer'], status: 'Active' });
    const tokenRecord = await PasswordResetToken.create({
      token: 'valid-token-abc',
      userId: user._id,
      expiryTime: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false
    });
    const req: any = { body: { token: 'valid-token-abc', newPassword: 'newpassword123' } };
    const res = createMockRes();
    await resetPassword(req, res);
    expect(res._status).toBe(200);
    // Token should be marked as used
    const updated = await PasswordResetToken.findById(tokenRecord._id);
    expect(updated!.isUsed).toBe(true);
  });

  it('should reject an already-used token', async () => {
    const user = await User.create({ username: 'resetme2', email: 'reset2@example.com', roles: ['Customer'], status: 'Active' });
    await PasswordResetToken.create({
      token: 'used-token',
      userId: user._id,
      expiryTime: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: true
    });
    const req: any = { body: { token: 'used-token', newPassword: 'newpassword123' } };
    const res = createMockRes();
    await resetPassword(req, res);
    expect(res._status).toBe(400);
  });

  it('should reject an expired token', async () => {
    const user = await User.create({ username: 'resetme3', email: 'reset3@example.com', roles: ['Customer'], status: 'Active' });
    await PasswordResetToken.create({
      token: 'expired-token',
      userId: user._id,
      expiryTime: new Date(Date.now() - 1000), // already expired
      isUsed: false
    });
    const req: any = { body: { token: 'expired-token', newPassword: 'newpassword123' } };
    const res = createMockRes();
    await resetPassword(req, res);
    expect(res._status).toBe(400);
  });
});

describe('becomeOwner()', () => {
  let becomeOwner: any;
  beforeAll(async () => {
    ({ becomeOwner } = await import('../../controllers/authController.js'));
  });

  it('should upgrade a Customer to Owner', async () => {
    const user = await User.create({ username: 'newowner', email: 'newowner@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { user: { id: user._id.toString() } };
    const res = createMockRes();
    await becomeOwner(req, res);
    expect(res._status).toBe(200);
    expect(res._body.user.role).toBe('owner');
  });

  it('should reject if already an Owner (BUG-8)', async () => {
    const user = await User.create({ username: 'alreadyowner', email: 'alreadyowner@example.com', roles: ['Owner'], status: 'Active' });
    const req: any = { user: { id: user._id.toString() } };
    const res = createMockRes();
    await becomeOwner(req, res);
    expect(res._status).toBe(400);
  });
});
