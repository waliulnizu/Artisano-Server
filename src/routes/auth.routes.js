import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getMe, 
  logoutUser, 
  changePassword, 
  upgradeToPremium,
  updateMyRole,          // 👑 NEW: Google OAuth-এর pending_role cookie থেকে role update
  getAllUsersByAdmin,      
  updateUserFieldsByAdmin   
} from '../controllers/auth.controller.js'; 
import { updateProfile } from "../controllers/user.controller.js";
import { protect } from '../middlewares/auth.middleware.js'; 
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// 📌 Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// 📌 Protected User Routes
router.get('/me', protect, getMe);
router.patch("/change-password", protect, changePassword);
router.patch("/update-profile", protect, upload.single("profileImage"), updateProfile);
router.post('/upgrade', protect, upgradeToPremium);
router.patch('/update-role', protect, updateMyRole); // 👑 NEW: Google user-এর pending role apply করার route

// =========================================================================
// 👑 📌 এডমিন এক্সক্লুসিভ গেটওয়ে (Admin Only Protected Routes)
// =========================================================================

// ইনলাইন রোল চেকার দারোয়ান মিডলওয়্যার
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ success: false, message: "Access Denied! Admin credentials required." });
};

// অ্যাডমিন এন্ডপয়েন্টস
router.get('/admin/users', protect, isAdmin, getAllUsersByAdmin);
router.put('/admin/users/:id', protect, isAdmin, updateUserFieldsByAdmin);

export default router;