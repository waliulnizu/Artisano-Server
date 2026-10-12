import express from "express";
import { 
  createReview, 
  getArtworkReviews, 
  updateReview,
  deleteReview,
  getMyReviews
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/submit", protect, createReview);

router.get("/artwork/:artworkId", getArtworkReviews);

// 📚 Everything this collector has written about masterpieces
router.get("/my", protect, getMyReviews);

// =========================================================================
// =========================================================================

// 📝 Postman: PUT http://localhost:5000/api/review/update
router.put("/update", protect, updateReview);

// 📝 Postman: DELETE http://localhost:5000/api/review/delete
router.delete("/delete", protect, deleteReview);

export default router;