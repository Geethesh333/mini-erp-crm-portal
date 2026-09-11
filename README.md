# Mini ERP + CRM Operations Portal

> **Full Stack Developer Case Study Assignment**  
> A complete, role-based ERP & CRM system built for wholesale and distribution companies to manage customers, product inventory, stock movements, and sales dispatch challans with atomic stock verification.

---

## Project Overview & Key Highlights

This application addresses the daily operational needs of wholesale and distribution businesses:
1. **Multi-Role Authentication (RBAC):** Dedicated permissions and views for **Admin**, **Sales**, **Warehouse**, and **Accounts** teams.
2. **Customer CRM Module:** Manage accounts (Retail, Wholesale, Distributor), GST information, lead/active statuses, and follow-up discussion logs.
3. **Product & Inventory Module:** Stock catalog with low-stock threshold alerts, warehouse bin locations, and an audit trail tracking all `IN` and `OUT` stock movements with timestamps and authors.
4. **Sales Challan & Dispatch Flow:**
   - Auto-generated sequential Challan numbers (`CH-YYYYMMDD-XXXX`).
   - Captures immutable **product snapshot data** (pricing, name, SKU at time of dispatch).
   - **Atomic Stock Validation:** Prevents negative inventory. Confirmed challans deduct stock atomically within database transactions; insufficient stock returns descriptive `HTTP 400` errors.
   - **Draft vs. Confirmed** lifecycle (Drafts reserve quotes without reducing physical warehouse inventory).
5. **Bonus Features (All 4 Fully Implemented & Included):**
   - **Docker Setup:** `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore` multi-stage containerization.
   - **GitHub Actions CI/CD:** `.github/workflows/ci.yml` automated continuous integration pipeline running lint, build, and automated test suites on push.
   - **Export Invoice as PDF:** `GET /api/challans/:id/pdf` powered by `pdfkit` generating printable, branded A4 dispatch invoices with itemized tables and tax stamps.
   - **Upload Product Image to AWS S3:** `POST /api/products/:id/image` with `@aws-sdk/client-s3` streaming to AWS S3 buckets (with offline local storage fallback) and `imageUrl` schema support.

---

## Pre-Seeded Test Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@minierp.com` | `password123` | Full access across all modules, users, and audit logs |
| **Sales** | `sales@minierp.com` | `password123` | Customer CRM, Challan creation, and Product catalog |
| **Warehouse** | `warehouse@minierp.com` | `password123` | Product management, Stock adjustments, Inward/Outward movements |
| **Accounts** | `accounts@minierp.com` | `password123` | Financial auditing, Invoice/Challan inspection & PDF exports |

*(Note: On the login page, you can simply click on any of the 4 role buttons to log in with a single click!)*

---

## Required Case Study Documentation

### 1. How the Server Was Set Up
- **Runtime & Language:** Built with **Node.js (v20 LTS)** and **TypeScript 5.6** in strict mode.
- **Web Framework:** **Express.js** with centralized routing, CORS handling (`cors`), JSON body parsing, and custom error middleware (`errorHandler.ts`).
- **Database & ORM:** **Prisma ORM (v5.21)** connected to **PostgreSQL** (Neon.tech in production) and SQLite for zero-dependency local setups.
- **Authentication & Security:** JWT (`jsonwebtoken`) with 7-day expiration, and one-way password hashing using `bcryptjs` with salt rounds = 10.
- **Business Logic Layer:** Database transactions (`prisma.$transaction`) ensure atomicity for sales challan confirmation and stock decrements.
- **Document Engine:** `pdfkit` dynamic streaming engine generating printable A4 dispatch challans and invoices.
- **Containerization:** Multi-stage `Dockerfile` and `docker-compose.yml` for unified backend, database, and frontend container orchestration.

