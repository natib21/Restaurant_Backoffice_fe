// src/features/Table/Components/PrintMenu/templates/ElegantMenuTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData, getTableScanUrl, type ProcessedCategory } from '../utils/templateUtils';

export interface ElegantMenuTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const ElegantMenuTemplate: React.FC<ElegantMenuTemplateProps> = ({
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
  const restaurantName = settings.restaurantName || merchant?.businessName || 'L’HÉRITAGE';
  const subTitle = settings.subTitle || 'HAUTE CUISINE & TASTING MENU';
  const tagline = settings.tagline || 'Exclusive Chef Creations';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';

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

  const isDark = settings.paperColor === 'dark-slate';
  const paperBgColor = isDark ? '#090d16' : settings.paperColor === 'cream' ? '#fcf8ee' : '#fafafa';
  const goldColor = '#c5a059';
  const primaryTextColor = isDark ? '#f8fafc' : '#1a1a1a';
  const secondaryTextColor = isDark ? '#94a3b8' : '#737373';
  const dividerColor = isDark ? '#262626' : '#e5e5e5';

  return (
    <div
      className="menu-print-page relative w-full h-full p-10 sm:p-14 flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: paperBgColor,
        color: primaryTextColor,
        fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
      }}
    >
      {/* ── Geometric Gold Corner Accents ───────────────────────────── */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: goldColor }} />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: goldColor }} />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: goldColor }} />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: goldColor }} />

      {/* ── Luxury Header ───────────────────────────────────────────── */}
      <header className="relative text-center pb-8 mb-6 border-b z-10" style={{ borderColor: dividerColor }}>
        {/* Table Number & QR in top right */}
        <div className="absolute right-0 top-0 flex items-center gap-3">
          {settings.showTableNumber && (
            <div className="text-right">
              <span className="text-[8px] uppercase tracking-[0.2em] block font-sans font-bold" style={{ color: goldColor }}>
                SALLE À MANGER
              </span>
              <span className="text-xl font-bold tracking-widest" style={{ color: primaryTextColor }}>
                TABLE {tableNum}
              </span>
            </div>
          )}

          {settings.showTableQR && (
            <div className="p-1 bg-white border rounded shadow-xs" style={{ borderColor: goldColor }}>
              <QRCodeSVG value={qrUrl} size={50} level="M" />
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto">
          {settings.showLogo && (settings.logoUrl || merchant?.logo) && (
            <img
              src={settings.logoUrl || merchant?.logo}
              alt={restaurantName}
              className="h-12 w-12 object-contain mx-auto mb-3"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-normal uppercase tracking-[0.25em]" style={{ color: goldColor }}>
            {restaurantName}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium mt-1" style={{ color: secondaryTextColor }}>
            {subTitle}
          </p>
          {tagline && (
            <p className="text-[9px] italic mt-1 font-serif" style={{ color: secondaryTextColor }}>
              — {tagline} —
            </p>
          )}
        </div>
      </header>

      {/* ── Main Menu Content ───────────────────────────────────────── */}
      <main className="relative flex-1 z-10">
        {processedCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm uppercase tracking-widest font-bold">No Menu Selections</p>
            <p className="text-xs mt-1 font-sans" style={{ color: secondaryTextColor }}>
              Configure items on the right panel to preview this menu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-10 h-full">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {col1Categories.map((cat) => (
                <ElegantCategorySection
                  key={cat.id}
                  category={cat}
                  settings={settings}
                  goldColor={goldColor}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                />
              ))}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {col2Categories.map((cat) => (
                <ElegantCategorySection
                  key={cat.id}
                  category={cat}
                  settings={settings}
                  goldColor={goldColor}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative mt-auto pt-4 border-t text-center text-[9px] font-sans tracking-widest uppercase z-10" style={{ borderColor: dividerColor, color: secondaryTextColor }}>
        <p>{settings.taxDisclaimer || 'Service compris • All major cards accepted'}</p>
        <div className="flex justify-center items-center gap-6 mt-1.5 font-bold" style={{ color: goldColor }}>
          {settings.phone && <span>{settings.phone}</span>}
          <span>•</span>
          <span>RESERVATION TABLE #{tableNum}</span>
          <span>•</span>
          {settings.website && <span>{settings.website}</span>}
        </div>
      </footer>
    </div>
  );
};

const ElegantCategorySection: React.FC<{
  category: ProcessedCategory;
  settings: PrintMenuSettings;
  goldColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
}> = ({ category, settings, goldColor, primaryTextColor, secondaryTextColor }) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Category Title */}
      <div className="text-center">
        <h2 className="text-xs sm:text-sm font-normal uppercase tracking-[0.2em]" style={{ color: goldColor }}>
          {category.name}
        </h2>
        <div className="w-12 h-px mx-auto mt-1" style={{ backgroundColor: goldColor }} />
      </div>

      <div className="flex flex-col gap-3">
        {category.items.map((item) => (
          <div key={item.id} className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xs sm:text-[13px] font-medium tracking-wide uppercase" style={{ color: primaryTextColor }}>
                {item.name}
              </h3>
              {settings.showPrices && (
                <span className="text-xs sm:text-[13px] font-sans font-bold tabular-nums" style={{ color: goldColor }}>
                  — {item.price > 0 ? `${item.price} ${settings.currencySymbol}` : 'S.P.'}
                </span>
              )}
            </div>

            {settings.showDescriptions && item.description && (
              <p className="text-[10px] italic font-sans max-w-xs mt-0.5" style={{ color: secondaryTextColor }}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
