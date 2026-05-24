import * as z from 'zod';

export const staffFormSchema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .min(9, 'Phone number is too short')
      .max(15, 'Phone number is too long')
      .regex(
        /^\+?\d[\d\s-]{8,}$/,
        'Invalid phone format — use +251912345678 style'
      ),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string(),
    branch: z.string().min(1, 'Please select a branch'),
    role: z.string().min(1, 'Please assign a role'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

export type StaffFormValues = z.infer<typeof staffFormSchema>;
