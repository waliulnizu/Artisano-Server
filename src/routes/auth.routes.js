import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getMe, 
  logoutUser, 
  changePassword, 
  upgradeToPremium,
  updateMyRole,          
  getAllUsersByAdmin,      
  updateUserFieldsByAdmin,
  getPublicUsers
} from '../controllers/auth.controller.js'; 
import { updateProfile } from "../controllers/user.controller.js";
import { protect } from '../middlewares/auth.middleware.js'; 
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.get('/public-users', getPublicUsers);
router.patch("/change-password", protect, changePassword);
router.patch("/update-profile", protect, upload.single("profileImage"), updateProfile);
router.post('/upgrade', protect, upgradeToPremium);
router.patch('/update-role', protect, updateMyRole); 

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ success: false, message: "Access Denied! Admin credentials required." });
};

router.get('/admin/users', protect, isAdmin, getAllUsersByAdmin);
router.put('/admin/users/:id', protect, isAdmin, updateUserFieldsByAdmin);

export default router;