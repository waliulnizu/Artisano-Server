import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// --- রাউটগুলো মডার্ন নিয়মে ইম্পোর্ট করা ---
import healthRoutes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js'; 
import contentRoutes from './routes/content.routes.js';
import paymentRoutes from './routes/payment.route.js';
import commentRoutes from './routes/comment.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import transactionRouter from "./routes/transaction.routes.js";
import mockPaymentRouter from "./routes/mockPayment.routes.js";
import adminRouter from "./routes/admin.routes.js";
import settingsRouter from "./routes/settings.routes.js";

// 👑 [ESM CHECKOUT FIX]: ডুপ্লিকেট রিমুভড এবং সিঙ্গেল ক্লিন ইম্পোর্ট
import checkoutRoutes from "./routes/checkout.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";

// Better-Auth কনফিগ
import { auth } from "./config/auth.config.js";
import { toNodeHandler } from "better-auth/node";

const app = express();

// --- ১. গ্লোবাল মিডলওয়্যার ---
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 👑 [ROUTE REGISTER]: স্ট্রাইপ রাউট রেজিস্ট্রেশন
app.use("/api/checkout", checkoutRoutes);
app.use("/api/stripe", stripeRoutes);

// --- ২. রাউটিং (Routes) ---
app.use('/api', healthRoutes);

// =========================================================================
// 👑 THE MASTER SEQUENCING FIX: কাস্টম লগইন এবং Better-Auth এর সহাবস্থান
// =========================================================================
app.use('/api/auth', authRoutes); 
app.use('/api/auth', toNodeHandler(auth)); 

// বাকি এক্সিস্টিং রাউটগুলো
app.use('/api/payment', paymentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use("/api/review", reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/transactions", transactionRouter);
app.use("/api/mock-payment", mockPaymentRouter);
app.use("/api/admin-control", adminRouter);
app.use("/api/settings", settingsRouter);

// --- ৩. গ্লোবাল এরর হ্যান্ডলার (ক্যাচ-অল) ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found!' });
});

export default app;