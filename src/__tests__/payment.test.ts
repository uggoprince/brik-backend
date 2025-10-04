/* eslint-disable @typescript-eslint/no-unsafe-call */
import { JobService } from '../services/JobService';
import { InvoiceService } from '../services/InvoiceService';
import { cleanDatabase, getPrismaClient } from './setup';

const prisma = getPrismaClient();
const jobService = new JobService(prisma);
const invoiceService = new InvoiceService(prisma);

describe('Payment Balance Updates', () => {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('should update balance after single payment', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
  email: `test+${Date.now()}+${Math.floor(Math.random()*10000)}@example.com`,
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
      taxRate: 0.1,
    });

    const result = await invoiceService.createPayment(invoice.id, {
      amount: 50,
      method: 'cash',
    });

    expect(result.payment.amount).toBe(50);
    expect(result.invoice?.balance).toBe(60); // 110 - 50
  });

  it('should update balance after multiple payments', async () => {
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
      taxRate: 0.1,
    });

    await invoiceService.createPayment(invoice.id, {
      amount: 30,
      method: 'cash',
    });

    await invoiceService.createPayment(invoice.id, {
      amount: 40,
      method: 'card',
    });

    const result = await invoiceService.createPayment(invoice.id, {
      amount: 40,
      method: 'check',
    });

    expect(result.invoice?.balance).toBe(0); // 110 - 30 - 40 - 40
  });

  it('should mark job as Paid when invoice is fully paid', async () => {
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
      taxRate: 0.1,
    });

    await invoiceService.createPayment(invoice.id, {
      amount: 110,
      method: 'cash',
    });

    const updatedJob = await jobService.getJobById(job.id);
    expect(updatedJob.status).toBe('Paid');
  });

  it('should not allow payment exceeding balance', async () => {
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
      taxRate: 0.1,
    });

    await expect(
      invoiceService.createPayment(invoice.id, {
        amount: 150,
        method: 'cash',
      })
    ).rejects.toThrow('Payment amount ($150.00) exceeds remaining balance ($110.00)');
  });

  it('should not allow payment exceeding remaining balance after partial payment', async () => {
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
      taxRate: 0.1,
    });

    await invoiceService.createPayment(invoice.id, {
      amount: 50,
      method: 'cash',
    });

    await expect(
      invoiceService.createPayment(invoice.id, {
        amount: 70,
        method: 'cash',
      })
    ).rejects.toThrow('Payment amount ($70.00) exceeds remaining balance ($60.00)');
  });
});
