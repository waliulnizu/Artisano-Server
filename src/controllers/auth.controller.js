import User from '../models/user.model.js';
import { generateToken, cookieOptions } from '../utils/auth.utils.js';
import bcrypt from 'bcryptjs';

// ==========================================
// 📌 ১. User Registration Controller
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
        
        res.cookie('token', token, {
            ...cookieOptions,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token, 
            user,
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Server Error during registration' });
    }
};

// ==========================================
// 📌 ২. User Login Controller
// ==========================================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'No account found with this email. Please register first.' });
        }

        if (!user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'This account was created with Google. Please use "Continue with Google" to sign in.' 
            });
        }

        const isMatch = await user.comparePassword(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        const token = generateToken(user._id);
        
        res.cookie('token', token, {
            ...cookieOptions,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

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
// 📌 ৩. Get Current User Controller (/me)
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
// 📌 ৪. Logout Controller
// ==========================================
export const logoutUser = async (req, res) => {
    try {
        res.cookie('token', '', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0), 
        });
        res.status(200).json({ success: true, message: 'Logged out successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error during logout' });
    }
};

// ==========================================
// 📌 ৫. Change Password Controller
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
// 📌 ৬. Upgrade to Premium Controller (Mock Payment)
// ==========================================
export const upgradeToPremium = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.subscriptionTier = 'premium';
        user.isPremium = true; 
        
        await user.save();
        user.password = undefined;

        res.status(200).json({ 
            success: true, 
            message: "Successfully upgraded to Premium!", 
            user 
        });
    } catch (error) {
        console.error("Upgrade Error:", error);
        res.status(500).json({ success: false, message: "Server Error during upgrade" });
    }
};

// =========================================================================
// 👑 📌 অ্যাডমিন কন্ট্রোলার ৭: ডাটাবেসের সমস্ত ইউজার লিস্ট ফেচ করা
// =========================================================================
export const getAllUsersByAdmin = async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("Get All Users Admin Error:", error);
        res.status(500).json({ success: false, message: "Server Error while fetching user directories" });
    }
};

// =========================================================================
// 👑 📌 অ্যাডমিন কন্ট্রোলার ৮: অ্যাডমিন প্যানেল থেকে রোল/প্রিমিয়াম স্ট্যাটাস আপডেট করা
// =========================================================================
export const updateUserFieldsByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isPremium } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user._id.toString() === req.user._id.toString() && role && role !== "admin") {
            return res.status(400).json({ success: false, message: "Safety Alert: You cannot remove your own Admin privileges!" });
        }

        if (role) user.role = role;
        
        if (isPremium !== undefined) {
            user.isPremium = isPremium;
            user.subscriptionTier = isPremium ? 'premium' : 'free';
        }

        await user.save();
        user.password = undefined;

        res.status(200).json({ 
            success: true, 
            message: `Account of ${user.name} successfully updated! 🛠️`, 
            user 
        });
    } catch (error) {
        console.error("Admin User Update Error:", error);
        res.status(500).json({ success: false, message: "Server Error during administrative update" });
    }
};

// =========================================================================
// 👑 📌 ৪. আপডেট করা কন্ট্রোলার ৯: Google OAuth user-এর pending role apply করা
// =========================================================================
export const updateMyRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !["user", "artist"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role value." });
        }

        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authorized." });
        }

        // 🛡️ [ROLE OVERWRITE SHIELD]: ডাটাবেস থেকে ইউজারের এক্সিস্টিং ডাটা আগে রিড করা
        const checkUser = await User.findById(userId);
        
        // 🚨 যদি ইউজার অলরেডি একজন "artist" বা "admin" হয়, তবে তার রোল কোনোভাবেই "user" এ নামানো যাবে না!
        if (checkUser && (checkUser.role === "artist" || checkUser.role === "admin") && role === "user") {
            console.log(`🛡️ Role Shield Triggered for ${checkUser.name}. Preventing reset back to standard user.`);
            
            // সেশন যেন লক না হয়, তাই তার এক্সিস্টিং রোলটাই রেসপন্সে সাকসেসফুলি ব্যাক করা হলো
            return res.status(200).json({ 
                success: true, 
                message: "Welcome back! Retaining your authorized creator privileges.", 
                user: checkUser 
            });
        }

        // নতুন বা আপগ্রেডেড ইউজারের জন্য ফাইনাল আপডেট এক্সিকিউশন
        let updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, select: "-password" }
        );

        if (!updatedUser) {
            updatedUser = await User.findOneAndUpdate(
                { email: req.user.email },
                { role },
                { new: true, select: "-password" }
            );
        }

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // 🔄 [SESSION SYNC TOKEN]: রোল চেঞ্জের পর কুকিতে ফ্রেশ আইডেন্টিটি টোকেন পুশ করা হলো
        const token = generateToken(updatedUser._id);
        res.cookie('token', token, {
            ...cookieOptions,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Update Role Error:", error);
        res.status(500).json({ success: false, message: "Server Error while updating role." });
    }
};