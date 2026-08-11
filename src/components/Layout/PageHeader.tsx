import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbText?: string;
  breadcrumbAction?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbText,
  breadcrumbAction,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  actionLabel,
  onAction,
  children,
}) => {
  return (
    <div className="sticky top-0 z-30 mx-auto">
      <header className="border-b border-border/40 bg-background/70 backdrop-blur-2xl transition-all">
        <div className="flex h-20 items-center justify-between px-6">
          {/* Left: Dual Accent Bar + Typography */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="h-9 w-1 bg-primary rounded-full" />
              <div className="h-5 w-0.5 bg-primary/40 rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black tracking-tight text-foreground">
                  {title}
                </h1>
                {breadcrumbText && breadcrumbAction && (
                  <>
                    <span className="text-border/80">•</span>
                    <button
                      onClick={breadcrumbAction}
                      className="group inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-all"
                    >
                      <span>{breadcrumbText}</span>
                      <span className="block transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </button>
                  </>
                )}
              </div>
              {subtitle && (
                <p className="text-xs font-medium text-muted-foreground/85 tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-3">
            {onSearchChange !== undefined && (
              <div className="hidden md:block w-64 lg:w-72">
                <div className="relative flex items-center group">
                  <Search className="absolute left-3.5 text-muted-foreground/50 h-3.5 w-3.5 pointer-events-none transition-colors group-focus-within:text-primary" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-10 text-xs bg-muted/40 hover:bg-muted/60 focus-visible:bg-background rounded-full border-border/60 shadow-inner transition-all"
                  />
                </div>
              </div>
            )}

            {children}

            {actionLabel && onAction && (
              <Button
                className="h-10 px-5 text-xs font-bold gap-2 rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                onClick={onAction}
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>{actionLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default PageHeader;
