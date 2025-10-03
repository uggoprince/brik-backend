import { PrismaClient } from '@prisma/client';
import { addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.jobActivity.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.technician.deleteMany();

  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Smith',
      phone: '555-0101',
      email: 'john.smith@example.com',
      address: '123 Main St, Springfield, IL 62701',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Sarah Johnson',
      phone: '555-0102',
      email: 'sarah.j@example.com',
      address: '456 Oak Ave, Springfield, IL 62702',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Mike Williams',
      phone: '555-0103',
      email: 'mike.w@example.com',
      address: '789 Pine Rd, Springfield, IL 62703',
    },
  });

  const taylor = await prisma.technician.create({
    data: {
      name: 'Taylor',
    },
  });

  const job1 = await prisma.job.create({
    data: {
      title: 'HVAC Repair',
      description: 'Air conditioning unit not cooling properly',
      customerId: customer1.id,
      status: 'New',
      activities: {
        create: {
          action: 'Job Created',
          details: 'New job created for HVAC repair',
        },
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Plumbing Installation',
      description: 'Install new kitchen faucet',
      customerId: customer2.id,
      status: 'New',
      activities: {
        create: {
          action: 'Job Created',
          details: 'New job created for plumbing installation',
        },
      },
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'Electrical Inspection',
      description: 'Annual electrical system inspection',
      customerId: customer3.id,
      status: 'Scheduled',
      activities: {
        create: [
          {
            action: 'Job Created',
            details: 'New job created for electrical inspection',
          },
          {
            action: 'Job Scheduled',
            details: 'Scheduled with Taylor from 10:00 to 12:00',
          },
        ],
      },
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      jobId: job3.id,
      technicianId: taylor.id,
      startTime: tomorrow,
      endTime: addHours(tomorrow, 2),
    },
  });

  console.log('Seed data created successfully!');
  console.log(`- 3 Customers: ${customer1.name}, ${customer2.name}, ${customer3.name}`);
  console.log(`- 1 Technician: ${taylor.name}`);
  console.log(`- 3 Jobs: 2 New, 1 Scheduled`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
