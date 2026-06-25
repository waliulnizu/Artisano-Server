/**
 * ============================================================
 * 👑 ADMIN SEEDER SCRIPT
 * ============================================================
 * এই script একবার run করলে admin account তৈরি হবে।
 * 
 * Run Command (server folder থেকে):
 *   node src/scripts/createAdmin.js
 * ============================================================
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import User from "../models/user.model.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const ADMIN_DATA = {
    name: "Admin",
    email: "admin@arthub.com",
    password: "Admin@123",
    role: "admin",
};

const createAdmin = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected!\n");

        // আগে থেকে আছে কিনা check করো
        const existing = await User.findOne({ email: ADMIN_DATA.email });

        if (existing) {
            if (existing.role !== "admin") {
                // Account আছে কিন্তু admin না — role update করো
                existing.role = "admin";
                await existing.save();
                console.log(`✅ Existing user (${ADMIN_DATA.email}) upgraded to admin role!`);
            } else {
                console.log(`ℹ️  Admin account already exists: ${ADMIN_DATA.email}`);
            }
        } else {
            // নতুন admin তৈরি করো
            await User.create(ADMIN_DATA);
            console.log(`✅ Admin account created successfully!`);
            console.log(`   Email   : ${ADMIN_DATA.email}`);
            console.log(`   Password: ${ADMIN_DATA.password}`);
            console.log(`   Role    : admin`);
        }

    } catch (error) {
        console.error("❌ Error creating admin:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 MongoDB disconnected. Done!");
        process.exit(0);
    }
};

createAdmin();
