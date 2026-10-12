import express from "express";
import { updateProfileInfo, updateAccountPassword } from "../controllers/settings.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/update-profile", protect, updateProfileInfo);
router.put("/update-password", protect, updateAccountPassword);

export default router;