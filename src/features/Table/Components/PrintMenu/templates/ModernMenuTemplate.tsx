// src/features/Table/Components/PrintMenu/templates/ModernMenuTemplate.tsx
import React, { useMemo } from 'react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings } from '../types';
import { filterAndGroupMenuData } from '../utils/templateUtils';
import { DynamicSectionRenderer } from './DynamicSectionRenderer';
import { SlotBrandingHeader, SlotBrandingFooter } from './SlotBrandingRenderer';

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
  // Filter and group menu items according to user curation & DnD order settings
  const processedCategories = useMemo(() => {
    return filterAndGroupMenuData({
      menuItems,
      menuGroups,
      categories,
      settings,
    });
  }, [menuItems, menuGroups, categories, settings]);

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
  const accentColor = settings.accentColor || '#2563eb';

  return (
    <div
      className="menu-print-page relative w-full h-full p-8 sm:p-10 flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: paperBgColor,
        color: primaryTextColor,
        fontFamily:
          settings.fontFamily === 'serif'
            ? 'Georgia, serif'
            : settings.fontFamily === 'cinzel'
            ? "'Cinzel', serif"
            : settings.fontFamily === 'mono'
            ? 'monospace'
            : 'Inter, sans-serif',
      }}
    >
      {/* ── Slot-Based Top Header Bar ── */}
      <SlotBrandingHeader
        table={table}
        merchant={merchant}
        settings={settings}
        primaryTextColor={primaryTextColor}
        secondaryTextColor={secondaryTextColor}
        borderColor={borderColor}
        accentColor={accentColor}
      />

      {/* ── Main Category & Menu Content ── */}
      <main className="flex-1 overflow-hidden">
        {processedCategories.length === 0 ? (
          <div
            className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl"
            style={{ borderColor }}
          >
            <p className="text-base font-bold" style={{ color: primaryTextColor }}>
              No Menu Items Selected
            </p>
            <p className="text-xs mt-1" style={{ color: secondaryTextColor }}>
              Select categories and items in the configuration panel to curate this menu.
            </p>
          </div>
        ) : settings.columnsCount === 1 ? (
          /* Single Column Layout */
          <div className="space-y-6">
            {processedCategories.map((category) => (
              <DynamicSectionRenderer
                key={category.id}
                category={category}
                settings={settings}
                primaryTextColor={primaryTextColor}
                secondaryTextColor={secondaryTextColor}
                borderColor={borderColor}
                accentColor={accentColor}
              />
            ))}
          </div>
        ) : (
          /* Dual Column Modern Layout */
          <div className="grid grid-cols-2 gap-8 sm:gap-10 h-full">
            <div className="flex flex-col gap-6">
              {col1Categories.map((category) => (
                <DynamicSectionRenderer
                  key={category.id}
                  category={category}
                  settings={settings}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                  borderColor={borderColor}
                  accentColor={accentColor}
                />
              ))}
            </div>
            <div className="flex flex-col gap-6">
              {col2Categories.map((category) => (
                <DynamicSectionRenderer
                  key={category.id}
                  category={category}
                  settings={settings}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                  borderColor={borderColor}
                  accentColor={accentColor}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Slot-Based Footer Bar ── */}
      <SlotBrandingFooter
        table={table}
        merchant={merchant}
        settings={settings}
        primaryTextColor={primaryTextColor}
        secondaryTextColor={secondaryTextColor}
        borderColor={borderColor}
        accentColor={accentColor}
      />
    </div>
  );
};
