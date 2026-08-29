// src/features/Table/Components/PrintMenu/templates/MinimalMenuTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData, getTableScanUrl, type ProcessedCategory } from '../utils/templateUtils';

export interface MinimalMenuTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const MinimalMenuTemplate: React.FC<MinimalMenuTemplateProps> = ({
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
  const restaurantName = settings.restaurantName || merchant?.businessName || 'MINIMAL KITCHEN';
  const tagline = settings.tagline || 'Essential Dining';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';

  const isDark = settings.paperColor === 'dark-slate';
  const paperBgColor = isDark ? '#0a0a0a' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#000000';
  const textMuted = isDark ? '#a3a3a3' : '#737373';
  const borderRule = isDark ? '#262626' : '#e5e5e5';

  return (
    <div
      className="menu-print-page relative w-full h-full p-10 sm:p-12 flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: paperBgColor,
        color: textPrimary,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="flex justify-between items-start pb-6 mb-6 border-b" style={{ borderColor: borderRule }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase" style={{ color: textPrimary }}>
            {restaurantName}
          </h1>
          <p className="text-xs font-mono tracking-wider mt-0.5" style={{ color: textMuted }}>
            {tagline}
          </p>
        </div>

        {/* Table & QR */}
        <div className="flex items-center gap-4">
          {settings.showTableNumber && (
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase block" style={{ color: textMuted }}>
                TABLE
              </span>
              <span className="text-2xl font-black font-mono">
                {tableNum}
              </span>
            </div>
          )}

          {settings.showTableQR && (
            <div className="p-1 bg-white border border-black/10 rounded">
              <QRCodeSVG value={qrUrl} size={54} level="M" />
            </div>
          )}
        </div>
      </header>

      {/* ── Menu List ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {processedCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm font-bold">No Menu Items Selected</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-10 h-full">
            {processedCategories.map((category) => (
              <div key={category.id} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between border-b pb-1" style={{ borderColor: textPrimary }}>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: textPrimary }}>
                    {category.name}
                  </h2>
                  <span className="text-[10px] font-mono" style={{ color: textMuted }}>
                    ({category.items.length})
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs">
                      <div className="flex-1 pr-2">
                        <div className="font-semibold" style={{ color: textPrimary }}>
                          {item.name}
                        </div>
                        {settings.showDescriptions && item.description && (
                          <div className="text-[10px] mt-0.5 leading-snug" style={{ color: textMuted }}>
                            {item.description}
                          </div>
                        )}
                      </div>

                      {settings.showPrices && (
                        <div className="font-mono font-bold tabular-nums" style={{ color: textPrimary }}>
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

      {/* ── Minimal Footer ────────────────────────────────────────── */}
      <footer className="mt-auto pt-4 border-t flex justify-between items-center text-[9px] font-mono uppercase" style={{ borderColor: borderRule, color: textMuted }}>
        <div>{settings.taxDisclaimer || 'All prices inclusive of VAT.'}</div>
        <div>Table #{tableNum} • Scan QR to order</div>
      </footer>
    </div>
  );
};
