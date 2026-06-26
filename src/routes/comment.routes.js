import express from "express";
import { createComment, getArtworkComments, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

// 🚀 ADD: আমাদের তৈরি করা আইসোলেটেড পারচেজ গার্ড ইম্পোর্ট
import { canCommentGuard } from "../middlewares/purchaseGuard.middleware.js";

const router = express.Router();

router.post("/create", protect,canCommentGuard, createComment);
router.get("/artwork/:artworkId", getArtworkComments);
router.put("/update", protect, updateComment);
router.delete("/delete", protect, deleteComment);

export default router;