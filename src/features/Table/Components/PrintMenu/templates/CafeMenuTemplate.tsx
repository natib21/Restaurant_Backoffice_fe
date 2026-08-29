// src/features/Table/Components/PrintMenu/templates/CafeMenuTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData, getTableScanUrl, type ProcessedCategory } from '../utils/templateUtils';

export interface CafeMenuTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const CafeMenuTemplate: React.FC<CafeMenuTemplateProps> = ({
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
  const restaurantName = settings.restaurantName || merchant?.businessName || 'ARTISAN CAFE & BAKERY';
  const tagline = settings.tagline || 'Specialty Coffee • Fresh Pastries • Brunch';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';

  const paperBgColor =
    settings.paperColor === 'cream'
      ? '#fdfbf7'
      : settings.paperColor === 'warm-white'
      ? '#faf8f5'
      : settings.paperColor === 'light-beige'
      ? '#f4ece1'
      : '#ffffff';

  const primaryColor = settings.primaryColor || '#451a03'; // Warm coffee tone
  const accentColor = '#b45309';
  const mutedColor = '#78716c';

  return (
    <div
      className="menu-print-page relative w-full h-full p-8 sm:p-10 flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: paperBgColor,
        color: primaryColor,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="flex justify-between items-center pb-5 mb-5 border-b-2" style={{ borderColor: accentColor }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-900 border border-amber-300">
            ☕
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: primaryColor }}>
              {restaurantName}
            </h1>
            <p className="text-xs font-semibold text-amber-800 tracking-wide mt-0.5">
              {tagline}
            </p>
          </div>
        </div>

        {/* Table & QR Badge */}
        <div className="flex items-center gap-3 bg-amber-50/80 p-2 rounded-xl border border-amber-200">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold tracking-wider block text-amber-900">
              TABLE NO.
            </span>
            <span className="text-2xl font-black text-amber-950">
              #{tableNum}
            </span>
          </div>
          {settings.showTableQR && (
            <div className="p-1 bg-white border border-amber-200 rounded-lg shadow-2xs">
              <QRCodeSVG value={qrUrl} size={50} level="M" />
            </div>
          )}
        </div>
      </header>

      {/* ── Menu Grid with Photo Cards ────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {processedCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm font-bold">No Menu Items Selected</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 h-full">
            {processedCategories.map((category) => (
              <div key={category.id} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 border-b pb-1" style={{ borderColor: accentColor }}>
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: primaryColor }}>
                    {category.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-white/70 border border-amber-900/10 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      {/* Photo Thumbnail */}
                      {settings.showImages && item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 rounded-md object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-amber-100/60 flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0">
                          ☕
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate" style={{ color: primaryColor }}>
                          {item.name}
                        </div>
                        {settings.showDescriptions && item.description && (
                          <div className="text-[10px] line-clamp-1 mt-0.5" style={{ color: mutedColor }}>
                            {item.description}
                          </div>
                        )}
                      </div>

                      {settings.showPrices && (
                        <div className="font-bold text-xs text-amber-900 flex-shrink-0 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 tabular-nums">
                          {item.price > 0 ? `${item.price} ${settings.currencySymbol}` : '–'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Cafe Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto pt-3 border-t flex justify-between items-center text-[10px] font-medium" style={{ borderColor: '#e7e5e4', color: mutedColor }}>
        <span>Free High-Speed Wi-Fi • Ask barista for password</span>
        <span className="font-bold text-amber-950">Table #{tableNum} • Scan QR for fast order & re-orders</span>
      </footer>
    </div>
  );
};
