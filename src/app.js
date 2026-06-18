import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.routes.js';

const app = express();

// --- ১. গ্লোবাল মিডলওয়্যার (Middlewares) ---
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- ২. রাউটিং (Routes) ---
// সব রাউটের শুরুতে /api/v1 যোগ করে দেওয়া হলো (Standard API Versioning)
app.use('/api/v1', routes);

// --- ৩. গ্লোবাল এরর হ্যান্ডলার ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found!' });
});

export default app;