import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// ==========================================
// 🛡️ Protect Middleware (Backend Route Guard)
// ==========================================
export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized! Please login first.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'The user belonging to this token no longer exists.' 
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized! Token is invalid or expired.' 
        });
    }
};