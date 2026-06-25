import express from "express";
import { 
  createReview, 
  getArtworkReviews, 
  updateReview,
  deleteReview
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ক) রিভিউ পোস্ট করা (Protected)
router.post("/submit", protect, createReview);

// খ) নির্দিষ্ট আর্টের সব রিভিউ দেখা (Public)
router.get("/artwork/:artworkId", getArtworkReviews);

// =========================================================================
// 🚀 নতুন সংযোজন: ৩ ও ৪ নম্বর ফিচারের এপিআই এন্ডপয়েন্ট (উভয়ই Protected)
// =========================================================================

// গ) রিভিউ এডিট বা আপডেট করার রাউট 
// 📝 Postman: PUT http://localhost:5000/api/review/update
router.put("/update", protect, updateReview);

// ঘ) রিভিউ ডিলিট বা মুছে ফেলার রাউট 
// 📝 Postman: DELETE http://localhost:5000/api/review/delete
router.delete("/delete", protect, deleteReview);

export default router;