### 2. How Environment Variables Are Managed
- Environment variables are isolated from source code using `.env` files locally and secure dashboard injection in production.
- Key variables:
  - `PORT`: Network port for Express server (default `5000`).
  - `DATABASE_URL`: Connection string for PostgreSQL or SQLite (`postgresql://user:pass@host/db?sslmode=require` or `file:./dev.db`).
  - `JWT_SECRET`: Secret key used to sign and verify JSON Web Tokens.
  - `JWT_EXPIRES_IN`: Expiration duration for auth tokens (default `7d`).
  - `NODE_ENV`: Application environment (`development` or `production`).
  - `VITE_API_URL`: Frontend client URL pointing to the backend API (`https://your-backend.onrender.com/api` or `http://localhost:5000/api`).
- An audited `.env.example` template is committed to the repository for reference.

### 3. How to Run the Project Locally
- **Option A (1-Click on Windows):**
  - Simply double-click `start_all.bat` in the project root. It will launch both the backend (port 5000) and frontend (port 5173) and open your browser automatically.
- **Option B (Standard CLI):**
  1. Start Backend:
     ```bash
     cd backend
     npm install
     npx prisma generate
     npx prisma db push
     npx tsx prisma/seed.ts
     npm run dev
     ```
  2. Start Frontend:
     ```bash
     cd frontend
     npm install
     npm run dev
     ```
  3. Open `http://localhost:5173` in your browser.
- **Option C (Docker Compose):**
  ```bash
  docker-compose up --build
  ```

