import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { auth } from "../config/auth.config.js";

// =========================================================================
// 🛡️ Protect Middleware (Universal Backend Route Guard)
// =========================================================================
export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'The user belonging to this token no longer exists.' 
                });
            }

            req.user = user;
            return next();
        }

        // =========================================================================
        // =========================================================================
        const session = await auth.api.getSession({ headers: req.headers });

        if (session && session.user) {
            
            // 🔄 Fetch additional fields from google_users to ensure premium status is attached
            let isPremium = false;
            let subscriptionTier = "free";
            try {
                // better-auth's MongoDB adapter maps the logical `id` onto Mongo's `_id`,
                // and google_users carries no separate `id` field — so look it up both ways,
                // otherwise every Google member would silently be treated as a free user.
                const lookup = [{ id: session.user.id }];
                if (mongoose.Types.ObjectId.isValid(session.user.id)) {
                    lookup.push({ _id: new mongoose.Types.ObjectId(session.user.id) });
                }

                const dbUser = await mongoose.connection.db
                    .collection("google_users")
                    .findOne({ $or: lookup });

                if (dbUser) {
                    isPremium = dbUser.isPremium || false;
                    subscriptionTier = dbUser.subscriptionTier || "free";
                }
            } catch (e) {
                console.error("Failed to fetch premium status for Google user:", e);
            }

            req.user = {
                _id: session.user.id,
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role || 'user', 
                image: session.user.image,
                isPremium,
                subscriptionTier
            };

            return next();
        }

        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized! Please login first.' 
        });

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized! Token is invalid or expired.' 
        });
    }
};

// =========================================================================
// =========================================================================
export const isArtist = (req, res, next) => {
    if (req.user && (req.user.role === 'artist' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Specialized Creator Studio privileges required." 
    });
};

// =========================================================================
// =========================================================================
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Supreme Administrative clearance required." 
    });
};