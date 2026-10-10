import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid corporate email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  email: z.string().email('Valid corporate email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['TECHNICIAN', 'LEAD_TECHNICIAN', 'SUPERVISOR', 'PAYMENT_CLERK']),
  hourlyLaborRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be valid decimal string').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
