// src/features/Table/Components/PrintMenu/templates/ModernMenuTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData, getTableScanUrl, type ProcessedCategory } from '../utils/templateUtils';

export interface ModernMenuTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const ModernMenuTemplate: React.FC<ModernMenuTemplateProps> = ({
  table,
  menuItems,
  menuGroups = [],
  categories = [],
  merchant,
  settings,
}) => {
  // Filter and group menu items according to user curation settings
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
    'Kinetic Ops';
  const tagline = settings.tagline || 'Craft Burgers & Artisan Pizza';
  const subTitle = settings.subTitle || 'Physical Dining Menu';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';

  // Split categories for 2-column or 1-column layout
  const { col1Categories, col2Categories } = useMemo(() => {
    if (settings.columnsCount === 1 || processedCategories.length <= 1) {
      return { col1Categories: processedCategories, col2Categories: [] };
    }
    const mid = Math.ceil(processedCategories.length / 2);
    return {
      col1Categories: processedCategories.slice(0, mid),
      col2Categories: processedCategories.slice(mid),
    };
  }, [processedCategories, settings.columnsCount]);

  const paperBgColor =
    settings.paperColor === 'cream'
      ? '#fdfaf2'
      : settings.paperColor === 'warm-white'
      ? '#faf9f6'
      : settings.paperColor === 'light-beige'
      ? '#f5f0e6'
      : settings.paperColor === 'dark-slate'
      ? '#0f172a'
      : '#ffffff';

  const isDarkPaper = settings.paperColor === 'dark-slate';
  const primaryTextColor = isDarkPaper ? '#f8fafc' : settings.primaryColor || '#091426';
  const secondaryTextColor = isDarkPaper ? '#94a3b8' : settings.secondaryColor || '#64748b';
  const borderColor = isDarkPaper ? '#334155' : '#e2e8f0';

  return (
    <div
      className="menu-print-page relative w-full h-full p-8 sm:p-10 flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: paperBgColor,
        color: primaryTextColor,
        fontFamily: settings.fontFamily === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif',
      }}
    >
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <header className="border-b-4 pb-5 mb-6 flex justify-between items-end" style={{ borderColor: primaryTextColor }}>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3">
            {settings.showLogo && (settings.logoUrl || merchant?.logo) && (
              <img
                src={settings.logoUrl || merchant?.logo}
                alt={restaurantName}
                className="h-12 w-12 object-contain rounded-md"
              />
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-none" style={{ color: primaryTextColor }}>
                {restaurantName}
              </h1>
              {tagline && (
                <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold mt-1" style={{ color: secondaryTextColor }}>
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Right: Table Badge & QR Code */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {settings.showTableNumber && (
            <div className="text-right border-r pr-4" style={{ borderColor }}>
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: secondaryTextColor }}>
                DINE-IN TABLE
              </div>
              <div className="text-2xl sm:text-3xl font-black leading-none" style={{ color: primaryTextColor }}>
                #{tableNum}
              </div>
              {table?.section && (
                <div className="text-[10px] uppercase font-semibold mt-0.5" style={{ color: secondaryTextColor }}>
                  {table.section}
                </div>
              )}
            </div>
          )}

          {settings.showTableQR && (
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg border bg-white shadow-xs" style={{ borderColor }}>
              <QRCodeSVG
                value={qrUrl}
                size={settings.qrSize === 'small' ? 52 : settings.qrSize === 'large' ? 76 : 64}
                level="M"
                includeMargin={false}
              />
              <span className="text-[8px] font-bold tracking-tight text-slate-800 uppercase mt-1">
                Scan To Order
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Category & Menu Grid ─────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {processedCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl" style={{ borderColor }}>
            <p className="text-base font-bold" style={{ color: primaryTextColor }}>No Menu Items Selected</p>
            <p className="text-xs mt-1" style={{ color: secondaryTextColor }}>
              Select categories and items in the configuration panel to curate this menu.
            </p>
          </div>
        ) : settings.columnsCount === 1 ? (
          /* Single Column Layout */
          <div className="space-y-6">
            {processedCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                settings={settings}
                primaryTextColor={primaryTextColor}
                secondaryTextColor={secondaryTextColor}
                borderColor={borderColor}
              />
            ))}
          </div>
        ) : (
          /* Dual Column Modern Layout */
          <div className="grid grid-cols-2 gap-8 sm:gap-10 h-full">
            <div className="flex flex-col gap-6">
              {col1Categories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  settings={settings}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                  borderColor={borderColor}
                />
              ))}
            </div>
            <div className="flex flex-col gap-6">
              {col2Categories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  settings={settings}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                  borderColor={borderColor}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer Bar ───────────────────────────────────────────────── */}
      <footer className="mt-auto pt-4 border-t flex flex-row items-center justify-between gap-4 text-[10px] font-medium" style={{ borderColor, color: secondaryTextColor }}>
        <div>
          {settings.taxDisclaimer || 'Please inform your server of any allergies. All prices include applicable taxes.'}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {settings.phone && <span>📞 {settings.phone}</span>}
          {settings.website && <span>🌐 {settings.website}</span>}
          <span className="font-bold uppercase tracking-wider">TABLE #{tableNum}</span>
        </div>
      </footer>
    </div>
  );
};

interface CategorySectionProps {
  category: ProcessedCategory;
  settings: PrintMenuSettings;
  primaryTextColor: string;
  secondaryTextColor: string;
  borderColor: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  settings,
  primaryTextColor,
  secondaryTextColor,
  borderColor,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Category Heading */}
      <div className="border-b-2 pb-1 flex justify-between items-baseline" style={{ borderColor: primaryTextColor }}>
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide" style={{ color: primaryTextColor }}>
          {category.name}
        </h2>
        {category.amName && settings.showAmharic && (
          <span className="text-xs font-medium" style={{ color: secondaryTextColor }}>
            {category.amName}
          </span>
        )}
      </div>

      {settings.showCategoryDescriptions && category.description && (
        <p className="text-[11px] italic -mt-1" style={{ color: secondaryTextColor }}>
          {category.description}
        </p>
      )}

      {/* Items List */}
      <div className="flex flex-col gap-3.5">
        {category.items.map((item) => (
          <div key={item.id} className="flex gap-3 items-start justify-between">
            {/* Optional Thumbnail Image */}
            {settings.showImages && item.image && (
              <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border" style={{ borderColor }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-[13px] font-bold" style={{ color: primaryTextColor }}>
                    {item.name}
                  </h3>
                  {settings.showDietary && item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {settings.showPrices && (
                  <span className="text-xs sm:text-[13px] font-bold tabular-nums flex-shrink-0" style={{ color: primaryTextColor }}>
                    {item.price > 0 ? `${item.price.toFixed(2)} ${settings.currencySymbol}` : 'Market Price'}
                  </span>
                )}
              </div>

              {settings.showDescriptions && item.description && (
                <p className="text-[11px] leading-tight mt-0.5" style={{ color: secondaryTextColor }}>
                  {item.description}
                </p>
              )}

              {/* Variants / Sizing */}
              {item.variants && item.variants.length > 1 && (
                <div className="flex gap-2 mt-1 text-[10px]" style={{ color: secondaryTextColor }}>
                  {item.variants.map((v) => (
                    <span key={v.name} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                      {v.name}: {v.price} {settings.currencySymbol}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
