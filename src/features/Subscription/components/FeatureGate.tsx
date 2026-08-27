import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import type { FeatureKey } from '@/api/Queries/subscriptionQueries';

interface FeatureGateProps {
  feature: FeatureKey | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /**
   * If true, renders a banner instead of replacing the entire content view.
   */
  mode?: 'fullscreen' | 'banner' | 'inline';
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  mode = 'fullscreen',
}) => {
  const navigate = useNavigate();
  const { hasAccess, isLoading, featureDetail } = useFeatureAccess(feature);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Verifying feature permissions...</div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featureName = featureDetail?.name || feature;
  const featureDesc =
    featureDetail?.description ||
    'This feature is not included in your active subscription plan.';

  if (mode === 'banner') {
    return (
      <div className="my-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{featureName} Locked</p>
            <p className="text-xs text-amber-700">{featureDesc}</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#3e4095] hover:bg-[#32347d] text-white shrink-0"
          onClick={() => navigate('/subscription/plan')}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Unlock Feature
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4 animate-in fade-in duration-300">
      <Card className="border-slate-200 shadow-md text-center">
        <CardHeader className="space-y-3 pb-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {featureName} Required
          </CardTitle>
          <CardDescription className="text-sm max-w-md mx-auto text-slate-600">
            {featureDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Subscription Required
            </div>
            <p>
              Your current merchant plan does not include the <strong>{featureName}</strong> module.
              You can activate it instantly from your Billing & Subscription manager.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button
            className="bg-[#3e4095] hover:bg-[#32347d] text-white font-medium"
            onClick={() => navigate('/subscription/plan')}
          >
            <span>Choose Plan & Activate</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
