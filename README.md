# SnapMart — Multivendor eCommerce Platform

SnapMart is a full-stack multivendor marketplace built with **Next.js 16**, where multiple vendors sell products, manage orders, and interact with customers through a single unified platform. Shoppers get cart checkout, order tracking, wishlists, and ML-powered price insights — all in a responsive, modern UI.

**Live demo:** [https://snapmart-virid.vercel.app](https://snapmart-virid.vercel.app)

**Repository:** [github.com/neev-25/snap-mart-multivendor-ecommerce](https://github.com/neev-25/snap-mart-multivendor-ecommerce)

---

## Highlights

| Role | Capabilities |
|------|----------------|
| **Customer** | Browse, cart, wishlist, COD & Stripe checkout, order tracking, returns, support chat |
| **Vendor** | Product CRUD, order fulfillment, delivery OTP, commission acceptance, ML insights |
| **Admin** | Vendor & product approval, coupon management, platform orders, sentiment overview |

---

## Features

- Multi-vendor marketplace with role-based dashboards (user / vendor / admin)
- Email & password + Google OAuth (NextAuth v5)
- Shopping cart with multi-item checkout and coupon support
- Cash on Delivery and Stripe online payments
- Order lifecycle: pending → confirmed → shipped → delivered (OTP verification)
- Order cancellation, returns, and readable order IDs in emails
- Vendor onboarding with GST verification workflow
- Admin product & vendor approval with counter-offers
- Wishlist, shop following, and product reviews
- CLIP-based visual product search
- ML modules: cross-vendor price comparison, review sentiment, stock alerts
- Email notifications (orders, approvals, delivery OTP, password reset)
- Support chat between buyers, vendors, and admin

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Motion (Framer Motion) |
| **State** | Redux Toolkit |
| **Database** | MongoDB, Mongoose |
| **Auth** | NextAuth v5 (Credentials + Google) |
| **Payments** | Stripe Checkout + webhooks |
| **Media** | Cloudinary |
| **Email** | Nodemailer (Gmail SMTP) |
| **ML / Search** | Transformers.js (CLIP), custom pricing & sentiment libs |
| **Deploy** | Vercel |

---

## Project Structure

```
src/
├── app/                 # Pages & API routes (App Router)
├── component/           # UI components (Admin, Vendor, User, ML)
├── hooks/               # Data-fetching hooks
├── lib/                 # Business logic, email, pricing, ML
├── model/               # Mongoose schemas
├── redux/               # Global state
└── auth.ts              # NextAuth configuration
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas (or local MongoDB)
- Cloudinary account (product images)
- Gmail App Password (transactional email)
- Stripe account (optional, for online payments)
- Google OAuth credentials (optional, for Google sign-in)

### 1. Clone & install

```bash
git clone https://github.com/neev-25/snap-mart-multivendor-ecommerce.git
cd snap-mart-multivendor-ecommerce
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
# Database
MONGODB_URL=mongodb://...

# Auth
AUTH_SECRET=your-random-secret-min-32-chars
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# App URL (local)
NEXT_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_CLOUD_APIKEY=
CLOUDINARY_CLOUD_SECRET=

# Email (Gmail App Password)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOKS_KEY=whsec_...

# Optional — route all emails to one inbox in dev
TEST_MAIL=
```

> **MongoDB note:** If `mongodb+srv://` fails locally with `querySrv ECONNREFUSED`, use Atlas **direct connection** string (`mongodb://host1:27017,...`).

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. First-time setup flow

1. Register or sign in with Google
2. Choose role (User / Vendor / Admin) and enter phone number
3. Vendors: complete shop details (name, address, GST) → wait for admin approval
4. Admin: approve vendors and products from the dashboard

---

## Stripe Webhook (required for online payments)

**Local testing** with [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/order/stripe/webhooks
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOKS_KEY`.

**Production** (Vercel):

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://snapmart-virid.vercel.app/api/order/stripe/webhooks`
3. Event: `checkout.session.completed`
4. Add signing secret to Vercel as `STRIPE_WEBHOOKS_KEY`
5. Redeploy

---

## Deploy on Vercel

The project is connected to Vercel and auto-deploys from the `main` branch.

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables under **Settings → Environment Variables**
3. Set `NEXT_BASE_URL` and `NEXTAUTH_URL` to your Vercel domain
4. MongoDB Atlas → **Network Access** → allow `0.0.0.0/0`
5. Google OAuth → add production callback:
   `https://your-domain.vercel.app/api/auth/callback/google`
6. Deploy

```bash
npm run build   # verify build locally
npx vercel --prod
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## API Overview

| Area | Routes |
|------|--------|
| Auth | `/api/auth/*`, register, forgot/reset password |
| Cart & Wishlist | `/api/user/cart/*`, `/api/user/wishlist/*` |
| Orders | `/api/order/cod`, `/api/order/online-pay`, cancel, return, webhooks |
| Vendor | `/api/vendor/addProduct`, update, reviews |
| Admin | `/api/admin/update-vendor-status`, coupons, product approval |
| ML | `/api/ml/pricing/compare`, sentiment, stock-alerts |
| Search | `/api/search`, `/api/visual-search` |

---

## Author

**Neev Mendapara**

---

## License

This project is for portfolio and educational use.
