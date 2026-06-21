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
    secure: false, // Localhost এর জন্য এটি false হতে হবে!
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};