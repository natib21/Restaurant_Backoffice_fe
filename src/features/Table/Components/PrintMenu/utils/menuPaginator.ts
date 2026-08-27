// src/features/Table/Components/PrintMenu/utils/menuPaginator.ts
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import { getCategoryName, getCategoryDescription } from '@/features/Menu/lib/categoryUtils';
import { getLocalizedName, getLocalizedDescription } from '@/features/Menu/lib/localizationUtils';
import type { PrintMenuSettings } from '../types';

export interface PagedMenuItem {
  id: string;
  name: string;
  am?: string;
  desc?: string;
  price: number;
  variants?: { n: string; p: number }[];
  tags?: string[];
}

export interface PagedCategory {
  id: string;
  name: string;
  am?: string;
  items: PagedMenuItem[];
}

export interface PagedSection {
  id: string;
  name: string;
  am?: string;
  cats: PagedCategory[];
}

export interface PagedMerchant {
  name: string;
  am: string;
  branch: string;
  tagline: string;
  addr: string;
  phone: string;
  web: string;
  color: string;
}

export type MenuBlock =
  | { k: 'sec'; s: PagedSection }
  | { k: 'cat'; c: PagedCategory; s: PagedSection; cont: boolean }
  | { k: 'item'; i: PagedMenuItem; c: PagedCategory }
  | { k: 'contact' };

/**
 * Maps raw backend menu data into structured PagedSection[] model.
 */
export function mapToPagedSections(
  menuItems: MenuItem[],
  menuGroups: MenuGroup[] = [],
  dbCategories: Category[] = []
): PagedSection[] {
  // If we have menuGroups, organize by group
  if (menuGroups && menuGroups.length > 0) {
    const activeGroups = menuGroups.filter((g) => g.visibility !== 'hidden');
    if (activeGroups.length > 0) {
      return activeGroups.map((group) => {
        // Collect items in this group
        const rawGroupItems: MenuItem[] = [];
        (group.items || []).forEach((gi) => {
          if (gi.isHidden) return;
          if (typeof gi.menu === 'object' && gi.menu) {
            rawGroupItems.push(gi.menu as MenuItem);
          } else if (typeof gi.menu === 'string') {
            const found = menuItems.find((m) => m._id === gi.menu);
            if (found) rawGroupItems.push(found);
          }
        });

        // Group these items by their Category
        const catMap = new Map<string, MenuItem[]>();
        rawGroupItems.forEach((item) => {
          const itemCat = item.category as any;
          const catId = typeof itemCat === 'object' && itemCat ? (itemCat.id || itemCat._id) : itemCat;
          const catObj = dbCategories.find((c) => (c.id || c._id) === catId || c.name?.en === catId) || (typeof itemCat === 'object' ? itemCat : null);
          const catKey = catObj ? (catObj.id || catObj._id || getCategoryName(catObj, 'en')) : (typeof itemCat === 'string' ? itemCat : 'General');

          if (!catMap.has(catKey)) {
            catMap.set(catKey, []);
          }
          catMap.get(catKey)!.push(item);
        });

        const cats: PagedCategory[] = Array.from(catMap.entries()).map(([catKey, items]) => {
          const catObj = dbCategories.find((c) => (c.id || c._id) === catKey || c.name?.en === catKey);
          const enName = catObj ? getCategoryName(catObj, 'en') : catKey;
          const amName = catObj && typeof catObj.name === 'object' ? catObj.name.am : undefined;

          return {
            id: catKey,
            name: enName,
            am: amName,
            items: items.map((i) => mapMenuItem(i, dbCategories)),
          };
        });

        return {
          id: group._id,
          name: getLocalizedName(group, 'en', 'Menu Section'),
          am: getLocalizedName(group, 'am'),
          cats: cats.filter((c) => c.items.length > 0),
        };
      }).filter((sec) => sec.cats.length > 0);
    }
  }

  // Fallback: Group by Food / Beverage / Desserts or Category
  const typeMap = new Map<string, Map<string, MenuItem[]>>();

  menuItems.forEach((item) => {
    const secType = item.type === 'drink' ? 'Beverages' : 'Food';
    const itemCat = item.category as any;
    const catId = typeof itemCat === 'object' && itemCat ? (itemCat.id || itemCat._id) : itemCat;
    const catObj = dbCategories.find((c) => (c.id || c._id) === catId || c.name?.en === catId) || (typeof itemCat === 'object' ? itemCat : null);
    const catKey = catObj ? (catObj.id || catObj._id || getCategoryName(catObj, 'en')) : (typeof itemCat === 'string' ? itemCat : 'Specialties');

    if (!typeMap.has(secType)) {
      typeMap.set(secType, new Map());
    }
    const catGroup = typeMap.get(secType)!;
    if (!catGroup.has(catKey)) {
      catGroup.set(catKey, []);
    }
    catGroup.get(catKey)!.push(item);
  });

  const sectionAmMap: Record<string, string> = {
    Food: 'ምግብ',
    Beverages: 'መጠጦች',
    'Combos & Specials': 'ልዩ ምግቦችና ኮምቦ',
    'Grills & Specialties': 'ግሪልና ልዩ ምግቦች',
    Desserts: 'ጣፋጮች',
  };

  const sections: PagedSection[] = [];
  typeMap.forEach((catGroup, secName) => {
    const cats: PagedCategory[] = [];
    catGroup.forEach((items, catKey) => {
      const catObj = dbCategories.find((c) => (c.id || c._id) === catKey || c.name?.en === catKey);
      const enName = catObj ? getCategoryName(catObj, 'en') : catKey;
      const amName = catObj && typeof catObj.name === 'object' ? catObj.name.am : undefined;

      cats.push({
        id: catKey,
        name: enName,
        am: amName,
        items: items.map((i) => mapMenuItem(i, dbCategories)),
      });
    });

    if (cats.length > 0) {
      sections.push({
        id: secName.toLowerCase().replace(/\s+/g, '-'),
        name: secName,
        am: sectionAmMap[secName],
        cats,
      });
    }
  });

  return sections;
}

