import dotenv from 'dotenv';
import express from 'express'; 

dotenv.config({
    path: './.env' 
});

import connectDB from './src/config/db.js'; 
import app from './src/app.js';            

app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.log("Server connection failed due to Database issue!", err);
    });