// src/lib/constants.js

// 🧠 Developer Thought: আমরা এনভায়রনমেন্ট চেক করব। প্রজেক্ট যদি ডেভেলপমেন্ট মোডে (Localhost) থাকে, 
// তবে লোকাল পোর্ট ধরবে, আর প্রোডাকশনে (Live) গেলে ডাইনামিক রিয়েল ডোমেইন ধরবে।
// src/lib/constants.js
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";