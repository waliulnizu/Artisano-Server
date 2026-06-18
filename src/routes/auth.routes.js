import { Router } from 'express';
import { registerUser } from '../controllers/auth.controller.js';

const router = Router();

// ফ্রন্টএন্ড যখন /register এ POST রিকোয়েস্ট পাঠাবে, তখন registerUser ফাংশনটি কাজ করবে
router.post('/register', registerUser);

export default router;