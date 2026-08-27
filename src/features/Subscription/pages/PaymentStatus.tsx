import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, RefreshCcw, Home, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatusQuery, useVerifyPaymentMutation } from '@/api/Queries/subscriptionQueries';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramTxRef = searchParams.get('tx_ref');
  const storedTxRef = localStorage.getItem('pending_tx_ref');
  const tx_ref = paramTxRef || storedTxRef;

  const { data: subscription, refetch: refetchSub } = useSubscriptionStatusQuery();
  const { data: merchant, refetch: refetchMerchant } = useMyMerchantQuery();
  const { mutate: verifyPayment, isPending: isVerifying } = useVerifyPaymentMutation();
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const isSubActive =
    subscription?.isActive ||
    subscription?.status === 'active' ||
    merchant?.isSubscriptionActive ||
    (merchant?.hasActiveAccess && merchant?.features?.optional && Object.values(merchant.features.optional).some((f: any) => f?.enabled));

  // Call POST /verify immediately on page load
  useEffect(() => {
    if (tx_ref && !verificationAttempted && !isSubActive) {
      setVerificationAttempted(true);
      verifyPayment(tx_ref, {
        onSuccess: () => {
          refetchSub();
          refetchMerchant();
        },
      });
    }
  }, [tx_ref, verificationAttempted, isSubActive, verifyPayment, refetchSub, refetchMerchant]);

  // Secondary status check interval if backend webhook / verification processing is asynchronous
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!isSubActive) {
      interval = setInterval(() => {
        refetchSub();
        refetchMerchant();
      }, 4000);
    }

    return () => clearInterval(interval);
  }, [isSubActive, refetchSub, refetchMerchant]);

  const activeFeaturesCount =
    Array.isArray(subscription?.features)
      ? subscription.features.length
      : merchant?.features?.optional
      ? Object.values(merchant.features.optional).filter((f: any) => f?.enabled).length
      : 0;

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card
        className={`w-full max-w-md text-center shadow-lg border-t-4 transition-colors duration-500 ${
          isSubActive ? 'border-t-emerald-500' : 'border-t-[#3e4095]'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-center mb-4">
            {isSubActive ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-in zoom-in duration-300" />
            ) : (
              <Loader2 className="h-16 w-16 text-[#3e4095] animate-spin" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {isSubActive ? 'Subscription Activated!' : isVerifying ? 'Verifying Payment...' : 'Processing Confirmation'}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 mt-1">
            {isSubActive
              ? 'Your subscription payment has been verified and your merchant features are now active.'
              : 'Verifying payment transaction status with the payment gateway...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active Plan Card */}
          {isSubActive && (
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="capitalize">{subscription?.plan || merchant?.mode || 'Active Plan'}</span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
              </div>

              <div className="flex justify-between text-xs text-slate-600 pt-1">
                <span>Enabled Features:</span>
                <span className="font-bold text-[#3e4095]">{activeFeaturesCount} Modules</span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Transaction Reference</p>
            <p className="text-xs font-mono font-bold text-slate-700 break-all mt-0.5">{tx_ref || 'N/A'}</p>
          </div>

          {!isSubActive && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin text-amber-600" />
              <span>Checking gateway verification...</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full bg-[#3e4095] hover:bg-[#32347d] text-white font-semibold h-11"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-500"
            onClick={() => navigate('/subscription/plan')}
          >
            View Subscription Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export const PaymentCancel = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-t-4 border-t-amber-500">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Payment Cancelled</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            You have cancelled the subscription transaction. No charges were completed.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => navigate('/subscription/plan')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Plan Selection
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export const PaymentError = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-t-4 border-t-rose-500">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-rose-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Verification Error</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Payment could not be verified automatically. If you were charged, please contact our support team with your transaction reference.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full bg-[#3e4095] hover:bg-[#32347d]"
            onClick={() => navigate('/subscription/plan')}
          >
            Back to Subscription Manager
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
