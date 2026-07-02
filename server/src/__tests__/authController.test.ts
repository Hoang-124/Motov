import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { EmailVerificationToken } from '../models/EmailVerificationToken.js';

vi.mock('../utils/emailService.js', () => ({
  sendPasswordReset: vi.fn().mockResolvedValue('https://mock-ethereal-link.com'),
  sendEmailVerification: vi.fn().mockResolvedValue('https://mock-ethereal-link.com'),
  sendOwnerRequestNotification: vi.fn().mockResolvedValue(true)
}));

// ── Setup in-memory MongoDB ───────────────────────────────────────────────────
let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  } catch (err) {
    console.warn('Could not start MongoMemoryServer. Falling back to local MongoDB test database.');
    await mongoose.connect('mongodb://localhost:27017/Motov_test');
  }
  // Required for JWT_SECRET guard in authController
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
  await PasswordResetToken.deleteMany({});
  await EmailVerificationToken.deleteMany({});
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
    ({ register } = await import('../controllers/authController.js'));
  });

  it('should create a user and require email verification when email is provided', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(201);
    expect(res._body.success).toBe(true);
    expect(res._body.token).toBeUndefined();
    expect(res._body.needsVerification).toBe(true);
    expect(res._body.previewUrl).toBe('https://mock-ethereal-link.com');
    expect(res._body.user.role).toBe('customer');
    expect(res._body.user.status).toBe('Unverified');
  });

  it('should reject registration when email is missing', async () => {
    const req: any = { body: { username: 'noemailuser', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Email');
  });

  it('should reject duplicate email', async () => {
    await User.create({ username: 'u1', email: 'dup@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { username: 'u2', email: 'dup@example.com', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('should ignore admin/staff role from request body (SEC-4)', async () => {
    const req: any = { body: { username: 'hacker', email: 'hacker@example.com', password: 'Password123!', role: 'admin' } };
    const res = createMockRes();
    await register(req, res);
    // Should succeed but demote to customer
    expect(res._body.user.role).toBe('customer');
  });

  it('should allow owner role from request body', async () => {
    const req: any = { body: { username: 'owneruser', email: 'owner@example.com', password: 'Password123!', role: 'owner' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._body.user.role).toBe('owner');
  });

  it('should not create a user document in the database immediately upon registering with email (Option 2)', async () => {
    const req: any = { body: { username: 'pendinguser', email: 'pending@example.com', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(201);
    
    // User should NOT exist in database yet
    const dbUser = await User.findOne({ username: 'pendinguser' });
    expect(dbUser).toBeNull();

    // Verification token should exist and store pendingUserData
    const tokenRecord = await EmailVerificationToken.findOne({ 'pendingUserData.username': 'pendinguser' });
    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord!.pendingUserData!.email).toBe('pending@example.com');
  });

  it('should reject registration if email is already pending verification', async () => {
    // Create a pending verification token
    await EmailVerificationToken.create({
      token: 'some-pending-token',
      pendingUserData: {
        username: 'pendinguser2',
        email: 'pending2@example.com',
        passwordHash: 'hashedpassword',
        roles: ['Customer']
      },
      expiryTime: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false
    });

    const req: any = { body: { username: 'anothername', email: 'pending2@example.com', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('đang chờ xác minh');
  });

  it('should reject registration if username is too short', async () => {
    const req: any = { body: { username: 'ab', email: 'test@example.com', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Tên đăng nhập');
  });

  it('should reject registration if username contains special characters', async () => {
    const req: any = { body: { username: 'user name!', email: 'test@example.com', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('chỉ được chứa');
  });

  it('should reject registration if email is invalid', async () => {
    const req: any = { body: { username: 'testuser', email: 'invalidemail', password: 'Password123!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('email không đúng');
  });

  it('should reject registration if password is too short', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'Short1!' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Mật khẩu');
  });

  it('should reject registration if password lacks special character or uppercase/lowercase/number', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'Password123' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Mật khẩu phải chứa');
  });

  it('should reject registration if firstName contains numbers', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'Password123!', firstName: 'John123' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Tên không được');
  });

  it('should reject registration if lastName contains special characters', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'Password123!', lastName: 'Doe$' } };
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Họ không được');
  });

  it('should reject registration if phoneNumber is invalid', async () => {
    const req: any = { body: { username: 'testuser', email: 'test@example.com', password: 'Password123!', phoneNumber: '012345678' } }; // length 9
    const res = createMockRes();
    await register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Số điện thoại');
  });
});

describe('login()', () => {
  let login: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ login } = await import('../controllers/authController.js'));
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

  it('should reject unverified accounts', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    await User.create({ username: 'unverifieduser', email: 'unv@example.com', passwordHash, roles: ['Customer'], status: 'Unverified' });
    const req: any = { body: { email: 'unv@example.com', password: 'password123' } };
    const res = createMockRes();
    await login(req, res);
    expect(res._status).toBe(403);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('chưa được kích hoạt');
  });
});

describe('changePassword()', () => {
  let changePassword: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ changePassword } = await import('../controllers/authController.js'));
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
    ({ forgotPassword } = await import('../controllers/authController.js'));
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

  it('should reject forgotPassword request for Google-only accounts', async () => {
    await User.create({ username: 'guser', email: 'g@example.com', googleId: 'gid123', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { email: 'g@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Google');
  });

  it('should reject forgotPassword request for Google-linked accounts (with passwordHash)', async () => {
    await User.create({ username: 'guser2', email: 'g2@example.com', googleId: 'gid456', passwordHash: 'somehash', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { email: 'g2@example.com' } };
    const res = createMockRes();
    await forgotPassword(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toContain('Google');
  });
});

describe('resetPassword()', () => {
  let resetPassword: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ resetPassword } = await import('../controllers/authController.js'));
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
  let approveOwnerRequest: any;
  beforeAll(async () => {
    ({ becomeOwner, approveOwnerRequest } = await import('../controllers/authController.js'));
  });

  it('should request upgrade from Customer to Owner and then approve it', async () => {
    const user = await User.create({ username: 'newowner', email: 'newowner@example.com', roles: ['Customer'], status: 'Active', identityStatus: 'Verified' });
    const req: any = {
      user: { id: user._id.toString() },
      body: {
        bankName: 'Vietcombank',
        bankAccountNumber: '1234567890',
        bankAccountOwner: 'NGUYEN VAN A',
        ownerSignature: 'data:image/png;base64,mockSignature'
      }
    };
    const res = createMockRes();
    await becomeOwner(req, res);
    expect(res._status).toBe(200);
    expect(res._body.user.role).toBe('customer');
    expect(res._body.user.ownerRequestStatus).toBe('Pending');

    // Approve the request
    const approveReq: any = {
      user: { roles: ['Admin'] },
      params: { id: user._id.toString() }
    };
    const approveRes = createMockRes();
    await approveOwnerRequest(approveReq, approveRes);
    expect(approveRes._status).toBe(200);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser!.roles).toContain('Owner');
    expect(updatedUser!.ownerRequestStatus).toBe('Approved');
  });

  it('should reject if already an Owner (BUG-8)', async () => {
    const user = await User.create({ username: 'alreadyowner', email: 'alreadyowner@example.com', roles: ['Owner'], status: 'Active', identityStatus: 'Verified' });
    const req: any = { user: { id: user._id.toString() } };
    const res = createMockRes();
    await becomeOwner(req, res);
    expect(res._status).toBe(400);
  });
});

describe('resetPasswordPhone()', () => {
  let resetPasswordPhone: any;
  let bcrypt: any;
  beforeAll(async () => {
    ({ resetPasswordPhone } = await import('../controllers/authController.js'));
    bcrypt = (await import('bcryptjs')).default;
  });

  it('should reset password with a valid mock token', async () => {
    await User.create({ username: 'phoneuser1', phoneNumber: '0912345678', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { idToken: 'mock-token-0912345678', newPassword: 'newphonepassword123' } };
    const res = createMockRes();
    await resetPasswordPhone(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);

    const updatedUser = await User.findOne({ phoneNumber: '0912345678' });
    expect(updatedUser).not.toBeNull();
    const isMatch = await bcrypt.compare('newphonepassword123', updatedUser!.passwordHash);
    expect(isMatch).toBe(true);
  });

  it('should reset password with a mock token containing +84 when phone number in DB is 0...', async () => {
    await User.create({ username: 'phoneuser2', phoneNumber: '0987654321', roles: ['Customer'], status: 'Active' });
    const req: any = { body: { idToken: 'mock-token-+84987654321', newPassword: 'newphonepassword456' } };
    const res = createMockRes();
    await resetPasswordPhone(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);

    const updatedUser = await User.findOne({ phoneNumber: '0987654321' });
    expect(updatedUser).not.toBeNull();
    const isMatch = await bcrypt.compare('newphonepassword456', updatedUser!.passwordHash);
    expect(isMatch).toBe(true);
  });

  it('should reject if phone number does not exist', async () => {
    const req: any = { body: { idToken: 'mock-token-0000000000', newPassword: 'newphonepassword123' } };
    const res = createMockRes();
    await resetPasswordPhone(req, res);
    expect(res._status).toBe(404);
    expect(res._body.success).toBe(false);
  });

  it('should reject if password is shorter than 6 characters', async () => {
    const req: any = { body: { idToken: 'mock-token-0912345678', newPassword: '123' } };
    const res = createMockRes();
    await resetPasswordPhone(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });
});

describe('verifyEmail()', () => {
  let verifyEmail: any;
  beforeAll(async () => {
    ({ verifyEmail } = await import('../controllers/authController.js'));
  });

  it('should verify email successfully with a valid token', async () => {
    const user = await User.create({ username: 'verifytest', email: 'verify@example.com', roles: ['Customer'], status: 'Unverified' });
    const tokenRecord = await EmailVerificationToken.create({
      token: 'valid-verify-token',
      userId: user._id,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false
    });
    const req: any = { body: { token: 'valid-verify-token' } };
    const res = createMockRes();
    await verifyEmail(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser!.status).toBe('Active');

    const updatedToken = await EmailVerificationToken.findById(tokenRecord._id);
    expect(updatedToken!.isUsed).toBe(true);
  });

  it('should reject if no token provided', async () => {
    const req: any = { body: {} };
    const res = createMockRes();
    await verifyEmail(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('should reject invalid token', async () => {
    const req: any = { body: { token: 'nonexistent-token' } };
    const res = createMockRes();
    await verifyEmail(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('should reject an already-used token', async () => {
    const user = await User.create({ username: 'verifytest2', email: 'verify2@example.com', roles: ['Customer'], status: 'Unverified' });
    await EmailVerificationToken.create({
      token: 'used-verify-token',
      userId: user._id,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: true
    });
    const req: any = { body: { token: 'used-verify-token' } };
    const res = createMockRes();
    await verifyEmail(req, res);
    expect(res._status).toBe(400);
  });

  it('should reject an expired token', async () => {
    const user = await User.create({ username: 'verifytest3', email: 'verify3@example.com', roles: ['Customer'], status: 'Unverified' });
    await EmailVerificationToken.create({
      token: 'expired-verify-token',
      userId: user._id,
      expiryTime: new Date(Date.now() - 1000), // expired 1s ago
      isUsed: false
    });
    const req: any = { body: { token: 'expired-verify-token' } };
    const res = createMockRes();
    await verifyEmail(req, res);
    expect(res._status).toBe(400);
  });

  it('should successfully create and save user to database when verifying a token containing pendingUserData (Option 2)', async () => {
    const tokenRecord = await EmailVerificationToken.create({
      token: 'deferred-create-token',
      pendingUserData: {
        username: 'deferreduser',
        email: 'deferred@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Deferred',
        lastName: 'User',
        phoneNumber: '0123456789',
        roles: ['Customer']
      },
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false
    });

    const req: any = { body: { token: 'deferred-create-token' } };
    const res = createMockRes();
    await verifyEmail(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);

    // User should now be created and status should be Active
    const savedUser = await User.findOne({ username: 'deferreduser' });
    expect(savedUser).not.toBeNull();
    expect(savedUser!.status).toBe('Active');
    expect(savedUser!.email).toBe('deferred@example.com');
    expect(savedUser!.firstName).toBe('Deferred');
    expect(savedUser!.lastName).toBe('User');

    // Token should be marked as used
    const updatedToken = await EmailVerificationToken.findById(tokenRecord._id);
    expect(updatedToken!.isUsed).toBe(true);
  });
});

describe('checkVerificationStatus()', () => {
  let checkVerificationStatus: any;
  beforeAll(async () => {
    ({ checkVerificationStatus } = await import('../controllers/authController.js'));
  });

  it('should return 400 if email is missing in request query', async () => {
    const req: any = { query: {} };
    const res = createMockRes();
    await checkVerificationStatus(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('should return isVerified: false if user does not exist', async () => {
    const req: any = { query: { email: 'nonexistent@example.com' } };
    const res = createMockRes();
    await checkVerificationStatus(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.isVerified).toBe(false);
  });

  it('should return isVerified: false if user is unverified', async () => {
    await User.create({ username: 'checkunverified', email: 'unvcheck@example.com', roles: ['Customer'], status: 'Unverified' });
    const req: any = { query: { email: 'unvcheck@example.com' } };
    const res = createMockRes();
    await checkVerificationStatus(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.isVerified).toBe(false);
  });

  it('should return isVerified: true if user is verified and active', async () => {
    await User.create({ username: 'checkactive', email: 'activecheck@example.com', roles: ['Customer'], status: 'Active' });
    const req: any = { query: { email: 'activecheck@example.com' } };
    const res = createMockRes();
    await checkVerificationStatus(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.isVerified).toBe(true);
  });
});

