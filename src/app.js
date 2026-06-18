import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// রাউটগুলো ইমপোর্ট করা
import healthRoutes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// --- ১. গ্লোবাল মিডলওয়্যার ---
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- ২. রাউটিং (Routes) ---
// হেলথ চেক রাউট
app.use('/api/v1', healthRoutes);

// অথেনটিকেশন রাউট (রেজিস্ট্রেশন, লগইন সব এর ভেতরে থাকবে)
app.use('/api/v1/auth', authRoutes);

// --- ৩. গ্লোবাল এরর হ্যান্ডলার ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found!' });
});

export default app;