import { PrismaClient } from '@prisma/client';
import { parseISO, areIntervalsOverlapping } from 'date-fns';
import {
  CreateJobInput,
  CreateAppointmentInput,
  UpdateStatusInput,
  CreateInvoiceInput,
} from '../validators/jobValidator';
import { AppError } from '../middleware/errorHandler';

export class JobService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }
  async createJob(data: CreateJobInput) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return await this.prisma.job.create({
      data: {
        ...data,
        status: 'New',
        activities: {
          create: {
            action: 'Job Created',
            details: `Job created: ${data.title}`,
          },
        },
      },
      include: {
        customer: true,
        activities: true,
      },
    });
  }

  async getAllJobs(status?: string) {
    return await this.prisma.job.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: true,
        appointment: {
          include: {
            technician: true,
          },
        },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        appointment: {
          include: {
            technician: true,
          },
        },
        invoice: {
          include: {
            lineItems: true,
            payments: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!job) {
      throw new AppError(404, 'Job not found');
    }

    return job;
  }

  async updateJobStatus(id: string, data: UpdateStatusInput) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { appointment: true },
    });

    if (!job) {
      throw new AppError(404, 'Job not found');
    }

    if (data.status === 'Scheduled' && !job.appointment) {
      throw new AppError(400, 'Cannot mark job as Scheduled without an appointment');
    }

    if (data.status === 'Done' && !job.appointment) {
      throw new AppError(400, 'Cannot mark job as Done without an appointment');
    }

    return await this.prisma.job.update({
      where: { id },
      data: {
        status: data.status,
        activities: {
          create: {
            action: 'Status Changed',
            details: `Status changed to ${data.status}`,
          },
        },
      },
      include: {
        customer: true,
        appointment: {
          include: { technician: true },
        },
        activities: true,
      },
    });
  }

  async createAppointment(jobId: string, data: CreateAppointmentInput) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { appointment: true },
    });

    if (!job) {
      throw new AppError(404, 'Job not found');
    }

    if (job.appointment) {
      throw new AppError(400, 'Job already has an appointment');
    }

    const technician = await this.prisma.technician.findUnique({
      where: { id: data.technicianId },
    });

    if (!technician) {
      throw new AppError(404, 'Technician not found');
    }

    const startTime = parseISO(data.startTime);
    const endTime = parseISO(data.endTime);

    if (endTime <= startTime) {
      throw new AppError(400, 'End time must be after start time');
    }

    const existingAppointments = await this.prisma.appointment.findMany({
      where: { technicianId: data.technicianId },
    });

    const hasOverlap = existingAppointments.some((apt) => {
      return areIntervalsOverlapping(
        { start: startTime, end: endTime },
        { start: apt.startTime, end: apt.endTime },
        { inclusive: false }
      );
    });

    if (hasOverlap) {
      throw new AppError(
        409,
        `Technician ${technician.name} has a conflicting appointment in this time window`
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        jobId,
        technicianId: data.technicianId,
        startTime,
        endTime,
      },
      include: {
        technician: true,
      },
    });

    await this.prisma.jobActivity.create({
      data: {
        jobId,
        action: 'Job Scheduled',
        details: `Scheduled with ${technician.name} from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`,
      },
    });

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'Scheduled',
      },
    });

    return appointment;
  }

  async createInvoice(jobId: string, data: CreateInvoiceInput) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { invoice: true },
    });

    if (!job) {
      throw new AppError(404, 'Job not found');
    }

    if (job.status !== 'Done') {
      throw new AppError(400, 'Job must be Done before creating an invoice');
    }

    if (job.invoice) {
      throw new AppError(400, 'Job already has an invoice');
    }

    const subtotal = data.lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const tax = subtotal * data.taxRate;
    const total = subtotal + tax;

    const invoice = await this.prisma.invoice.create({
      data: {
        jobId,
        subtotal,
        tax,
        total,
        balance: total,
        lineItems: {
          create: data.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'Invoiced',
        activities: {
          create: {
            action: 'Invoice Created',
            details: `Invoice created for $${total.toFixed(2)}`,
          },
        },
      },
    });

    return invoice;
  }
}
