# SnapMart — Multivendor eCommerce Platform

SnapMart is a production-ready, full-stack multivendor marketplace built with **Next.js 16 App Router**. Multiple vendors can list products, manage orders, and earn revenue while customers shop with cart checkout, wishlists, COD/Stripe payments, order tracking, returns, and ML-powered insights.

| | |
|---|---|
| **Live demo** | [https://snapmart-virid.vercel.app](https://snapmart-virid.vercel.app) |
| **Repository** | [github.com/neev-25/snap-mart-multivendor-ecommerce](https://github.com/neev-25/snap-mart-multivendor-ecommerce) |
| **Author** | Neev Mendapara |

---

## Table of Contents

- [Overview](#overview)
- [Features by Role](#features-by-role)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Database Models](#database-models)
- [Business Rules](#business-rules)
- [Order Lifecycle](#order-lifecycle)
- [Email Notifications](#email-notifications)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Overview

SnapMart simulates a real-world marketplace (Flipkart/Amazon-style) with three distinct roles:

| Role | Access |
|------|--------|
| **Customer (`user`)** | Browse, cart, wishlist, checkout, track orders, returns, support chat |
| **Vendor (`vendor`)** | Add/edit products, manage orders, delivery OTP, ML dashboard |
| **Admin (`admin`)** | Approve vendors & products, manage coupons, view all orders & sentiment |

Authentication uses **NextAuth v5** (email/password + Google OAuth). Payments support **Cash on Delivery** and **Stripe Checkout** with webhook confirmation.

---

## Features by Role

### Customer
- Product browsing by category, shop, and text search
- CLIP-based visual image search
- Shopping cart (single-item or full-cart checkout)
- Wishlist with heart toggle on product cards
- Coupon codes at checkout
- COD and Stripe online payment
- Order tracking (pending → confirmed → shipped → delivered)
- Order cancellation and returns (within replacement window)
- Follow vendor shops
- Product reviews (after delivery)
- ML price comparison on product pages
- Support chat with vendors from past orders

### Vendor
- Shop onboarding (name, address, GST) with admin approval
- Add/update products (4 images, commission negotiation)
- Toggle product active/inactive after approval
- Accept admin commission counter-offers
- Order management with status updates
- Delivery OTP flow (email OTP to buyer, vendor verifies)
- Finance dashboard (earnings, commissions)
- ML panels: review sentiment, pricing insights, stock alerts

### Admin
- Vendor approval/rejection with email notification
- Product approval, rejection, or commission counter-offer
- Platform-wide order view
- Coupon CRUD (percent/fixed, min order, expiry, usage limits)
- Review sentiment overview across platform
- Support chat with all vendors

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Motion (Framer Motion) |
| State | Redux Toolkit |
| Database | MongoDB Atlas, Mongoose |
| Auth | NextAuth v5 — Credentials + Google OAuth (JWT sessions) |
| Payments | Stripe Checkout + Webhooks |
| Media | Cloudinary (product & profile images) |
| Email | Nodemailer (Gmail SMTP) |
| ML / AI | Transformers.js (CLIP visual search), custom pricing/sentiment/stock libs |
| Charts | Recharts |
| Deploy | Vercel (serverless) |

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js App     │────▶│  MongoDB    │
│  (React UI) │     │  API Routes      │     │  Atlas      │
└─────────────┘     │  Server Actions  │     └─────────────┘
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Cloudinary      Stripe         Gmail SMTP
         (images)      (payments)      (emails)
```

- **Frontend**: Client components with Redux for global state; hooks fetch data on mount
- **Backend**: Next.js Route Handlers under `src/app/api/`
- **Auth**: JWT sessions via NextAuth; route guard in `src/proxy.ts` (Vercel middleware)
- **Orders**: Created in MongoDB first, then Stripe session; payment confirmed via webhook

---

## Project Structure

```
snapmart/
├── public/                    # Static assets
├── scripts/                   # Utility scripts (env sync, etc.)
├── src/
│   ├── app/                   # Pages & API routes (App Router)
│   │   ├── api/               # REST API endpoints
│   │   ├── cart/              # Shopping cart page
│   │   ├── checkout/          # Single & cart checkout
│   │   ├── category/          # Product listing & filters
│   │   ├── login/             # Auth pages
│   │   ├── orders/            # Customer order history
│   │   ├── shop/              # Vendor directory
│   │   ├── support/           # Chat support
│   │   ├── viewProduct/       # Product detail page
│   │   └── page.tsx           # Role-based home router
│   ├── auth.ts                # NextAuth configuration
│   ├── component/             # React components
│   │   ├── Admin/             # Admin dashboard panels
│   │   ├── Vendor/            # Vendor dashboard panels
│   │   ├── User/              # Shopper UI components
│   │   ├── ml/                # ML insight panels
│   │   ├── analytics/         # Finance charts
│   │   ├── layout/            # AppShell, Navbar, Footer
│   │   └── ui/                # Shared UI (Toast, EmptyState)
│   ├── hooks/                 # Data-fetching hooks
│   ├── lib/                   # Business logic
│   │   ├── ml/                # Sentiment, pricing, stock alerts
│   │   └── visualSearch/      # CLIP indexing & search
│   ├── model/                 # Mongoose schemas
│   ├── redux/                 # Global state slices
│   └── proxy.ts               # Auth middleware (route protection)
├── .env.local                 # Local secrets (not committed)
├── next.config.ts
├── package.json
└── README.md
```

---

## Pages & Routes

| Path | Auth | Description |
|------|------|-------------|
| `/` | Public (role UI when logged in) | Home — routes to User/Vendor/Admin dashboard or onboarding |
| `/login` | Public | Email/password + Google sign-in |
| `/register` | Public | Create account |
| `/forgot-password` | Public | Request password reset email |
| `/reset-password` | Public | Set new password via token |
| `/category` | Public | Browse & filter products |
| `/shop` | Public | Verified vendor directory |
| `/shopDetails/[id]` | Public | Vendor storefront + follow |
| `/viewProduct/[id]` | Public | Product detail, reviews, ML price compare |
| `/cart` | User | Shopping cart |
| `/checkout/[id]` | User | Single-item checkout |
| `/checkout/cart` | User | Full cart checkout |
| `/wishlist` | User | Saved products |
| `/orders` | User | Order history, track, cancel, return |
| `/order-success` | User | Post-checkout confirmation |
| `/order-failed` | User | Payment failure page |
| `/profile` | User | Edit profile & vendor shop details |
| `/support` | User | Chat with vendors/admin |
| `/addVendorProduct` | Vendor | Add new product form |
| `/updateProduct/[id]` | Vendor | Edit existing product |

> Admin and Vendor dashboards are embedded components on `/` when logged in with the matching role.

---

## Database Models

### User
| Field | Type | Notes |
|-------|------|-------|
| `name`, `email`, `phone`, `password`, `image` | — | Core profile |
| `role` | `user` \| `vendor` \| `admin` | Default: `user` |
| `shopName`, `shopAddress`, `gstNumber` | — | Vendor shop info |
| `verificationStatus` | `pending` \| `approved` \| `rejected` | Vendor approval |
| `cart[]` | `{ product, quantity }` | Embedded cart |
| `wishlist[]` | ObjectId[] | Product references |
| `followingVendors[]` | ObjectId[] | Followed shops |
| `chats[]` | Embedded messages | Support chat history |

### Product
| Field | Type | Notes |
|-------|------|-------|
| `title`, `description`, `price`, `stock`, `category` | — | Core listing |
| `image1`–`image4` | string | Cloudinary URLs |
| `vendor` | ObjectId → User | Owner |
| `verificationStatus`, `isActive` | — | Approval workflow |
| `replacementDays`, `freeDelivery`, `warranty` | — | Order/return rules |
| `commissionStatus`, `agreedCommissionPercent` | — | Vendor ↔ admin negotiation |
| `reviews[]` | Embedded | User ratings & comments |
| `visualEmbeddings` | number[][] | CLIP vectors for visual search |

### Order
| Field | Type | Notes |
|-------|------|-------|
| `orderNumber` | string | Human-readable ID (e.g. `SM20250630A3F9K2`) |
| `buyer`, `productVendor` | ObjectId → User | Parties |
| `products[]` | `{ product, quantity, price }` | Line items |
| `productsTotal`, `deliveryCharge`, `serviceCharge`, `totalAmount` | number | Pricing breakdown |
| `couponCode`, `couponDiscount` | — | Applied coupon |
| `platformCommission`, `vendorEarning` | number | Settlement |
| `paymentMethod` | `cod` \| `stripe` | Payment type |
| `isPaid`, `orderStatus` | — | Payment & fulfillment state |
| `address` | Embedded | Delivery address |
| `deliveryOtp`, `otpExpiresAt` | — | OTP delivery verification |

### Coupon
| Field | Type | Notes |
|-------|------|-------|
| `code` | string | Unique, uppercase |
| `discountType` | `percent` \| `fixed` | Discount mode |
| `discountValue`, `minOrderAmount` | number | Rules |
| `maxUses`, `usedCount`, `expiresAt`, `isActive` | — | Limits |

---

## Business Rules

| Rule | Value |
|------|-------|
| Service charge | ₹30 per order (`SERVICE_CHARGE`) |
| Default delivery | ₹50 per product (`DEFAULT_DELIVERY_CHARGE`) |
| Free delivery | Per-product flag bypasses delivery charge |
| Platform commission | 5–40% negotiated per product (`MIN`/`MAX_PLATFORM_COMMISSION_PERCENT`) |
| Order ID format | `SM` + date + random (e.g. `SM20250630A3F9K2`) |
| Return refund | Product amount only; delivery & service kept by platform |
| Stripe cancel | Paid Stripe orders cannot be cancelled via API |
| COD payment | Marked paid on successful OTP delivery |
| One admin | Only one `admin` role allowed in the system |
| One review per product | User can review only after delivery, once per product |

---

## Order Lifecycle

```
Customer places order (COD or Stripe)
        │
        ▼
   pending ──▶ confirmed ──▶ shipped ──▶ delivered
        │                                      │
        │                                      ├── COD: isPaid = true
        │                                      └── Return window opens
        │
        ├── cancelled (buyer, before delivery)
        └── returned (buyer, within replacementDays)
```

**Stripe flow:**
1. Order created with `isPaid: false`
2. User redirected to Stripe Checkout
3. Webhook `checkout.session.completed` → `isPaid: true` + emails sent

**Delivery OTP flow:**
1. Vendor selects "delivered" → OTP emailed to buyer
2. Vendor enters OTP in dashboard → order marked delivered

---

## Email Notifications

| Event | Recipients |
|-------|------------|
| Order placed | Admin, vendor, buyer |
| Order status update | Buyer, admin |
| Delivery OTP | Buyer |
| Vendor approved/rejected | Vendor |
| Product approved/rejected | Vendor |
| New vendor request | Admin |
| New product pending | Admin |
| New vendor shop announcement | All users |
| Follower new product | Shop followers |
| Password reset | User |

> Set `TEST_MAIL` in dev to route all emails to one inbox. Remove in production.

---

## API Reference

**Base URL (production):** `https://snapmart-virid.vercel.app`

**Auth legend:**
- **Public** — no login required
- **User** — any authenticated session
- **Customer** — authenticated with `role: user`
- **Vendor** — authenticated with `role: vendor`
- **Admin** — authenticated with `role: admin`
- **Stripe** — verified via `stripe-signature` header

---

### Auth

| Method | Endpoint | Auth | Body / Query | Description |
|--------|----------|------|--------------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | Public | NextAuth protocol | Sign-in, sign-out, OAuth callbacks, session |
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | Register new account |
| `POST` | `/api/auth/forgot-password` | Public | `{ email }` | Send password reset link (1 hour expiry) |
| `POST` | `/api/auth/reset-password` | Public | `{ token, password }` | Reset password with token |

---

### User

| Method | Endpoint | Auth | Body / Query | Description |
|--------|----------|------|--------------|-------------|
| `GET` | `/api/user/currentUser` | User | — | Get logged-in user profile |
| `POST` | `/api/user/update-profile` | User | FormData: `name`, `phone`, `image?` | Update profile + avatar |
| `POST` | `/api/user/edit-role-phone` | User | `{ phone, role }` | Set role & phone (onboarding) |
| `GET` | `/api/user/follow/status` | Public | `?vendorId=` | Check if user follows vendor |
| `POST` | `/api/user/follow/toggle` | User | `{ vendorId }` | Follow/unfollow vendor shop |

---

### Cart

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/user/cart/get` | User | — | Get cart with populated products |
| `POST` | `/api/user/cart/add` | User | `{ productId, quantity? }` | Add to cart (stock check) |
| `POST` | `/api/user/cart/update` | User | `{ productId, quantity }` | Update item quantity |
| `POST` | `/api/user/cart/remove` | User | `{ productId }` | Remove item from cart |

---

### Wishlist

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/user/wishlist/get` | Customer | — | Get wishlist products & IDs |
| `POST` | `/api/user/wishlist/add` | Customer | `{ productId }` | Add product to wishlist |
| `POST` | `/api/user/wishlist/remove` | Customer | `{ productId }` | Remove from wishlist |

---

### Orders

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/order/allOrders` | User/Vendor/Admin | — | List orders (scoped by role) |
| `POST` | `/api/order/cod` | User | `{ productId, quantity, address, couponCode? }` | Place single COD order |
| `POST` | `/api/order/cod/cart` | User | `{ address, couponCode? }` | Place COD orders for full cart |
| `POST` | `/api/order/online-pay` | User | `{ productId, quantity, address, couponCode? }` | Place order + Stripe Checkout URL |
| `POST` | `/api/order/online-pay/cart` | User | `{ address, couponCode? }` | Cart checkout + Stripe Checkout URL |
| `POST` | `/api/order/stripe/webhooks` | Stripe | Raw body + signature | Mark orders paid on checkout complete |
| `POST` | `/api/order/cancelOrder` | User (buyer) | `{ orderId }` | Cancel order + restore stock |
| `POST` | `/api/order/return` | User (buyer) | `{ orderId }` | Return delivered order + refund calc |
| `POST` | `/api/order/update-status` | Vendor | `{ orderId, status }` | Update to confirmed/shipped/delivered (OTP) |
| `POST` | `/api/order/verify-delivery-otp` | User/Vendor | `{ orderId, otp }` | Verify OTP → mark delivered |

**Address object:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "address": "123 Main St",
  "city": "Mumbai",
  "pincode": "400001"
}
```

**Order status values:** `pending`, `confirmed`, `shipped`, `delivered`, `returned`, `cancelled`

---

### Vendor

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/vendor/allProduct` | Public | — | List products (filtered by role) |
| `GET` | `/api/vendor/AllVendor` | Public | — | List all vendor shops |
| `POST` | `/api/vendor/addProduct` | Vendor | FormData (see below) | Create product (pending approval) |
| `POST` | `/api/vendor/updateProduct` | Vendor | FormData + `productId` | Update own product |
| `POST` | `/api/vendor/isActiveProduct` | Vendor | `{ productId, isActive }` | Toggle product listing on/off |
| `POST` | `/api/vendor/accept-commission` | Vendor | `{ productId }` | Accept admin commission offer |
| `POST` | `/api/vendor/editDetails` | User | `{ shopName, shopAddress, gstNumber }` | Submit vendor shop info |
| `POST` | `/api/vendor/verifyagain` | User | `{ shopName, shopAddress, gstNumber }` | Resubmit after rejection |
| `POST` | `/api/vendor/addReview` | User | FormData: `productId, rating, comment, image?` | Add product review |

**Add product FormData fields:**
`title`, `description`, `price`, `stock`, `category`, `isWearable`, `sizes[]`, `replacementDays`, `freeDelivery`, `warranty`, `payOnDelivery`, `vendorCommissionPercent`, `detailsPoints[]`, `image1`–`image4`

---

### Admin

| Method | Endpoint | Auth | Body / Query | Description |
|--------|----------|------|--------------|-------------|
| `GET` | `/api/admin/check-admin` | Public | — | Check if admin account exists |
| `GET` | `/api/admin/product/[id]` | Admin | Path: `id` | Get product detail for approval |
| `POST` | `/api/admin/update-product-status` | Admin | `{ productId, status, rejectedReason?, adminCounterCommissionPercent?, approvedCommissionPercent? }` | Approve/counter/reject product |
| `POST` | `/api/admin/update-vendor-status` | Admin | `{ vendorId, status, rejectedReason? }` | Approve/reject vendor |
| `GET` | `/api/admin/coupon` | Admin | — | List all coupons |
| `POST` | `/api/admin/coupon` | Admin | `{ code, discountType, discountValue, minOrderAmount?, maxUses?, expiresAt?, isActive? }` | Create coupon |
| `PATCH` | `/api/admin/coupon` | Admin | `{ couponId, isActive }` | Enable/disable coupon |

**Product status values:** `approved`, `counter`, `rejected`  
**Vendor status values:** `approved`, `rejected`

---

### Coupon

| Method | Endpoint | Auth | Body / Query | Description |
|--------|----------|------|--------------|-------------|
| `GET` | `/api/coupon/list` | Public | `?subtotal=` | List active coupons with eligibility |
| `POST` | `/api/coupon/validate` | Public | `{ code, productId, quantity? }` | Validate coupon for single product |
| `POST` | `/api/coupon/validate-cart` | User | `{ code }` | Validate coupon for full cart |

---

### ML & Analytics

| Method | Endpoint | Auth | Query | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/ml/pricing/compare` | Public | `?productId=` | Cross-vendor price comparison for a product |
| `GET` | `/api/ml/pricing/vendor` | Vendor | — | Pricing insights vs peer listings |
| `GET` | `/api/ml/stock-alerts` | Vendor | — | Low-stock alerts from order velocity |
| `GET` | `/api/ml/sentiment` | Vendor/Admin | — | Review sentiment analysis |

---

### Support (Chat)

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/support/active-users` | User/Vendor/Admin | — | Get chat contact list |
| `POST` | `/api/support/get` | User | `{ withUserId }` | Fetch message history |
| `POST` | `/api/support/send` | User | `{ receiverId, text }` | Send chat message |

**Chat contacts by role:**
- **User** → vendors from past orders
- **Vendor** → admin + buyers from orders
- **Admin** → all vendors

---

### Search

| Method | Endpoint | Auth | Query / Body | Description |
|--------|----------|------|--------------|-------------|
| `GET` | `/api/search` | Public | `?query=&category=&shop=` | Text search on approved products |
| `POST` | `/api/visual-search` | Public | FormData: `image` | CLIP visual similarity search |

---

## Environment Variables

Create `.env.local` in the project root:

```env
# ─── Database ───
MONGODB_URL=mongodb://...              # Atlas direct connection recommended

# ─── Auth ───
AUTH_SECRET=                           # openssl rand -base64 32
AUTH_GOOGLE_ID=                        # Google OAuth Client ID
AUTH_GOOGLE_SECRET=                    # Google OAuth Client Secret

# ─── App URLs ───
NEXT_BASE_URL=http://localhost:3000    # Production: https://snapmart-virid.vercel.app
NEXTAUTH_URL=http://localhost:3000     # Same as NEXT_BASE_URL

# ─── Cloudinary (product/profile images) ───
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_CLOUD_APIKEY=
CLOUDINARY_CLOUD_SECRET=

# ─── Email (Gmail App Password) ───
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=                    # 16-char app password from Google Account

# ─── Stripe (online payments) ───
STRIPE_SECRET_KEY=sk_test_...          # sk_live_... for production
STRIPE_WEBHOOKS_KEY=whsec_...          # From Stripe Dashboard webhook

# ─── Optional ───
TEST_MAIL=                             # Dev only: route all emails here
GEMINI_API_KEY=                        # If using Gemini features
```

> **MongoDB tip:** If `mongodb+srv://` fails locally with `querySrv ECONNREFUSED`, use Atlas **direct connection** string (`mongodb://host:27017,...`).

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Cloudinary account
- Gmail with App Password enabled
- (Optional) Stripe, Google Cloud OAuth

### Install & run

```bash
git clone https://github.com/neev-25/snap-mart-multivendor-ecommerce.git
cd snap-mart-multivendor-ecommerce
npm install
cp .env.example .env.local   # create and fill .env.local manually
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time setup

1. **Register** or sign in with Google
2. **Choose role** (User / Vendor / Admin) + enter 10-digit phone
3. **Vendor:** fill shop details (name, address, GST) → wait for admin approval
4. **Admin:** approve vendors and products from dashboard
5. **Vendor:** add products → admin approves → activate listing
6. **Customer:** browse → add to cart → checkout (COD or Stripe)

### Stripe local testing

```bash
stripe listen --forward-to localhost:3000/api/order/stripe/webhooks
# Copy whsec_... to STRIPE_WEBHOOKS_KEY in .env.local
```

Test card: `4242 4242 4242 4242`

---

## Deployment

### Vercel (recommended)

The project auto-deploys from the `main` branch.

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables (see above)
3. Set `NEXT_BASE_URL` and `NEXTAUTH_URL` to your Vercel domain
4. Deploy

**Sync env vars from local:**
```bash
node scripts/push-vercel-env.mjs
```

### MongoDB Atlas
- **Network Access** → Add `0.0.0.0/0` (allow all IPs for serverless)

### Google OAuth (production)
In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

| Field | Value |
|-------|-------|
| JavaScript origin | `https://snapmart-virid.vercel.app` |
| Redirect URI | `https://snapmart-virid.vercel.app/api/auth/callback/google` |

### Stripe webhook (production)

| Setting | Value |
|---------|-------|
| Endpoint URL | `https://snapmart-virid.vercel.app/api/order/stripe/webhooks` |
| Event | `checkout.session.completed` |
| Env var | `STRIPE_WEBHOOKS_KEY=whsec_...` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build (requires 8GB RAM) |
| `npm run start` | Start production server locally |
| `npm run lint` | Run ESLint |
| `node scripts/push-vercel-env.mjs` | Sync `.env.local` → Vercel (prod + preview) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `querySrv ECONNREFUSED` on MongoDB | Use direct `mongodb://` URI, not `mongodb+srv://` |
| Google login `redirect_uri_mismatch` | Add exact Vercel URL to Google OAuth redirect URIs |
| Stripe payment works but order unpaid | Set up webhook + `STRIPE_WEBHOOKS_KEY` + redeploy |
| Emails not sending | Check `GMAIL_USER` + `GMAIL_APP_PASSWORD`; remove `TEST_MAIL` in prod |
| Build OOM on Vercel | Build script already uses `--max-old-space-size=8192` |
| Auth session errors | Ensure `AUTH_SECRET` is set on Vercel |
| Products not showing | Must be `verificationStatus: approved` AND `isActive: true` |
| Visual search no results | Product must be active; CLIP indexing runs on activation |

---

## License

This project is for portfolio and educational use.

---

## Author

**Neev Mendapara**

- GitHub: [neev-25](https://github.com/neev-25)
- Live: [snapmart-virid.vercel.app](https://snapmart-virid.vercel.app)
