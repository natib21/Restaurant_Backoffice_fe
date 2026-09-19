// src/features/Table/Components/PrintMenu/themes.ts
import type {
  PrintMenuSettings,
  PaperColor,
  FontFamily,
  MenuTheme,
  BorderStyle,
  SectionLayoutStyle,
} from './types';

export interface ThemePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  previewColors: {
    primary: string;
    accent: string;
    paper: string;
  };
  settings: Partial<PrintMenuSettings>;
}

export const MENU_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'modern-bistro',
    name: 'Modern Bistro',
    category: 'Contemporary',
    description: 'Crisp layout, deep indigo & bright blue accents with modern sans typography.',
    previewColors: {
      primary: '#091426',
      accent: '#2563eb',
      paper: '#ffffff',
    },
    settings: {
      theme: 'modern',
      paperColor: 'white',
      fontFamily: 'sans',
      fontSize: 'medium',
      primaryColor: '#091426',
      secondaryColor: '#64748b',
      accentColor: '#2563eb',
      borderStyle: 'none',
      defaultSectionLayout: 'list-with-photos',
      density: 'comfortable',
    },
  },
  {
    id: 'habesha-heritage',
    name: 'Habesha Heritage',
    category: 'Cultural',
    description: 'Traditional Ethiopian warm tones, rich crimson, gold borders & Ge’ez styling.',
    previewColors: {
      primary: '#451a03',
      accent: '#b45309',
      paper: '#faf7f2',
    },
    settings: {
      theme: 'ethiopian',
      paperColor: 'warm-white',
      fontFamily: 'serif',
      fontSize: 'medium',
      primaryColor: '#451a03',
      secondaryColor: '#78350f',
      accentColor: '#b45309',
      borderStyle: 'ethiopian',
      showAmharic: true,
      defaultSectionLayout: 'grid-2col',
      density: 'comfortable',
    },
  },
  {
    id: 'luxury-noir',
    name: 'Luxury Gold & Noir',
    category: 'Fine Dining',
    description: 'Refined dark slate with metallic champagne gold and luxury serif typography.',
    previewColors: {
      primary: '#f8fafc',
      accent: '#eab308',
      paper: '#0f172a',
    },
    settings: {
      theme: 'luxury',
      paperColor: 'dark-slate',
      fontFamily: 'cinzel',
      fontSize: 'medium',
      primaryColor: '#f8fafc',
      secondaryColor: '#94a3b8',
      accentColor: '#eab308',
      borderStyle: 'luxury-corner',
      defaultSectionLayout: 'compact-price-list',
      density: 'spacious',
    },
  },
  {
    id: 'artisan-cafe',
    name: 'Artisan Cafe & Bakery',
    category: 'Casual',
    description: 'Warm cream paper, espresso brown notes, and generous dish photo cards.',
    previewColors: {
      primary: '#292524',
      accent: '#d97706',
      paper: '#fdfaf0',
    },
    settings: {
      theme: 'coffee',
      paperColor: 'cream',
      fontFamily: 'serif',
      fontSize: 'medium',
      primaryColor: '#292524',
      secondaryColor: '#78716c',
      accentColor: '#d97706',
      borderStyle: 'coffee-shop',
      showImages: true,
      defaultSectionLayout: 'list-with-photos',
      density: 'comfortable',
    },
  },
  {
    id: 'minimal-editorial',
    name: 'Minimalist Editorial',
    category: 'Modern',
    description: 'Monochrome precision with stark typography, dotted leaders, and zero distractions.',
    previewColors: {
      primary: '#171717',
      accent: '#525252',
      paper: '#ffffff',
    },
    settings: {
      theme: 'minimal',
      paperColor: 'white',
      fontFamily: 'mono',
      fontSize: 'medium',
      primaryColor: '#171717',
      secondaryColor: '#737373',
      accentColor: '#000000',
      borderStyle: 'minimal',
      defaultSectionLayout: 'compact-price-list',
      density: 'compact',
    },
  },
];
