import { z } from 'zod';

export const localizedNameSchema = z.object({
  en: z.string().min(2, 'English name must be at least 2 characters').max(100, 'English name max 100 characters'),
  am: z.string().max(100, 'Amharic name max 100 characters').optional().or(z.literal('')),
});

export const localizedDescriptionSchema = z.object({
  en: z.string().max(800, 'English description max 800 characters').optional().or(z.literal('')),
  am: z.string().max(800, 'Amharic description max 800 characters').optional().or(z.literal('')),
});

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name required').max(60),
  size: z.string().max(50).optional(),
  volume: z.string().optional(),
  price: z.number().min(0, 'Price must be ≥ 0'),
  calories: z.number().optional(),
  available: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const menuformSchema = z.object({
  name: localizedNameSchema,
  description: localizedDescriptionSchema.optional(),
  type: z.enum(['food', 'drink']),
  categoryId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
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
  isAlcoholic: z.boolean().default(false),
  alcoholPercentage: z.number().min(0).max(100).optional(),
  isVeg: z.boolean().nullable().optional(),
  isFasting: z.boolean().nullable().optional(),
  cuisineOrigin: z.enum(['local', 'international']).default('local'),
  cuisineTags: z.array(z.string()).optional(),
  isSpicy: z.boolean().default(false),
  available: z.boolean().default(true),
  inStock: z.boolean().default(true),
  publishStatus: z.enum(['draft', 'published', 'archived']).default('published'),
  variants: z.array(variantSchema).min(1),
  price: z.number().optional(),
  prepTime: z.string().optional(),
  requiresKitchen: z.boolean().default(true),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  image: z.instanceof(File).optional(),
});

export type MenuFormValues = z.infer<typeof menuformSchema>;

// Category schema
export const categoryFormSchema = z.object({
  name: z.object({
    en: z.string().min(2, 'English name must be at least 2 characters').max(100, 'English name max 100 characters'),
    am: z.string().max(100, 'Amharic name max 100 characters').optional().or(z.literal('')),
  }),
  description: z
    .object({
      en: z.string().max(800, 'English description max 800 characters').optional().or(z.literal('')),
      am: z.string().max(800, 'Amharic description max 800 characters').optional().or(z.literal('')),
    })
    .optional(),
  displayOrder: z.number().int(),
  icon: z.string().max(10, 'Icon or emoji should be short').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Combo schema
export const comboFormSchema = z.object({
  name: localizedNameSchema,
  description: localizedDescriptionSchema.optional(),
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
