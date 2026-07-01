# SnapMart

Multivendor eCommerce platform — multiple vendors, one marketplace. Built with Next.js 16, MongoDB, Stripe, and NextAuth.

**Live:** [snapmart-virid.vercel.app](https://snapmart-virid.vercel.app)  
**Repo:** [github.com/neev-25/snap-mart-multivendor-ecommerce](https://github.com/neev-25/snap-mart-multivendor-ecommerce)

---

## What it does

| Role | Key features |
|------|----------------|
| **Customer** | Browse, cart, wishlist, COD/Stripe checkout, order tracking, returns, reviews, visual search |
| **Vendor** | Product listing, order management, delivery OTP, commission negotiation, ML insights |
| **Admin** | Vendor & product approval, coupons, platform orders, sentiment overview |

---

## Tech stack

| | |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Redux |
| Backend | Next.js API Routes, Mongoose |
| Database | MongoDB Atlas |
| Auth | NextAuth v5 (email + Google) |
| Payments | Stripe Checkout + webhooks |
| Media | Cloudinary |
| Email | Gmail SMTP (Nodemailer) |
| ML | CLIP visual search (browser), price compare, sentiment, stock alerts |
| Deploy | Vercel |

---

## Features

- Multi-vendor shop with role-based dashboards
- Cart checkout (single item or full cart) with coupons
- Cash on Delivery and Stripe online pay
- Order lifecycle with delivery OTP verification
- Readable order IDs in emails (`SM20250630A3F9K2`)
- Vendor onboarding + admin approval workflow
- Product commission negotiation
- Wishlist, follow shops, product reviews
- **Visual search** — upload a photo, find similar products (CLIP runs in browser)
- Text search + category filters
- Support chat (buyer ↔ vendor ↔ admin)
- Finance dashboards for vendor and admin

---

## Quick start

```bash
git clone https://github.com/neev-25/snap-mart-multivendor-ecommerce.git
cd snap-mart-multivendor-ecommerce
npm install
```

Create `.env.local`:

```env
MONGODB_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_CLOUD_APIKEY=
CLOUDINARY_CLOUD_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOKS_KEY=
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Use Atlas **direct connection** URI if `mongodb+srv://` fails locally.

---

## API reference

Base URL: `/api`

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/auth/[...nextauth]` | Sign in, sign out, session |
| POST | `/auth/register` | Register `{ name, email, password }` |
| POST | `/auth/forgot-password` | Send reset link `{ email }` |
| POST | `/auth/reset-password` | Reset `{ token, password }` |

### User
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/user/currentUser` | Profile |
| POST | `/user/update-profile` | Update name, phone, avatar |
| POST | `/user/edit-role-phone` | Set role + phone |
| GET | `/user/follow/status?vendorId=` | Follow status |
| POST | `/user/follow/toggle` | Follow/unfollow vendor |

### Cart & Wishlist
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/user/cart/get` | Get cart |
| POST | `/user/cart/add` | Add `{ productId, quantity? }` |
| POST | `/user/cart/update` | Update `{ productId, quantity }` |
| POST | `/user/cart/remove` | Remove `{ productId }` |
| GET | `/user/wishlist/get` | Get wishlist |
| POST | `/user/wishlist/add` | Add `{ productId }` |
| POST | `/user/wishlist/remove` | Remove `{ productId }` |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/order/allOrders` | List orders (scoped by role) |
| POST | `/order/cod` | Single COD order |
| POST | `/order/cod/cart` | Cart COD checkout |
| POST | `/order/online-pay` | Single Stripe checkout |
| POST | `/order/online-pay/cart` | Cart Stripe checkout |
| POST | `/order/stripe/webhooks` | Stripe payment webhook |
| POST | `/order/cancelOrder` | Cancel `{ orderId }` |
| POST | `/order/return` | Return `{ orderId }` |
| POST | `/order/update-status` | Vendor status update |
| POST | `/order/verify-delivery-otp` | Verify OTP `{ orderId, otp }` |

### Vendor
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/vendor/allProduct` | Product catalog |
| GET | `/vendor/AllVendor` | All vendors |
| POST | `/vendor/addProduct` | Add product (FormData) |
| POST | `/vendor/updateProduct` | Edit product |
| POST | `/vendor/isActiveProduct` | Toggle active |
| POST | `/vendor/accept-commission` | Accept admin offer |
| POST | `/vendor/editDetails` | Shop onboarding |
| POST | `/vendor/verifyagain` | Re-submit verification |
| POST | `/vendor/addReview` | Product review |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/check-admin` | Admin exists check |
| GET | `/admin/product/[id]` | Product detail |
| POST | `/admin/update-product-status` | Approve/reject/counter |
| POST | `/admin/update-vendor-status` | Approve/reject vendor |
| GET/POST/PATCH | `/admin/coupon` | Coupon CRUD |

### Coupons, ML, Search, Support
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/coupon/list` | Active coupons |
| POST | `/coupon/validate` | Validate for product |
| POST | `/coupon/validate-cart` | Validate for cart |
| GET | `/ml/pricing/compare?productId=` | Price comparison |
| GET | `/ml/pricing/vendor` | Vendor pricing insights |
| GET | `/ml/stock-alerts` | Stock alerts |
| GET | `/ml/sentiment` | Review sentiment |
| GET | `/search?query=&category=&shop=` | Text search |
| POST | `/visual-search` | Visual search `{ embedding }` |
| GET | `/support/active-users` | Chat contacts |
| POST | `/support/get` | Get messages |
| POST | `/support/send` | Send message |

---

## Visual search

How it works:
1. **Browser** downloads CLIP model once (~50MB, cached in IndexedDB)
2. Your uploaded image is converted to a vector in the browser
3. **Server** compares it against pre-indexed product embeddings in MongoDB

Products are indexed when vendors **activate** an approved listing.

If you see *"No indexed products yet"* — ensure products are approved and active.

---

## Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Add env variables (same as `.env.local`, but set `NEXT_BASE_URL` and `NEXTAUTH_URL` to your Vercel domain)
3. MongoDB Atlas → allow `0.0.0.0/0`
4. Stripe webhook → `https://your-domain/api/order/stripe/webhooks` (event: `checkout.session.completed`)
5. Add `STRIPE_WEBHOOKS_KEY` from Stripe Dashboard

Sync local env to Vercel:

```bash
node scripts/push-vercel-env.mjs
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run production locally |
| `node scripts/push-vercel-env.mjs` | Push `.env.local` → Vercel |

---

## Project structure

```
src/
├── app/           Pages + API routes
├── component/     UI (Admin, Vendor, User, ML)
├── hooks/         Data fetching
├── lib/           Business logic
├── model/         Mongoose schemas
├── redux/         Global state
└── auth.ts        NextAuth config
```

---

## Author

**Neev Mendapara**
