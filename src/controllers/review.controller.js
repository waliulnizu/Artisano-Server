import Review from "../models/review.model.js";

// =========================================================================
// =========================================================================
export const createReview = async (req, res) => {
  try {
    const { artworkId, rating, comment } = req.body;
    const userId = req.user._id;

    const newReview = await Review.create({
      artworkId,
      user: userId,
      rating,
      comment
    });

    const populatedReview = await newReview.populate("user", "name profileImage");

    return res.status(201).json({
      success: true,
      message: "Thank you for your valuable feedback! ⭐",
      data: populatedReview
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already submitted a review for this artwork." });
    }
    return res.status(500).json({ success: false, message: "Server encountered an error posting review." });
  }
};

// =========================================================================
// =========================================================================
export const getArtworkReviews = async (req, res) => {
  try {
    const { artworkId } = req.params;

    const reviews = await Review.find({ artworkId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    return res.status(200).json({
      success: true,
      averageRating: Number(averageRating),
      count: totalReviews,
      data: reviews
    });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching reviews for this asset." });
  }
};

// =========================================================================
// =========================================================================
export const updateReview = async (req, res) => {
  try {
    const { reviewId, rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (review.user.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only edit your own reviews." });
    }

    review.rating = rating !== undefined ? rating : review.rating;
    review.comment = comment !== undefined ? comment : review.comment;

    const updatedReview = await review.save();

    await updatedReview.populate("user", "name profileImage");

    return res.status(200).json({
        success: true,
        message: "Review updated successfully.",
        data: updatedReview
    });

  } catch (error) {
    console.error("Update Review Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update review." });
  }
};

// =========================================================================
// =========================================================================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (review.user.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own reviews." });
    }

    await Review.findByIdAndDelete(reviewId);

    return res.status(200).json({
        success: true,
        message: "Review deleted successfully."
    });

  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete review." });
  }
};

// =========================================================================
// 📚 Curatorial notes written by the signed-in collector
// =========================================================================
export const getMyReviews = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const reviews = await Review.find({ user: userId })
      .populate({ path: "artworkId", model: "Content", select: "title featuredImage price category" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error("GET_MY_REVIEWS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error fetching your curatorial notes." });
  }
};