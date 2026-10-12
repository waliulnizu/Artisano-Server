import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import healthRoutes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js'; 
import contentRoutes from './routes/content.routes.js';
import paymentRoutes from './routes/payment.route.js';
import commentRoutes from './routes/comment.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import transactionRouter from "./routes/transaction.routes.js";
import mockPaymentRouter from "./routes/mockPayment.routes.js";
import adminRouter from "./routes/admin.routes.js";
import settingsRouter from "./routes/settings.routes.js";

import checkoutRoutes from "./routes/checkout.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";

import { auth } from "./config/auth.config.js";
import { toNodeHandler } from "better-auth/node";

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "https://artisano.vercel.app",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Security Alert: Blocked by CORS Policy!"));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/checkout", checkoutRoutes);
app.use("/api/stripe", stripeRoutes);

app.use('/api', healthRoutes);

app.use('/api/auth', authRoutes); 

app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
        return toNodeHandler(auth)(req, res);
    }
    next();
});

app.use('/api/payment', paymentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use("/api/review", reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/transactions", transactionRouter);
app.use("/api/mock-payment", mockPaymentRouter);
app.use("/api/admin-control", adminRouter);
app.use("/api/settings", settingsRouter);

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found!' });
});

export default app;