### 4. How to Deploy the Project
- **Database (Neon / Supabase):**
  - Create a serverless PostgreSQL instance on [neon.tech](https://neon.tech) and copy the `postgresql://...` connection string.
- **Backend (Render / Railway):**
  - Create a Web Service connected to your repository.
  - Root directory: `backend`
  - Build command: `npm install && npx prisma generate && npx prisma db push && npm run build`
  - Start command: `node dist/index.js`
  - Set `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
- **Frontend (Vercel / Netlify):**
  - Import the repository on [vercel.com](https://vercel.com).
  - Root directory: `frontend`
  - Preset: `Vite`
  - Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
  - Rewrites handled automatically via `frontend/vercel.json` for single-page routing.

### 5. Assumptions Made
1. **Currency Standard:** All transactions, line items, and challan totals are modeled in Indian Rupees (₹) suited for domestic wholesale trade.
2. **Product Price Snapshots:** Wholesale prices change frequently. When a Challan is created, the unit price and item description are permanently frozen into the `ChallanItem` record to protect past financial and tax records from future catalog price edits.
3. **Sequential Challan Numbering:** Challans follow an automated format (`CH-YYYYMMDD-XXXX`) to facilitate physical paperwork matching in the warehouse.
4. **Draft vs. Confirmed Workflows:** Draft challans represent quotations or tentative dispatches and do not lock or deduct physical stock. Confirmation strictly decrements stock and returns HTTP 400 if stock is insufficient, preventing negative inventory.
5. **Role Exclusivity:** Admin holds universal permissions. Sales focuses on customers and orders; Warehouse controls stock and inward receipts; Accounts audits invoices and PDF printouts.

---

## Tech Stack

- **Backend:**
  - Runtime: Node.js (v20+) with TypeScript
  - Framework: Express.js
  - ORM: Prisma ORM (SQLite for instant zero-config local run; seamlessly switchable to PostgreSQL)
  - Security: JWT (JSON Web Tokens), `bcryptjs` password hashing
  - Validation: `zod` schema validation
  - PDF Generation: `pdfkit`
- **Frontend:**
  - Framework: React 18 with TypeScript
  - Build Tool: Vite
  - Styling: Tailwind CSS
  - Icons: Lucide React
  - Routing: React Router v6
  - API Client: Axios with request/response auth interceptors
- **DevOps:**
  - Docker & Docker Compose
  - Multi-stage build containers

---

## Quick Start (Local Setup)

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone & Setup Backend
```bash
cd backend
npm install

# Run database migrations and seed pre-configured test users & products
npm run prisma:push
npm run prisma:seed

# Start backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Setup & Start Frontend
Open a new terminal window:
```bash
cd frontend
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## Running with Docker

You can run the entire stack with a single command:
```bash
docker-compose up --build
```
- Frontend will be accessible at: **http://localhost:3000**
- Backend API will be accessible at: **http://localhost:5000/api**

---

## Deployment Instructions (Free Hosting Platforms)

### Option A: Frontend on Vercel / Netlify
1. Connect your GitHub repository to Vercel/Netlify.
2. Set Root Directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`

### Option B: Backend on Render / Railway
1. Create a Web Service connected to your repository.
2. Set Root Directory: `backend`
3. Build Command: `npm install && npm run build && npx prisma db push && npx tsx prisma/seed.ts`
4. Start Command: `node dist/index.js`
5. Environment Variables:
   - `PORT`: `5000`
   - `DATABASE_URL`: Your PostgreSQL database URL (from Supabase, Neon, or Render Postgres)
   - `JWT_SECRET`: `your-production-jwt-secret`
   - `NODE_ENV`: `production`

### Option C: Database on Supabase / Neon (PostgreSQL)
To switch Prisma from SQLite to PostgreSQL for production:
1. In `backend/prisma/schema.prisma`, change datasource provider from `sqlite` to `postgresql`.
2. Provide your hosted Postgres connection string in `DATABASE_URL`.
3. Run `npx prisma db push`.

---

## System Architecture & Business Logic

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│   • Role-Based Sidebar Navigation                      │
│   • 1-Click Role Switcher                              │
│   • Live Stock Validation Warnings in Challan Builder  │
└──────────────────────────┬─────────────────────────────┘
                           │ REST / JSON (Bearer JWT)
┌──────────────────────────▼─────────────────────────────┐
│             Backend API (Express + TypeScript)         │
│   • JWT Authentication & Role Guards (RBAC)            │
│   • Zod Schema Validation & Central Error Handler      │
│   • PDFKit Invoice Document Engine                     │
└──────────────────────────┬─────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼─────────────────────────────┐
│                 Database & Transactions                │
│   • Customers & Follow-Up Notes                        │
│   • Products & Minimum Stock Alerts                    │
│   • Stock Movement Audit Logs (IN / OUT)               │
│   • Sales Challans & Product Price Snapshots           │
└────────────────────────────────────────────────────────┘
```

### Core Business Rules Implemented:
1. **Immutable Product Snapshots:** When a Challan is created, the item's name, SKU, and unit price are saved as part of the challan item record. If the product price changes in the catalog later, historical challans remain untouched.
2. **Strict Stock Verification:** When a Challan is created with `status: "Confirmed"` or transitioned from `Draft` to `Confirmed`:
   - Stock is verified for all line items.
   - If `quantity > currentStock`, the operation is aborted with a `400 Bad Request` and returns the exact deficient items and available counts.
   - Stock decrements and movement log creation are executed inside an atomic database transaction (`prisma.$transaction`).
3. **Draft Lifecycle:** Draft challans can be prepared and negotiated without locking or deducting physical warehouse stock until confirmed.
4. **Order Cancellation:** If a confirmed challan is cancelled, the inventory items are automatically restocked with an inward movement audit log.

---

## Bonus Features Implementation Guide

All 4 bonus features described in the assignment specification are fully implemented and integrated:

### 1. Docker Setup
- **Root Docker Compose:** `docker-compose.yml` configures a complete multi-container stack with 3 orchestrated services:
  - `postgres`: PostgreSQL 16 database with persistent volume mapping and health check.
  - `backend`: Node.js / Express backend with Prisma migration and auto-seed execution on launch.
  - `frontend`: React SPA built with Vite and served via high-performance Nginx with HTML5 pushState routing.
- **Dockerfiles:**
  - `backend/Dockerfile`: Multi-stage build with dependency pruning and Prisma binary generation.
  - `frontend/Dockerfile`: Multi-stage build compiling TypeScript/Vite into optimized static assets and serving via Nginx.
- **Run command:** `docker-compose up --build`

### 2. GitHub Actions Deployment & CI Pipeline
- **Workflow File:** `.github/workflows/ci.yml`
- **Triggers:** Automatically executes on every `push` and `pull_request` targeting the `main` branch.
- **Pipeline Jobs:**
  - Setup Node.js 20 LTS runtime.
  - Backend dependencies installation & Prisma client generation.
  - TypeScript strict compilation (`tsc`).
  - Frontend dependencies installation & production Vite build.
  - Automated integration test execution ensuring zero regressions before deployment.

### 3. Export Invoice as PDF
- **Backend Service:** Powered by `pdfkit` in `backend/src/controllers/challanController.ts` (`exportChallanPDF`).
- **Endpoint:** `GET /api/challans/:id/pdf`
- **Features:** Generates official A4 dispatch invoices with company header, challan sequential number, customer address & GSTIN, itemized table of dispatched products, subtotal & tax breakdown, and authorized signature section.
- **Frontend Integration:** Directly accessible from the Sales Challans page with an "Export PDF" button on every challan card and modal.

### 4. Upload Product Image to AWS S3
- **Backend Service:** Implemented in `backend/src/services/s3Service.ts` using the official AWS SDK (`@aws-sdk/client-s3`).
- **Endpoint:** `POST /api/products/:id/image` (restricted to `ADMIN` and `WAREHOUSE` roles).
- **Intelligent Dual-Mode Storage:**
  - If AWS S3 credentials are provided in `.env` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION`), images are directly streamed and hosted on Amazon S3.
  - If running without paid cloud credentials or in an offline local environment, it safely falls back to local static storage in `/uploads/` and serves them via `express.static`, ensuring zero crashes and 100% functionality.
