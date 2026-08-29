// src/features/Table/Components/PrintMenu/utils/templateUtils.ts
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Table } from '@/api/Queries/tableQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { getLocalizedName, getLocalizedDescription } from '@/features/Menu/lib/localizationUtils';
import { getCategoryName, getCategoryDescription } from '@/features/Menu/lib/categoryUtils';

export interface ProcessedItem {
  id: string;
  name: string;
  amName?: string;
  description?: string;
  price: number;
  image?: string;
  categoryName: string;
  categoryId: string;
  isVeg?: boolean;
  isSpicy?: boolean;
  isAlcoholic?: boolean;
  isPopular?: boolean;
  tags?: string[];
  variants?: { name: string; price: number }[];
}

export interface ProcessedCategory {
  id: string;
  name: string;
  amName?: string;
  description?: string;
  items: ProcessedItem[];
}

export function filterAndGroupMenuData({
  menuItems = [],
  menuGroups = [],
  categories = [],
  settings,
}: {
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  settings: PrintMenuSettings;
}): ProcessedCategory[] {
  const selectedCatSet = new Set(settings.selectedCategoryIds || []);
  const selectedItemSet = new Set(settings.selectedMenuItemIds || []);

  const hasCategoryFilter = selectedCatSet.size > 0;
  const hasItemFilter = selectedItemSet.size > 0;

  // Build a Category Lookup Map
  const catLookup = new Map<string, { name: string; amName?: string; desc?: string }>();
  categories.forEach((cat) => {
    const id = cat.id || cat._id || '';
    catLookup.set(id, {
      name: getCategoryName(cat, 'en'),
      amName: cat.name && typeof cat.name === 'object' ? cat.name.am : undefined,
      desc: getCategoryDescription(cat, 'en'),
    });
  });

  const categoryMap = new Map<string, ProcessedCategory>();

  // Process raw menu items
  menuItems.forEach((item) => {
    const itemId = item._id || (item as any).id || '';
    
    // Check if item is filtered out
    if (hasItemFilter && !selectedItemSet.has(itemId)) {
      return;
    }

    // Determine category ID and details
    let catId = 'general';
    let catName = 'Specialties';
    let catAmName: string | undefined = undefined;
    let catDesc: string | undefined = undefined;

    if (item.category) {
      if (typeof item.category === 'object') {
        const catObj = item.category as any;
        catId = catObj.id || catObj._id || catObj.name?.en || 'general';
        catName = getLocalizedName(catObj, 'en', 'Specialties');
        catAmName = catObj.name?.am;
        catDesc = catObj.description?.en;
      } else if (typeof item.category === 'string') {
        catId = item.category;
        const lookup = catLookup.get(item.category);
        if (lookup) {
          catName = lookup.name;
          catAmName = lookup.amName;
          catDesc = lookup.desc;
        } else {
          catName = item.category;
        }
      }
    }

    // Check if category is filtered out
    if (hasCategoryFilter && !selectedCatSet.has(catId) && !selectedCatSet.has(catName)) {
      return;
    }

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        name: catName,
        amName: catAmName,
        description: catDesc,
        items: [],
      });
    }

    // Extract item details
    const itemName = getLocalizedName(item, 'en', 'Menu Item');
    const itemAmName = getLocalizedName(item, 'am');
    const itemDesc = getLocalizedDescription(item, 'en');

    // Variants
    let variants: { name: string; price: number }[] | undefined = undefined;
    if (Array.isArray(item.variants) && item.variants.length > 1) {
      variants = item.variants.map((v) => ({
        name: v.name || v.size || 'Regular',
        price: v.price || 0,
      }));
    }

    const price =
      item.variants && item.variants.length > 0
        ? item.variants[0].price
        : item.price || 0;

    const tags: string[] = [];
    if (item.isVeg) tags.push('Vegan');
    if (item.isSpicy) tags.push('Spicy');
    if (item.isAlcoholic) tags.push('Alcoholic');
    if (Array.isArray(item.tags)) {
      item.tags.forEach((t) => {
        if (t && !tags.includes(t)) tags.push(t);
      });
    }

    const processedItem: ProcessedItem = {
      id: itemId,
      name: itemName,
      amName: itemAmName,
      description: itemDesc,
      price,
      image: item.image || item.imageUrl || (item as any).coverImage || undefined,
      categoryName: catName,
      categoryId: catId,
      isVeg: item.isVeg ?? undefined,
      isSpicy: item.isSpicy ?? undefined,
      isAlcoholic: item.isAlcoholic ?? undefined,
      isPopular: (item as any).isPopular || (item as any).isSpecial || false,
      tags: tags.length > 0 ? tags : undefined,
      variants,
    };

    categoryMap.get(catId)!.items.push(processedItem);
  });

  // Filter out empty categories and return array
  return Array.from(categoryMap.values()).filter((c) => c.items.length > 0);
}

export function formatPrice(price: number, currency: string = 'ETB'): string {
  if (isNaN(price)) return `${currency} 0.00`;
  return `${currency} ${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getTableQrData(table?: Table | null, customUrl?: string): string {
  if (!table) return 'https://restoflow.app/order';
  if (customUrl) return customUrl;
  if (table.qrUrl) return table.qrUrl;
  if (table.qrCode && !table.qrCode.startsWith('data:image')) return table.qrCode;
  return `https://restoflow.app/tables/${table._id || (table as any).id}/order`;
}

export const getTableScanUrl = getTableQrData;

