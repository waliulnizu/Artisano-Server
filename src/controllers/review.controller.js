import Review from "../models/review.model.js";

// =========================================================================
// 📝 ১. নতুন রিভিউ ও রেটিং যোগ করার লজিক (Create Review)
// =========================================================================
export const createReview = async (req, res) => {
  try {
    const { artworkId, rating, comment } = req.body;
    const userId = req.user._id; // প্রটেক্টেড মিডলওয়্যার থেকে নেওয়া

    // ডাটাবেসে রিভিউ ইনসার্ট করা
    const newReview = await Review.create({
      artworkId,
      user: userId,
      rating,
      comment
    });

    // ফ্রন্টঅ্যান্ডে ইনস্ট্যান্ট রিভিউকারীর নাম ও ছবি দেখানোর জন্য পপুলেট করা
    const populatedReview = await newReview.populate("user", "name profileImage");

    return res.status(201).json({
      success: true,
      message: "Thank you for your valuable feedback! ⭐",
      data: populatedReview
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    // যদি কম্পাউন্ড ইনডেক্সের কারণে ডুপ্লিকেট রিভিউ এরর আসে (Error Code: 11000)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already submitted a review for this artwork." });
    }
    return res.status(500).json({ success: false, message: "Server encountered an error posting review." });
  }
};

// =========================================================================
// 📥 ২. নির্দিষ্ট আর্টওয়ার্কের সব রিভিউ এবং এভারেজ রেটিং আনা (Get Product Reviews)
// =========================================================================
export const getArtworkReviews = async (req, res) => {
  try {
    const { artworkId } = req.params;

    // ক) সব রিভিউ খোঁজা ও রিভিউকারীর প্রোফাইল ডাটা পপুলেট করা
    const reviews = await Review.find({ artworkId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    // খ) 🧠 ডাইনামিক ম্যাথ লজিক: গড় বা এভারেজ রেটিং হিসাব করা
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
// ✏️ ৩. কোনো ইউজারের নিজের রিভিউ এডিট করা (Update Own Review)
// =========================================================================
export const updateReview = async (req, res) => {
  try {
    const { reviewId, rating, comment } = req.body;
    const userId = req.user._id; // ভেরিফাইড ইউজার

    // প্রথমে রিভিউটি খুঁজে বের করা এবং নিশ্চিত করা যে এটি ওই ইউজারেরই
    const review = await Review.findById(reviewId);
    
    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found." });
    }

    // 🛡️ সিকিউরিটি চেক: শুধু রিভিউদাতা নিজেই এডিট করতে পারবে
    if (review.user.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only edit your own reviews." });
    }

    // রিভিউ আপডেট
    review.rating = rating !== undefined ? rating : review.rating;
    review.comment = comment !== undefined ? comment : review.comment;

    const updatedReview = await review.save();

    // আপডেট হওয়া রিভিউটি পপুলেট করে পাঠানো (যাতে নাম/ছবি দেখা যায়)
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
// 🗑️ ৪. কোনো ইউজারের রিভিউ মুছে ফেলা (Delete Own Review)
// =========================================================================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found." });
    }

    // সিকিউরিটি: শুধু রিভিউদাতা বা অ্যাডমিন ডিলিট করতে পারবে
    if (review.user.toString() !== userId.toString()) {
        // (যদি অ্যাডমিনদের জন্য আলাদা ভেরিফিকেশন থাকে, সেটাও এখানে যোগ করা যায়)
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