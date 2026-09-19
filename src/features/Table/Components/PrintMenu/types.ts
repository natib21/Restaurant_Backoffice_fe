// src/features/Table/Components/PrintMenu/types.ts
import { z } from 'zod';

export type PaperSize = 'a4' | 'a5' | 'a3' | 'letter';
export type Orientation = 'portrait' | 'landscape';
export type FontSize = 'small' | 'medium' | 'large';
export type FontFamily = 'playfair' | 'serif' | 'sans' | 'cinzel' | 'inter' | 'mono';

export type TemplateId =
  | 'modern'
  | 'classic'
  | 'elegant'
  | 'minimal'
  | 'cafe'
  | 'fast-food'
  | 'ethiopian-classic'
  | 'premium-alacarte';

export type MenuTheme =
  | 'modern'
  | 'classic'
  | 'luxury'
  | 'minimal'
  | 'coffee'
  | 'ethiopian';

export type BorderStyle =
  | 'ethiopian'
  | 'classic-double'
  | 'luxury-corner'
  | 'coffee-shop'
  | 'modern-geometric'
  | 'minimal'
  | 'none';

export type BorderThickness = 'thin' | 'medium' | 'thick';
export type BorderRadius = 'sharp' | 'small' | 'medium' | 'large';
export type BorderColorMode = 'brand' | 'black' | 'dark-gray' | 'gold' | 'custom';
export type PaperColor = 'white' | 'warm-white' | 'cream' | 'light-beige' | 'dark-slate';
export type Density = 'spacious' | 'comfortable' | 'compact';

// ── 1. Per-Section Layout & Styling ─────────────────────────────
export type SectionLayoutStyle = 'grid-2col' | 'list-with-photos' | 'compact-price-list';
export type SectionDividerStyle = 'none' | 'line' | 'dashed';
export type SectionSpacingDensity = 'compact' | 'normal' | 'relaxed';

export const sectionConfigSchema = z.object({
  layout: z.enum(['grid-2col', 'list-with-photos', 'compact-price-list']).default('list-with-photos'),
  backgroundTint: z.string().default('none'), // 'none' | 'subtle' | 'card' | hex
  dividerStyle: z.enum(['none', 'line', 'dashed']).default('line'),
  density: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
  showPhotos: z.boolean().default(true),
});

export type SectionConfig = z.infer<typeof sectionConfigSchema>;

export const DEFAULT_SECTION_CONFIG: SectionConfig = {
  layout: 'list-with-photos',
  backgroundTint: 'none',
  dividerStyle: 'line',
  density: 'normal',
  showPhotos: true,
};

// ── 2. Slot-Based Branding ──────────────────────────────────────
export type BrandingSlotPosition = 'top-left' | 'top-center' | 'top-right' | 'footer';

export const brandingElementSchema = z.object({
  visible: z.boolean().default(true),
  position: z.enum(['top-left', 'top-center', 'top-right', 'footer']),
});

export type BrandingElementConfig = z.infer<typeof brandingElementSchema>;

export const slotBrandingSchema = z.object({
  logo: brandingElementSchema.default({ visible: true, position: 'top-left' }),
  qrCode: brandingElementSchema.default({ visible: true, position: 'top-right' }),
  tableNumber: brandingElementSchema.default({ visible: true, position: 'top-right' }),
  tagline: brandingElementSchema.default({ visible: true, position: 'top-left' }),
});

export type SlotBrandingSettings = z.infer<typeof slotBrandingSchema>;

