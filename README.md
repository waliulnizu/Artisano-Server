# Artisano — Online Art Marketplace (Server)

## Project Overview

The backend API for Artisano, a digital art marketplace connecting artists with collectors. Built with Express 5 and MongoDB, it handles authentication (dual JWT + Better Auth), payment processing (Stripe), role-based access control, and media management (Cloudinary).

## Live URL

**Backend API:** [https://artisano-server.onrender.com/api](https://artisano-server.onrender.com/api)

---

## How the Server Works

### Architecture

```
Client (Next.js) → API Routes → Middleware Chain → Controllers → MongoDB
```

1. **Request arrives** → Express middleware processes (CORS, JSON parsing, cookies)
2. **Auth check** → `protect` middleware verifies JWT cookie OR Better Auth session
3. **Role check** → `isArtist`, `isAdmin`, `authorizeRoles` verify permissions
4. **Business logic** → Controllers handle the operation
5. **Database** → Mongoose models or raw MongoDB collections
6. **Response** → JSON with `{ success: true/false, data/message }`

### Authentication System (Dual Auth)

The server supports **two authentication methods** simultaneously:

| Method | How It Works | User Collection |
|---|---|---|
| **JWT (Email/Password)** | Token in httpOnly cookie, verified with `jsonwebtoken` | `users` collection |
| **Better Auth (Google OAuth)** | Session via better-auth, verified with `auth.api.getSession()` | `google_users` collection |

The `protect` middleware checks **both** methods:
1. First tries JWT cookie → if valid, `req.user` is set
2. If no JWT, tries Better Auth session → if valid, `req.user` is set from `google_users`
3. If neither, returns 401

### Role-Based Access Control (RBAC)

```
Public → No auth required
Protected → Valid JWT or Better Auth session
Artist/Admin → Role must be "artist" or "admin"
Admin Only → Role must be "admin"
```

### Membership Tiers

| Tier | Monthly Price | Artwork Quota | Upload Limit | Label |
|---|---|---|---|---|
| **Free** | $0 | 3 artworks/month | 3 lifetime | Starter Spark |
| **VIP Pro** | $29/month | 25 artworks/month | 25 lifetime | VIP Premium Pro |
| **Enterprise** | $99/month | Unlimited | Unlimited | Studio Enterprise |

**Key:** Quota is a **monthly window** (resets every calendar month UTC), not lifetime.

---

## API Endpoints

Base URL: `http://localhost:5000/api` (local) or `https://artisano-server.onrender.com/api` (production)

### Health Check

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/` | API health check | Public |

### Auth Routes (`/api/auth`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/register` | Register new user (name, email, password, role) | Public |
| `POST` | `/login` | Login with email/password → JWT cookie | Public |
| `POST` | `/logout` | Clear JWT cookie | Public |
| `GET` | `/me` | Get current user profile (resolves premium state) | Protected |
| `GET` | `/public-users` | List all public creators (artists/admins) with artwork count | Public |
| `PATCH` | `/change-password` | Change password (current + new) | Protected |
| `PATCH` | `/update-profile` | Update profile (with avatar upload via Multer) | Protected |
| `POST` | `/upgrade` | Upgrade to Premium membership | Protected |
| `PATCH` | `/update-role` | Update own role (user ↔ artist) | Protected |
| `GET` | `/admin/users` | List all users (no passwords) | Admin |
| `PUT` | `/admin/users/:id` | Update user role/premium status | Admin |

### Content Routes (`/api/content`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/public-data` | List artworks with search ($text), filter, sort, pagination | Public |
| `GET` | `/premium-data` | List all artworks (premium + free) | Premium/Admin |
| `POST` | `/create` | Create new artwork (image upload via Multer → Cloudinary) | Artist/Admin |
| `PUT` | `/:id` | Update artwork (author or admin only) | Protected |
| `DELETE` | `/:id` | Delete artwork (author or admin only) | Protected |
| `GET` | `/artist-assets` | List current artist's artworks | Protected |
| `GET` | `/artist-profile` | Creator dossier — catalog size, acquired works, collector count | Public |
| `GET` | `/:id` | Single artwork detail (includes collector count) | Public |
| `POST` | `/upload` | Upload standalone image to Cloudinary | Protected |

### Comment Routes (`/api/comment`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/create` | Create comment on artwork | Protected |
| `GET` | `/artwork/:artworkId` | Get all comments for an artwork | Public |
| `GET` | `/my` | Get all comments written by current user | Protected |
| `PUT` | `/update` | Update a comment | Protected |
| `DELETE` | `/delete` | Delete a comment | Protected |

### Review Routes (`/api/review`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/submit` | Submit review with rating | Protected |
| `GET` | `/artwork/:artworkId` | Get all reviews for an artwork | Public |
| `GET` | `/my` | Get all reviews written by current user | Protected |
| `PUT` | `/update` | Update a review | Protected |
| `DELETE` | `/delete` | Delete a review | Protected |

### Wishlist Routes (`/api/wishlist`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/toggle` | Toggle wishlist status for an artwork | Protected |
| `GET` | `/` | Get current user's wishlist | Protected |
| `GET` | `/my-list` | Alias for above | Protected |

### Transaction Routes (`/api/transactions`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/acquired` | Collector's purchased artworks with receipts (value, currency, date) | Protected |
| `GET` | `/history` | Full purchase history (artworks + subscriptions) with enriched data | Protected |

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/user-stats` | Collector stats — quota, tier, purchase count, wishlist count | Protected |
| `GET` | `/artist-stats` | Artist stats — total assets, sales, earnings | Artist |
| `GET` | `/admin-stats` | Admin stats — total users, artworks, premium users | Admin |

### Stripe Routes (`/api/stripe`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/create-checkout-session` | Create Stripe subscription checkout (VIP membership) | Public |
| `POST` | `/verify-payment` | Verify subscription payment & upgrade user to premium | Public |
| `POST` | `/create-single-purchase-session` | Create Stripe one-time purchase (artwork) with quota enforcement | Protected |
| `POST` | `/verify-single-purchase` | Verify artwork purchase & record transaction (validates receipt ownership) | Protected |
| `GET` | `/check-ownership` | Check if user owns artwork + quota info + collector count | Protected |
| `GET` | `/admin/sales-analytics` | 7-day sales revenue chart data (aggregation pipeline) | Admin |

### Checkout Routes (`/api/checkout`)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/create-checkout-session` | Legacy Stripe subscription checkout | Public |

---

## Tech Stack & Packages

| Category | Technology |
|---|---|
| **Runtime** | Node.js (ES Modules) |
| **Framework** | Express 5.2.1 |
| **Database** | MongoDB 7.3 + Mongoose 9.7 |
| **Auth** | Better Auth 1.6.2 + jsonwebtoken 9 |
| **Password Hashing** | bcryptjs 3 |
| **File Upload** | Multer 2.2 |
| **Media** | Cloudinary 2.10 |
| **Payments** | Stripe 22.3 |
| **CORS** | cors 2.8 |
| **Cookies** | cookie-parser 1.4 |
| **Env** | dotenv 17.4 |
| **Dev** | nodemon 3.1 |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000

# CORS — allowed origins
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/artisano

# Auth
JWT_SECRET=your-super-secret-jwt-key
BETTER_AUTH_SECRET=your-better-auth-secret
BETTER_AUTH_URL=http://localhost:5000/api/auth

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER_NAME=Artisano

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (default: 5000) |
| `CLIENT_URL` | Yes | Allowed CORS origin (frontend URL) |
| `FRONTEND_URL` | Yes | Frontend URL for Stripe redirect |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL for Stripe redirect |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT token signing secret |
| `BETTER_AUTH_SECRET` | Yes | Better Auth encryption secret |
| `BETTER_AUTH_URL` | Yes | Better Auth server URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `CLOUDINARY_FOLDER_NAME` | No | Cloudinary folder name (default: Artisano) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |

---

## Setup & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/waliulnizu/Artisano-Server.git
cd Artisano-Server

# 2. Install dependencies
pnpm install

# 3. Create .env with the variables above

# 4. Start development server
pnpm dev
```

The server runs on `http://localhost:5000`

---

## Database Models

### User (Mongoose Model — `users` collection)
```
_id, name, email, password, role, profileImage,
subscriptionTier, isPremium, wishlist[], createdAt, updatedAt
```

### Google Users (better-auth — `google_users` collection)
```
_id, name, email, emailVerified, image, role,
subscriptionTier, isPremium, createdAt, updatedAt
```

### Content (Mongoose Model — `contents` collection)
```
_id, title, description, category, price, isPremiumOnly,
resourceLink, featuredImage, author (ref User), status, createdAt
```

### Comment (Mongoose Model — `comments` collection)
```
_id, user (ref User), artworkId (ref Content),
text, createdAt, updatedAt
```

### Review (Mongoose Model — `reviews` collection)
```
_id, user (ref User), artworkId (ref Content),
rating, comment, createdAt, updatedAt
```

### Transaction (Mongoose Model — `transactions` collection)
```
_id, transactionId, user (ref User), amount, currency,
status, packageName, createdAt
```

### Wishlist (Mongoose Model — `wishlists` collection)
```
_id, user (ref User), items (array of Content refs), createdAt
```

---

## Middleware Chain

```
┌─────────────────────────────────────────────────────┐
│  Request                                            │
├─────────────────────────────────────────────────────┤
│  1. CORS — check origin whitelist                  │
│  2. JSON parsing — express.json()                   │
│  3. Cookie parsing — cookieParser()                 │
│  4. protect — JWT verify OR Better Auth session     │
│  5. Role check — isArtist / isAdmin / authorizeRoles │
│  6. Business check — checkUploadLimit / canComment │
│  7. Controller — handle the request                 │
│  8. Response — JSON { success, data }               │
└─────────────────────────────────────────────────────┘
```

---

## Security Features

- **Dual auth** — JWT + Better Auth session validation
- **Role-based access** — Middleware chain protects routes
- **Quota enforcement** — Monthly acquisition limits per tier
- **Receipt ownership** — Stripe session metadata prevents fraud
- **Self-purchase block** — Cannot buy own artwork
- **CORS whitelist** — Only allowed origins can access
- **Password hashing** — bcryptjs with salt rounds
- **No password leakage** — Passwords stripped from all responses

---

## Package Manager

This project uses **pnpm** (pnpm-lock.yaml is tracked).
