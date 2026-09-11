import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records
  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users with Roles
  console.log('👤 Seeding users for all 4 roles...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Sarah Connor (Admin)',
        email: 'admin@minierp.com',
        password: passwordHash,
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Alex Rivera (Sales)',
        email: 'sales@minierp.com',
        password: passwordHash,
        role: 'SALES',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dave Miller (Warehouse)',
        email: 'warehouse@minierp.com',
        password: passwordHash,
        role: 'WAREHOUSE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Elena Rostova (Accounts)',
        email: 'accounts@minierp.com',
        password: passwordHash,
        role: 'ACCOUNTS',
      },
    }),
  ]);

  // 3. Seed Products
  console.log('📦 Seeding wholesale products...');
  const productsData = [
    {
      name: 'Heavy Duty Power Drill 750W',
      sku: 'TOOL-DRL-001',
      category: 'Power Tools',
      unitPrice: 2850.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Warehouse A - Rack 01',
    },
    {
      name: 'Cordless Angle Grinder 20V',
      sku: 'TOOL-GRD-002',
      category: 'Power Tools',
      unitPrice: 3400.0,
      currentStock: 6, // Low stock on purpose!
      minStockAlert: 10,
      location: 'Warehouse A - Rack 02',
    },
    {
      name: 'Cat6 Shielded Ethernet Cable 305m',
      sku: 'NET-CAB-100',
      category: 'Networking',
      unitPrice: 4200.0,
      currentStock: 30,
      minStockAlert: 5,
      location: 'Warehouse B - Bin 14',
    },
    {
      name: '24-Port Gigabit Managed Switch',
      sku: 'NET-SWT-024',
      category: 'Networking',
      unitPrice: 8900.0,
      currentStock: 12,
      minStockAlert: 4,
      location: 'Warehouse B - Bin 15',
    },
    {
      name: 'Corrugated Shipping Boxes (Pack of 50)',
      sku: 'PKG-BOX-50',
      category: 'Packaging Supplies',
      unitPrice: 950.0,
      currentStock: 150,
      minStockAlert: 25,
      location: 'Warehouse C - Bay 03',
    },
    {
      name: 'Industrial Stretch Wrap Film 500mm',
      sku: 'PKG-WRP-500',
      category: 'Packaging Supplies',
      unitPrice: 620.0,
      currentStock: 4, // Low stock on purpose!
      minStockAlert: 15,
      location: 'Warehouse C - Bay 04',
    },
    {
      name: 'Ergonomic Standing Desk Frame',
      sku: 'OFF-DSK-200',
      category: 'Office Furniture',
      unitPrice: 14500.0,
      currentStock: 18,
      minStockAlert: 5,
      location: 'Warehouse D - Area 01',
    },
    {
      name: 'High-Back Mesh Executive Chair',
      sku: 'OFF-CHR-101',
      category: 'Office Furniture',
      unitPrice: 7800.0,
      currentStock: 25,
      minStockAlert: 8,
      location: 'Warehouse D - Area 02',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.create({ data: p });
    createdProducts.push(product);

    // Initial stock movement log
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: product.currentStock,
        movementType: 'IN',
        reason: 'Initial Inward Stock Audit',
        createdBy: 'Dave Miller (Warehouse)',
      },
    });
  }

  // 4. Seed Customers
  console.log('🏢 Seeding customers & CRM follow-up logs...');
  const customersData = [
    {
      customerName: 'Rajesh Sharma',
      mobileNumber: '+91 98200 11223',
      email: 'rajesh@apexindustrial.com',
      businessName: 'Apex Industrial Solutions Pvt Ltd',
      gstNumber: '27AABCA1234F1Z5',
      customerType: 'Distributor',
      address: 'Plot 45, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093',
      status: 'Active',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Key distributor for western region. Interested in expanding power tools line.',
    },
    {
      customerName: 'Priya Sundaram',
      mobileNumber: '+91 94440 98765',
      email: 'priya@chennaitechdist.in',
      businessName: 'Chennai Tech Distributors',
      gstNumber: '33AAAAA0000A1Z5',
      customerType: 'Wholesale',
      address: '12 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
      status: 'Active',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Regular buyer of networking gear. Follow up for monthly contract order.',
    },
    {
      customerName: 'Amit Verma',
      mobileNumber: '+91 98110 55443',
      email: 'amit@delhiretailhub.com',
      businessName: 'Delhi Retail World',
      gstNumber: '07AAACR4567P1ZV',
      customerType: 'Retail',
      address: 'Shop 14, Main Market, Lajpat Nagar II, New Delhi 110024',
      status: 'Lead',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'Met at Trade Expo 2026. Requested catalog and wholesale price list.',
    },
    {
      customerName: 'Kavita Patel',
      mobileNumber: '+91 97230 44556',
      email: 'kavita@gujaratpack.com',
      businessName: 'Gujarat Packaging Mart',
      gstNumber: '24BBBBP8888Q1Z1',
      customerType: 'Wholesale',
      address: 'GIDC Estate, Vatva, Ahmedabad, Gujarat 382445',
      status: 'Active',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Orders corrugated boxes every 3 weeks.',
    },
    {
      customerName: 'Vikram Mehta',
      mobileNumber: '+91 98300 77889',
      email: 'vikram@easternhardware.in',
      businessName: 'Eastern Hardware Syndicate',
      gstNumber: '19CCCCD1111E1Z0',
      customerType: 'Distributor',
      address: '88 Brabourne Road, BBD Bagh, Kolkata, West Bengal 700001',
      status: 'Inactive',
      followUpDate: null,
      notes: 'Account paused due to credit delay. Waiting for clearance.',
    },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);

    // Add follow-up logs
    await prisma.customerFollowUp.create({
      data: {
        customerId: cust.id,
        note: `Account onboarded. Initial status: ${cust.status}. Note: ${cust.notes}`,
        followUpDate: cust.followUpDate,
        createdBy: 'Alex Rivera (Sales)',
      },
    });

    if (cust.status === 'Active') {
      await prisma.customerFollowUp.create({
        data: {
          customerId: cust.id,
          note: 'Called client to discuss quarterly pricing discount structure. Very receptive.',
          followUpDate: cust.followUpDate,
          createdBy: 'Alex Rivera (Sales)',
        },
      });
    }
  }

  // 5. Seed Sales Challans (One Confirmed, One Draft)
  console.log('📋 Seeding sample Sales Challans...');
  const apex = createdCustomers[0];
  const p1 = createdProducts[0]; // Drill
  const p2 = createdProducts[2]; // Ethernet Cable

  // Confirmed Challan
  const challan1Number = 'CH-20260901-0001';
  const c1Qty1 = 5;
  const c1Qty2 = 2;
  const c1TotalQty = c1Qty1 + c1Qty2;
  const c1TotalAmt = p1.unitPrice * c1Qty1 + p2.unitPrice * c1Qty2;

  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: challan1Number,
      customerId: apex.id,
      totalQuantity: c1TotalQty,
      totalAmount: c1TotalAmt,
      status: 'Confirmed',
      createdBy: 'Alex Rivera (Sales)',
      notes: 'Priority dispatch via express cargo.',
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            productSku: p1.sku,
            category: p1.category,
            unitPrice: p1.unitPrice,
            quantity: c1Qty1,
            subtotal: p1.unitPrice * c1Qty1,
          },
          {
            productId: p2.id,
            productName: p2.name,
            productSku: p2.sku,
            category: p2.category,
            unitPrice: p2.unitPrice,
            quantity: c1Qty2,
            subtotal: p2.unitPrice * c1Qty2,
          },
        ],
      },
    },
  });

  // Deduct stock for confirmed challan
  await prisma.product.update({
    where: { id: p1.id },
    data: { currentStock: { decrement: c1Qty1 } },
  });
  await prisma.stockMovement.create({
    data: {
      productId: p1.id,
      quantity: c1Qty1,
      movementType: 'OUT',
      reason: `Sales Challan dispatch #${challan1Number}`,
      createdBy: 'Dave Miller (Warehouse)',
    },
  });

  await prisma.product.update({
    where: { id: p2.id },
    data: { currentStock: { decrement: c1Qty2 } },
  });
  await prisma.stockMovement.create({
    data: {
      productId: p2.id,
      quantity: c1Qty2,
      movementType: 'OUT',
      reason: `Sales Challan dispatch #${challan1Number}`,
      createdBy: 'Dave Miller (Warehouse)',
    },
  });

  // Draft Challan
  const chennai = createdCustomers[1];
  const p3 = createdProducts[3]; // Switch
  const challan2Number = 'CH-20260902-0002';
  const c2Qty = 2;

  await prisma.salesChallan.create({
    data: {
      challanNumber: challan2Number,
      customerId: chennai.id,
      totalQuantity: c2Qty,
      totalAmount: p3.unitPrice * c2Qty,
      status: 'Draft',
      createdBy: 'Alex Rivera (Sales)',
      notes: 'Draft order awaiting final customer sign-off.',
      items: {
        create: [
          {
            productId: p3.id,
            productName: p3.name,
            productSku: p3.sku,
            category: p3.category,
            unitPrice: p3.unitPrice,
            quantity: c2Qty,
            subtotal: p3.unitPrice * c2Qty,
          },
        ],
      },
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('🔑 Test Credentials:');
  console.log('   Admin:     admin@minierp.com     / password123');
  console.log('   Sales:     sales@minierp.com     / password123');
  console.log('   Warehouse: warehouse@minierp.com / password123');
  console.log('   Accounts:  accounts@minierp.com  / password123');
}

export { main as seedDatabase };

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error during database seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
