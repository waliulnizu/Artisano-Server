import express from "express";
import { updateProfileInfo, updateAccountPassword } from "../controllers/settings.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🛣️ প্রোটেক্টেড সেটিংস এন্ডপয়েন্টস
router.put("/update-profile", protect, updateProfileInfo);
router.put("/update-password", protect, updateAccountPassword);

export default router;