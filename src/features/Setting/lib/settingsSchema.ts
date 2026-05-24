// src/features/Settings/schema/settingsSchema.ts
import * as z from 'zod';

export const formSchema = z.object({
  businessName: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      'Only lowercase letters, numbers, and hyphens allowed'
    ),
  sector: z.enum([
    'Cafe',
    'Restaurant',
    'Hotel',
    'Food Truck',
    'Ghost Kitchen',
    'Bakery',
    'Other',
  ]),
  cuisineType: z.string().optional(),
  owner: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    gender: z.enum(['Male', 'Female']),
    phone: z
      .string()
      .regex(/^\+?251[79]\d{8}$/, 'Invalid Ethiopian phone number'),
    email: z.string().email('Invalid email address'),
  }),

  phone: z
    .string()
    .regex(/^\+?251[79]\d{8}$/, 'Invalid Ethiopian phone number')
    .optional()
    .or(z.literal('')), // Allows empty string if not provided
  location: z.object({
    address: z.string().min(5, 'Address is too short'),
    city: z.string().default('Addis Ababa'),
    subcity: z.string().optional(),
  }),
  tinId: z.string().optional().or(z.literal('')),
  licenseNumber: z.string().optional(),

  // Specific object to handle Image + Metadata
  tradeLicense: z
    .object({
      url: z.string().optional(),
      file: z.any().optional(), // For new uploads
    })
    .nullable()
    .optional(),
  // Branding
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i, 'Invalid hex color')
    .optional()
    .default('#1A1A2E'),
  logo: z.any().optional(),
  // Settings - Added .default() so they are valid even if not in the UI
  currency: z.enum(['ETB', 'USD']).default('ETB'),
  taxRate: z.number().min(0).max(100).default(0),
  serviceCharge: z.number().min(0).max(100).default(0),

  tipsEnabled: z.boolean().default(true),
  tipOptions: z.array(z.number()).default([10, 15, 20]),

  language: z.enum(['en', 'am', 'both']).default('both'),
  defaultLanguage: z.enum(['en', 'am']).default('en'),

  onlineOrderingEnabled: z.boolean().default(true),
  deliveryEnabled: z.boolean().default(false),
  pickupEnabled: z.boolean().default(true),
  autoAcceptOrders: z.boolean().default(false),
  requireWaiterConfirmation: z.boolean().default(false),
  prepTimeMinutes: z.number().min(5).max(180).default(15),

  // QR Settings
  showTableNumberOnQR: z.boolean().default(true),
  qrStyle: z.enum(['classic', 'modern', 'rounded', 'dots']).default('modern'),
  qrLogoEnabled: z.boolean().default(true),
});

export type SettingsFormValues = z.infer<typeof formSchema>;

export const defaultValues: SettingsFormValues = {
  businessName: '',
  slug: '',
  sector: 'Restaurant',
  cuisineType: '', // Added
  owner: {
    fullName: '',
    gender: 'Male',
    phone: '',
    email: '',
  },
  location: {
    address: '', // Added
    city: 'Addis Ababa', // Added
    subcity: '', // Added
  },
  phone: '',
  tinId: '', // Added
  tradeLicense: null,
  licenseNumber: '',
  brandColor: '#1A1A2E', // Added
  logo: '',
  currency: 'ETB',
  taxRate: 15,
  serviceCharge: 0,
  tipsEnabled: true,
  tipOptions: [10, 15, 20],
  language: 'both',
  defaultLanguage: 'en',
  onlineOrderingEnabled: true,
  deliveryEnabled: false,
  pickupEnabled: true,
  autoAcceptOrders: false,
  requireWaiterConfirmation: false,
  prepTimeMinutes: 15,
  showTableNumberOnQR: true,
  qrStyle: 'modern',
  qrLogoEnabled: true,
};
