import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

const FILE = 'middleware/auth.js';

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid Authorization header', 401, FILE);
    }
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    if (error.isAppError) return next(error);
    next(new AppError('Invalid or expired token', 401, FILE));
  }
}
