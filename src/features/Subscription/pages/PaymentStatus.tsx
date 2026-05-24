import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner'; // shadcn often uses sonner instead of react-toastify
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionQuery } from '@/api/Queries/subscriptionQueries';

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tx_ref = searchParams.get('tx_ref');

  // We use the status query. It's already polling every 30s.
  // We can also manually trigger 'refetch' for a faster UX.
  const { data: subscription, isLoading, refetch } = useSubscriptionQuery();

  const isSubActive = subscription?.status === 'active';

  // Faster polling specifically for the success page (every 3 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isSubActive) {
      interval = setInterval(() => {
        refetch();
      }, 3000);
    }

    if (isSubActive) {
      toast.success("Payment confirmed and plan activated!");
    }

    return () => clearInterval(interval);
  }, [isSubActive, refetch]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className={`w-full max-w-md text-center shadow-lg border-t-4 transition-colors duration-500 ${isSubActive ? 'border-t-green-500' : 'border-t-blue-500'}`}>
        <CardHeader>
          <div className="flex justify-center mb-4">
            {isSubActive ? (
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
            ) : (
              <Loader2 className="h-16 w-16 text-[#3e4095] animate-spin" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isSubActive ? "Payment Confirmed!" : "Verifying Payment..."}
          </CardTitle>
          <CardDescription>
            {isSubActive 
              ? "Your account has been upgraded successfully." 
              : "We're waiting for the payment provider to notify our server. This usually takes a few seconds."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500 uppercase font-semibold">Reference Number</p>
            <p className="text-sm font-mono text-slate-700 break-all">{tx_ref || 'N/A'}</p>
          </div>
          
          {!isSubActive && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
              <RefreshCcw className="h-3 w-3 animate-spin" />
              Checking status...
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full bg-[#3e4095] hover:bg-[#353787]" 
            onClick={() => navigate('/dashboard')}
            disabled={!isSubActive} // Optional: keep them here until active
          >
            Go to Dashboard
          </Button>
          {!isSubActive && (
            <p className="text-[10px] text-slate-400">
              Don't close this window until confirmation is complete.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
export const PaymentCancel = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-t-4 border-t-orange-500">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Payment Cancelled</CardTitle>
          <CardDescription>
            You have cancelled the transaction. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => navigate('/subscription/plan')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
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
      <Card className="w-full max-w-md text-center shadow-lg border-t-4 border-t-red-500">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Something went wrong</CardTitle>
          <CardDescription>
            We couldn't process your payment. This could be due to insufficient funds or a temporary provider issue.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="destructive" className="w-full" onClick={() => navigate('/subscription/plan')}>
            Back to Billing
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
            Help & Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};