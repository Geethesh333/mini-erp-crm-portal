import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';
import * as authCtrl from '../controllers/authController';
import * as customerCtrl from '../controllers/customerController';
import * as productCtrl from '../controllers/productController';
import * as challanCtrl from '../controllers/challanController';
import * as dashboardCtrl from '../controllers/dashboardController';

const router = Router();

// ==================== API ROOT OVERVIEW ====================
router.get('/', (req, res) => {
  const isHtml = req.headers.accept?.includes('text/html');

  if (isHtml) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Mini ERP + CRM API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
          .card { max-width: 720px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .badge { display: inline-flex; align-items: center; gap: 6px; background: #064e3b; color: #34d399; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
          .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
          h1 { margin: 16px 0 8px; font-size: 24px; color: #fff; }
          p { color: #94a3b8; font-size: 14px; margin: 0 0 24px; }
          .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: 0.2s; }
          .btn:hover { background: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #334155; }
          th { color: #94a3b8; text-transform: uppercase; font-size: 11px; }
          code { font-family: monospace; background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> Backend API is Online (Port 5000)</div>
          <h1>Mini ERP + CRM Operations API</h1>
          <p>The backend server is running and ready to serve requests.</p>
          <a href="http://localhost:5173" class="btn">Launch Frontend Portal (localhost:5173) &rarr;</a>
          
          <h3 style="margin-top: 32px; margin-bottom: 8px; font-size: 15px; color: #e2e8f0;">Pre-Seeded Test Accounts (password: password123)</h3>
          <table>
            <thead>
              <tr><th>Role</th><th>Email</th><th>Password</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Admin</strong></td><td><code>admin@minierp.com</code></td><td><code>password123</code></td></tr>
              <tr><td><strong>Sales</strong></td><td><code>sales@minierp.com</code></td><td><code>password123</code></td></tr>
              <tr><td><strong>Warehouse</strong></td><td><code>warehouse@minierp.com</code></td><td><code>password123</code></td></tr>
              <tr><td><strong>Accounts</strong></td><td><code>accounts@minierp.com</code></td><td><code>password123</code></td></tr>
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
            Tip: For automated API testing, import <code>postman_collection.json</code> or run <code>node test_e2e.js</code>.
          </p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  res.json({
    status: 'online',
    service: 'Mini ERP + CRM Operations Portal API',
    version: '1.0.0',
    documentation: 'See README.md and postman_collection.json',
    frontendUrl: 'http://localhost:5173',
    demoCredentials: {
      Admin: { email: 'admin@minierp.com', password: 'password123' },
      Sales: { email: 'sales@minierp.com', password: 'password123' },
      Warehouse: { email: 'warehouse@minierp.com', password: 'password123' },
      Accounts: { email: 'accounts@minierp.com', password: 'password123' },
    },
    modules: {
      auth: ['POST /api/auth/login', 'GET /api/auth/roles', 'GET /api/auth/me'],
      dashboard: ['GET /api/dashboard'],
      customers: [
        'GET /api/customers',
        'GET /api/customers/:id',
        'POST /api/customers',
        'PUT /api/customers/:id',
        'POST /api/customers/:id/notes',
      ],
      products: [
        'GET /api/products',
        'GET /api/products/:id',
        'POST /api/products',
        'PUT /api/products/:id',
        'POST /api/products/:id/adjust-stock',
        'GET /api/products/movements',
      ],
      challans: [
        'GET /api/challans',
        'GET /api/challans/:id',
        'POST /api/challans',
        'POST /api/challans/:id/confirm',
        'POST /api/challans/:id/cancel',
        'GET /api/challans/:id/pdf',
      ],
    },
  });
});

// ==================== AUTH ROUTES ====================
router.post('/auth/login', authCtrl.login);
router.get('/auth/roles', authCtrl.getRoles);
router.get('/auth/me', authenticateJWT, authCtrl.getMe);

// ==================== DASHBOARD ====================
router.get('/dashboard', authenticateJWT, dashboardCtrl.getDashboardMetrics);

// ==================== CUSTOMER CRM MODULE ====================
// Sales and Admin can create/update. Accounts and Warehouse can view.
router.get('/customers', authenticateJWT, customerCtrl.getCustomers);
router.get('/customers/:id', authenticateJWT, customerCtrl.getCustomerById);
router.post('/customers', authenticateJWT, authorizeRoles('SALES', 'ADMIN'), customerCtrl.createCustomer);
router.put('/customers/:id', authenticateJWT, authorizeRoles('SALES', 'ADMIN'), customerCtrl.updateCustomer);
router.post('/customers/:id/notes', authenticateJWT, authorizeRoles('SALES', 'ADMIN'), customerCtrl.addFollowUpNote);

// ==================== PRODUCT & INVENTORY MODULE ====================
// Everyone can view products. Warehouse and Admin can add/edit and adjust stock.
router.get('/products', authenticateJWT, productCtrl.getProducts);
router.get('/products/movements', authenticateJWT, productCtrl.getStockMovements);
router.get('/products/:id', authenticateJWT, productCtrl.getProductById);
router.post('/products', authenticateJWT, authorizeRoles('WAREHOUSE', 'ADMIN'), productCtrl.createProduct);
router.put('/products/:id', authenticateJWT, authorizeRoles('WAREHOUSE', 'ADMIN'), productCtrl.updateProduct);
router.post('/products/:id/adjust-stock', authenticateJWT, authorizeRoles('WAREHOUSE', 'ADMIN'), productCtrl.adjustStock);

// ==================== SALES CHALLAN MODULE ====================
// Everyone can view challans and download PDF. Sales, Warehouse and Admin can create/confirm.
router.get('/challans', authenticateJWT, challanCtrl.getChallans);
router.get('/challans/:id', authenticateJWT, challanCtrl.getChallanById);
router.get('/challans/:id/pdf', authenticateJWT, challanCtrl.exportChallanPDF);
router.post('/challans', authenticateJWT, authorizeRoles('SALES', 'ADMIN'), challanCtrl.createChallan);
router.post('/challans/:id/confirm', authenticateJWT, authorizeRoles('SALES', 'WAREHOUSE', 'ADMIN'), challanCtrl.confirmChallan);
router.post('/challans/:id/cancel', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), challanCtrl.cancelChallan);

export default router;
