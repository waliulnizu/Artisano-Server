import dotenv from "dotenv";
import path from "path";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// 👑 [DYNAMIC ORIGINS FIX]: লোকালহোস্ট এবং লাইভ ভার্সেল দুই জায়গার রিকোয়েস্ট হ্যান্ডেল করার জন্য
const trustedOriginsList = [
    "http://localhost:3000",          // লোকাল ফ্রন্টএন্ড ব্যাকআপ
    process.env.NEXT_PUBLIC_APP_URL,  // লাইভ ফ্রন্টএন্ড (https://artisano.vercel.app)
    process.env.CLIENT_URL            // ব্যাকআপ লাইভ ফ্রন্টএন্ড
].filter(Boolean);                    // ফাঁকা বা undefined মানগুলো ফিল্টার করে বাদ দেবে

export const auth = betterAuth({
    // ডাটাবেস অ্যাডাপ্টার
    database: mongodbAdapter(new Proxy({}, {
        get: (_, prop) => mongoose.connection.db[prop]
    })),
    
    // 👑 লোকালহোস্টে BETTER_AUTH_URL না থাকলে অটোমেটিক লোকাল ব্যাকআপ সেট হবে
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000", 
    
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
    // 📦 MongoDB Collection Mapping
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

    // =========================================================================
    // 👑 ওআউথ ইনকামিং রিকোয়েস্ট রেফারার ট্র্যাকিং হুক
    // =========================================================================
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