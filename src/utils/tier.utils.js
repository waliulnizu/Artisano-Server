// 👑 Membership tiers are stored inconsistently in the database:
//    the User schema enum expects "free" | "pro" | "premium", but subscription
//    writes from the Stripe flow store raw plan names like "VIP Premium Pro"
//    or "Studio Enterprise". Every quota decision must go through this helper
//    so a paying member is never treated as a free user.
//
// 📊 The three nodes and what each one actually buys:
//
//   ┌──────────────────┬────────┬ VIP Pro $29 ─┬ Enterprise $99 ┐
//   │ Artworks/month   │     3  │           25 │      unlimited │
//   │ Creator uploads  │     3  │           25 │      unlimited │
//   │ Premium vault    │  3/day │     unlimited│      unlimited │
//   └──────────────────┴────────┴──────────────┴────────────────┘
//
//   Acquisition slots are a *permission to buy*, never a payment: every artwork
//   is still paid for separately through Stripe, so the tiers only decide how
//   many purchases a member may make inside one calendar month.

export const TIER_SLOTS = {
  free: 3,       // artworks per month
  pro: 25,
  premium: Infinity // Studio Enterprise — uncapped
};

export const TIER_UPLOADS = {
  free: 3,       // lifetime studio uploads (storage-backed)
  pro: 25,
  premium: Infinity
};

export const TIER_LABELS = {
  free: "Starter Spark",
  pro: "VIP Premium Pro",
  premium: "Studio Enterprise"
};

export const normalizeTier = (tier) => {
  const value = String(tier || "free").trim().toLowerCase();

  if (!value || value === "free") return "free";
  if (value.includes("enterprise") || value === "premium") return "premium";
  if (value.includes("pro") || value.includes("vip") || value.includes("premium")) return "pro";

  return "free";
};

export const slotsForTier = (tier) => TIER_SLOTS[normalizeTier(tier)] ?? TIER_SLOTS.free;

export const uploadsForTier = (tier) => TIER_UPLOADS[normalizeTier(tier)] ?? TIER_UPLOADS.free;

export const labelForTier = (tier) => TIER_LABELS[normalizeTier(tier)] ?? TIER_LABELS.free;

// 🗓 Quota windows run per calendar month (UTC), which is what every "monthly
//    acquisition quota" message promises — the previous build counted lifetime
//    purchases, so a free member who bought 3 works once was locked out forever.
export const monthWindowStart = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

export const nextMonthStart = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

// Mongoose filter shared by every quota count.
export const monthlyAcquisitionFilter = (userId) => ({
  user: userId,
  packageName: { $regex: /^Artwork_Purchase_/ },
  status: "succeeded",
  createdAt: { $gte: monthWindowStart() }
});
