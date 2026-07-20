import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import '../loadEnv.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không tìm thấy token xác thực' });
  }
  try {
    // FIX [SEC-1]: Use env variable only — authController already guards against missing JWT_SECRET at startup
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles && decoded.roles.length > 0 ? decoded.roles : ['Customer'],
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const restrictTo = (...allowedRoles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập trước khi truy cập' });
    }

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    const hasRole = req.user.roles.some(role => normalizedAllowed.includes(role.toLowerCase()));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này' });
    }

    next();
  };
};

// SEC-FIX: CSRF protection via custom header check
// Browsers won't send custom headers in cross-origin simple requests (forms),
// so requiring this header blocks CSRF attacks without needing a token
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  // Only check state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest' ||
<<<<<<< HEAD
                            req.headers['content-type']?.includes('application/json');
=======
                            req.headers['content-type']?.includes('application/json') ||
                            req.headers['authorization'];
>>>>>>> ada1fbe7cad589a365abd150c933404cda5023a6
    if (!hasCustomHeader) {
      return res.status(403).json({ success: false, message: 'Forbidden: missing required headers' });
    }
  }
  next();
};
