/* eslint-disable @typescript-eslint/no-unsafe-call */
import { JobService } from '../services/JobService';
import { cleanDatabase, getPrismaClient } from './setup';

const prisma = getPrismaClient();
const jobService = new JobService(prisma);

describe('Appointment Conflicts Integration Test', () => {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('should handle complete workflow with appointment conflicts', async () => {
    // Create customers
    const customer1 = await prisma.customer.create({
      data: {
        name: 'Customer One',
        email: `customer1+${Date.now()}+${Math.floor(Math.random() * 10000)}@example.com`,
        phone: '1111111111',
        address: '111 First St',
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        name: 'Customer Two',
        email: `customer2+${Date.now()}+${Math.floor(Math.random() * 10000)}@example.com`,
        phone: '2222222222',
        address: '222 Second St',
      },
    });

    // Create technicians
    const technicianA = await prisma.technician.create({
      data: {
        name: 'Tech A',
      },
    });

    const technicianB = await prisma.technician.create({
      data: {
        name: 'Tech B',
      },
    });

    // Create jobs
    const job1 = await jobService.createJob({
      customerId: customer1.id,
      title: 'HVAC Repair',
      description: 'Fix air conditioning',
    });

    const job2 = await jobService.createJob({
      customerId: customer2.id,
      title: 'Pipe Leak',
      description: 'Fix leaking pipe',
    });

    const job3 = await jobService.createJob({
      customerId: customer1.id,
      title: 'Emergency Repair',
      description: 'Urgent repair needed',
    });

    // Schedule appointment for Tech A at 9-11 AM
    const appointment1 = await jobService.createAppointment(job1.id, {
      technicianId: technicianA.id,
      startTime: '2024-01-20T09:00:00Z',
      endTime: '2024-01-20T11:00:00Z',
    });

    expect(appointment1).toBeDefined();
    expect(appointment1.technicianId).toBe(technicianA.id);

    // Verify job1 status is now Scheduled
    const updatedJob1 = await jobService.getJobById(job1.id);
    expect(updatedJob1.status).toBe('Scheduled');

    // Try to schedule Tech A at overlapping time (10-12 PM) - should fail
    await expect(
      jobService.createAppointment(job3.id, {
        technicianId: technicianA.id,
        startTime: '2024-01-20T10:00:00Z',
        endTime: '2024-01-20T12:00:00Z',
      })
    ).rejects.toThrow(
      `Technician ${technicianA.name} has a conflicting appointment in this time window`
    );

    // Schedule Tech A at non-overlapping time (11-13 PM) - should succeed
    const appointment3 = await jobService.createAppointment(job3.id, {
      technicianId: technicianA.id,
      startTime: '2024-01-20T11:00:00Z',
      endTime: '2024-01-20T13:00:00Z',
    });

    expect(appointment3).toBeDefined();
    expect(appointment3.technicianId).toBe(technicianA.id);

    // Schedule Tech B at same time as Tech A - should succeed (different technician)
    const appointment2 = await jobService.createAppointment(job2.id, {
      technicianId: technicianB.id,
      startTime: '2024-01-20T09:00:00Z',
      endTime: '2024-01-20T11:00:00Z',
    });

    expect(appointment2).toBeDefined();
    expect(appointment2.technicianId).toBe(technicianB.id);

    // Verify all jobs are scheduled
    const allJobs = await jobService.getAllJobs('Scheduled');
    expect(allJobs).toHaveLength(3);

    // Verify appointments were created with correct technicians
    const appointments = await prisma.appointment.findMany({
      include: { technician: true },
    });

    expect(appointments).toHaveLength(3);

    const techAAppointments = appointments.filter((apt) => apt.technicianId === technicianA.id);
    expect(techAAppointments).toHaveLength(2);

    const techBAppointments = appointments.filter((apt) => apt.technicianId === technicianB.id);
    expect(techBAppointments).toHaveLength(1);

    // Test that we cannot manually set job to Scheduled without appointment
    const job4 = await jobService.createJob({
      customerId: customer1.id,
      title: 'New Job',
      description: 'Test job',
    });

    await expect(jobService.updateJobStatus(job4.id, { status: 'Scheduled' })).rejects.toThrow(
      'Cannot mark job as Scheduled without an appointment'
    );
  });
});
