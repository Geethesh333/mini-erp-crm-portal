// Comprehensive End-to-End Test Suite for Mini ERP + CRM Portal

const API_BASE = 'http://localhost:5000/api';

async function testSuite() {
  console.log('🧪 Starting Mini ERP + CRM Automated Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Check
  console.log('--- 1. Testing System Health ---');
  const healthRes = await fetch('http://localhost:5000/health').then(r => r.json());
  assert(healthRes.status === 'ok', 'Server health check returns ok');

  // 2. Auth Tests for All 4 Roles
  console.log('\n--- 2. Testing Authentication & RBAC for All 4 Roles ---');
  const roles = [
    { role: 'ADMIN', email: 'admin@minierp.com', expectedName: 'Sarah Connor (Admin)' },
    { role: 'SALES', email: 'sales@minierp.com', expectedName: 'Alex Rivera (Sales)' },
    { role: 'WAREHOUSE', email: 'warehouse@minierp.com', expectedName: 'Dave Miller (Warehouse)' },
    { role: 'ACCOUNTS', email: 'accounts@minierp.com', expectedName: 'Elena Rostova (Accounts)' },
  ];

  const tokens = {};
  for (const r of roles) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: r.email, password: 'password123' }),
    }).then(res => res.json());

    assert(res.success === true, `Login successful for ${r.role}`);
    assert(res.user?.role === r.role, `Token correctly encodes role ${r.role}`);
    tokens[r.role] = res.token;
  }

  // Verify getMe
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${tokens.ADMIN}` },
  }).then(r => r.json());
  assert(meRes.user?.email === 'admin@minierp.com', 'GET /api/auth/me returns valid admin profile');

  // 3. Customer CRM Tests
  console.log('\n--- 3. Testing Customer CRM Module ---');
  const custRes = await fetch(`${API_BASE}/customers`, {
    headers: { Authorization: `Bearer ${tokens.SALES}` },
  }).then(r => r.json());
  assert(custRes.success === true && custRes.data.length > 0, `Customers list returned ${custRes.data?.length} records`);

  // Create new customer
  const newCustRes = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.SALES}`,
    },
    body: JSON.stringify({
      customerName: 'Test Buyer',
      mobileNumber: '+91 99999 88888',
      email: 'testbuyer@wholesalehub.com',
      businessName: 'Dynamic Enterprises',
      gstNumber: '29ABCDE1234F1Z5',
      customerType: 'Wholesale',
      address: 'Industrial Road 9, Hubli, Karnataka',
      status: 'Active',
      notes: 'Initial test note',
    }),
  }).then(r => r.json());
  assert(newCustRes.success === true, 'Created new customer successfully');
  const testCustId = newCustRes.customer.id;

  // Add follow-up note
  const noteRes = await fetch(`${API_BASE}/customers/${testCustId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.SALES}`,
    },
    body: JSON.stringify({
      note: 'Followed up via phone. Client wants quote for 100 drill units.',
      followUpDate: '2026-09-20',
    }),
  }).then(r => r.json());
  assert(noteRes.success === true, 'Recorded CRM follow-up note');

  // Verify customer detail page includes note
  const detailRes = await fetch(`${API_BASE}/customers/${testCustId}`, {
    headers: { Authorization: `Bearer ${tokens.SALES}` },
  }).then(r => r.json());
  assert(detailRes.customer?.followUps?.length >= 2, 'Customer detail page has complete follow-up notes history');

  // 4. Product & Inventory Module Tests
  console.log('\n--- 4. Testing Product & Inventory Module ---');
  const prodRes = await fetch(`${API_BASE}/products`, {
    headers: { Authorization: `Bearer ${tokens.WAREHOUSE}` },
  }).then(r => r.json());
  assert(prodRes.success === true && prodRes.data.length > 0, `Product catalog returned ${prodRes.data?.length} items`);

  // Create a new product with stock
  const testSku = `TEST-ITEM-${Date.now().toString().slice(-4)}`;
  const createProdRes = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.WAREHOUSE}`,
    },
    body: JSON.stringify({
      name: 'Precision Laser Measure 50m',
      sku: testSku,
      category: 'Power Tools',
      unitPrice: 1950.0,
      currentStock: 20,
      minStockAlert: 5,
      location: 'Warehouse A - Bin 99',
    }),
  }).then(r => r.json());
  assert(createProdRes.success === true, `Created product with SKU ${testSku} and initial stock 20`);
  const testProdId = createProdRes.product.id;

  // Adjust stock IN
  const adjustInRes = await fetch(`${API_BASE}/products/${testProdId}/adjust-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.WAREHOUSE}`,
    },
    body: JSON.stringify({
      quantity: 10,
      movementType: 'IN',
      reason: 'Additional shipment received',
    }),
  }).then(r => r.json());
  assert(adjustInRes.product?.currentStock === 30, 'Adjusted stock IN: 20 + 10 = 30');

  // Adjust stock OUT
  const adjustOutRes = await fetch(`${API_BASE}/products/${testProdId}/adjust-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.WAREHOUSE}`,
    },
    body: JSON.stringify({
      quantity: 5,
      movementType: 'OUT',
      reason: 'Samples dispatched',
    }),
  }).then(r => r.json());
  assert(adjustOutRes.product?.currentStock === 25, 'Adjusted stock OUT: 30 - 5 = 25');

  // Verify stock movements logged
  const movementsRes = await fetch(`${API_BASE}/products/movements?productId=${testProdId}`, {
    headers: { Authorization: `Bearer ${tokens.WAREHOUSE}` },
  }).then(r => r.json());
  assert(movementsRes.data?.length === 3, 'Audit log recorded opening stock + IN + OUT movements');

  // 5. Sales Challan Module & Business Rules Tests
  console.log('\n--- 5. Testing Sales Challan Module & Strict Stock Validation ---');
  
  // Create Draft Challan
  const draftChallanRes = await fetch(`${API_BASE}/challans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.SALES}`,
    },
    body: JSON.stringify({
      customerId: testCustId,
      status: 'Draft',
      notes: 'Testing draft challan without stock decrement',
      items: [
        { productId: testProdId, quantity: 10 },
      ],
    }),
  }).then(r => r.json());
  assert(draftChallanRes.success === true, `Created Draft Challan ${draftChallanRes.challan?.challanNumber}`);
  const draftChallanId = draftChallanRes.challan.id;

  // Verify stock was NOT reduced for Draft
  const prodCheck1 = await fetch(`${API_BASE}/products/${testProdId}`, {
    headers: { Authorization: `Bearer ${tokens.SALES}` },
  }).then(r => r.json());
  assert(prodCheck1.product?.currentStock === 25, 'Draft Challan does NOT deduct stock (Stock remains 25)');

  // Verify item snapshot
  assert(draftChallanRes.challan?.items[0]?.productName === 'Precision Laser Measure 50m', 'Challan stored immutable product name snapshot');
  assert(draftChallanRes.challan?.items[0]?.unitPrice === 1950.0, 'Challan stored immutable unit price snapshot');

  // Confirm the Draft Challan -> Stock MUST be reduced from 25 to 15!
  const confirmRes = await fetch(`${API_BASE}/challans/${draftChallanId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.SALES}` },
  }).then(r => r.json());
  assert(confirmRes.success === true, 'Confirmed Draft Challan successfully');

  const prodCheck2 = await fetch(`${API_BASE}/products/${testProdId}`, {
    headers: { Authorization: `Bearer ${tokens.SALES}` },
  }).then(r => r.json());
  assert(prodCheck2.product?.currentStock === 15, 'Confirmed Challan atomically reduced stock: 25 - 10 = 15');

  // TEST STRICT BUSINESS RULE: Attempt to order MORE than available stock (Requested 50, Available 15)
  console.log('\n--- 5.1 Testing Negative Stock Prevention Rule ---');
  const overstockChallanRes = await fetch(`${API_BASE}/challans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.SALES}`,
    },
    body: JSON.stringify({
      customerId: testCustId,
      status: 'Confirmed',
      items: [
        { productId: testProdId, quantity: 50 }, // Only 15 available!
      ],
    }),
  });
  const overstockJson = await overstockChallanRes.json();
  assert(overstockChallanRes.status === 400, 'HTTP 400 returned when requested quantity exceeds available stock');
  assert(overstockJson.success === false, 'API cleanly rejects confirmation due to insufficient stock');

  // Verify stock remained at 15 and did NOT go negative!
  const prodCheck3 = await fetch(`${API_BASE}/products/${testProdId}`, {
    headers: { Authorization: `Bearer ${tokens.SALES}` },
  }).then(r => r.json());
  assert(prodCheck3.product?.currentStock === 15, 'Stock did NOT go negative, remained strictly at 15');

  // 6. PDF Export Test (Bonus Feature)
  console.log('\n--- 6. Testing PDF Invoice / Challan Export (Bonus Feature) ---');
  const pdfRes = await fetch(`${API_BASE}/challans/${draftChallanId}/pdf`, {
    headers: { Authorization: `Bearer ${tokens.ACCOUNTS}` },
  });
  assert(pdfRes.status === 200, 'PDF generation endpoint returned HTTP 200');
  const contentType = pdfRes.headers.get('content-type');
  assert(contentType?.includes('application/pdf'), `Returned correct Content-Type: ${contentType}`);

  // 7. Dashboard Metrics
  console.log('\n--- 7. Testing Dashboard Metrics ---');
  const dashRes = await fetch(`${API_BASE}/dashboard`, {
    headers: { Authorization: `Bearer ${tokens.ADMIN}` },
  }).then(r => r.json());
  assert(dashRes.metrics?.totalCustomers >= 5, `Dashboard aggregates ${dashRes.metrics?.totalCustomers} customers`);
  assert(dashRes.metrics?.totalProducts >= 8, `Dashboard aggregates ${dashRes.metrics?.totalProducts} products`);
  assert(dashRes.metrics?.totalChallans >= 2, `Dashboard aggregates ${dashRes.metrics?.totalChallans} sales challans`);

  // Final summary
  console.log('\n=========================================');
  console.log(`🏁 TEST RUN RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=========================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL INTEGRATION & BUSINESS LOGIC TESTS PASSED WITH 100% SUCCESS!\n');
  }
}

testSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
