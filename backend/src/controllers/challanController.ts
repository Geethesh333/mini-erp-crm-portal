import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { generateChallanPDF } from '../services/pdfService';

const challanItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
  notes: z.string().optional().nullable(),
  items: z.array(challanItemInputSchema).min(1, 'At least one product item is required'),
});

// Auto-generate unique sequential Challan Number
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.salesChallan.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `CH-${dateStr}-${sequence}`;
};

export const getChallans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const customerId = req.query.customerId as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { customerName: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status && ['Draft', 'Confirmed', 'Cancelled'].includes(status)) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          customer: {
            select: { id: true, customerName: true, businessName: true, mobileNumber: true, email: true },
          },
          items: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Sales Challan not found' });
      return;
    }

    res.json({ success: true, challan });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createChallanSchema.parse(req.body);
    const user = req.user?.name || 'Sales Rep';

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({ where: { id: validated.customerId } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Selected customer does not exist' });
      return;
    }

    // Fetch products to capture snapshots and verify stock
    const productIds = validated.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate that all requested products exist
    for (const item of validated.items) {
      if (!productMap.has(item.productId)) {
        res.status(400).json({ success: false, message: `Product ID '${item.productId}' not found in catalog.` });
        return;
      }
    }

    // If status is Confirmed, strictly check that stock is sufficient
    if (validated.status === 'Confirmed') {
      const insufficientItems: Array<{ product: string; sku: string; requested: number; available: number }> = [];

      for (const item of validated.items) {
        const prod = productMap.get(item.productId)!;
        if (prod.currentStock < item.quantity) {
          insufficientItems.push({
            product: prod.name,
            sku: prod.sku,
            requested: item.quantity,
            available: prod.currentStock,
          });
        }
      }

      if (insufficientItems.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Insufficient stock for one or more products. Challan cannot be confirmed.',
          details: insufficientItems,
        });
        return;
      }
    }

    // Build line items snapshots and calculate totals
    let totalQuantity = 0;
    let totalAmount = 0;

    const snapshotItems = validated.items.map(item => {
      const prod = productMap.get(item.productId)!;
      const subtotal = prod.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += subtotal;

      return {
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        category: prod.category,
        unitPrice: prod.unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    const challanNumber = await generateChallanNumber();

    // Execute atomic transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      // 1. Create Challan and Snapshot Items
      const created = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId: validated.customerId,
          totalQuantity,
          totalAmount,
          status: validated.status,
          createdBy: user,
          notes: validated.notes || null,
          items: {
            create: snapshotItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // 2. If Confirmed, decrement stock and log stock movement
      if (validated.status === 'Confirmed') {
        for (const item of validated.items) {
          const prod = productMap.get(item.productId)!;

          await tx.product.update({
            where: { id: prod.id },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: prod.id,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan dispatch #${challanNumber}`,
              createdBy: user,
            },
          });
        }
      }

      return created;
    });

    res.status(201).json({
      success: true,
      message: `Sales Challan ${newChallan.challanNumber} created as ${newChallan.status}`,
      challan: newChallan,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user?.name || 'Sales/Warehouse';

    const existing = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Sales Challan not found' });
      return;
    }

    if (existing.status === 'Confirmed') {
      res.status(400).json({ success: false, message: 'This challan is already confirmed.' });
      return;
    }

    if (existing.status === 'Cancelled') {
      res.status(400).json({ success: false, message: 'Cancelled challans cannot be confirmed.' });
      return;
    }

    // Check stock for all items
    const productIds = existing.items.map(i => i.productId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map(p => [p.id, p]));

    const insufficientItems: Array<{ product: string; sku: string; requested: number; available: number }> = [];

    for (const item of existing.items) {
      if (!item.productId || !productMap.has(item.productId)) {
        insufficientItems.push({
          product: item.productName,
          sku: item.productSku,
          requested: item.quantity,
          available: 0,
        });
        continue;
      }
      const prod = productMap.get(item.productId)!;
      if (prod.currentStock < item.quantity) {
        insufficientItems.push({
          product: prod.name,
          sku: prod.sku,
          requested: item.quantity,
          available: prod.currentStock,
        });
      }
    }

    if (insufficientItems.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Insufficient stock. Cannot confirm challan.',
        details: insufficientItems,
      });
      return;
    }

    // Atomic confirmation and stock decrement
    const updated = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.salesChallan.update({
        where: { id },
        data: { status: 'Confirmed' },
        include: { customer: true, items: true },
      });

      for (const item of existing.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan confirmed #${existing.challanNumber}`,
              createdBy: user,
            },
          });
        }
      }

      return confirmed;
    });

    res.json({
      success: true,
      message: `Challan ${updated.challanNumber} has been confirmed and stock deducted.`,
      challan: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user?.name || 'Admin';

    const existing = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Sales Challan not found' });
      return;
    }

    if (existing.status === 'Cancelled') {
      res.status(400).json({ success: false, message: 'Challan is already cancelled.' });
      return;
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // If it was already confirmed, return items back into inventory!
      if (existing.status === 'Confirmed') {
        for (const item of existing.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                movementType: 'IN',
                reason: `Return from cancelled Challan #${existing.challanNumber}`,
                createdBy: user,
              },
            });
          }
        }
      }

      return tx.salesChallan.update({
        where: { id },
        data: { status: 'Cancelled' },
        include: { customer: true, items: true },
      });
    });

    res.json({
      success: true,
      message: `Challan ${cancelled.challanNumber} has been cancelled.`,
      challan: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

export const exportChallanPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Challan not found' });
      return;
    }

    generateChallanPDF(challan as any, res);
  } catch (error) {
    next(error);
  }
};
