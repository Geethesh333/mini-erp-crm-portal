import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { uploadProductImage } from '../services/s3Service';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required').toUpperCase(),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0, 'Current stock must be zero or positive').default(0),
  minStockAlert: z.number().int().min(0, 'Minimum stock alert must be zero or positive').default(10),
  location: z.string().min(2, 'Warehouse location is required'),
});

const adjustStockSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required'),
});

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStockOnly = req.query.lowStock === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    // Compute low stock status
    const enriched = products.map(p => ({
      ...p,
      isLowStock: p.currentStock <= p.minStockAlert,
    }));

    const filtered = lowStockOnly ? enriched.filter(p => p.isLowStock) : enriched;

    res.json({
      success: true,
      data: filtered,
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

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({
      success: true,
      product: {
        ...product,
        isLowStock: product.currentStock <= product.minStockAlert,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = productSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({ where: { sku: validated.sku } });
    if (existingSku) {
      res.status(400).json({ success: false, message: `Product with SKU '${validated.sku}' already exists.` });
      return;
    }

    const user = req.user?.name || 'System';

    // Create product and log initial stock movement if currentStock > 0
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: validated.name,
          sku: validated.sku,
          category: validated.category,
          unitPrice: validated.unitPrice,
          currentStock: validated.currentStock,
          minStockAlert: validated.minStockAlert,
          location: validated.location,
        },
      });

      if (validated.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: validated.currentStock,
            movementType: 'IN',
            reason: 'Initial Opening Stock',
            createdBy: user,
          },
        });
      }

      return product;
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = productSchema.partial().parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (validated.sku && validated.sku !== existing.sku) {
      const skuTaken = await prisma.product.findUnique({ where: { sku: validated.sku } });
      if (skuTaken) {
        res.status(400).json({ success: false, message: `SKU '${validated.sku}' is already in use by another product.` });
        return;
      }
    }

    // Do not allow currentStock to be directly updated here - must use adjust-stock for audit logging
    const { currentStock, ...safeUpdates } = validated as any;

    const updated = await prisma.product.update({
      where: { id },
      data: safeUpdates,
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, movementType, reason } = adjustStockSchema.parse(req.body);
    const user = req.user?.name || 'System';

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      if (movementType === 'OUT' && product.currentStock < quantity) {
        throw new Error(`INSUFFICIENT_STOCK: Current stock is ${product.currentStock}, cannot deduct ${quantity}.`);
      }

      const newStock = movementType === 'IN'
        ? product.currentStock + quantity
        : product.currentStock - quantity;

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          quantity,
          movementType,
          reason,
          createdBy: user,
        },
      });

      return { updatedProduct, movement };
    });

    res.json({
      success: true,
      message: `Stock successfully adjusted (${movementType} ${quantity} units)`,
      product: result.updatedProduct,
      movement: result.movement,
    });
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    if (error.message?.startsWith('INSUFFICIENT_STOCK')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const productId = req.query.productId as string;
    const movementType = req.query.movementType as string;

    const where: any = {};
    if (productId) where.productId = productId;
    if (movementType && ['IN', 'OUT'].includes(movementType)) where.movementType = movementType;

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true, sku: true, category: true, currentStock: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: movements,
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

export const uploadProductImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { imageBase64, fileName, contentType } = req.body;

    if (!imageBase64) {
      res.status(400).json({ success: false, message: 'Image base64 data is required.' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const uploadResult = await uploadProductImage(
      fileName || `${product.sku}.jpg`,
      buffer,
      contentType || 'image/jpeg'
    );

    const updated = await prisma.product.update({
      where: { id },
      data: { imageUrl: uploadResult.url },
    });

    res.json({
      success: true,
      message: `Image successfully uploaded via ${uploadResult.provider}`,
      imageUrl: uploadResult.url,
      provider: uploadResult.provider,
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};
