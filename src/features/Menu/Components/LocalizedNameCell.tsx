// src/features/Menu/Components/LocalizedNameCell.tsx
import React from 'react';
import {
  type LocalizedField,
  extractLocalizedPair,
  getLocalizedDescription,
} from '../lib/localizationUtils';

export interface LocalizedNameCellProps {
  name: LocalizedField;
  description?: LocalizedField;
  secondaryText?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  subBadges?: React.ReactNode;
  fallback?: string;
  showDescription?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const LocalizedNameCell: React.FC<LocalizedNameCellProps> = ({
  name,
  description,
  secondaryText,
  icon,
  badge,
  subBadges,
  fallback = 'Unnamed',
  showDescription = true,
  className = '',
  onClick,
}) => {
  const { en: enName, am: amName } = extractLocalizedPair(name);
  const primaryName = enName || fallback;
  const secondaryName = amName;
  const descText = description ? getLocalizedDescription({ description }, 'en') : '';

  return (
    <div
      className={`flex flex-col justify-center min-w-0 max-w-sm ${className}`}
      onClick={onClick}
    >
      {/* Primary English Name Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-snug">
          {primaryName}
        </span>
        {badge && <span className="shrink-0">{badge}</span>}
      </div>

      {/* Amharic Name Row (Below Primary) */}
      {secondaryName && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium tracking-wide leading-tight truncate">
            {secondaryName}
          </span>
        </div>
      )}

      {/* Subtext: Description or Secondary Info */}
      {showDescription && (descText || secondaryText) && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 truncate mt-0.5">
          {descText || secondaryText}
        </p>
      )}

      {/* Optional Sub-badges (tags, dietary, variants, etc.) */}
      {subBadges && <div className="mt-1 flex items-center gap-1 flex-wrap">{subBadges}</div>}
    </div>
  );
};

export default LocalizedNameCell;
