import express from "express";
import { toggleWishlist, getMyWishlist } from "../controllers/wishlist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ১. উইশলিস্টে আইটেম অ্যাড/রিমুভ করার টগল এন্ডপয়েন্ট (ফ্রন্টঅ্যান্ডের handleRemoveWish-এর সাথে ম্যাচ করা)
// POST http://localhost:5000/api/wishlist/toggle
router.post("/toggle", protect, toggleWishlist);

// =========================================================================
// 🚀 ৪0৪ ফিক্স: ফ্রন্টঅ্যান্ডের রিকোয়েস্ট করা '/my-list' এন্ডপয়েন্ট এখানে যুক্ত করা হলো
// =========================================================================
// GET http://localhost:5000/api/wishlist/my-list
router.get("/my-list", protect, getMyWishlist);

export default router;