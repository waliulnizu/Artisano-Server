import express from "express";
import { toggleWishlist, getMyWishlist } from "../controllers/wishlist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 💔 উইশলিস্টে আইটেম অ্যাড/রিমুভ করার টগল এন্ডপয়েন্ট 
// POST http://localhost:5000/api/wishlist/toggle
router.post("/toggle", protect, toggleWishlist);

// =========================================================================
// 👑 🔓 THE CURATED SYNC FIX: গ্লোবাল এবং ওল্ড পাথ দুটোর জন্যই গেটওয়ে সচল
// =========================================================================
// 🧠 Developer Thought Process: ফ্রন্টএন্ডের fetch এপিআই যদি সরাসরি হিট করে, 
// তবে প্রথম রাউটটি ডাটা পাস করবে। আর ওল্ড কোনো এক্সিওস বা ইন্টারসেপ্টর যদি '/my-list' খোঁজে, 
// তবে দ্বিতীয় রাউটটি ব্যাকআপ দেবে। এতে পুরো পাইপলাইন ১০০% সেফ থাকবে।

router.get("/", protect, getMyWishlist);        // ✅ ডাইরেক্ট গ্লোবাল পাথ সচল করা হলো
router.get("/my-list", protect, getMyWishlist); // ✅ ওল্ড সাব-পাথও সচল রাখা হলো

export default router;