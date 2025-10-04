import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['card', 'cash', 'check']).default('card'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
