// src/components/Common/PageHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  onClick?: () => void;
}

export interface PageHeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  className?: string;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  onBack?: () => void;
  breadcrumbText?: string;
  breadcrumbAction?: () => void;
  // Legacy / Direct Search support
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  // Primary Action
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  // Multiple Actions
  actions?: PageHeaderAction[];
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  showBackButton = false,
  onBack,
  breadcrumbText,
  breadcrumbAction,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actionLabel,
  actionIcon,
  onAction,
  actionVariant = 'default',
  actions = [],
  children,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className={`sticky top-0 z-30 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 ${className}`}>
      <div className="flex min-h-16 items-center justify-between px-4 sm:px-8 py-3 gap-4">
        {/* Left: Back button + Accent Bar + Title & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Accent Line Indicator */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <div className="h-4 w-0.5 bg-primary/40 rounded-full" />
          </div>

          <div className="space-y-0.5 min-w-0">
            {/* Breadcrumbs Row */}
            {(breadcrumbs && breadcrumbs.length > 0) || (breadcrumbText && breadcrumbAction) ? (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {breadcrumbs ? (
                  breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={`crumb-${idx}`}>
                      {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                      {crumb.to || crumb.onClick ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (crumb.onClick) crumb.onClick();
                            else if (crumb.to) navigate(crumb.to);
                          }}
                          className="hover:text-primary transition-colors truncate max-w-[120px]"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[120px]">
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={breadcrumbAction}
                    className="hover:text-primary transition-colors font-semibold"
                  >
                    {breadcrumbText} →
                  </button>
                )}
              </div>
            ) : null}

            {/* Title & Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {title}
              </h1>
              {badge}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Toolbar / Actions Area */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Header Search Input */}
          {onSearchChange !== undefined && searchQuery !== undefined && (
            <div className="hidden md:block w-56 lg:w-64">
              <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-400 h-3.5 w-3.5 pointer-events-none" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8.5 h-9 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          )}

          {/* Custom children */}
          {children}

          {/* Multiple Actions */}
          {actions.map((act, i) => (
            <Button
              key={`action-${i}`}
              variant={act.variant || 'outline'}
              size="sm"
              onClick={act.onClick}
              disabled={act.disabled}
              className={`h-9 px-3.5 text-xs font-semibold gap-1.5 rounded-xl border-slate-200/80 dark:border-slate-700/80 ${act.className || ''}`}
            >
              {act.icon}
              <span>{act.label}</span>
            </Button>
          ))}

          {/* Single Action */}
          {actionLabel && onAction && (
            <Button
              variant={actionVariant}
              size="sm"
              onClick={onAction}
              className="h-9 px-4 text-xs font-bold gap-1.5 rounded-xl shadow-2xs transition-all"
            >
              {actionIcon || <Plus className="h-4 w-4 stroke-[2.5]" />}
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
