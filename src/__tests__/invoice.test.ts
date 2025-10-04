/* eslint-disable @typescript-eslint/no-unsafe-call */
import { JobService } from '../services/JobService';
import { cleanDatabase, getPrismaClient } from './setup';

const prisma = getPrismaClient();
const jobService = new JobService(prisma);

describe('Invoice Totals', () => {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('should calculate invoice totals correctly', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: `test+${Date.now()}+${Math.floor(Math.random() * 10000)}@example.com`,
        phone: '1234567890',
        address: '123 Test St',
      },
    });

    const technician = await prisma.technician.create({
      data: {
        name: 'Test Technician',
      },
    });

    const job = await jobService.createJob({
      customerId: customer.id,
      title: 'Test Job',
      description: 'Test Description',
    });

    await jobService.createAppointment(job.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    await jobService.updateJobStatus(job.id, { status: 'Done' });

    const invoice = await jobService.createInvoice(job.id, {
      lineItems: [
        { description: 'Labor', quantity: 2, unitPrice: 50 },
        { description: 'Parts', quantity: 1, unitPrice: 30 },
      ],
      taxRate: 0.1,
    });

    expect(invoice.subtotal).toBe(130); // (2 * 50) + (1 * 30)
    expect(invoice.tax).toBe(13); // 130 * 0.1
    expect(invoice.total).toBe(143); // 130 + 13
    expect(invoice.balance).toBe(143);
  });

  it('should calculate invoice with multiple line items correctly', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
      },
    });

    const technician = await prisma.technician.create({
      data: {
        name: 'Test Technician',
      },
    });

    const job = await jobService.createJob({
      customerId: customer.id,
      title: 'Test Job',
      description: 'Test Description',
    });

    await jobService.createAppointment(job.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    await jobService.updateJobStatus(job.id, { status: 'Done' });

    const invoice = await jobService.createInvoice(job.id, {
      lineItems: [
        { description: 'Item 1', quantity: 3, unitPrice: 25 },
        { description: 'Item 2', quantity: 2, unitPrice: 40 },
        { description: 'Item 3', quantity: 1, unitPrice: 100 },
      ],
      taxRate: 0.08,
    });

    expect(invoice.subtotal).toBe(255); // (3 * 25) + (2 * 40) + (1 * 100)
    expect(invoice.tax).toBe(20.4); // 255 * 0.08
    expect(invoice.total).toBe(275.4); // 255 + 20.4
    expect(invoice.balance).toBe(275.4);
  });

  it('should calculate invoice with zero tax rate', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
      },
    });

    const technician = await prisma.technician.create({
      data: {
        name: 'Test Technician',
      },
    });

    const job = await jobService.createJob({
      customerId: customer.id,
      title: 'Test Job',
      description: 'Test Description',
    });

    await jobService.createAppointment(job.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    await jobService.updateJobStatus(job.id, { status: 'Done' });

    const invoice = await jobService.createInvoice(job.id, {
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      taxRate: 0,
    });

    expect(invoice.subtotal).toBe(100);
    expect(invoice.tax).toBe(0);
    expect(invoice.total).toBe(100);
    expect(invoice.balance).toBe(100);
  });
});
