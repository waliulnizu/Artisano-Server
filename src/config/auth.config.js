import dotenv from "dotenv";
import path from "path";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// 👑 [DYNAMIC ORIGINS PROD FIX]: ব্যাকএন্ড ও ফ্রন্টএন্ড সব লাইভ লিঙ্ক এখানে লক করা হলো
const trustedOriginsList = [
    "http://localhost:3000",          
    "http://localhost:5000",          
    "https://artisano.vercel.app",             // লাইভ ফ্রন্টএন্ড
    "https://artisano-server.onrender.com",    // 🚨 মাস্ট: লাইভ ব্যাকএন্ড নিজের ডোমেইন
    process.env.NEXT_PUBLIC_APP_URL,  
    process.env.CLIENT_URL            
].filter(Boolean);                    

export const auth = betterAuth({
    // ডাটাবেস অ্যাডাপ্টার
    database: mongodbAdapter(new Proxy({}, {
        get: (_, prop) => mongoose.connection.db[prop]
    })),
    
    // 👑 [CRITICAL LIVE FIX]: লাইভ প্রোডাকশনের জন্য সম্পূর্ণ এপিআই রুটটি ফলব্যাক হিসেবে এনফোর্স করা হলো
    baseURL: process.env.BETTER_AUTH_URL || "https://artisano-server.onrender.com/api/auth", 
    trustHost: true, // 🚨 Vercel/Render-এর মতো Proxy সার্ভারে HTTP/HTTPS কনফ্লিক্ট দূর করতে ఇది মাস্ট!
    
    // নতুন ডাইনামিক অ্যারে এখানে বসানো হলো
    trustedOrigins: trustedOriginsList,

    // 👑 [CROSS-DOMAIN COOKIE FIX]: ভিন্ন ভিন্ন ডোমেনে (Render -> Vercel) কুকি পাস করানোর জন্য
    advanced: {
        cookieOptions: {
            sameSite: "none", // লাইভ প্রোডাকশনে ভিন্ন ডোমেন সাপোর্ট করবে
            secure: true      // লাইভ প্রোডাকশনের HTTPS নিশ্চিত করবে
        }
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },

    // =========================================================
    // 📦 MongoDB Collection Mapping (বাকি কোড আগের মতোই থাকবে...)
    // =========================================================
    user: {
        modelName: "google_users",
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user"
            }
        }
    },
    session: {
        modelName: "google_sessions",
    },
    account: {
        modelName: "google_accounts",
    },
    verification: {
        modelName: "google_verifications",
    },

    databaseHooks: {
        user: {
            create: {
                before: async (user, context) => {
                    let targetRole = "user"; 

                    try {
                        if (context?.request) {
                            const cookieHeader = context.request.headers.get("cookie") || "";
                            const cookieMatch = cookieHeader.match(/pending_role=([^;]+)/);
                            if (cookieMatch) {
                                const cookieRole = cookieMatch[1].trim();
                                if (cookieRole === "artist" || cookieRole === "admin") {
                                    targetRole = cookieRole;
                                }
                            }
                        }
                    } catch (e) {
                        // Error handling
                    }

                    return {
                        data: {
                            ...user,
                            role: targetRole,
                        },
                    };
                },
            },
        },
    },
});