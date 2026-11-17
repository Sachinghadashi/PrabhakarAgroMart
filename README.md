# Prabhakar Agro Mart
> **Your Trusted Partner in Agriculture.**

A complete, production-grade agricultural e-commerce platform purpose-built for farmers, agribusinesses, and rural agricultural communities in India. Prabhakar Agro Mart provides certified seeds, fertilizers, fungicides, insecticides, and herbicides with authentic pack sizes, authoritative GST/shipping calculations, pessimistic stock locking, Razorpay online payments with UPI, and Cash on Delivery (COD) fulfillment.

---

## 1. Architectural Highlights

The platform is architected as three completely separate applications consuming a single shared backend API and database:

1. **Customer E-Commerce Frontend (`customer-frontend/`)**: React 18 + TypeScript (strict mode) + Vite + Tailwind CSS + Lucide Icons + TanStack Query + React Hook Form + Zod.
2. **Admin Operations Portal (`admin-frontend/`)**: React 18 + TypeScript (strict mode) + Vite + Tailwind CSS + Recharts + Lucide Icons + TanStack Query.
3. **Shared Backend REST API (`backend/`)**: Python 3.11 + Django 5.1 + Django REST Framework + Simple JWT + MySQL 8.0 (with SQLite dev fallback) + `drf-spectacular` OpenAPI 3.0 + Razorpay SDK.

```
prabhakar-agro-mart/
├── customer-frontend/          # Port 5173 (Customer shopping experience)
│   ├── src/
│   │   ├── api/                # Axios client with auto-refresh interceptors
│   │   ├── components/         # Navbar, Footer, ProductCard, AuthPromptModal
│   │   ├── context/            # AuthContext, CartContext (persistent cart)
│   │   ├── pages/              # Home, Catalog, ProductDetail, Cart, Checkout, Orders, Profile
│   │   ├── routes/             # AppRoutes, CustomerLayout
│   │   └── types/              # Strict TypeScript models
│   ├── Dockerfile              # Multi-stage production build (Node 20 -> Nginx Alpine)
│   └── nginx.conf
│
├── admin-frontend/             # Port 5174 (Separate operations portal)
│   ├── src/
│   │   ├── api/                # adminApi.ts (metrics, catalog, orders, inventory)
│   │   ├── context/            # AdminAuthContext (staff clearance verification)
│   │   ├── layouts/            # Collapsible sidebar, header, role navigation
│   │   ├── pages/              # Dashboard, Products, Categories, Inventory, Orders, Coupons, Reports, AuditLogs
│   │   ├── routes/             # AdminRoutes with ProtectedAdminRoute
│   │   └── types/              # Strict Admin models
│   ├── Dockerfile              # Multi-stage production build (Node 20 -> Nginx Alpine)
│   └── nginx.conf
│
├── backend/                    # Port 8000 (Django REST API & Business Logic)
│   ├── apps/
│   │   ├── accounts/           # Custom User, CustomerProfile, Address, AuditLog, RBAC
│   │   ├── catalog/            # Category, Brand, Product, ProductVariant, ProductImage
│   │   ├── inventory/          # select_for_update() reservation & stock ledger
│   │   ├── cart/               # Authoritative server-side pricing & coupon calculation
│   │   ├── orders/             # Order state machine & tax invoice snapshot generator
│   │   ├── payments/           # Razorpay HMAC SHA-256 verification, COD, idempotency
│   │   ├── shipping/           # 6-digit PIN serviceability validator
│   │   ├── promotions/         # Coupon validation & redemption quotas
│   │   ├── notifications/      # Real-time customer & admin notifications
│   │   └── reports/            # Real database metrics, CSV exports, sales trends
│   ├── config/                 # settings.py, urls.py, wsgi.py, asgi.py
│   ├── tests/                  # Pytest automated test suite
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── infrastructure/
│   └── nginx/                  # Production reverse proxy (Port 80 & 8080)
├── .github/workflows/          # CI/CD pipeline (pytest, typecheck, builds)
├── docker-compose.yml          # Containerized development environment
├── docker-compose.prod.yml     # Production containerized stack
├── .env.example                # Configuration template
└── README.md
```

