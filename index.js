import dotenv from 'dotenv';
import express from 'express'; // এক্সপ্রেস ইম্পোর্ট নিশ্চিত করা হলো

// =========================================================================
// 🚀 ১. সবার আগে সর্বপ্রধান লাইনে .env কনফিগারেশন এক্সিকিউট করা হলো
// =========================================================================
dotenv.config({
    path: './.env' 
});

import connectDB from './src/config/db.js'; 
import app from './src/app.js';            

// 👑 [COOKIE LOOP FIX]: লাইভ ক্লাউড সার্ভারে (Render) কুকি আদান-প্রদান সচল করার জন্য মাস্ট
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// =========================================================================
// 🔌 ২. ডাটাবেস কানেকশন এবং এক্সপ্রেস সার্ভার লিসেনিং
// =========================================================================
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Artisano Global Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.log("❌ Server connection failed due to Database issue!", err);
    });