import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// JWT টোকেন জেনারেট করার একটি ছোট হেল্পার ফাংশন
const generateToken = (id) => {
    // এটি ইউজারের আইডি দিয়ে একটি টোকেন বানাবে যা ৭ দিন পর এক্সপায়ার হবে
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// ==========================================
// 📌 User Registration Controller
// ==========================================
export const registerUser = async (req, res) => {
    try {
        // ১. ফ্রন্টএন্ড থেকে পাঠানো ডাটাগুলো রিসিভ করা
        const { name, email, password, role } = req.body;

        // ২. ভ্যালিডেশন: কোনো ফিল্ড ফাঁকা আছে কি না চেক করা
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        // ৩. ইমেইল চেক: এই ইমেইলে আগে থেকে কোনো অ্যাকাউন্ট আছে কি না
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already registered. Please login.' });
        }

        // ৪. নতুন ইউজার তৈরি করা (Mongoose pre-save হুক অটোমেটিক পাসওয়ার্ড হ্যাশ করে নেবে)
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user', // ফ্রন্টএন্ড থেকে রোল না দিলে ডিফল্ট 'user' হবে
        });

        // ৫. JWT টোকেন তৈরি করা
        const token = generateToken(user._id);

        // ৬. টোকেনটিকে ব্রাউজারের HTTP-only কুকিতে সেট করা (সিকিউরিটির জন্য)
        res.cookie('token', token, {
            path: '/',
            httpOnly: true, // জাভাস্ক্রিপ্ট দিয়ে এই কুকি হ্যাক করা যাবে না
            secure: process.env.NODE_ENV === 'production', // লাইভ সার্ভারে এটি true হবে
            sameSite: 'strict', // অন্য সাইট থেকে কুকি এক্সেস করা যাবে না
            maxAge: 7 * 24 * 60 * 60 * 1000, // ৭ দিন (মিলি সেকেন্ডে)
        });

        // ৭. পাসওয়ার্ড বাদ দিয়ে ইউজারের বাকি ডাটা ফ্রন্টএন্ডে পাঠানো
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user,
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Server Error during registration' });
    }
};