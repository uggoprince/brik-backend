import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class TechnicianService {
  async getAllTechnicians() {
    return await prisma.technician.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });
  }

  async getTechnicianById(id: string) {
    const technician = await prisma.technician.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            job: {
              include: {
                customer: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!technician) {
      throw new AppError(404, 'Technician not found');
    }

    return technician;
  }
}
