import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`\n✅ MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Failed!', error);
        process.exit(1); // ডাটাবেস কানেক্ট না হলে সার্ভার ক্র্যাশ করে বন্ধ হয়ে যাবে (এটি সেফটি ফিচার)
    }
};

export default connectDB;