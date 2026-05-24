import * as z from 'zod';

export const deliveryFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Invalid phone number'),
  city: z.string().min(1, 'City is required'),
  specificArea: z.string().optional(),
  building: z.string().optional(),
  // Coordinates validation
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
});

export type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;
