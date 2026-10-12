import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'artist', 'admin'],
            default: 'user',
        },
        // 👑 Stripe writes the *raw* plan name ("VIP Premium Pro",
        //    "Studio Enterprise") straight into this field, so it must stay a
        //    plain string — a schema enum would strip it on write and, worse,
        //    blow up validation on any later .save().
        //    Every quota/permission decision goes through normalizeTier().
        subscriptionTier: {
            type: String,
            default: 'free',
        },
        // ⚠️ This flag used to be missing from the schema entirely, so mongoose
        //    silently dropped it from every User.findById() result: paying VIPs
        //    were 403'd out of the premium room because req.user.isPremium was
        //    undefined while /auth/me (raw collection) still said true.
        isPremium: {
            type: Boolean,
            default: false,
        },
        profileImage: {
            type: String,
            default: 'https://i.ibb.co/4pDNDk1/avatar.png',
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Content'
            }
        ]
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
export default User;