import express from "express";
import { 
  createContent, 
  getPremiumContent, 
  getPublicContent, // 👑 FIX: পাবলিক ফিড কন্ট্রোলার ইমপোর্ট করা হলো
  updateContent, 
  deleteContent, 
  getArtistAssets, 
  getSingleArtwork 
} from "../controllers/content.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; 
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// =========================================================================
// 🛣️ রাউট ১: সম্পূর্ণ পাবলিক ফিড (সার্চ, ফিল্টার এবং লগইন ছাড়া সবার জন্য ওপেন 🔓)
// =========================================================================
router.get("/public-data", getPublicContent); 

// =========================================================================
// 🛣️ রাউট ২: ভিআইপি প্রিমিয়াম গ্যালারি (শুধু প্রিমিয়াম মেম্বার ও অ্যাডমিনদের জন্য 🔒)
// =========================================================================
router.get("/premium-data", protect, (req, res, next) => {
    if (req.user && (req.user.isPremium || req.user.role === "admin")) {
        return next(); 
    }
    return res.status(403).json({ success: false, message: "Premium Access Denied. Upgrade to Pro/Premium room." });
}, getPremiumContent);

// =========================================================================
// 🛣️ রাউট ৩: নতুন কন্টেন্ট তৈরি করার জন্য (Admin & Artist Combined)
// =========================================================================
router.post(
    "/create", 
    upload.single("featuredImage"), 
    protect,                        
    (req, res, next) => {
        if (req.user && (req.user.role === "admin" || req.user.role === "artist")) {
            return next();
        }
        return res.status(403).json({ success: false, message: "Access Denied! Only Admins and Artists can upload." });
    },
    createContent                   
);

// 🛣️ রাউট ৪: কন্টেন্ট এডিট/আপডেট করার জন্য (CRUD - Update)
router.put("/:id", upload.single("featuredImage"), protect, updateContent);

// 🛣️ রাউট ৫: কন্টেন্ট ডিলিট করার জন্য (CRUD - Delete)
router.delete("/:id", protect, deleteContent);

// 🛣️ রাউট ৬: লগইন করা আর্টিস্টের নিজস্ব এসেট দেখার জন্য
router.get("/artist-assets", protect, getArtistAssets);

// 🛣️ রাউট ৭: সিঙ্গেল আর্টওয়ার্ক ভিউ নোড (🔓 পাবলিক এক্সেস)
router.get("/:id", getSingleArtwork);

export default router;