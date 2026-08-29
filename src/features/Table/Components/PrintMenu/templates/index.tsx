// src/features/Table/Components/PrintMenu/templates/index.tsx
import React from 'react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings, TemplateId } from '../types';

import { ModernMenuTemplate } from './ModernMenuTemplate';
import { ClassicMenuTemplate } from './ClassicMenuTemplate';
import { ElegantMenuTemplate } from './ElegantMenuTemplate';
import { MinimalMenuTemplate } from './MinimalMenuTemplate';
import { EthiopianClassicTemplate } from './EthiopianClassicTemplate';
import { CafeMenuTemplate } from './CafeMenuTemplate';
import { FastFoodMenuTemplate } from './FastFoodMenuTemplate';

export {
  ModernMenuTemplate,
  ClassicMenuTemplate,
  ElegantMenuTemplate,
  MinimalMenuTemplate,
  EthiopianClassicTemplate,
  CafeMenuTemplate,
  FastFoodMenuTemplate,
};

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  badge: string;
  columns: string;
  defaultPaper: string;
  recommendedTone: string;
}

export const AVAILABLE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    category: 'Contemporary',
    description: 'Clean grid, prominent table number & scannable QR code.',
    badge: 'Popular',
    columns: '2 Column',
    defaultPaper: 'A4',
    recommendedTone: 'white',
  },
  {
    id: 'classic',
    name: 'Classic Bistro',
    category: 'Traditional',
    description: 'Text-heavy, elegant typography with dotted price leaders.',
    badge: 'Standard',
    columns: '2 Column',
    defaultPaper: 'A4',
    recommendedTone: 'warm-white',
  },
  {
    id: 'elegant',
    name: 'Luxury / Elegant',
    category: 'Fine Dining',
    description: 'High-end centered layout with refined gold borders.',
    badge: 'Premium',
    columns: '2 Column',
    defaultPaper: 'A4',
    recommendedTone: 'cream',
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    category: 'Modern',
    description: 'High contrast, ample whitespace, sharp monospace elements.',
    badge: 'Clean',
    columns: '1 or 2 Col',
    defaultPaper: 'Letter',
    recommendedTone: 'white',
  },
  {
    id: 'cafe',
    name: 'Visual Cafe & Bakery',
    category: 'Casual',
    description: 'Photo cards, signature dish highlights & brunch badges.',
    badge: 'Visual',
    columns: 'Grid Cards',
    defaultPaper: 'A4',
    recommendedTone: 'cream',
  },
  {
    id: 'fast-food',
    name: 'Fast Food Express',
    category: 'Quick Service',
    description: 'Bold red header, quick combo highlights & price badges.',
    badge: 'High Speed',
    columns: '2 Column',
    defaultPaper: 'A4',
    recommendedTone: 'white',
  },
  {
    id: 'ethiopian-classic',
    name: 'Ethiopian Classic',
    category: 'Cultural',
    description: 'Habesha Tibeb borders, Amharic Ge’ez script & multi-page support.',
    badge: 'Habesha',
    columns: 'Multi-Page',
    defaultPaper: 'A4',
    recommendedTone: 'warm-white',
  },
];

export interface MenuTemplateRendererProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const MenuTemplateRenderer: React.FC<MenuTemplateRendererProps> = (props) => {
  const { settings } = props;

  switch (settings.templateId) {
    case 'classic':
      return <ClassicMenuTemplate {...props} />;
    case 'elegant':
      return <ElegantMenuTemplate {...props} />;
    case 'minimal':
      return <MinimalMenuTemplate {...props} />;
    case 'cafe':
      return <CafeMenuTemplate {...props} />;
    case 'fast-food':
      return <FastFoodMenuTemplate {...props} />;
    case 'ethiopian-classic':
      return <EthiopianClassicTemplate {...props} />;
    case 'modern':
    default:
      return <ModernMenuTemplate {...props} />;
  }
};
