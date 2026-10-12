import { generateToken, cookieOptions } from '../utils/auth.utils.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const getRawUsersCollection = () => mongoose.connection.db.collection("users");
const getRawGoogleUsersCollection = () => mongoose.connection.db.collection("google_users");

// ==========================================
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
                profileImage: gUser?.image || user.image || "https://i.ibb.co/4pDNDk1/avatar.png",
                role: gUser?.role || "user",
                // ⚠️ Carry the paid state over — hard-coding "free" here silently
                //    downgraded every Google VIP to a free member on their first
                //    /auth/me call after the mirror row was created.
                subscriptionTier: gUser?.subscriptionTier || user.subscriptionTier || "free",
                isPremium: Boolean(gUser?.isPremium || user.isPremium),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await usersCollection.insertOne(clonedUser);
            user = clonedUser;
        } else if (mainUserCheck) {
            if (!mainUserCheck.profileImage) {
                try {
                    const googleCollection = getRawGoogleUsersCollection();
                    const gUser = await googleCollection.findOne({ email: mainUserCheck.email });
                    if (gUser?.image) {
                        await usersCollection.updateOne(
                            { _id: mainUserCheck._id },
                            { $set: { profileImage: gUser.image, updatedAt: new Date() } }
                        );
                        mainUserCheck.profileImage = gUser.image;
                    }
                } catch (syncErr) {
                    console.log("Google image sync skipped:", syncErr.message);
                }
            }
            user = mainUserCheck;
        }

        // 🔐 /auth/me must answer with exactly what every other protected route
        //    will see. For Google (better-auth) sessions `req.user` carries the
        //    premium state resolved from google_users, while `user` above is the
        //    mirror row in `users` — when they disagree the paid state wins,
        //    otherwise the client renders VIP UI that the server then 403s.
        if (user && req.user) {
            const resolvedTier = req.user.subscriptionTier;
            const resolvedIsPremium = Boolean(req.user.isPremium);

            if (resolvedIsPremium || (resolvedTier && resolvedTier !== "free")) {
                user.isPremium = true;
                user.subscriptionTier = resolvedTier || user.subscriptionTier;
            }
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
// =========================================================================
export const getPublicUsers = async (req, res) => {
    try {
        const usersCollection = getRawUsersCollection();
        // Only public creators (artists + admin) are listed on Featured/All Artists.
        // Buyers (role "user") stay private and are only visible to admins via getAllUsersByAdmin.
        const users = await usersCollection
            .find({ role: { $in: ["artist", "admin"] } })
            .project({ _id: 1, name: 1, profileImage: 1, role: 1 })
            .sort({ createdAt: -1 })
            .toArray();

        const { Content } = await import('../models/content.model.js');
        const counts = await Content.aggregate([
            { $group: { _id: "$author", count: { $sum: 1 } } }
        ]);
        const countMap = {};
        counts.forEach(c => { countMap[String(c._id)] = c.count; });

        const data = users.map(u => ({
            id: String(u._id),
            name: u.name || "User",
            image: u.profileImage || "https://i.ibb.co/4pDNDk1/avatar.png",
            role: u.role || "user",
            count: countMap[String(u._id)] || 0
        })).sort((a, b) => b.count - a.count);

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Get Public Users Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

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