- **Database Schema:** `Product` model includes `imageUrl String?` to store the permanent public asset URL.

---

## REST API Endpoints Overview

### Authentication
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/auth/me` — Get current logged-in user profile.
- `GET /api/auth/roles` — Role definitions.

### Customer CRM
- `GET /api/customers` — Search, filter by status/type, paginated list.
- `GET /api/customers/:id` — Detail view with follow-up timeline & past orders.
- `POST /api/customers` — Create customer account (Sales, Admin).
- `PUT /api/customers/:id` — Update customer account (Sales, Admin).
- `POST /api/customers/:id/notes` — Add follow-up note (Sales, Admin).

### Product & Inventory
- `GET /api/products` — Catalog list with `isLowStock` indicator.
- `GET /api/products/:id` — Product detail with recent movements.
- `POST /api/products` — Create new catalog item (Warehouse, Admin).
- `PUT /api/products/:id` — Edit catalog item (Warehouse, Admin).
- `POST /api/products/:id/adjust-stock` — Manual stock IN/OUT adjustment (Warehouse, Admin).
- `GET /api/products/movements` — Complete inventory audit log.

### Sales Challan
- `GET /api/challans` — List sales challans with search & filters.
- `GET /api/challans/:id` — View challan details and snapshot items.
- `POST /api/challans` — Create Challan (`Draft` or `Confirmed`).
- `POST /api/challans/:id/confirm` — Confirm draft challan and deduct inventory.
- `POST /api/challans/:id/cancel` — Cancel challan.
- `GET /api/challans/:id/pdf` — Download generated PDF invoice document.

---

## Automated Testing

An end-to-end test suite is included in `test_e2e.js`. To run all 33 tests verifying role access, customer CRM, stock decrements, zero-negative stock rules, and PDF generation:

```bash
node test_e2e.js
```

**Result:** `33 PASSED, 0 FAILED (100% Success)`.

---

## Assumptions & Known Design Decisions
1. **Currency:** Pricing is standardized in Indian Rupees (₹) suited for domestic wholesale distribution operations.
2. **Local Database:** SQLite is configured by default so anyone downloading the project can run `npm run prisma:seed` and `npm run dev` in 10 seconds without having to install a local PostgreSQL server. For cloud deployment, switching to PostgreSQL is a 1-line configuration change in `schema.prisma`.
3. **Sequential Numbering:** Challan numbers are auto-generated using timestamp and sequence counters (`CH-YYYYMMDD-0001`) to guarantee human-readable uniqueness across warehouse dispatch slips.
