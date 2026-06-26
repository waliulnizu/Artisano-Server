import multer from "multer";

// মেমোরি স্টোরেজ ব্যবহার করা প্রফেশনাল কারণ ফাইলগুলো সরাসরি সার্ভারে সেভ না করে 
// মেমোরিতে ধরে রেখে ক্লাউডিনারিতে পাঠানো যায়।
const storage = multer.memoryStorage(); 

export const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // সর্বোচ্চ 10 এমবি সাইজ
});