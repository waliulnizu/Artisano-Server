import express from "express";
import { createComment, getArtworkComments, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, createComment);
router.get("/artwork/:artworkId", getArtworkComments);
router.put("/update", protect, updateComment);
router.delete("/delete", protect, deleteComment);

export default router;