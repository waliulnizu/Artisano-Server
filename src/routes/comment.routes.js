import express from "express";
import { createComment, getArtworkComments } from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; // ইউজার লগইন চেক করার মিডলওয়্যার

const router = express.Router();

// ক) কমেন্ট পোস্ট করার রাউট (এটি প্রটেক্টেড, লগইন ছাড়া কমেন্ট করা নিষেধ)
router.post("/create", protect, createComment);

// খ) কমেন্ট গেট করার রাউট (এটি পাবলিক, লগইন না করলেও যে কেউ কমেন্ট দেখতে পারবে)
router.get("/artwork/:artworkId", getArtworkComments);

export default router;