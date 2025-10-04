/* eslint-disable @typescript-eslint/no-unsafe-call */
import { JobService } from '../services/JobService';
import { cleanDatabase, getPrismaClient } from './setup';

const prisma = getPrismaClient();
const jobService = new JobService(prisma);

describe('Scheduling Overlaps', () => {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('should detect overlapping appointments for same technician', async () => {
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
        name: 'John Doe',
      },
    });

    const job1 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 1',
      description: 'First job',
    });

    await jobService.createAppointment(job1.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    const job2 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 2',
      description: 'Second job',
    });

    await expect(
      jobService.createAppointment(job2.id, {
        technicianId: technician.id,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T12:00:00Z',
      })
    ).rejects.toThrow(
      `Technician ${technician.name} has a conflicting appointment in this time window`
    );
  });

  it('should allow non-overlapping appointments for same technician', async () => {
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
        name: 'John Doe',
      },
    });

    const job1 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 1',
      description: 'First job',
    });

    await jobService.createAppointment(job1.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    const job2 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 2',
      description: 'Second job',
    });

    const appointment2 = await jobService.createAppointment(job2.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T11:00:00Z',
      endTime: '2024-01-15T13:00:00Z',
    });

    expect(appointment2).toBeDefined();
    expect(appointment2.technicianId).toBe(technician.id);
  });

  it('should allow overlapping appointments for different technicians', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
      },
    });

    const technician1 = await prisma.technician.create({
      data: {
        name: 'John Doe',
      },
    });

    const technician2 = await prisma.technician.create({
      data: {
        name: 'Jane Smith',
      },
    });

    const job1 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 1',
      description: 'First job',
    });

    await jobService.createAppointment(job1.id, {
      technicianId: technician1.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    const job2 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 2',
      description: 'Second job',
    });

    const appointment2 = await jobService.createAppointment(job2.id, {
      technicianId: technician2.id,
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
    });

    expect(appointment2).toBeDefined();
    expect(appointment2.technicianId).toBe(technician2.id);
  });

  it('should detect overlap when new appointment starts during existing one', async () => {
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
        name: 'John Doe',
      },
    });

    const job1 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 1',
      description: 'First job',
    });

    await jobService.createAppointment(job1.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    const job2 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 2',
      description: 'Second job',
    });

    await expect(
      jobService.createAppointment(job2.id, {
        technicianId: technician.id,
        startTime: '2024-01-15T10:30:00Z',
        endTime: '2024-01-15T12:00:00Z',
      })
    ).rejects.toThrow(
      `Technician ${technician.name} has a conflicting appointment in this time window`
    );
  });

  it('should detect overlap when new appointment ends during existing one', async () => {
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
        name: 'John Doe',
      },
    });

    const job1 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 1',
      description: 'First job',
    });

    await jobService.createAppointment(job1.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    const job2 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 2',
      description: 'Second job',
    });

    await expect(
      jobService.createAppointment(job2.id, {
        technicianId: technician.id,
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-15T10:00:00Z',
      })
    ).rejects.toThrow(
      `Technician ${technician.name} has a conflicting appointment in this time window`
    );
  });

  it('should detect overlap when new appointment completely contains existing one', async () => {
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
        name: 'John Doe',
      },
    });

    const job1 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 1',
      description: 'First job',
    });

    await jobService.createAppointment(job1.id, {
      technicianId: technician.id,
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    });

    const job2 = await jobService.createJob({
      customerId: customer.id,
      title: 'Job 2',
      description: 'Second job',
    });

    await expect(
      jobService.createAppointment(job2.id, {
        technicianId: technician.id,
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-15T12:00:00Z',
      })
    ).rejects.toThrow(
      `Technician ${technician.name} has a conflicting appointment in this time window`
    );
  });
});