function mapMenuItem(item: MenuItem, dbCategories: Category[]): PagedMenuItem {
  const tags: string[] = [];
  if (item.isVeg) tags.push('Vegan');
  if (item.isSpicy) tags.push('Spicy');
  if (item.isAlcoholic) tags.push('Alcoholic');
  if (Array.isArray(item.tags)) {
    item.tags.forEach((t) => {
      if (t && !tags.includes(t)) tags.push(t);
    });
  }

  // Variants
  let variants: { n: string; p: number }[] | undefined = undefined;
  if (Array.isArray(item.variants) && item.variants.length > 1) {
    variants = item.variants.map((v) => ({
      n: v.name || v.size || 'Regular',
      p: v.price || 0,
    }));
  }

  const primaryPrice =
    item.variants && item.variants.length > 0
      ? item.variants[0].price
      : item.price || 0;

  return {
    id: item._id,
    name: getLocalizedName(item, 'en', 'Menu Item'),
    am: getLocalizedName(item, 'am'),
    desc: getLocalizedDescription(item, 'en'),
    price: primaryPrice,
    variants,
    tags: tags.length > 0 ? tags : undefined,
  };
}

/**
 * Maps merchant and settings to PagedMerchant data.
 */
export function mapToPagedMerchant(
  merchant: Merchant | null | undefined,
  settings: PrintMenuSettings
): PagedMerchant {
  const name =
    settings.restaurantName ||
    merchant?.businessName ||
    'Habesha Kitchen';

  const am =
    settings.amharicRestaurantName ||
    (typeof merchant?.businessName === 'object' ? (merchant.businessName as any)?.am : '') ||
    'ሃበሻ ኩሽና';

  const loc = merchant?.location;
  const branch =
    settings.branchName ||
    [loc?.address, loc?.city || loc?.subcity].filter(Boolean).join(' — ') ||
    'Bole Road — Addis Ababa';

  const tagline =
    settings.tagline ||
    'Authentic Ethiopian Cuisine & Hospitality';

  const addr =
    [loc?.address, loc?.subcity, loc?.city, 'Ethiopia'].filter(Boolean).join(', ') ||
    merchant?.address ||
    'Bole Road, Addis Ababa, Ethiopia';

  const phone = merchant?.phone || '+251 911 123 456';
  const web =
    merchant?.slug
      ? `www.${merchant.slug}.com`
      : merchant?.businessName
      ? `www.${merchant.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      : 'www.habeshakitchen.com';

  const color = settings.primaryColor || '#7B3F00';

  return {
    name,
    am,
    branch,
    tagline,
    addr,
    phone,
    web,
    color,
  };
}

function itemHeightUnits(item: PagedMenuItem, settings: PrintMenuSettings): number {
  let h = settings.density === 'compact' ? 1.4 : settings.density === 'spacious' ? 1.9 : 1.6;
  if (settings.showDescriptions && item.desc) {
    h += settings.density === 'compact' ? 0.6 : 0.85;
  }
  if (item.variants && item.variants.length > 0) {
    h += item.variants.length * 0.38;
  }
  return h;
}

/**
 * Paginates sections into an array of page blocks.
 */
export function paginateMenu(
  sections: PagedSection[],
  settings: PrintMenuSettings
): MenuBlock[][] {
  type Node =
    | { k: 'sec'; s: PagedSection; h: number }
    | { k: 'cat'; c: PagedCategory; s: PagedSection; h: number }
    | { k: 'item'; i: PagedMenuItem; c: PagedCategory; h: number };

  const catH = settings.density === 'compact' ? 1.6 : settings.density === 'spacious' ? 2.0 : 1.8;
  const secH = settings.density === 'compact' ? 1.8 : settings.density === 'spacious' ? 2.4 : 2.1;

  const nodes: Node[] = [];
  for (const s of sections) {
    nodes.push({ k: 'sec', s, h: secH });
    for (const c of s.cats) {
      nodes.push({ k: 'cat', c, s, h: catH });
      for (const i of c.items) {
        nodes.push({ k: 'item', i, c, h: itemHeightUnits(i, settings) });
      }
    }
  }

  // Page capacity in abstract height units
  const baseUnits =
    settings.density === 'spacious' ? 11 : settings.density === 'comfortable' ? 15 : 21;
  const colMult = settings.columnsCount === 2 ? 1.85 : 1;
  const firstCap = (baseUnits - 4.5) * colMult;
  const midCap = (baseUnits - 1.8) * colMult;

  const pages: MenuBlock[][] = [];
  let page: MenuBlock[] = [];
  let used = 0;
  let cap = firstCap;

  const flush = () => {
    if (page.length > 0) {
      pages.push(page);
    }
    page = [];
    used = 0;
    cap = midCap;
  };

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];

    if (n.k === 'sec') {
      if (used > 0 && used + n.h > cap) flush();
      page.push({ k: 'sec', s: n.s });
      used += n.h;
    } else if (n.k === 'cat') {
      const next = nodes[i + 1];
      const needed = n.h + (next?.k === 'item' ? next.h : 0);
      if (used > 0 && used + needed > cap) flush();
      page.push({ k: 'cat', c: n.c, s: n.s, cont: false });
      used += n.h;
    } else {
      if (used + n.h > cap) {
        const last = page[page.length - 1];
        if (last?.k === 'cat') {
          // Move orphaned cat header to next page
          page.pop();
          used -= catH;
          flush();
          page.push({ ...last, cont: false });
          used += catH;
        } else if (page.length > 0) {
          flush();
          // Insert continuation header
          const prevCatNode = [...nodes]
            .slice(0, i)
            .reverse()
            .find((nd) => nd.k === 'cat' && nd.c.id === n.c.id);
          if (prevCatNode && prevCatNode.k === 'cat') {
            page.push({ k: 'cat', c: prevCatNode.c, s: prevCatNode.s, cont: true });
            used += catH;
          }
        }
      }
      page.push({ k: 'item', i: n.i, c: n.c });
      used += n.h;
    }
  }

  if (page.length > 0) {
    pages.push(page);
  }

  // If no items at all, guarantee at least 1 page
  if (pages.length === 0) {
    pages.push([]);
  }

  // Append contact page if enabled
  if (settings.showContactPage !== false) {
    pages.push([{ k: 'contact' }]);
  }

  return pages;
}