// ── 3. Main Print Settings Schema ───────────────────────────────
export const printMenuSettingsSchema = z.object({
  templateId: z.string().default('modern') as z.ZodType<TemplateId>,
  paperSize: z.enum(['a4', 'a5', 'a3', 'letter']).default('a4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  fontFamily: z.enum(['playfair', 'serif', 'sans', 'cinzel', 'inter', 'mono']).default('sans'),

  // Selection & Ordering
  selectedCategoryIds: z.array(z.string()).default([]),
  selectedMenuItemIds: z.array(z.string()).default([]),
  categoryOrder: z.array(z.string()).default([]), // DnD persisted category order

  // Per-section customization (keyed by category ID)
  sectionConfigs: z.record(z.string(), sectionConfigSchema).default({}),
  defaultSectionLayout: z.enum(['grid-2col', 'list-with-photos', 'compact-price-list']).default('list-with-photos'),

  // Slot-based Branding
  brandingSlots: slotBrandingSchema.default({
    logo: { visible: true, position: 'top-left' },
    qrCode: { visible: true, position: 'top-right' },
    tableNumber: { visible: true, position: 'top-right' },
    tagline: { visible: true, position: 'top-left' },
  }),

  // Table & QR parameters
  showTableNumber: z.boolean().default(true),
  showTableQR: z.boolean().default(true),
  qrSize: z.enum(['small', 'medium', 'large']).default('large'),
  qrCtaText: z.string().default('Scan to Order & Pay Online'),
  qrCodeData: z.string().default(''), // Actual URL to encode into QR code
  tableNumberOverride: z.string().optional(),

  // Restaurant details
  restaurantName: z.string().default(''),
  amharicRestaurantName: z.string().default('ሃበሻ ኩሽና'),
  subTitle: z.string().default('Dine-In Physical Menu'),
  tagline: z.string().default('Fresh Flavors & Craft Hospitality'),
  branchName: z.string().default('Main Dining Room'),
  logoUrl: z.string().optional(),
  showLogo: z.boolean().default(true),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.string().optional(),
  primaryColor: z.string().default('#091426'),
  secondaryColor: z.string().default('#64748b'),
  accentColor: z.string().default('#2170e4'),

  // Content toggles
  showImages: z.boolean().default(true),
  showDescriptions: z.boolean().default(true),
  showPrices: z.boolean().default(true),
  showCategoryDescriptions: z.boolean().default(true),
  showDietary: z.boolean().default(true),
  showAmharic: z.boolean().default(false),
  showWatermark: z.boolean().default(false),
  showContactPage: z.boolean().default(false),
  columnsCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),

  // Visual styling & borders
  theme: z.string().default('modern') as z.ZodType<MenuTheme>,
  borderStyle: z.string().default('none') as z.ZodType<BorderStyle>,
  borderThickness: z.enum(['thin', 'medium', 'thick']).default('thin'),
  borderOpacity: z.number().min(0).max(100).default(100),
  borderRadius: z.enum(['sharp', 'small', 'medium', 'large']).default('medium'),
  borderColorMode: z.enum(['brand', 'black', 'dark-gray', 'gold', 'custom']).default('brand'),
  customBorderColor: z.string().default('#091426'),
  paperColor: z.enum(['white', 'warm-white', 'cream', 'light-beige', 'dark-slate']).default('white'),
  density: z.enum(['spacious', 'comfortable', 'compact']).default('comfortable'),

  // Footer & Currency
  taxDisclaimer: z.string().default('All prices include 10% Service Charge & 15% VAT.'),
  currencySymbol: z.string().default('ETB'),
});

export type PrintMenuSettings = z.infer<typeof printMenuSettingsSchema>;

export const DEFAULT_PRINT_SETTINGS: PrintMenuSettings = {
  templateId: 'modern',
  paperSize: 'a4',
  orientation: 'portrait',
  fontSize: 'medium',
  fontFamily: 'sans',

  selectedCategoryIds: [],
  selectedMenuItemIds: [],
  categoryOrder: [],

  sectionConfigs: {},
  defaultSectionLayout: 'list-with-photos',

  brandingSlots: {
    logo: { visible: true, position: 'top-left' },
    qrCode: { visible: true, position: 'top-right' },
    tableNumber: { visible: true, position: 'top-right' },
    tagline: { visible: true, position: 'top-left' },
  },

  showTableNumber: true,
  showTableQR: true,
  qrSize: 'large',
  qrCtaText: 'Scan to Order & Pay Online',
  qrCodeData: '',

  restaurantName: '',
  amharicRestaurantName: 'ሃበሻ ኩሽና',
  subTitle: 'Dine-In Physical Menu',
  tagline: 'Fresh Flavors & Craft Hospitality',
  branchName: 'Main Dining Room',
  showLogo: true,
  address: 'Bole Road, Addis Ababa',
  phone: '+251 911 123 456',
  website: 'www.restoflow.com',
  openingHours: 'Mon - Sun: 7:00 AM - 11:00 PM',
  primaryColor: '#091426',
  secondaryColor: '#64748b',
  accentColor: '#2170e4',

  showImages: true,
  showDescriptions: true,
  showPrices: true,
  showCategoryDescriptions: true,
  showDietary: true,
  showAmharic: false,
  showWatermark: false,
  showContactPage: false,
  columnsCount: 2,

  theme: 'modern',
  borderStyle: 'none',
  borderThickness: 'thin',
  borderOpacity: 100,
  borderRadius: 'medium',
  borderColorMode: 'brand',
  customBorderColor: '#091426',
  paperColor: 'white',
  density: 'comfortable',

  taxDisclaimer: 'All prices include 10% Service Charge & 15% VAT.',
  currencySymbol: 'ETB',
};
