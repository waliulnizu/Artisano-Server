import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// রাউটগুলো ইম্পোর্ট করা
import healthRoutes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js'; // আপনার ট্র্যাডিশনাল মেইল-পাসওয়ার্ড রাউট ফাইল
import contentRoutes from './routes/content.routes.js';
import paymentRoutes from './routes/payment.route.js'; 
import commentRoutes from './routes/comment.routes.js'; 
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// 👑 ADD: ডাইনামিক নোড হ্যান্ডলার এবং কোর কনফিগ সরাসরি মেইন ফাইলে মাউন্ট করার জন্য ইম্পোর্ট
import { auth } from "./config/auth.config.js";
import { toNodeHandler } from "better-auth/node";

const app = express();

// --- ১. গ্লোবাল মিডলওয়্যার ---
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- ২. রাউটিং (Routes) ---
app.use('/api', healthRoutes);

// =========================================================================
// 👑 THE MASTER SEQUENCING FIX: কাস্টম লগইন এবং Better-Auth এর সহাবস্থান
// =========================================================================
// 🧠 Developer Thought Process: এক্সপ্রেস যখন দেখে ওপরে ক্যাচ-অল নোড হ্যান্ডলার বসা, 
// সে তখন নিচের লাইনে থাকা কাস্টম রাউট রিড না করে সরাসরি ৪০৪ এরর ছুঁড়ে মারে। 
// সিকোয়েন্স উল্টে প্রথমে আপনার কাস্টম মেইল-পাসওয়ার্ড রাউট দেওয়ায় এক্সপ্রেস সেটি আগে মেলাবে। 
// যদি রিকোয়েস্ট সেখানে ম্যাচ না করে (যেমন সোশাল সাইন-ইন), তবেই সে নিচে Better-Auth-কে পাস করবে।
app.use('/api/auth', authRoutes); // 🚀 ১. কাস্টম মেইল-পাসওয়ার্ড এপিআই চেইন আগে রান হবে
app.use('/api/auth', toNodeHandler(auth)); // 🚀 ২. ক্যাচ-অল Better-Auth নোড নিচে থাকবে

// বাকি এক্সিস্টিং রাউটগুলো আগের মতোই ১০০% অক্ষত ও সচল থাকবে...
app.use('/api/payment', paymentRoutes); 
app.use('/api/content', contentRoutes);
app.use('/api/comment', commentRoutes); 
app.use('/api/wishlist', wishlistRoutes);
app.use("/api/review", reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- ৩. গ্লোবাল এরর হ্যান্ডলার (ক্যাচ-অল) ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found!' });
});

export default app;