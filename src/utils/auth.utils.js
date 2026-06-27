import jwt from 'jsonwebtoken';

// ==========================================
// 📌 JWT টোকেন জেনারেট করার হেল্পার ফাংশন
// ==========================================
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// ==========================================
// 📌 গ্লোবাল কুকি অপশনস (কোড ক্লিন রাখার জন্য)
// ==========================================
export const cookieOptions = {  
    path: '/',
    httpOnly: true,
    secure: true, // 👑 FIX: Vercel - Render Cross Domain Cookie Allow
    sameSite: 'none', // 👑 FIX: Vercel - Render Cross Domain Cookie Allow
    maxAge: 7 * 24 * 60 * 60 * 1000
};