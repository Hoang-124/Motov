import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const JWT_SECRET = 'test-secret-for-vitest';
process.env.JWT_SECRET = JWT_SECRET;

// ── Helpers ───────────────────────────────────────────────────────────────────
const createMockRes = () => {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: any) => { res._body = body; return res; };
  return res;
};

const validToken = (roles: string[] = ['Customer']) =>
  jwt.sign({ id: 'user-id', email: 'test@example.com', roles }, JWT_SECRET);

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('authMiddleware', () => {
  it('should call next() for a valid Bearer token', () => {
    const req: any = { headers: { authorization: `Bearer ${validToken()}` } };
    const res = createMockRes();
    let called = false;
    authMiddleware(req, res, () => { called = true; });
    expect(called).toBe(true);
    expect(req.user.email).toBe('test@example.com');
  });

  it('should return 401 when no authorization header', () => {
    const req: any = { headers: {} };
    const res = createMockRes();
    authMiddleware(req, res, () => {});
    expect(res._status).toBe(401);
  });

  it('should return 401 for expired token', () => {
    const expiredToken = jwt.sign({ id: 'u', email: 'e@e.com', roles: ['Customer'] }, JWT_SECRET, { expiresIn: -1 });
    const req: any = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = createMockRes();
    authMiddleware(req, res, () => {});
    expect(res._status).toBe(401);
  });

  it('should return 401 for tampered token', () => {
    const req: any = { headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.tampered.signature' } };
    const res = createMockRes();
    authMiddleware(req, res, () => {});
    expect(res._status).toBe(401);
  });
});

describe('restrictTo()', () => {
  it('should call next() when user has the required role', () => {
    const req: any = { user: { id: 'x', email: 'x@x.com', roles: ['Admin'] } };
    const res = createMockRes();
    let called = false;
    restrictTo('Admin')(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it('should return 403 when user lacks the required role', () => {
    const req: any = { user: { id: 'x', email: 'x@x.com', roles: ['Customer'] } };
    const res = createMockRes();
    restrictTo('Admin')(req, res, () => {});
    expect(res._status).toBe(403);
  });

  it('should return 401 when req.user is not present', () => {
    const req: any = {};
    const res = createMockRes();
    restrictTo('Admin')(req, res, () => {});
    expect(res._status).toBe(401);
  });
});

describe('escapeRegex() from roleMapper utils', () => {
  it('should escape special regex characters', async () => {
    const { escapeRegex } = await import('../utils/roleMapper.js');
    const result = escapeRegex('a.b*c+d(e)f[g]h{i}j^k$l|m?n\\o');
    // Ensure no special chars remain unescaped
    expect(() => new RegExp(result)).not.toThrow();
    expect(result).toContain('\\.');
    expect(result).toContain('\\*');
  });
});
