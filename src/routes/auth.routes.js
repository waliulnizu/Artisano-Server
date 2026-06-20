import express from 'express';
import { registerUser, loginUser, getMe, logoutUser } from '../controllers/auth.controller.js'; // getMe ইমপোর্ট করা হলো
import { protect } from '../middlewares/auth.middleware.js'; // দারোয়ানকে (guard) ইমপোর্ট করা হলো

const router = express.Router();

// 📌 Public Routes (যে কেউ আসতে পারবে, কোনো গার্ড নেই)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// 📌 Protected Routes (এখানে আগে দারোয়ান চেক করবে, তারপর কন্ট্রোলারে যাবে)
// লজিক: যখনই কেউ GET /me তে রিকোয়েস্ট পাঠাবে, প্রথমে protect ফাংশন রান হবে। 
// protect যদি next() কল করে, তবেই getMe ফাংশন রান হবে।
router.get('/me', protect, getMe);

export default router;