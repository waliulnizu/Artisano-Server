import dotenv from "dotenv";
import path from "path";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const auth = betterAuth({
    // ডাটাবেস অ্যাডাপ্টার হিসেবে আপনার অলরেডি কানেক্টেড মঙ্গুজ প্রক্সি ড্রাইভার ব্যবহার করা হলো
    database: mongodbAdapter(new Proxy({}, {
        get: (_, prop) => mongoose.connection.db[prop]
    })),
    
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    trustedOrigins: ["http://localhost:3000"],

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },

    // =========================================================
    // 📦 MongoDB Collection Mapping — Google OAuth আলাদা
    // =========================================================
    // Google OAuth users  → google_users
    // Google sessions     → google_sessions
    // Google accounts     → google_accounts
    // Email/pass users    → users  (existing mongoose model)
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
    // 👑 FIX 2: ওআউথ ইনকামিং রিকোয়েস্ট রেফারার ট্র্যাকিং হুক
    // =========================================================================
    databaseHooks: {
        user: {
            create: {
                before: async (user, context) => {
                    let targetRole = "user"; // Default role

                    try {
                        if (context?.request) {
                            // =========================================================
                            // 👑 THE COOKIE METHOD - সবচেয়ে নির্ভরযোগ্য পদ্ধতি
                            // =========================================================
                            // Google OAuth flow-এ client থেকে header/query যায় না।
                            // কিন্তু client Google-এ যাওয়ার আগে 'pending_role' cookie
                            // set করে রাখে — সেটা OAuth callback-এও থাকে।
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
                        // Role detection না হলে default "user" থাকবে
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