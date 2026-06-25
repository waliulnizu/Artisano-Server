import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { auth } from "../config/auth.config.js"; // 👑 ADD: Better-Auth এর কোর কনফিগ ফাইল ইম্পোর্ট

// =========================================================================
// 🛡️ Protect Middleware (Universal Backend Route Guard)
// =========================================================================
export const protect = async (req, res, next) => {
    try {
        let token;

        // ১. ট্র্যাডিশনাল ইমেইল-পাসওয়ার্ড লগইনের কুকি চেক
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // 👑 [লজিক ক্যাসকেড ১]: যদি ওল্ড JWT টোকেন পাওয়া যায়, তবে প্রথাগত উপায়ে ভেরিফাই করো
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'The user belonging to this token no longer exists.' 
                });
            }

            req.user = user; // ওল্ড ইউজার অবজেক্ট রিকোয়েস্টে সেট
            return next(); // সাকসেস সেশন, পরের কন্ট্রোলারে পাস
        }

        // =========================================================================
        // 👑 UPDATE & ADD: Better-Auth (Google OAuth) সেশন ইন্টিগ্রেশন ইঞ্জিন
        // =========================================================================
        // 🧠 Developer Thought Process: যদি ওপরে ওল্ড টোকেন না মেলে, তার মানে ইউজার গুগল দিয়ে এসেছে।
        // Better-Auth এর অফিশিয়াল 'api.getSession' মেথড ব্রাউজারের ইনকামিং হেডার/কুকি এনালাইসিস করে 
        // ডাটাবেস থেকে রিয়েল-টাইম সেশন অবজেক্ট এবং ইউজারের ডাইনামিক প্রোফাইল টেনে বের করে আনে।
        const session = await auth.api.getSession({ headers: req.headers });

        if (session && session.user) {
            
            // 🔄 ডাটা সিঙ্ক্রোনাইজেশন নোড:
            // Better-Auth এর ডাটাবেস ইউজার অবজেক্টের ফরম্যাট আপনার ওল্ড মডেলের সাথে হুবহু মিলানোর জন্য 
            // এবং নিচের 'isArtist' ও 'isAdmin' গার্ডে যেন কোনো ক্র্যাশ না হয়, তাই ম্যাপ করে দেওয়া হলো।
            req.user = {
                _id: session.user.id,
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role || 'user', // ডিফল্ট রোল অ্যাসাইনমেন্ট ভেরিফিকেশন
                image: session.user.image
            };

            return next(); // সাকসেস সেশন, ৪০১ এরর বাইপাস করে পরের কন্ট্রোলারে পাস 🚀
        }

        // যদি কোনো সেশনই মেমরিতে না মেলে, তবেই কেবল ব্লক করবে
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
// 🔒 ১. আর্টিস্ট রোল ভেরিফিকেশন মিডলওয়্যার (IsArtist Guard)
// =========================================================================
export const isArtist = (req, res, next) => {
    // 🧠 ওনারশিপ চেক: কাস্টম এবং Better-Auth—উভয় ইউজারের রোল যদি artist বা admin হয়, তবেই অনুমতি পাবে
    if (req.user && (req.user.role === 'artist' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Specialized Creator Studio privileges required." 
    });
};

// =========================================================================
// 🔒 ২. অ্যাডমিন রোল ভেরিফিকেশন মিডলওয়্যার (IsAdmin Guard)
// =========================================================================
export const isAdmin = (req, res, next) => {
    // 🧠 সুপার এডমিন চেক: শুধুমাত্র admin রোলের ইউজারই এই গেট পার হতে পারবেন
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Supreme Administrative clearance required." 
    });
};