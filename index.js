import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// ১. সবার আগে .env কনফিগারেশন লোড করা
dotenv.config({
    path: './.env' // যেহেতু index.js এখন src এর ভেতরে, তাই .env এক ফোল্ডার পেছনে (../) আছে
});

const PORT = process.env.PORT || 5000;

// ২. ডাটাবেস কানেকশন কল করা
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.log("❌ Server connection failed due to Database issue!", err);
    });