---

## 2. Core Business Workflows

### A. Authoritative Server-Side Pricing
* **Cart Calculations**: Subtotal, 5% agricultural GST, delivery fee (Free for orders over ₹999, else flat ₹99), and verified coupon discounts are calculated strictly on the Django backend. The client browser cannot forge prices or totals.
* **Pessimistic Inventory Locking**: During checkout, database transactions lock target variant records using `select_for_update()` to prevent concurrent overselling.
* **Order Snapshots**: Product names, pack sizes, SKUs, and prices are frozen at the moment of order placement.

### B. Payment Lifecycle
1. **Razorpay Online Payments**:
   - Order created with status `PENDING_PAYMENT`.
   - Razorpay Order initiated server-side via Razorpay Python SDK.
   - Client completes payment through Razorpay Checkout.
   - Signature verification verified using `hmac.new(secret, ..., sha256)`.
   - Webhook processing is idempotent, keyed by event ID (`evt_...`).
2. **Cash on Delivery (COD)**:
   - Permitted for orders up to ₹50,000.
   - Orders are created with payment status `PENDING`.
   - Warehouse dispatch proceeds to field delivery.
   - Administrators mark payment collected upon physical cash receipt.

---

## 3. Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+ or 20+
- **Docker & Docker Compose**: (Optional for local dev, recommended for containerized testing)
- **MySQL**: 8.0+ (Optional; backend defaults to SQLite for local development when MySQL is absent)

---

## 4. Quick Start (Containerized with Docker)

### Step 1: Clone and Configure Environment
```bash
cp .env.example .env
```

### Step 2: Start All Services via Docker Compose
```bash
docker compose up --build
```
This starts:
- `pam_mysql`: MySQL 8.0 database at port `3306` with persistent volume `mysql_data`.
- `pam_backend`: Django REST API at `http://localhost:8000`.
- `pam_customer_frontend`: Customer Storefront at `http://localhost:5173`.
- `pam_admin_frontend`: Admin Operations Portal at `http://localhost:5174`.

### Step 3: Run Database Migrations & Seed Sample Data
In a separate terminal:
```bash
# Apply Django migrations
docker compose exec backend python manage.py migrate

# Seed categories, brands, products, pack sizes, inventory, and coupons
docker compose exec backend python manage.py seed_data

# Create default Super Admin (admin@prabhakar.com / Admin@Agro2026)
docker compose exec backend python manage.py create_super_admin
```

---

## 5. Local Development (Without Docker)

### A. Backend Setup

```bash
# 1. Create and activate Python virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run database migrations
python backend/manage.py migrate

# 4. Seed sample agricultural data and super admin
python backend/manage.py seed_data
python backend/manage.py create_super_admin

# 5. Start Django development server
python backend/manage.py runserver 8000
```
Backend runs at `http://127.0.0.1:8000`.
- Interactive Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc Documentation: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI Schema: `http://127.0.0.1:8000/api/schema/`

### B. Customer Frontend Setup

```bash
cd customer-frontend
npm install
npm run dev
```
Customer Storefront runs at `http://localhost:5173`.
- Proxies `/api` and `/media` requests to `http://127.0.0.1:8000`.

### C. Admin Operations Portal Setup

```bash
cd admin-frontend
npm install
npm run dev
```
Admin Operations Portal runs at `http://localhost:5174`.
- Proxies `/api` and `/media` requests to `http://127.0.0.1:8000`.

---

## 6. Seed Credentials

### Super Administrator
- **Email**: `admin@prabhakar.com`
- **Password**: `Admin@Agro2026`
- **Role**: `SUPER_ADMIN` (Full clearance across catalog, inventory, fulfillment, reports, and security audit logs)
- **Portal URL**: `http://localhost:5174` (or click "Fill Seeded SuperAdmin Credentials" on login page)

### Demo Customer
- **Email**: `kisan@prabhakar.com`
- **Password**: `Kisan@12345`
- **Storefront URL**: `http://localhost:5173`

