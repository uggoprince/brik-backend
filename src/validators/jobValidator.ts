import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  customerId: z.string().uuid('Invalid customer ID'),
});

export const createAppointmentSchema = z.object({
  technicianId: z.string().uuid('Invalid technician ID'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['New', 'Scheduled', 'Done', 'Invoiced', 'Paid']),
});

export const createInvoiceSchema = z.object({
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(1).default(0.08),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
