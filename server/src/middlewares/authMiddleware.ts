import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

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
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
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
    console.log('[DEBUG AUTH] user roles:', req.user.roles, 'normalizedAllowed:', normalizedAllowed);
    const hasRole = req.user.roles.some(role => normalizedAllowed.includes(role.toLowerCase()));
    if (!hasRole) {
      console.log('[DEBUG AUTH] Access denied for user roles:', req.user.roles);
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này' });
    }

    next();
  };
};
