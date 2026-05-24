import { Check, Zap, Crown, BarChart3, AlertCircle, Loader2, RefreshCcw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSubscriptionQuery, useSubscribeMutation } from '@/api/Queries/subscriptionQueries';

export default function SubscriptionPlanPage() {
  const { data: subscription, isLoading, error, isRefetching } = useSubscriptionQuery();
  const { mutate: subscribe, isPending: initiating } = useSubscribeMutation();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#3e4095]" />
      </div>
    );
  }

  if (error && (error as any).response?.status !== 404) {
    return (
      <div className="container max-w-2xl py-20">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Subscription</AlertTitle>
          <AlertDescription>
            {(error as any).response?.data?.message || "Something went wrong while fetching your billing data."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActive = subscription?.status === 'active';
  const isPending = subscription?.status === 'pending';
  const planName = subscription?.plan 
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) 
    : 'Free';

  const calculateProgress = (used: number = 0, limit: number = 1) => {
    if (limit === 0) return 100;
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="container mx-auto space-y-8 py-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#3e4095]">Billing & Subscription</h2>
            {isRefetching && <RefreshCcw className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <p className="text-muted-foreground mt-1">Manage your merchant account limits and plan features.</p>
        </div>

        <Badge className={`px-4 py-1.5 text-sm font-semibold shadow-sm ${
            isActive ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : 
            isPending ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' : 
            'bg-slate-100 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isActive ? `${planName} Plan • Active` : isPending ? 'Processing Payment...' : 'Free Tier'}
        </Badge>
      </div>

      {/* Webhook Status Alert: Shows if a payment is pending in the background */}
      {!isActive && (
        <Alert className={isPending ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}>
          <AlertCircle className={`h-5 w-5 ${isPending ? 'text-amber-600' : 'text-blue-600'}`} />
          <AlertTitle className="font-bold">
            {isPending ? 'Action Required: Verifying Payment' : 'Level up your business'}
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm leading-relaxed">
            {isPending
              ? "We've initiated your payment. We are currently waiting for the final confirmation from Kispay. Your dashboard will unlock automatically."
              : "You are currently using the limited version. Upgrade to Pro to handle more orders and add staff members."}
          </AlertDescription>
          {!isPending && (
            <Button 
              className="mt-4 bg-[#3e4095] hover:bg-[#353787]" 
              onClick={() => subscribe({ plan: 'pro', durationMonths: 1 })} 
              disabled={initiating}
            >
              {initiating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upgrade to Pro'}
            </Button>
          )}
        </Alert>
      )}

      {/* Usage Progress Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <UsageCard 
            title="Monthly Orders" 
            icon={<Zap className="h-4 w-4 text-amber-500" />}
            used={subscription?.usage?.orders || 0} 
            limit={subscription?.limits?.orders || 100} 
            progress={calculateProgress(subscription?.usage?.orders, subscription?.limits?.orders)} 
        />
        
        <UsageCard 
            title="Staff Accounts" 
            icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
            used={subscription?.usage?.staff || 0} 
            limit={subscription?.limits?.staff || 1} 
            progress={calculateProgress(subscription?.usage?.staff, subscription?.limits?.staff)} 
        />

        <Card className={isActive ? 'bg-[#3e4095] text-white shadow-lg border-none' : 'bg-slate-50 border-dashed'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-amber-400" />
              {isActive ? 'Current Billing' : 'Pro Plan'}
            </CardTitle>
            <CardDescription className={isActive ? 'text-slate-200' : ''}>
              {isActive ? `Next payment due ${new Date(subscription.endDate).toLocaleDateString()}` : '2,500 ETB / Month'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
                {isActive ? `${subscription.amount.toLocaleString()} ETB` : 'Get Unlimited Access'}
            </p>
          </CardContent>
          {!isActive && (
            <CardFooter>
              <Button variant="outline" className="w-full bg-white text-[#3e4095]" onClick={() => subscribe({ plan: 'pro', durationMonths: 1 })} disabled={initiating}>
                {initiating ? 'Redirecting...' : 'Switch to Pro'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Plan Features Grid */}
      {isActive && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-xl">Your {planName} Features</CardTitle>
                    <CardDescription>Included in your current monthly subscription.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-[#3e4095]">
                    <History className="mr-2 h-4 w-4" /> Billing History
                </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
                {(subscription.features || ['Order Management', 'Basic Reports', 'Support']).map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-green-100 p-1">
                    <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{feature}</span>
                </div>
                ))}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-slate-50/30 px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => subscribe({ plan: 'basic', durationMonths: 1 })} disabled={initiating}>
                Downgrade
            </Button>
            <Button className="bg-[#3e4095]" onClick={() => subscribe({ plan: 'enterprise', durationMonths: 1 })} disabled={initiating}>
                {initiating ? 'Processing...' : 'Upgrade to Enterprise'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}


function UsageCard({ title, icon, used, limit, progress }: { title: string, icon: React.ReactNode, used: number, limit: number, progress: number }) {
    return (
        <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
                {icon} {title}
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {used.toLocaleString()} <span className="text-slate-400 font-normal text-lg">/ {limit.toLocaleString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className={`h-2 ${progress > 90 ? '[&>div]:bg-red-500' : progress > 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-[#3e4095]'}`} />
            <div className="flex justify-between mt-2">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{Math.round(progress)}% utilized</p>
                {progress >= 100 && <p className="text-[11px] text-red-500 font-bold">Limit Reached</p>}
            </div>
          </CardContent>
        </Card>
    )
}