import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  address: z.string().min(1, 'Address is required'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
