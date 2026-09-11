import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalCustomers,
      totalProducts,
      allProducts,
      challanStats,
      recentChallans,
      recentMovements,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.findMany({ select: { currentStock: true, minStockAlert: true } }),
      prisma.salesChallan.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true, totalQuantity: true },
      }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdDate: 'desc' },
        include: {
          customer: { select: { customerName: true, businessName: true } },
        },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
        },
      }),
    ]);

    const lowStockCount = allProducts.filter(p => p.currentStock <= p.minStockAlert).length;

    res.json({
      success: true,
      metrics: {
        totalCustomers,
        totalProducts,
        lowStockCount,
        totalChallans: challanStats._count.id || 0,
        totalRevenue: challanStats._sum.totalAmount || 0,
        totalItemsDispatched: challanStats._sum.totalQuantity || 0,
      },
      recentChallans,
      recentMovements,
    });
  } catch (error) {
    next(error);
  }
};
