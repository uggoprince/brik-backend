import { PrismaClient } from '@prisma/client';
import { CreatePaymentInput } from '../validators/invoiceValidator';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class InvoiceService {
  async getAllInvoices() {
    return await prisma.invoice.findMany({
      include: {
        job: {
          include: {
            customer: true,
          },
        },
        lineItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            customer: true,
          },
        },
        lineItems: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    return invoice;
  }

  async createPayment(invoiceId: string, data: CreatePaymentInput) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        job: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    if (data.amount > invoice.balance) {
      throw new AppError(
        400,
        `Payment amount ($${data.amount.toFixed(2)}) exceeds remaining balance ($${invoice.balance.toFixed(2)})`
      );
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method,
      },
    });

    const newBalance = invoice.balance - data.amount;
    const isFullyPaid = newBalance === 0;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        balance: newBalance,
      },
    });

    if (isFullyPaid) {
      await prisma.job.update({
        where: { id: invoice.jobId },
        data: {
          status: 'Paid',
          activities: {
            create: {
              action: 'Payment Completed',
              details: 'Invoice paid in full',
            },
          },
        },
      });
    } else {
      await prisma.jobActivity.create({
        data: {
          jobId: invoice.jobId,
          action: 'Payment Received',
          details: `Payment of $${data.amount.toFixed(2)} received. Remaining balance: $${newBalance.toFixed(2)}`,
        },
      });
    }

    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        lineItems: true,
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  }
}
