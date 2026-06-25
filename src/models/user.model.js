import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ১. ইউজারের স্কিমা (ছাঁচ) তৈরি করা
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true, // নামের আগে-পিছে স্পেস থাকলে কেটে দেবে
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true, // একই ইমেইলে দুজন অ্যাকাউন্ট খুলতে পারবে না
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // ডাটাবেস থেকে ইউজার খুঁজলে ডিফল্টভাবে পাসওয়ার্ড দেখাবে না (সিকিউরিটি)
        },
        role: {
            type: String,
            enum: ['user', 'artist', 'admin'], // এই ৩টি ছাড়া অন্য কোনো রোল দেওয়া যাবে না
            default: 'user', // অ্যাকাউন্ট খুললে ডিফল্টভাবে সে 'user' হবে
        },
        subscriptionTier: {
            type: String,
            enum: ['free', 'pro', 'premium'],
            default: 'free',
        },
        profileImage: {
            type: String,
            default: 'https://i.ibb.co/4pDNDk1/avatar.png', // ডিফল্ট একটি ডামি ছবি
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Content'
            }
        ]
    },
    {
        timestamps: true, // এটি দিলে createdAt এবং updatedAt নামে দুটি ফিল্ড অটোমেটিক তৈরি হবে
    }
);

// ২. ডাটাবেসে সেভ হওয়ার ঠিক আগে পাসওয়ার্ড হ্যাশ (লুকানোর) করার লজিক (Pre-save Hook)
userSchema.pre('save', async function () {
    // যদি পাসওয়ার্ড পরিবর্তন না হয়, তাহলে এটি স্কিপ করে সামনে যাও
    if (!this.isModified('password')) return;

    // পাসওয়ার্ড পরিবর্তন বা নতুন হলে সেটিকে হ্যাশ করো (12 rounds of salt)
    this.password = await bcrypt.hash(this.password, 12);
});

// ৩. লগইন করার সময় ইউজারের দেওয়া পাসওয়ার্ড আর ডাটাবেসের হ্যাশ পাসওয়ার্ড মেলানোর ফাংশন
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// ৪. মডেল তৈরি এবং এক্সপোর্ট করা
const User = mongoose.model('User', userSchema);
export default User;