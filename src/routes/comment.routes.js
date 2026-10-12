import express from "express";
import { createComment, getArtworkComments, updateComment, deleteComment, getMyComments } from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

import { canCommentGuard } from "../middlewares/purchaseGuard.middleware.js";

const router = express.Router();

router.post("/create", protect,canCommentGuard, createComment);
router.get("/artwork/:artworkId", getArtworkComments);

// 💬 Everything this collector has said in the guestbooks
router.get("/my", protect, getMyComments);

router.put("/update", protect, updateComment);
router.delete("/delete", protect, deleteComment);

export default router;