import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// ১. Environment variables লোড করা (যাতে .env এর ডাটা পড়তে পারে)
dotenv.config();

// ২. Express অ্যাপ তৈরি করা
const app = express();
const PORT = process.env.PORT || 5000;

// ৩. মিডলওয়্যার (Middlewares) সেটআপ
// ফ্রন্টএন্ড (localhost:3000) থেকে যেন ডেটা আসতে পারে এবং কুকি শেয়ার করা যায়
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json()); // ক্লায়েন্ট থেকে আসা JSON ডাটা রিসিভ করার জন্য
app.use(cookieParser()); // ব্রাউজারের কুকি রিড করার জন্য

// ৪. সাধারণ একটি রাউট (টেস্টিংয়ের জন্য)
app.get('/', (req, res) => {
    res.send('Artisano Server is running!');
});

// ৫. MongoDB কানেকশন এবং সার্ভার রান করা
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        // ডাটাবেস কানেক্ট হওয়ার পরেই আমরা সার্ভারটি চালু করব
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB Connection Failed!', error);
    });