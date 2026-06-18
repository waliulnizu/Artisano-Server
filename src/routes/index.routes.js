import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';

const router = Router();

// হেলথ চেক রাউট (টেস্টিংয়ের জন্য)
router.get('/', healthCheck);

export default router;