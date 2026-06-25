import User from "../models/user.model.js";

// =========================================================================
// ❤️ ১. উইশলিস্ট টগল লজিক (Error Free Array Based)
// =========================================================================
export const toggleWishlist = async (req, res) => {
  try {
    const { artworkId } = req.body;
    const userId = req.user._id;

    if (!artworkId) {
      return res.status(400).json({ success: false, message: "Artwork ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const isWished = user.wishlist.some(id => id && id.toString() === artworkId.toString());
    if (isWished) {
      user.wishlist = user.wishlist.filter((id) => id && id.toString() !== artworkId.toString());
      await user.save();
      return res.status(200).json({ success: true, isWished: false, message: "Removed from wishlist." });
    } else {
      user.wishlist.push(artworkId);
      await user.save();
      return res.status(200).json({ success: true, isWished: true, message: "Added to wishlist! ❤️" });
    }
  } catch (error) {
    console.error("Toggle Wishlist Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error toggle." });
  }
};

// =========================================================================
// 📥 ২. ইউজারের নিজস্ব উইশলিস্ট ডাটা তুলে আনা (The Permanent Fix)
// =========================================================================
export const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🧠 🚀 UPDATE: পপুলেশন পাথ এর সাথে মডেলের নাম সুনির্দিষ্টভাবে লক করা হলো
    const userWithWishlist = await User.findById(userId).populate({
      path: "wishlist",
      model: "Content" // 👈 আপনার আর্টওয়ার্ক মঙ্গুজ মডেলের এক্সপোর্ট নেম
    });

    if (!userWithWishlist || !userWithWishlist.wishlist) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // 🧠 🚀 UPDATE & REMOVE EXTRA NESTING: কোনো জটিল র‍্যাপিং ছাড়া ক্লিন আর্ট অবজেক্ট পাঠানো
    const formattedWishlist = userWithWishlist.wishlist
      .filter(artwork => artwork !== null); // ডিলিট হয়ে যাওয়া আর্ট ফিল্টার করা

    return res.status(200).json({
      success: true,
      count: formattedWishlist.length,
      data: formattedWishlist // 👈 সরাসরি পিউর আর্ট অবজেক্ট অ্যারে হিসেবে যাবে
    });
  } catch (error) {
    console.error("CRITICAL GET_WISH_LIST ERROR:", error);
    return res.status(200).json({ success: true, count: 0, data: [] });
  }
};