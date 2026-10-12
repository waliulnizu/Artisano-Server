import express from "express";
import { getAllUsersForAdmin, updateUserPrivilegeByAdmin } from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/admin/users", protect, getAllUsersForAdmin);
router.put("/admin/users/:id", protect, updateUserPrivilegeByAdmin);

export default router;