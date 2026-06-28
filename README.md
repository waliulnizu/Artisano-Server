# ArtHub – Online Art Marketplace (Server)

## Project Overview
The backend API for ArtHub, an online marketplace connecting artists and buyers. The server handles authentication, secure data storage, payment processing logic, and business rules for the platform.

## Live URL
[https://artisano-server.onrender.com/api](https://artisano-server.onrender.com/api)

## Key Features
- **RESTful API:** Built with Express.js to serve the frontend client.
- **Secure Authentication:** JWT-based authentication combined with Better-Auth for OAuth handling.
- **Database Management:** MongoDB with Mongoose ODM for structured, schema-based data modeling.
- **Role-Based Access Control (RBAC):** Middleware protecting routes based on roles (User, Artist, Admin).
- **Payment Processing (Stripe):** Endpoint logic to handle subscriptions (Pro/Premium) and one-time artwork purchases.
- **Image Management:** Integration with Cloudinary for handling artwork image uploads.
- **Analytics Engine:** Aggregation queries to provide the Admin with sales data and platform statistics.

## Tech Stack & npm Packages Used
- Node.js & Express (5.2.1)
- MongoDB & Mongoose
- Better-Auth & JsonWebToken (for authentication & security)
- bcryptjs (for password hashing)
- Cloudinary & Multer (for image uploads and parsing)
- Stripe (for server-side payment processing)
- Cors & dotenv

## Setup & Local Development
1. Clone the repository.
2. Run `pnpm install` to install dependencies.
3. Ensure you have the environment variables set up in your `.env` (for local) and `.env.production` (for live). The required variables are:
   - `PORT`
   - `CLIENT_URL`
   - `FRONTEND_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_FOLDER_NAME`
   - `STRIPE_SECRET_KEY`
4. Run `pnpm dev` to start the server in development mode.
