// src/features/Table/Components/PrintMenu/templates/ClassicMenuTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData, getTableScanUrl, type ProcessedCategory } from '../utils/templateUtils';

export interface ClassicMenuTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const ClassicMenuTemplate: React.FC<ClassicMenuTemplateProps> = ({
  table,
  menuItems,
  menuGroups = [],
  categories = [],
  merchant,
  settings,
}) => {
  const processedCategories = useMemo(() => {
    return filterAndGroupMenuData({
      menuItems,
      menuGroups,
      categories,
      settings,
    });
  }, [menuItems, menuGroups, categories, settings]);

  const qrUrl = getTableScanUrl(table);

  const restaurantName =
    settings.restaurantName ||
    merchant?.businessName ||
    'Kinetic Bistro';
  const tagline = settings.tagline || 'Fine Dining & Classic Hospitality • Est. 2024';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';

  // Split categories evenly across 2 columns
  const { col1Categories, col2Categories } = useMemo(() => {
    if (processedCategories.length <= 1) {
      return { col1Categories: processedCategories, col2Categories: [] };
    }
    const mid = Math.ceil(processedCategories.length / 2);
    return {
      col1Categories: processedCategories.slice(0, mid),
      col2Categories: processedCategories.slice(mid),
    };
  }, [processedCategories]);

  const paperBgColor =
    settings.paperColor === 'cream'
      ? '#fdfaf0'
      : settings.paperColor === 'warm-white'
      ? '#faf7f2'
      : settings.paperColor === 'light-beige'
      ? '#f4ece1'
      : settings.paperColor === 'dark-slate'
      ? '#1e293b'
      : '#ffffff';

  const isDark = settings.paperColor === 'dark-slate';
  const primaryColor = isDark ? '#f8fafc' : settings.primaryColor || '#1c1917';
  const accentColor = isDark ? '#fbbf24' : '#854d0e';
  const secondaryColor = isDark ? '#94a3b8' : '#78716c';
  const borderRuleColor = isDark ? '#475569' : '#d6d3d1';

  return (
    <div
      className="menu-print-page relative w-full h-full p-8 sm:p-12 flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: paperBgColor,
        color: primaryColor,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      {/* ── Outer Ornate Double Border ──────────────────────────────── */}
      <div
        className="absolute inset-4 sm:inset-6 border-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      >
        <div
          className="absolute inset-1 border pointer-events-none"
          style={{ borderColor: borderRuleColor }}
        />
      </div>

      {/* ── Top Classic Header ──────────────────────────────────────── */}
      <header className="relative text-center pb-5 mb-6 border-b z-10" style={{ borderColor: borderRuleColor }}>
        {/* Table & QR Badge (Top Right Corner) */}
        <div className="absolute right-0 top-0 flex items-center gap-3">
          {settings.showTableNumber && (
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest block font-sans font-bold" style={{ color: secondaryColor }}>
                TABLE
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif" style={{ color: primaryColor }}>
                #{tableNum}
              </span>
            </div>
          )}

          {settings.showTableQR && (
            <div className="p-1.5 bg-white border rounded shadow-2xs">
              <QRCodeSVG
                value={qrUrl}
                size={settings.qrSize === 'small' ? 44 : 56}
                level="M"
              />
            </div>
          )}
        </div>

        {/* Brand Title */}
        <div className="max-w-md mx-auto">
          {settings.showLogo && (settings.logoUrl || merchant?.logo) && (
            <img
              src={settings.logoUrl || merchant?.logo}
              alt={restaurantName}
              className="h-10 w-10 object-contain mx-auto mb-2"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest" style={{ color: primaryColor }}>
            {restaurantName}
          </h1>
          <div className="flex items-center justify-center gap-2 my-1">
            <div className="h-px w-8" style={{ backgroundColor: accentColor }} />
            <span className="text-xs text-amber-700 font-serif">♦</span>
            <div className="h-px w-8" style={{ backgroundColor: accentColor }} />
          </div>
          {tagline && (
            <p className="text-[11px] uppercase tracking-wider font-sans font-medium" style={{ color: secondaryColor }}>
              {tagline}
            </p>
          )}
        </div>
      </header>

      {/* ── Menu Sections (2 Columns with Dotted Leaders) ───────────── */}
      <main className="relative flex-1 z-10">
        {processedCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-base font-bold font-serif">No Menu Items Selected</p>
            <p className="text-xs mt-1 font-sans" style={{ color: secondaryColor }}>
              Select categories to display them in this classic bistro template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8 sm:gap-10 h-full">
            {/* Column 1 */}
            <div className="flex flex-col gap-6">
              {col1Categories.map((category) => (
                <ClassicCategorySection
                  key={category.id}
                  category={category}
                  settings={settings}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  accentColor={accentColor}
                  borderRuleColor={borderRuleColor}
                />
              ))}
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-6">
              {col2Categories.map((category) => (
                <ClassicCategorySection
                  key={category.id}
                  category={category}
                  settings={settings}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  accentColor={accentColor}
                  borderRuleColor={borderRuleColor}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Classic Footer ──────────────────────────────────────────── */}
      <footer className="relative mt-auto pt-3 border-t text-center text-[10px] font-sans z-10" style={{ borderColor: borderRuleColor, color: secondaryColor }}>
        <p className="italic">{settings.taxDisclaimer || 'Please inform your server of any dietary allergies. Gratuity may be added for large parties.'}</p>
        <div className="flex justify-center items-center gap-4 mt-1 font-semibold">
          {settings.phone && <span>Tel: {settings.phone}</span>}
          {settings.address && <span>{settings.address}</span>}
          <span>Table #{tableNum}</span>
        </div>
      </footer>
    </div>
  );
};

interface ClassicCategorySectionProps {
  category: ProcessedCategory;
  settings: PrintMenuSettings;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRuleColor: string;
}

const ClassicCategorySection: React.FC<ClassicCategorySectionProps> = ({
  category,
  settings,
  primaryColor,
  secondaryColor,
  accentColor,
  borderRuleColor,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Centered Category Heading with side flourish */}
      <div className="text-center pb-1">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest font-serif inline-block border-b pb-0.5" style={{ color: primaryColor, borderColor: accentColor }}>
          {category.name}
        </h2>
        {category.amName && settings.showAmharic && (
          <div className="text-[11px] font-sans mt-0.5" style={{ color: secondaryColor }}>
            {category.amName}
          </div>
        )}
      </div>

      {/* Items with dotted lines connecting to prices */}
      <div className="flex flex-col gap-3">
        {category.items.map((item) => (
          <div key={item.id} className="flex flex-col">
            <div className="flex items-baseline justify-between w-full">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-[13px] font-serif" style={{ color: primaryColor }}>
                <span>{item.name}</span>
                {settings.showDietary && item.tags && item.tags.length > 0 && (
                  <span className="text-[8px] font-sans font-semibold uppercase px-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {item.tags.join(', ')}
                  </span>
                )}
              </div>

              {/* Dotted Leader Line */}
              <div className="flex-1 mx-2 border-b border-dotted" style={{ borderColor: borderRuleColor }} />

              {/* Price */}
              {settings.showPrices && (
                <span className="text-xs sm:text-[13px] font-bold font-sans tabular-nums" style={{ color: primaryColor }}>
                  {item.price > 0 ? `${item.price.toFixed(2)} ${settings.currencySymbol}` : 'M/P'}
                </span>
              )}
            </div>

            {/* Description */}
            {settings.showDescriptions && item.description && (
              <p className="text-[10.5px] italic font-sans mt-0.5 max-w-[90%]" style={{ color: secondaryColor }}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
