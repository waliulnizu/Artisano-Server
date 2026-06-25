import express from "express";
const router = express.Router({ mergeParams: true });

// এই আলাদা ফাইলটি এখন মেইন অ্যাপ থেকে সরাসরি মাউন্টেড হওয়ায় এটি সেফলি বাইপাস থাকবে
router.get("/", (req, res) => res.json({ status: "Better Auth Sub-Route Node Operational" }));

export default router;