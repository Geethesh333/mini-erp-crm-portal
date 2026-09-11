# System & Technical Documentation

> **Mini ERP + CRM Operations Portal**  
> Case Study Technical & Operational Report

---

## 1. How the Server Was Set Up

### Architecture & Runtime
- **Runtime Environment:** Built with **Node.js (v20 LTS)** and **TypeScript 5.6** configured with `ES2022` target output and standard CommonJS modules.
- **Web Application Framework:** **Express.js (v4.21)** structured using a clean 3-tier Controller-Service-Repository pattern.
- **Database & ORM:** **Prisma ORM (v5.21)** with relational models, cascading relations, and transactional atomicity. Configured for **PostgreSQL** in production (hosted on Neon.tech) and **SQLite** for zero-dependency local setups.
- **Document Generation Engine:** Integrated with `pdfkit` for on-the-fly streaming of branded, itemized A4 Sales Challans and Invoices.

### Directory & Modular Organization
```text
backend/
├── prisma/
│   ├── schema.prisma         # Relational database models & constraints
│   └── seed.ts               # Database seeder (users, products, CRM logs, challans)
├── src/
│   ├── config/index.ts       # Centralized typed environment configuration
│   ├── controllers/          # Business logic handlers
│   │   ├── authController.ts
│   │   ├── customerController.ts
│   │   ├── productController.ts
│   │   ├── challanController.ts
│   │   └── dashboardController.ts
│   ├── middleware/           # Security, auth, and error handling
│   │   ├── authMiddleware.ts # JWT verification & RBAC authorization
│   │   └── errorHandler.ts   # Central error handling & Zod error parsing
│   ├── routes/index.ts       # REST endpoints with role guards
│   ├── services/
│   │   └── pdfService.ts     # PDF invoice builder with tax & snapshot tables
│   ├── prisma.ts             # Prisma client singleton instance
│   └── index.ts              # Express initialization, CORS, logging, & server boot
├── scripts/                  # Helper scripts (use-postgres.js, use-sqlite.js)
├── Dockerfile                # Multi-stage container build
├── package.json
└── tsconfig.json
```

### Security & Operational Middleware
- **Password Security:** One-way password hashing using `bcryptjs` with 10 salt rounds.
- **Authentication & RBAC:** Stateless JWT (`jsonwebtoken`) signed with a cryptographic secret, checked via `authenticateJWT` and `authorizeRoles('ADMIN', 'SALES', ...)` guards.
- **Input Validation:** Strict schema validation via `zod` returning structured field-level errors on invalid payloads.
- **Request Logging:** Custom logging middleware recording timestamp, HTTP method, route, status code, and latency in milliseconds.
- **Universal Route Mounting:** Routes mounted simultaneously on `/api` and `/` on `0.0.0.0` to support both direct API access and proxy routing.

---

## 2. How Environment Variables Are Managed

### Isolation & Best Practices
- Sensitive configuration (ports, database credentials, JWT secrets) is strictly decoupled from source code and never hardcoded.
- **Local Development:** Managed via `.env` file in `backend/` and loaded automatically at startup by `dotenv`.
- **Production Deployment:** Injected securely via cloud provider environment dashboards (Render for Backend, Vercel for Frontend).
- **Template Reference:** An audited template is committed to the repository as `backend/.env.example`.

### Managed Variables Reference Table

| Variable | Scope | Description | Default / Example Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | Port number for Express server | `5000` |
| `DATABASE_URL` | Backend | Database connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Backend | Cryptographic secret for signing JWTs | `super-secret-jwt-key-for-mini-erp-crm` |
| `JWT_EXPIRES_IN` | Backend | Expiration duration for access tokens | `7d` |
| `NODE_ENV` | Backend | Environment flag | `development` or `production` |
| `FRONTEND_URL` | Backend | Allowed origin for CORS headers | `http://localhost:5173` |
| `VITE_API_URL` | Frontend | Target API endpoint for Axios client | `https://your-backend.onrender.com/api` |

---

## 3. How to Run the Project Locally

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Method A: 1-Click Launch (Windows)
A helper script is provided in the repository root:
1. Double-click **`start_all.bat`**.
2. Both the backend (Port 5000) and frontend (Port 5173) will launch in separate terminal windows, and your browser will open **http://localhost:5173**.

### Method B: Manual Command-Line Setup

