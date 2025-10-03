import { PrismaClient } from '@prisma/client';

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
}
