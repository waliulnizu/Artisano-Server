import User from "../models/user.model.js";

// =========================================================================
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
// =========================================================================
export const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const userWithWishlist = await User.findById(userId).populate({
      path: "wishlist",
      model: "Content"
    });

    if (!userWithWishlist || !userWithWishlist.wishlist) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const formattedWishlist = userWithWishlist.wishlist
      .filter(artwork => artwork !== null);

    return res.status(200).json({
      success: true,
      count: formattedWishlist.length,
      data: formattedWishlist
    });
  } catch (error) {
    console.error("CRITICAL GET_WISH_LIST ERROR:", error);
    return res.status(200).json({ success: true, count: 0, data: [] });
  }
};