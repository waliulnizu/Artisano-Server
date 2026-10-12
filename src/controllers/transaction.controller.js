import { Transaction } from "../models/transaction.model.js";
import { Content } from "../models/content.model.js";

// Artwork purchases are stored as `Artwork_Purchase_<contentId>` inside packageName.
// Membership / test invoices keep their original human readable package name.
const artworkIdOf = (packageName = "") =>
  packageName.startsWith("Artwork_Purchase_") ? packageName.replace("Artwork_Purchase_", "") : null;

const bulkFetchArtworks = async (ids) => {
  if (!ids.length) return [];
  return Content.find({ _id: { $in: ids } })
    .select("title featuredImage price category status author")
    .populate({ path: "author", model: "User", select: "name profileImage" });
};

// =========================================================================
// 🧾 Purchase history (receipts) — artwork purchases come back enriched
// =========================================================================
export const getMyTransactionHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const history = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    // One bulk lookup instead of N+1 queries.
    const artworks = await bulkFetchArtworks(
      history.map((t) => artworkIdOf(t.packageName)).filter(Boolean)
    );
    const artMap = new Map(artworks.map((a) => [String(a._id), a]));

    const data = history.map((t) => {
      const artId = artworkIdOf(t.packageName);
      const art = artId ? artMap.get(artId) : null;

      return {
        ...t.toObject(),
        type: artId && art ? "artwork" : "subscription",
        label: art ? art.title : t.packageName,
        artwork: art
          ? {
              id: art._id,
              title: art.title,
              image: art.featuredImage,
              price: art.price,
              category: art.category,
              artist: art.author?.name || null,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GET_TRANSACTION_HISTORY_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error fetching payment history." });
  }
};

// =========================================================================
// 🖼 Acquired artworks (collector vault) — image 9
// =========================================================================
export const getMyAcquiredArtworks = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const acquisitions = await Transaction.find({
      user: userId,
      packageName: { $regex: /^Artwork_Purchase_/ },
      status: "succeeded",
    }).sort({ createdAt: -1 });

    const txMap = new Map(
      acquisitions.map((t) => [String(artworkIdOf(t.packageName)), t])
    );

    const artworks = await Content.find({
      _id: { $in: [...txMap.keys()] },
    }).populate({ path: "author", model: "User", select: "name profileImage" });

    const data = artworks.map((art) => {
      const tx = txMap.get(String(art._id));
      return {
        artwork: art,
        acquiredValue: tx?.amount ?? art.price,
        currency: tx?.currency ?? "USD",
        acquiredAt: tx?.createdAt ?? art.createdAt,
        transactionId: tx?.transactionId ?? null,
      };
    });

    // Newest acquisition first.
    data.sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("ACQUIRED_ARTWORKS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error fetching acquired artworks." });
  }
};
