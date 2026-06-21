import express from 'express';
import { getPremiumContent } from '../controllers/content.controller.js';
import { protect } from '../middlewares/auth.middleware.js'; // আপনার অথেনটিকেশন মিডলওয়্যার
import { checkPremium } from '../middlewares/subscription.middleware.js'; // আমাদের বানানো নতুন গার্ড

// Express ডকুমেন্টেশন অনুযায়ী Router ইনিশিয়ালাইজ করা হচ্ছে
const router = express.Router();

// 🧠 Developer Thought: 
// রাউটের নামের পর আমরা সিকোয়েনশিয়ালি (একটার পর একটা) মিডলওয়্যার বসাচ্ছি।
// Express.js বাম থেকে ডান দিকে মিডলওয়্যার এক্সিকিউট করে।
// আগে protect (লগইন চেক), তারপর checkPremium (সাবস্ক্রিপশন চেক), সবার শেষে Controller.

router.get('/premium-data', protect, checkPremium, getPremiumContent);

export default router;