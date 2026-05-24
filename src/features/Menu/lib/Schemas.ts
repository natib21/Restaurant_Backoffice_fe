import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name required').max(60),
  size: z.string().max(50).optional(),
  volume: z.string().optional(),
  price: z.number().min(0, 'Price must be ≥ 0'),
  calories: z.number().optional(),
  available: z.boolean(),
  isDefault: z.boolean(),
});

export const menuformSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(800).optional(),
  type: z.enum(['food', 'drink']),
  category: z.string().min(1),
  drinkType: z
    .enum([
      'soft-drink',
      'juice',
      'beer',
      'wine',
      'cocktail',
      'hot-drink',
      'milkshake',
      'water',
    ])
    .nullable()
    .optional(),
  isAlcoholic: z.boolean(),
  alcoholPercentage: z.number().min(0).max(100).optional(),
  isVeg: z.boolean().nullable().optional(),
  isSpicy: z.boolean(),
  available: z.boolean(),
  variants: z.array(variantSchema).min(1),
  price: z.number().optional(),
  prepTime: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  image: z.instanceof(File).optional(),
});

export type MenuFormValues = z.infer<typeof menuformSchema>;

// src/features/Menu/lib/comboSchemas.ts

export const comboFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  comboPrice: z.coerce.number().positive('Price must be greater than 0'),
  isActive: z.boolean(),
  priority: z.coerce.number().int().default(0),
  maxPerOrder: z.coerce.number().int().min(1).default(10),
  tags: z.array(z.string()).default([]),
  availableOnDays: z.array(z.string()).default([]),
  timeSlots: z
    .array(
      z.object({
        start: z
          .string()
          .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time'),
        end: z
          .string()
          .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time'),
      })
    )
    .default([]),
  items: z
    .array(
      z.object({
        menuItem: z.string().min(1, 'Menu item required'),
        quantity: z.coerce.number().int().min(1).default(1),
      })
    )
    .min(1, 'At least one item is required'),
  branches: z.array(z.string()).default([]),
  image: z.instanceof(File).optional(),
});

export type ComboFormValues = z.infer<typeof comboFormSchema>;
