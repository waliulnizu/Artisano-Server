import express from 'express';
import { registerUser, loginUser, getMe, logoutUser, changePassword, upgradeToPremium } from '../controllers/auth.controller.js'; // getMe ইমপোর্ট করা হলো
import { updateProfile } from "../controllers/user.controller.js";
import { protect } from '../middlewares/auth.middleware.js'; // দারোয়ানকে (guard) ইমপোর্ট করা হলো
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// 📌 Public Routes (যে কেউ আসতে পারবে, কোনো গার্ড নেই)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.patch("/change-password", protect, changePassword)

// 📌 Protected Routes (এখানে আগে দারোয়ান চেক করবে, তারপর কন্ট্রোলারে যাবে)
// লজিক: যখনই কেউ GET /me তে রিকোয়েস্ট পাঠাবে, প্রথমে protect ফাংশন রান হবে। 
// protect যদি next() কল করে, তবেই getMe ফাংশন রান হবে।
router.get('/me', protect, getMe);
router.patch("/update-profile", protect, upload.single("profileImage"), updateProfile);
// 🧠 Developer Thought: এটি একটি সুরক্ষিত (protected) রাউট হওয়া উচিত, তাই protect মিডলওয়্যার ব্যবহার করা হলো।
router.post('/upgrade', protect, upgradeToPremium);

export default router;