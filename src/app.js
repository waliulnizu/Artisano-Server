import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// রাউটগুলো ইমপোর্ট করা
import healthRoutes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js';
import contentRoutes from './routes/content.routes.js';

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

// অথেনটিকেশন রাউট 
app.use('/api/v1/auth', authRoutes);

// 📌 ফিক্স: contentRoutes কে গ্লোবাল এরর হ্যান্ডলারের উপরে বসানো হলো
app.use('/api/v1/content', contentRoutes);

// --- ৩. গ্লোবাল এরর হ্যান্ডলার (ক্যাচ-অল) ---
// 🧠 Developer Thought: 404 হ্যান্ডলার সবসময় ফাইলের একদম শেষে থাকতে হয়। 
// উপরের কোনো রাউটের সাথে ম্যাচ না করলেই কেবল রিকোয়েস্ট এখানে এসে ড্রপ করবে।
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found!' });
});

export default app;