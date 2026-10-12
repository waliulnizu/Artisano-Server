import dotenv from "dotenv";
import path from "path";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const trustedOriginsList = [
    "http://localhost:3000",          
    "http://localhost:5000",          
    "https://artisano.vercel.app",
    "https://artisano-server.onrender.com",
    process.env.NEXT_PUBLIC_APP_URL,  
    process.env.CLIENT_URL            
].filter(Boolean);                    

export const auth = betterAuth({
    database: mongodbAdapter(new Proxy({}, {
        get: (_, prop) => mongoose.connection.db[prop]
    })),
    
    baseURL: process.env.BETTER_AUTH_URL || "https://artisano-server.onrender.com/api/auth", 
    trustHost: true,
    
    trustedOrigins: trustedOriginsList,

    advanced: {
        crossSubDomain: true,
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true
        }
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },

    // =========================================================
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