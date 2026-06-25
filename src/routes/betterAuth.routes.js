import express from "express";
const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => res.json({ status: "Better Auth Sub-Route Node Operational" }));

export default router;