1. **Setup and Start Backend:**
   ```bash
   cd backend
   npm install

   # Push database schema & seed initial test accounts
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts

   # Start backend (runs on http://localhost:5000)
   npm run dev
   ```

2. **Setup and Start Frontend:**
   Open a separate terminal:
   ```bash
   cd frontend
   npm install

   # Start Vite dev server (runs on http://localhost:5173)
   npm run dev
   ```

3. **Open Application in Browser:**
   Navigate to **`http://localhost:5173`** and use the **One-Click Role Logins** on the login card.

### Method C: Run with Docker Compose
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

### Method D: Run Automated Test Suite
To execute the comprehensive 33-step end-to-end verification suite:
```bash
node test_e2e.js
```
*Result: 33 Passed, 0 Failed (100% success).*

---

## 4. How to Deploy the Project

The application is architected for deployment across modern free cloud hosting tiers:

```
┌─────────────────────────────────┐
│     Vercel (Free Hosting)       │  <-- Live Frontend Web App (React + Vite)
│   https://your-app.vercel.app   │
└────────────────┬────────────────┘
                 │ HTTPS / REST
┌────────────────▼────────────────┐
│     Render (Free Web Service)   │  <-- Live Backend API (Express + Node.js)
│  https://your-api.onrender.com  │
└────────────────┬────────────────┘
                 │ SSL Connection
┌────────────────▼────────────────┐
│    Neon.tech (Free Serverless)  │  <-- PostgreSQL Database
│      postgresql://...           │
└─────────────────────────────────┘
```

### Step 1: Database Setup (Neon Serverless PostgreSQL)
1. Register at [neon.tech](https://neon.tech) and create a project (e.g. `minierp-db`).
2. Copy the PostgreSQL connection string:
   `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### Step 2: Backend Deployment (Render)
1. Go to [render.com](https://render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository (`mini-erp-crm-portal`).
3. Configure settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:**
     `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:**
     `node dist/index.js`
4. Add Environment Variables:
   - `DATABASE_URL` = *(Your Neon PostgreSQL connection string)*
   - `JWT_SECRET` = `super-secret-jwt-key-for-mini-erp-crm`
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
5. Click **Create Web Service**. On boot, `index.ts` automatically verifies schema synchronization and seeds test data if empty.

### Step 3: Frontend Deployment (Vercel)
1. Go to [vercel.com](https://vercel.com) and click **Add New…** → **Project**.
2. Import the `mini-erp-crm-portal` repository.
3. Configure settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Click **Deploy**. Single Page Application (SPA) routing and deep refreshes are managed via `frontend/vercel.json`.

---

## 5. Any Assumptions Made

1. **Currency Standard:** All pricing, subtotals, and challan valuations are modeled in **Indian Rupees (₹)**, aligning with standard domestic wholesale trade practices.
2. **Product Snapshot Preservation:** Wholesale catalog prices fluctuate frequently. To maintain legal and auditing integrity, when a Sales Challan is generated, the item's name, SKU, and unit price are **snapshotted immutably** into the `ChallanItem` record. Subsequent catalog price adjustments never alter past dispatches or accounting invoices.
3. **Sequential Challan Numbering:** Challans follow an automated sequential format (`CH-YYYYMMDD-XXXX`), ensuring human-readable uniqueness for warehouse paperwork matching.
4. **Draft vs. Confirmed State Machine:**
   - **Draft:** Allows sales personnel to prepare quotations or tentative dispatch slips without locking or deducting physical warehouse stock.
   - **Confirmed:** Enforces strict inventory verification. If requested units exceed available warehouse stock, the request is rejected with `HTTP 400 Bad Request` specifying the exact deficient product and current stock. Stock deduction and outward movement logs occur inside an atomic database transaction (`prisma.$transaction`), ensuring **stock never goes negative**.
5. **Order Cancellation Restocking:** If a Confirmed challan is cancelled, items are automatically restocked into the product inventory with an inward audit movement log.
6. **Role-Based Separation of Concerns:**
   - `ADMIN`: Holds universal permissions across all portal operations.
   - `SALES`: Restricted to Customer CRM management and Sales Challan creation.
   - `WAREHOUSE`: Controls physical stock adjustments, bin locations, and inventory audit logs.
   - `ACCOUNTS`: Focused on financial auditing, invoice inspection, and PDF invoice downloads.
