import User from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { generateToken, cookieOptions } from '../utils/auth.utils.js';
import bcrypt from 'bcryptjs';

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

// ==========================================
// 📌 Logout Controller
// ==========================================
export const logoutUser = async (req, res) => {
    try {
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0), 
        });

        res.status(200).json({ success: true, message: 'Logged out successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error during logout' });
    }
};

// ==========================================
// 📌 Change Password Controller
// ==========================================
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password does not match" });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error changing password" });
    }
};

// ==========================================
// 📌 Update Profile Controller (Name & Image)
// ==========================================
export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user._id; 

        // ১. শুরুতে ইউজারকে খুঁজে বের করুন
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // ২. যদি নতুন নাম আপডেট করতে চায়
        if (name) {
            user.name = name;
        }

        // ৩. যদি ইমেজ ফাইল থাকে, তবে Cloudinary তে আপলোড করুন
        if (req.file) {
            const profileImageLocal = req.file.buffer;
            
            if (!profileImageLocal) {
                return res.status(400).json({ success: false, message: "File buffer not found" });
            }

            const folderName = process.env.CLOUDINARY_FOLDER_NAME || "Artisano";
            const uploadedImage = await uploadOnCloudinary(profileImageLocal, folderName);
            
            if (uploadedImage && uploadedImage.secure_url) {
                user.profileImage = uploadedImage.secure_url;
            } else {
                return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed" });
            }
        }

        // ৪. ইউজার ডাটা সেভ করুন
        await user.save();

        // ৫. পাসওয়ার্ড বাদ দিয়ে রেসপন্স পাঠান
        user.password = undefined; 

        res.status(200).json({ success: true, user });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during profile update" });
    }
};