// src/features/Table/Components/PrintMenu/templates/DynamicSectionRenderer.tsx
import React from 'react';
import type { ProcessedCategory, ProcessedItem } from '../utils/templateUtils';
import type { PrintMenuSettings } from '../types';
import { getSectionConfig } from '../utils/templateUtils';

export interface DynamicSectionRendererProps {
  category: ProcessedCategory;
  settings: PrintMenuSettings;
  primaryTextColor: string;
  secondaryTextColor: string;
  borderColor: string;
  accentColor?: string;
}

export const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({
  category,
  settings,
  primaryTextColor,
  secondaryTextColor,
  borderColor,
  accentColor = '#2563eb',
}) => {
  const sectionConfig = getSectionConfig(category.id, settings);
  const layout = sectionConfig.layout;
  const density = sectionConfig.density;
  const dividerStyle = sectionConfig.dividerStyle;
  const showPhotos = sectionConfig.showPhotos;

  // Density-based spacing classes
  const spacingClass =
    density === 'compact'
      ? 'gap-1.5'
      : density === 'relaxed'
      ? 'gap-4 sm:gap-5'
      : 'gap-3';

  const itemPaddingClass =
    density === 'compact'
      ? 'py-1'
      : density === 'relaxed'
      ? 'py-2.5'
      : 'py-1.5';

  // Section Background Tint
  let backgroundStyle: React.CSSProperties = {};
  let containerClasses = 'rounded-lg p-3 transition-all';

  if (sectionConfig.backgroundTint === 'subtle') {
    backgroundStyle = {
      backgroundColor: settings.paperColor === 'dark-slate' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
    };
  } else if (sectionConfig.backgroundTint === 'card') {
    backgroundStyle = {
      backgroundColor: settings.paperColor === 'dark-slate' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    };
  } else if (sectionConfig.backgroundTint && sectionConfig.backgroundTint !== 'none') {
    backgroundStyle = { backgroundColor: sectionConfig.backgroundTint };
  } else {
    containerClasses = 'p-0';
  }

  // Header Divider Style
  let headerBorderClass = 'border-b-2 pb-1';
  let headerBorderStyle: React.CSSProperties = { borderColor: primaryTextColor };

  if (dividerStyle === 'none') {
    headerBorderClass = 'pb-1';
    headerBorderStyle = {};
  } else if (dividerStyle === 'dashed') {
    headerBorderClass = 'border-b-2 border-dashed pb-1';
    headerBorderStyle = { borderColor: primaryTextColor };
  }

  return (
    <div className={`flex flex-col ${containerClasses}`} style={backgroundStyle}>
      {/* Category Heading */}
      <div className={`flex justify-between items-baseline mb-2 ${headerBorderClass}`} style={headerBorderStyle}>
        <div className="flex items-baseline gap-2">
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wide"
            style={{ color: primaryTextColor }}
          >
            {category.name}
          </h2>
          {category.amName && settings.showAmharic && (
            <span className="text-xs font-medium opacity-80" style={{ color: secondaryTextColor }}>
              {category.amName}
            </span>
          )}
        </div>

        {category.items.length > 0 && (
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: secondaryTextColor }}>
            {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {settings.showCategoryDescriptions && category.description && (
        <p className="text-[11px] italic mb-2.5 opacity-80" style={{ color: secondaryTextColor }}>
          {category.description}
        </p>
      )}

      {/* Render layout variants */}
      {layout === 'grid-2col' ? (
        /* ── 1. Grid 2-Column Layout ───────────────────────────────── */
        <div className={`grid grid-cols-2 ${spacingClass}`}>
          {category.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between p-2 rounded-md border bg-black/[0.015] dark:bg-white/[0.02]"
              style={{ borderColor }}
            >
              {showPhotos && item.image && (
                <div className="w-full h-20 rounded mb-1.5 overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="text-xs font-bold leading-tight" style={{ color: primaryTextColor }}>
                    {item.name}
                  </h3>
                  {settings.showPrices && (
                    <span className="text-xs font-black tabular-nums whitespace-nowrap ml-1" style={{ color: accentColor }}>
                      {item.price > 0 ? `${item.price.toFixed(2)} ${settings.currencySymbol}` : 'MP'}
                    </span>
                  )}
                </div>

                {settings.showDescriptions && item.description && (
                  <p className="text-[10px] leading-tight mt-1 line-clamp-2" style={{ color: secondaryTextColor }}>
                    {item.description}
                  </p>
                )}
              </div>

              {settings.showDietary && item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="px-1 py-0.2 rounded text-[7px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : layout === 'compact-price-list' ? (
        /* ── 2. Compact Price List (Bistro dot-leader style) ───────── */
        <div className="flex flex-col">
          {category.items.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col ${itemPaddingClass} ${
                dividerStyle === 'dashed' ? 'border-b border-dashed' : dividerStyle === 'line' ? 'border-b' : ''
              }`}
              style={{ borderColor }}
            >
              <div className="flex items-baseline justify-between w-full">
                <div className="flex items-baseline gap-1.5 font-bold text-xs" style={{ color: primaryTextColor }}>
                  <span>{item.name}</span>
                  {category.amName && settings.showAmharic && item.amName && (
                    <span className="text-[10px] font-normal opacity-70" style={{ color: secondaryTextColor }}>
                      ({item.amName})
                    </span>
                  )}
                </div>

                {/* Dot leader connecting name and price */}
                <div
                  className="flex-1 mx-2 border-b border-dotted"
                  style={{ borderColor: secondaryTextColor, opacity: 0.4 }}
                />

                {settings.showPrices && (
                  <span className="text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: primaryTextColor }}>
                    {item.price > 0 ? `${item.price.toFixed(2)} ${settings.currencySymbol}` : 'Market Price'}
                  </span>
                )}
              </div>

              {settings.showDescriptions && item.description && (
                <p className="text-[10px] leading-tight opacity-75 mt-0.5" style={{ color: secondaryTextColor }}>
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── 3. List with Photos (Default row-based layout) ────────── */
        <div className={`flex flex-col ${spacingClass}`}>
          {category.items.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 items-start justify-between ${itemPaddingClass} ${
                dividerStyle === 'dashed' ? 'border-b border-dashed' : dividerStyle === 'line' ? 'border-b' : ''
              }`}
              style={{ borderColor }}
            >
              {showPhotos && item.image && (
                <div
                  className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border"
                  style={{ borderColor }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

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
                            className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {settings.showPrices && (
                    <span
                      className="text-xs sm:text-[13px] font-bold tabular-nums flex-shrink-0"
                      style={{ color: primaryTextColor }}
                    >
                      {item.price > 0 ? `${item.price.toFixed(2)} ${settings.currencySymbol}` : 'Market Price'}
                    </span>
                  )}
                </div>

                {settings.showDescriptions && item.description && (
                  <p className="text-[11px] leading-tight mt-0.5" style={{ color: secondaryTextColor }}>
                    {item.description}
                  </p>
                )}

                {item.variants && item.variants.length > 1 && (
                  <div className="flex gap-2 mt-1 text-[10px]" style={{ color: secondaryTextColor }}>
                    {item.variants.map((v) => (
                      <span
                        key={v.name}
                        className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium"
                      >
                        {v.name}: {v.price} {settings.currencySymbol}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
