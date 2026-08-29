import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingPageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const SettingPageLayout: React.FC<SettingPageLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  maxWidth = 'max-w-[1200px]',
}) => {
  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-slate-950 text-[#0b1c30] dark:text-slate-100 antialiased p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className={`w-full mx-auto ${maxWidth} flex flex-col gap-6`}>
        {/* Breadcrumbs & Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
              <ol className="inline-flex items-center space-x-1.5">
                <li className="inline-flex items-center">
                  <Link
                    to="/settings/profile"
                    className="hover:text-blue-600 transition-colors font-medium"
                  >
                    Settings
                  </Link>
                </li>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={idx} className="inline-flex items-center">
                    <ChevronRight className="h-3.5 w-3.5 mx-1 text-slate-400" />
                    {crumb.href ? (
                      <Link to={crumb.href} className="hover:text-blue-600 transition-colors font-medium">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Content Canvas */}
        <div className="w-full flex flex-col gap-6">
          {children}
        </div>
      </div>
    </div>
  );
};
