// src/features/Table/Components/PrintMenu/templates/PremiumALaCarteTemplate.tsx
import React from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import { getLocalizedName, getLocalizedDescription } from '@/features/Menu/lib/localizationUtils';
import type { PrintMenuSettings } from '../types';

interface PremiumALaCarteTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

interface CategorizedMenu {
  categoryName: string;
  items: MenuItem[];
}

export const PremiumALaCarteTemplate: React.FC<PremiumALaCarteTemplateProps> = ({
  table,
  menuItems,
  menuGroups = [],
  merchant,
  settings,
}) => {
  // Use existing table QR / qrUrl directly from the API
  const qrImageSrc =
    table.qrCode && (table.qrCode.startsWith('data:image') || table.qrCode.startsWith('http'))
      ? table.qrCode
      : null;
  const qrUrl = table.qrUrl || (table.qrCode && !table.qrCode.startsWith('data:image') ? table.qrCode : '') || '';

  const restaurantName =
    settings.restaurantName ||
    merchant?.businessName ||
    'HOTTO';
  const subTitle = settings.subTitle || 'BY TOP TABLE PLC';
  const tagline = settings.tagline || 'YOUKOUS / WELCOME';

  // Group items by category
  const categories: CategorizedMenu[] = React.useMemo(() => {
    const map = new Map<string, MenuItem[]>();

    // 1. If menuGroups are provided, populate from groups
    if (menuGroups && menuGroups.length > 0) {
      menuGroups.forEach((group) => {
        if (group.visibility === 'hidden') return;
        const groupItems: MenuItem[] = [];
        (group.items || []).forEach((gi) => {
          if (gi.isHidden) return;
          if (typeof gi.menu === 'object' && gi.menu) {
            groupItems.push(gi.menu as MenuItem);
          } else if (typeof gi.menu === 'string') {
            const found = menuItems.find((m) => m._id === gi.menu);
            if (found) groupItems.push(found);
          }
        });
        if (groupItems.length > 0) {
          map.set(getLocalizedName(group, 'en', 'Menu Section'), groupItems);
        }
      });
    }

    // 2. Also map any menu items with category property
    menuItems.forEach((item) => {
      const catName = typeof item.category === 'object' && item.category
        ? getLocalizedName(item.category, 'en', 'Specialties')
        : (item.category || 'Specialties');
      if (!map.has(catName)) {
        map.set(catName, []);
      }
      const existing = map.get(catName)!;
      if (!existing.some((e) => e._id === item._id)) {
        existing.push(item);
      }
    });

    // Convert map to array and remove empty categories
    return Array.from(map.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([categoryName, items]) => ({ categoryName, items }));
  }, [menuItems, menuGroups]);

  // Split categories evenly across 2 columns for clean editorial layout
  const { leftColCategories, rightColCategories } = React.useMemo(() => {
    if (categories.length <= 1) {
      return { leftColCategories: categories, rightColCategories: [] };
    }

    const mid = Math.ceil(categories.length / 2);
    return {
      leftColCategories: categories.slice(0, mid),
      rightColCategories: categories.slice(mid),
    };
  }, [categories]);

  // Font family class
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'playfair':
      case 'serif':
        return 'font-serif';
      case 'cinzel':
        return 'font-serif tracking-wide';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  // Font scale class
  const getScaleClass = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-[11px] leading-tight';
      case 'large':
        return 'text-[14px] leading-normal';
      case 'medium':
      default:
        return 'text-[12.5px] leading-snug';
    }
  };

  return (
    <div
      className={`menu-print-page relative w-full h-full bg-[#FCFDFD] text-[#0f172a] print:text-black p-8 sm:p-12 print:p-10 flex flex-col justify-between select-none ${getFontFamilyClass()} ${getScaleClass()}`}
      style={{
        color: settings.primaryColor || '#0f172a',
      }}
    >
      {/* 1. Header Section */}
      <header className="w-full pb-6 mb-6 border-b border-slate-200/80 print:border-slate-400 flex flex-row items-start justify-between gap-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          {settings.showLogo && (
            <div className="flex-shrink-0">
              {settings.logoUrl || merchant?.logo ? (
                <img
                  src={settings.logoUrl || merchant?.logo}
                  alt={restaurantName}
                  className="h-14 w-14 object-contain rounded-lg"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif text-xl font-bold">
                  {restaurantName.charAt(0)}
                </div>
              )}
            </div>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-widest uppercase font-serif">
              {restaurantName}
            </h1>
            {subTitle && (
              <p className="text-[10px] tracking-[0.25em] text-slate-500 uppercase font-sans font-semibold mt-0.5">
                {subTitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Welcome / Tagline Banner */}
        <div className="hidden sm:flex flex-col items-center justify-center text-center px-4">
          <span className="text-sm font-bold tracking-[0.3em] uppercase font-serif text-slate-900 border-y border-slate-200/90 py-1 px-4">
            {tagline}
          </span>
          <span className="text-[9px] tracking-widest text-slate-400 uppercase mt-1 font-sans">
            A La Carte Dining Experience
          </span>
        </div>

        {/* Right: Table-Specific QR Card */}
        {settings.showTableQR && (
          <div className="flex items-center gap-3 bg-slate-50/90 print:bg-transparent border border-slate-200 print:border-slate-400 p-2.5 rounded-xl text-right">
            <div className="flex flex-col items-end">
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-sans uppercase">
                TABLE {table.tableNumber}
              </span>
              <span className="text-[9px] text-slate-500 font-sans font-medium mt-1">
                Scan for Digital Menu
              </span>
              <span className="text-[8px] text-slate-400 font-sans">
                Instant Table Ordering
              </span>
            </div>

            <div className="h-14 w-14 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
              {qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt={`QR for Table ${table.tableNumber}`}
                  className="w-full h-full object-contain"
                />
              ) : qrUrl ? (
                <QRCodeSVG value={qrUrl} size={48} level="M" />
              ) : (
                <div className="text-[8px] text-slate-400 text-center font-sans">QR</div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Menu Content Grid (2 Columns matching Reference PDF) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {/* Left Column */}
        <div className="space-y-6">
          {leftColCategories.map(({ categoryName, items }) => (
            <div key={categoryName} className="space-y-3 break-inside-avoid">
              <div className="flex items-center gap-3">
                <h2 className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase font-serif text-slate-900 border-b-2 border-slate-900 pb-0.5">
                  {categoryName}
                </h2>
                <div className="flex-1 border-b border-slate-200 print:border-slate-300"></div>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <MenuItemRow
                    key={item._id}
                    item={item}
                    settings={settings}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {rightColCategories.map(({ categoryName, items }) => (
            <div key={categoryName} className="space-y-3 break-inside-avoid">
              <div className="flex items-center gap-3">
                <h2 className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase font-serif text-slate-900 border-b-2 border-slate-900 pb-0.5">
                  {categoryName}
                </h2>
                <div className="flex-1 border-b border-slate-200 print:border-slate-300"></div>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <MenuItemRow
                    key={item._id}
                    item={item}
                    settings={settings}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 3. Footer Section */}
      <footer className="w-full pt-6 mt-6 border-t border-slate-200 print:border-slate-400 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-sans gap-2">
        {/* Dietary Legend */}
        {settings.showDietary && (
          <div className="flex items-center gap-4 text-[10px] text-slate-600">
            <span>
              <strong className="font-serif">r</strong> – Raw
            </span>
            <span>•</span>
            <span>
              <strong className="font-serif">v</strong> – Vegetarian
            </span>
            <span>•</span>
            <span>
              <strong className="font-serif">spicy</strong> – Hot / Spicy
            </span>
          </div>
        )}

        {/* Tax and Statutory Notice */}
        <div className="text-right italic text-slate-500">
          {settings.taxDisclaimer}
        </div>
      </footer>
    </div>
  );
};

interface MenuItemRowProps {
  item: MenuItem;
  settings: PrintMenuSettings;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({ item, settings }) => {
  // Format price from variants or base price
  const priceDisplay = React.useMemo(() => {
    if (!settings.showPrices) return null;
    if (item.price !== undefined && item.price !== null) {
      return `${item.price.toLocaleString()} ${settings.currencySymbol}`;
    }
    if (item.variants && item.variants.length > 0) {
      const defaultVariant = item.variants.find((v) => v.isDefault) || item.variants[0];
      return `${defaultVariant.price.toLocaleString()} ${settings.currencySymbol}`;
    }
    return null;
  }, [item, settings.showPrices, settings.currencySymbol]);

  // Dietary tags
  const dietaryTags = React.useMemo(() => {
    if (!settings.showDietary) return [];
    const tags: string[] = [];
    if (item.isVeg) tags.push('(v)');
    if (item.isSpicy) tags.push('(spicy)');
    if (item.tags?.some((t) => t.toLowerCase().includes('raw'))) tags.push('(r)');
    return tags;
  }, [item, settings.showDietary]);

  const itemName = getLocalizedName(item, 'en', 'Menu Item');
  const itemDesc = getLocalizedDescription(item, 'en');

  return (
    <div className="flex items-start justify-between gap-3 text-left">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-bold text-slate-900 font-serif tracking-tight">
            {itemName}
          </span>
          {dietaryTags.length > 0 && (
            <span className="text-[10px] font-serif text-slate-500 italic">
              {dietaryTags.join(' ')}
            </span>
          )}
        </div>

        {settings.showDescriptions && itemDesc && (
          <p className="text-[11px] text-slate-600 font-sans leading-tight mt-0.5 text-slate-500">
            {itemDesc}
          </p>
        )}
      </div>

      {priceDisplay && (
        <div className="font-semibold text-slate-900 font-mono text-[11.5px] flex-shrink-0 text-right whitespace-nowrap pt-0.5">
          {priceDisplay}
        </div>
      )}
    </div>
  );
};
