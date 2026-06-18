import { Router } from 'express';
// loginUser ইমপোর্ট করা হলো
import { registerUser, loginUser } from '../controllers/auth.controller.js';

const router = Router();

// রেজিস্ট্রেশন রাউট
router.post('/register', registerUser);

// লগইন রাউট
router.post('/login', loginUser);

export default router;