// src/components/layout/TestModeBanner.tsx
import { ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TestModeBannerProps {
  variant?: 'sidebar' | 'header';
  isExpanded?: boolean;
}

export const TestModeBanner: React.FC<TestModeBannerProps> = ({
  variant = 'sidebar',
  isExpanded = true,
}) => {
  const isTestMode = useSelector((state: RootState) => state.ui.isTestMode);

  if (!isTestMode || (variant === 'sidebar' && !isExpanded)) return null;

  const isHeader = variant === 'header';

  return (
    <div
      className={cn(
        'bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm',
        isHeader ? 'mx-0 flex flex-col sm:flex-row' : 'flex flex-col',
        ' gap-1 '
      )}
    >
      {/* Message + Icon */}
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-900">Test Mode Active</p>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Real orders and payments are disabled until setup is complete.
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex gap-3 ',
          variant === 'sidebar' ? 'flex-col' : 'flex-col sm:flex-row sm:ml-auto'
        )}
      >
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white w-full justify-center"
          asChild
        >
          <Link to="/onboarding/profile">Complete Setup</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 text-amber-800 hover:bg-amber-100 w-full justify-center"
          asChild
        >
          <Link to="/billing/plans">Choose Plan</Link>
        </Button>
      </div>
    </div>
  );
};
