import { generateToken, cookieOptions } from '../utils/auth.utils.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// 🔍 ১. ডাইনামিক র (Raw) ডাটাবেস কালেকশন ড্রাইভার্স (কোনো স্কিমা ইম্পোর্ট ক্র্যাশ হবে না)
const getRawUsersCollection = () => mongoose.connection.db.collection("users");
const getRawGoogleUsersCollection = () => mongoose.connection.db.collection("google_users");

// ==========================================
// 📌 ১. User Registration Controller
// ==========================================
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        const usersCollection = getRawUsersCollection();
        const existingUser = await usersCollection.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already registered. Please login.' });
        }

        // পাসওয়ার্ড হ্যাশ করা
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            subscriptionTier: 'free',
            isPremium: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);
        const token = generateToken(result.insertedId);
        
        res.cookie('token', token, {
            ...cookieOptions
        });

        delete newUser.password;

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token, 
            user: { _id: result.insertedId, ...newUser },
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Server Error during registration' });
    }
};

// ==========================================
// 📌 ২. User Login Controller (With Raw Google Sync Fallback 🔄)
// ==========================================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const usersCollection = getRawUsersCollection();
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            try {
                const googleCollection = getRawGoogleUsersCollection();
                const googleUser = await googleCollection.findOne({ email });
                if (googleUser) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'This account was created via Google. Please click "Continue with Google" to log in securely! 🌐' 
                    });
                }
            } catch (err) {
                console.log("Google user collection raw fallback skip.");
            }

            return res.status(401).json({ success: false, message: 'No account found with this email. Please register first.' });
        }

        if (!user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'This account was created with Google. Please use "Continue with Google" to sign in.' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        const token = generateToken(user._id);
        
        res.cookie('token', token, {
            ...cookieOptions
        });

        delete user.password;

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

// =========================================================================
// 📌 ৩. Get Current User Controller (/me) -> [🛡️ AUTOMATIC RAW PROFILE SYNC ENGINE]
// =========================================================================
export const getMe = async (req, res) => {
    try {
        let user = req.user;

        if (!user) {
            return res.status(401).json({ success: false, message: "Session expired or invalid token." });
        }

        const targetId = user._id ? new mongoose.Types.ObjectId(user._id) : new mongoose.Types.ObjectId(user.id);
        const usersCollection = getRawUsersCollection();
        const mainUserCheck = await usersCollection.findOne({ _id: targetId });
        
        if (!mainUserCheck && user.email) {
            console.log(`⚡ Auto-Sync Triggered: Mirroring Google profile for ${user.email} into main users collection.`);
            
            const googleCollection = getRawGoogleUsersCollection();
            const gUser = await googleCollection.findOne({ email: user.email });

            const clonedUser = {
                _id: gUser?._id || targetId,
                name: gUser?.name || user.name || "Artisano Member",
                email: user.email,
                profileImage: gUser?.image || user.image || "",
                role: gUser?.role || "user",
                subscriptionTier: "free",
                isPremium: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await usersCollection.insertOne(clonedUser);
            user = clonedUser;
        } else if (mainUserCheck) {
            user = mainUserCheck;
        }

        if (user && user.password) delete user.password;

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
            secure: true,
            sameSite: 'none',
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
        const targetId = new mongoose.Types.ObjectId(req.user._id);
        const usersCollection = getRawUsersCollection();
        const user = await usersCollection.findOne({ _id: targetId });

        if (!user || !user.password) {
            return res.status(400).json({ success: false, message: "Password cannot be changed for Social/Google accounts." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password does not match" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await usersCollection.updateOne(
            { _id: targetId },
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error changing password" });
    }
};

// ==========================================
// 📌 👑 ৬. Upgrade to Premium Controller
// ==========================================
export const upgradeToPremium = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const targetId = new mongoose.Types.ObjectId(userId);
        const usersCollection = getRawUsersCollection();
        const user = await usersCollection.findOne({ _id: targetId });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User profile record missing." });
        }

        await usersCollection.updateOne(
            { _id: targetId },
            { $set: { subscriptionTier: 'premium', isPremium: true, updatedAt: new Date() } }
        );

        const updatedUser = await usersCollection.findOne({ _id: targetId });
        if (updatedUser.password) delete updatedUser.password;

        res.status(200).json({ 
            success: true, 
            message: "Successfully upgraded to Premium!", 
            user: updatedUser 
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
        const usersCollection = getRawUsersCollection();
        const users = await usersCollection.find({}).project({ password: 0 }).sort({ createdAt: -1 }).toArray();
        
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
        const targetId = new mongoose.Types.ObjectId(id);

        const usersCollection = getRawUsersCollection();
        const user = await usersCollection.findOne({ _id: targetId });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user._id.toString() === req.user._id.toString() && role && role !== "admin") {
            return res.status(400).json({ success: false, message: "Safety Alert: You cannot remove your own Admin privileges!" });
        }

        const updateData = { updatedAt: new Date() };
        if (role) updateData.role = role;
        
        if (isPremium !== undefined) {
            updateData.isPremium = isPremium;
            updateData.subscriptionTier = isPremium ? 'premium' : 'free';
        }

        await usersCollection.updateOne({ _id: targetId }, { $set: updateData });
        const updatedUser = await usersCollection.findOne({ _id: targetId });
        if (updatedUser.password) delete updatedUser.password;

        res.status(200).json({ 
            success: true, 
            message: `Account of ${updatedUser.name} successfully updated! 🛠️`, 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Admin User Update Error:", error);
        res.status(500).json({ success: false, message: "Server Error during administrative update" });
    }
};

// =========================================================================
// 👑 📌 অ্যাডমিন কন্ট্রোলার ৯: Google OAuth user-এর pending role apply করা
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

        const targetId = new mongoose.Types.ObjectId(userId);
        const usersCollection = getRawUsersCollection();
        const checkUser = await usersCollection.findOne({ _id: targetId });
        
        if (checkUser && (checkUser.role === "artist" || checkUser.role === "admin") && role === "user") {
            console.log(`🛡️ Role Shield Triggered for ${checkUser.name}. Preventing reset back to standard user.`);
            if (checkUser.password) delete checkUser.password;
            return res.status(200).json({ 
                success: true, 
                message: "Welcome back! Retaining your authorized creator privileges.", 
                user: checkUser 
            });
        }

        await usersCollection.updateOne(
            { _id: targetId },
            { $set: { role, updatedAt: new Date() } }
        );

        let updatedUser = await usersCollection.findOne({ _id: targetId });

        if (!updatedUser && req.user.email) {
            await usersCollection.updateOne(
                { email: req.user.email },
                { $set: { role, updatedAt: new Date() } }
            );
            updatedUser = await usersCollection.findOne({ email: req.user.email });
        }

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const token = generateToken(updatedUser._id);
        res.cookie('token', token, {
            ...cookieOptions
        });

        if (updatedUser.password) delete updatedUser.password;

        res.status(200).json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Update Role Error:", error);
        res.status(500).json({ success: false, message: "Server Error while updating role." });
    }
};