### Pre-loaded Coupons
- `KISAN10`: 10% off (min order ₹500, max discount ₹200)
- `HARVEST20`: 20% off (min order ₹1,500, max discount ₹500)
- `WELCOME50`: Flat ₹50 off (min order ₹300)

---

## 7. Running Automated Tests

### Backend Automated Test Suite (Pytest)
```bash
.\.venv\Scripts\pytest backend\tests -v
```
Tests cover:
- Customer registration and JWT login
- Customer access restriction from admin portals
- Pessimistic stock reservation and insufficient inventory prevention
- Automatic stock release on order cancellation
- Authoritative server-side pricing and delivery fee thresholds
- Checkout with address validation and stock commitment
- Razorpay HMAC-SHA256 signature verification
- Cash on Delivery (COD) threshold limit enforcement

### Frontend Production Builds & Type Checking
```bash
# Customer frontend build
cd customer-frontend
npm run build

# Admin frontend build
cd ../admin-frontend
npm run build
```

---

## 8. API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register/` | Register customer account |
| `POST` | `/api/v1/auth/login/` | Customer JWT login (returns access & refresh) |
| `POST` | `/api/v1/auth/admin-login/` | Staff JWT login (verifies admin roles) |
| `GET` | `/api/v1/auth/me/` | Current authenticated user profile |
| `GET` | `/api/v1/catalog/categories/` | List agricultural categories |
| `GET` | `/api/v1/catalog/products/` | Filter products by category, brand, crop, price |
| `GET` | `/api/v1/catalog/products/{slug}/` | Detailed product specifications and pack sizes |
| `GET` | `/api/v1/cart/` | Fetch authenticated customer's persistent cart |
| `POST` | `/api/v1/cart/items/` | Add product variant to cart |
| `POST` | `/api/v1/cart/apply-coupon/` | Validate and apply promo code |
| `POST` | `/api/v1/orders/checkout/` | Commit checkout, reserve stock, create order |
| `POST` | `/api/v1/payments/razorpay/create-order/` | Initialize Razorpay payment gateway order |
| `POST` | `/api/v1/payments/razorpay/verify/` | Cryptographic signature verification |
| `POST` | `/api/v1/payments/razorpay/webhook/` | Idempotent webhook event ingestion |
| `POST` | `/api/v1/payments/cod/confirm/` | Confirm Cash on Delivery order |
| `GET` | `/api/v1/admin-panel/dashboard/` | Real database operational metrics and sales trends |
| `GET` | `/api/v1/admin-panel/reports/sales/?format=csv` | Download paid sales ledger CSV |
| `GET` | `/api/v1/admin-panel/reports/inventory/?format=csv` | Download warehouse inventory ledger CSV |
| `GET` | `/api/v1/admin-panel/audit-logs/` | Tamper-evident admin action audit trail |

---

## 9. Production Deployment Guide

### A. Environment Configuration
Ensure `.env` contains secure values:
- Set `DJANGO_DEBUG=0`.
- Generate a 50+ character random `DJANGO_SECRET_KEY`.
- Set production domain names in `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
- Provide live Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).

### B. Launch Production Stack
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
In this mode:
- MySQL runs on an isolated internal network without exposing host ports.
- Backend runs with Gunicorn and 3 worker processes.
- Nginx edge proxy serves customer traffic on port 80 and admin traffic on port 8080 with Gzip compression and security headers.

### C. Database Backups & Restores
```bash
# Create MySQL backup
docker compose exec mysql mysqldump -u agro_user -p prabhakar_agro_mart > backup_$(date +%Y%m%d).sql

# Restore MySQL backup
docker compose exec -T mysql mysql -u agro_user -p prabhakar_agro_mart < backup_20261016.sql
```

---

## 10. License & Compliance
This software is developed for **Prabhakar Agro Mart**. All agricultural inputs, chemicals, and fertilizers displayed on the platform are subject to Indian regulatory standards under the Fertilizer (Control) Order and Insecticides Act.
