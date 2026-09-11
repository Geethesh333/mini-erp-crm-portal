import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const customerSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  mobileNumber: z.string().min(7, 'Valid mobile number is required'),
  email: z.string().email('Valid email address is required'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().min(5, 'Address is required'),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const followUpNoteSchema = z.object({
  note: z.string().min(2, 'Note text is required'),
  followUpDate: z.string().optional().nullable(),
});

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const customerType = (req.query.customerType as string) || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { businessName: { contains: search } },
        { mobileNumber: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status && ['Lead', 'Active', 'Inactive'].includes(status)) {
      where.status = status;
    }

    if (customerType && ['Retail', 'Wholesale', 'Distributor'].includes(customerType)) {
      where.customerType = customerType;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { followUps: true, challans: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: customers,
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

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        challans: {
          orderBy: { createdDate: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    res.json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = customerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        customerName: validated.customerName,
        mobileNumber: validated.mobileNumber,
        email: validated.email.toLowerCase(),
        businessName: validated.businessName,
        gstNumber: validated.gstNumber || null,
        customerType: validated.customerType,
        address: validated.address,
        status: validated.status,
        followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
        notes: validated.notes || null,
      },
    });

    // If initial notes provided, log as first follow-up note
    if (validated.notes) {
      await prisma.customerFollowUp.create({
        data: {
          customerId: customer.id,
          note: `Initial Note: ${validated.notes}`,
          followUpDate: customer.followUpDate,
          createdBy: req.user?.name || 'System',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = customerSchema.partial().parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(validated.customerName ? { customerName: validated.customerName } : {}),
        ...(validated.mobileNumber ? { mobileNumber: validated.mobileNumber } : {}),
        ...(validated.email ? { email: validated.email.toLowerCase() } : {}),
        ...(validated.businessName ? { businessName: validated.businessName } : {}),
        ...(validated.gstNumber !== undefined ? { gstNumber: validated.gstNumber } : {}),
        ...(validated.customerType ? { customerType: validated.customerType } : {}),
        ...(validated.address ? { address: validated.address } : {}),
        ...(validated.status ? { status: validated.status } : {}),
        ...(validated.followUpDate !== undefined
          ? { followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null }
          : {}),
        ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
      },
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const addFollowUpNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = followUpNoteSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const newFollowUpDate = followUpDate ? new Date(followUpDate) : customer.followUpDate;

    const [followUp] = await prisma.$transaction([
      prisma.customerFollowUp.create({
        data: {
          customerId: id,
          note,
          followUpDate: newFollowUpDate,
          createdBy: req.user?.name || 'User',
        },
      }),
      prisma.customer.update({
        where: { id },
        data: {
          followUpDate: newFollowUpDate,
          notes: note, // Update latest note summary
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Follow-up note recorded successfully',
      followUp,
    });
  } catch (error) {
    next(error);
  }
};
