import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    // Treat 'cashier' and 'staff' as interchangeable for backward compat
    const effectiveRole = userRole === 'cashier' ? 'staff' : userRole;
    const expandedRoles = roles.flatMap(r => r === 'staff' ? ['staff', 'cashier'] : [r]);
    if (!expandedRoles.includes(effectiveRole) && !expandedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied for your role' });
    }
    next();
  };
};