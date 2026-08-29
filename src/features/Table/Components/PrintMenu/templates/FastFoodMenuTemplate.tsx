// src/features/Table/Components/PrintMenu/templates/FastFoodMenuTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData, getTableScanUrl, type ProcessedCategory } from '../utils/templateUtils';

export interface FastFoodMenuTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

export const FastFoodMenuTemplate: React.FC<FastFoodMenuTemplateProps> = ({
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
  const restaurantName = settings.restaurantName || merchant?.businessName || 'EXPRESS BURGERS & BITES';
  const tagline = settings.tagline || 'Flame Grilled • Crispy Fries • Fast Dine-In';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';

  return (
    <div
      className="menu-print-page relative w-full h-full p-8 sm:p-10 flex flex-col justify-between select-none overflow-hidden bg-white text-slate-900 font-sans"
    >
      {/* ── Bold Red Header ───────────────────────────────────────── */}
      <header className="bg-red-600 text-white p-4 rounded-2xl flex justify-between items-center mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🍔</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">
              {restaurantName}
            </h1>
            <p className="text-xs font-bold text-red-100 uppercase tracking-widest mt-1">
              {tagline}
            </p>
          </div>
        </div>

        {/* Table Badge & QR */}
        <div className="flex items-center gap-3 bg-white text-slate-900 p-2 rounded-xl">
          <div className="text-right">
            <span className="text-[8px] font-black uppercase tracking-wider block text-red-600">
              TABLE
            </span>
            <span className="text-2xl font-black leading-none">
              #{tableNum}
            </span>
          </div>
          {settings.showTableQR && (
            <QRCodeSVG value={qrUrl} size={48} level="M" />
          )}
        </div>
      </header>

      {/* ── Category Cards ────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {processedCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm font-bold text-slate-600">No Menu Items Selected</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 h-full">
            {processedCategories.map((category) => (
              <div key={category.id} className="flex flex-col gap-2">
                <div className="bg-amber-400 text-slate-950 px-3 py-1 rounded-lg font-black text-xs uppercase tracking-wider flex justify-between items-center">
                  <span>{category.name}</span>
                  <span className="text-[10px] opacity-80">HOT & FRESH</span>
                </div>

                <div className="flex flex-col gap-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border-2 border-slate-100 hover:border-red-200 bg-slate-50/50 flex justify-between items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 truncate">
                          {item.name}
                        </div>
                        {settings.showDescriptions && item.description && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>

                      {settings.showPrices && (
                        <div className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg tabular-nums shadow-xs">
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

      {/* ── Fast Food Footer ──────────────────────────────────────── */}
      <footer className="mt-auto pt-3 border-t-2 border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
        <span>⚡ FAST SERVICE • ORDER AT COUNTER OR SCAN TABLE QR</span>
        <span className="text-red-600">TABLE #{tableNum}</span>
      </footer>
    </div>
  );
};
