import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// ==========================================
// 📌 JWT টোকেন জেনারেট করার হেল্পার ফাংশন
// ==========================================
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// ==========================================
// 📌 গ্লোবাল কুকি অপশনস (কোড ক্লিন রাখার জন্য)
// ==========================================
const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: false, // Localhost এর জন্য এটি false হতে হবে!
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// ==========================================
// 📌 User Registration Controller
// ==========================================
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already registered. Please login.' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user',
        });

        const token = generateToken(user._id);

        // 📌 এখানে আমরা উপরের বানানো cookieOptions ব্যবহার করেছি
        res.cookie('token', token, cookieOptions);

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

// ==========================================
// 📌 User Login Controller
// ==========================================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        // 📌 এখানেও আমরা উপরের বানানো cookieOptions ব্যবহার করেছি
        res.cookie('token', token, cookieOptions);

        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            user,
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Error during login' });
    }
};

// ==========================================
// 📌 Get Current User Controller (/me)
// ==========================================
export const getMe = async (req, res) => {
    try {
        const user = req.user;

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error while fetching user data' 
        });
    }
};

// 📌 Logout Controller
export const logoutUser = async (req, res) => {
    try {
        // কুকি থেকে টোকেনটি মুছে ফেলার জন্য আমরা একই নামের কুকি সেট করব কিন্তু মেয়াদ বা maxAge শূন্য করে দেব
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0), // এখনই এক্সপায়ার করে দাও
        });

        res.status(200).json({ success: true, message: 'Logged out successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error during logout' });
    }
};


// প্রোফাইল আপডেট কন্ট্রোলার
export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body; // ইউজার যা পরিবর্তন করতে চায়
        const userId = req.user._id; // মিডলওয়্যার থেকে পাওয়া ইউজার আইডি

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name },
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating profile" });
    }
};