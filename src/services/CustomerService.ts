import { PrismaClient } from '@prisma/client';
import { CreateCustomerInput } from '../validators/customerValidator';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class CustomerService {
  async createCustomer(data: CreateCustomerInput) {
    return await prisma.customer.create({
      data,
    });
  }

  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer;
  }

  async getAllCustomers() {
    return await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });
  }
}