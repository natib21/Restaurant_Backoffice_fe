// src/features/Table/Components/PrintMenu/types.ts

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

export interface PrintMenuSettings {
  templateId: TemplateId;
  paperSize: PaperSize;
  orientation: Orientation;
  fontSize: FontSize;
  fontFamily: FontFamily;
  
  // Selection filters (empty array means include all)
  selectedCategoryIds: string[];
  selectedMenuItemIds: string[];

  // Table & QR settings
  showTableNumber: boolean;
  showTableQR: boolean;
  qrSize: 'small' | 'medium' | 'large';
  qrCtaText: string;
  tableNumberOverride?: string;

  // Branding & Contacts
  restaurantName: string;
  amharicRestaurantName?: string;
  subTitle: string;
  tagline: string;
  branchName?: string;
  logoUrl?: string;
  showLogo: boolean;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  
  // Menu Content Toggles
  showImages: boolean;
  showDescriptions: boolean;
  showPrices: boolean;
  showCategoryDescriptions: boolean;
  showDietary: boolean;
  showAmharic: boolean;
  showWatermark: boolean;
  showContactPage: boolean;
  columnsCount: 1 | 2 | 3;
  
  // Visual Theme & Borders
  theme: MenuTheme;
  borderStyle: BorderStyle;
  borderThickness: BorderThickness;
  borderOpacity: number;
  borderRadius: BorderRadius;
  borderColorMode: BorderColorMode;
  customBorderColor: string;
  paperColor: PaperColor;
  density: Density;
  
  // Footer & Currency
  taxDisclaimer: string;
  currencySymbol: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintMenuSettings = {
  templateId: 'modern',
  paperSize: 'a4',
  orientation: 'portrait',
  fontSize: 'medium',
  fontFamily: 'sans',
  
  selectedCategoryIds: [],
  selectedMenuItemIds: [],

  showTableNumber: true,
  showTableQR: true,
  qrSize: 'large',
  qrCtaText: 'Scan to Order & Pay Online',

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
