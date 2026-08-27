// src/features/Setting/pages/TelegramSettingsPage.tsx
import React, { useState } from 'react';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import {
  useTelegramStatusQuery,
  useConnectTelegramBotMutation,
  useUpdateTelegramSettingsMutation,
  useDisconnectTelegramBotMutation,
} from '@/api/Queries/telegramQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  SendHorizontal,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  Users,
  Megaphone,
  Bell,
  ShoppingBag,
  Trash2,
  Sparkles,
  HelpCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

export const TelegramSettingsPage: React.FC = () => {
  const { data: merchantProfile } = useMyMerchantQuery();
  const merchantId = merchantProfile?._id;

  const {
    data: status,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useTelegramStatusQuery(merchantId);

  const { mutate: connectBot, isPending: isConnecting } =
    useConnectTelegramBotMutation(merchantId);

  const { mutate: updateSettings, isPending: isUpdatingSettings } =
    useUpdateTelegramSettingsMutation(merchantId);

  const { mutate: disconnectBot, isPending: isDisconnecting } =
    useDisconnectTelegramBotMutation(merchantId);

  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim()) {
      toast.error('Please enter a valid Telegram Bot Token');
      return;
    }

    connectBot(
      { botToken: botToken.trim() },
      {
        onSuccess: (res) => {
          toast.success(`Connected as @${res.botUsername}`);
          setBotToken('');
          refetchStatus();
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.message ||
            'Failed to connect Telegram Bot. Check the token and try again.';
          toast.error(errMsg);
        },
      }
    );
  };

  const handleToggleSetting = (
    key: 'deliveryEnabled' | 'notificationsEnabled' | 'marketingEnabled',
    value: boolean
  ) => {
    updateSettings(
      { [key]: value },
      {
        onSuccess: () => {
          toast.success('Setting updated');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to update setting');
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnectBot(undefined, {
      onSuccess: () => {
        toast.success('Telegram bot disconnected');
        refetchStatus();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to disconnect bot');
      },
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('telegram-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-bot-qr-${status?.botUsername || 'code'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Code downloaded!');
  };

  if (isStatusLoading) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        <p className="text-sm font-medium">Loading Telegram Integration settings...</p>
      </div>
    );
  }

  const isConnected = status?.connected ?? false;
  const deepLinkUrl =
    status?.deepLink || (status?.botUsername ? `https://t.me/${status.botUsername}` : '');

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <SendHorizontal className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Telegram Bot & Mini App</h1>
              <p className="text-sm text-muted-foreground">
                Connect your Telegram bot to enable delivery ordering, notifications, and customer broadcasts.
              </p>
            </div>
          </div>
        </div>

        <div>
          {isConnected ? (
            <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-xs font-semibold gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Bot Active (@{status?.botUsername})
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Not Connected
            </Badge>
          )}
        </div>
      </div>

      {/* DISCONNECTED STATE: Bot Setup Form */}
      {!isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-sky-500/20 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot className="h-5 w-5 text-sky-500" />
                  Connect Telegram Bot
                </CardTitle>
                <CardDescription>
                  Enter the API token provided by Telegram's @BotFather to link your bot to this restaurant portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConnect} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="botToken" className="text-sm font-semibold">
                      Telegram Bot Token
                    </Label>
                    <div className="relative">
                      <Input
                        id="botToken"
                        type={showToken ? 'text' : 'password'}
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        disabled={isConnecting}
                        className="pr-10 font-mono text-xs h-10"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-sky-500" />
                      Your bot token is securely encrypted and never shown after connection.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isConnecting || !botToken.trim()}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white gap-2 h-10 font-semibold"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying & Connecting...
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="h-4 w-4" />
                        Connect Telegram Bot
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Collapsible How-To Guide */}
            <Card className="bg-muted/30">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  How to create a Telegram Bot token
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="single" collapsible defaultValue="step-guide">
                  <AccordionItem value="step-guide" className="border-none">
                    <AccordionTrigger className="py-2 text-xs hover:no-underline font-medium text-sky-600 dark:text-sky-400">
                      View step-by-step instructions with @BotFather
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 text-xs space-y-3 text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-2.5">
                        <li className="leading-relaxed">
                          Open Telegram and search for{' '}
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            @BotFather <ExternalLink className="h-3 w-3" />
                          </a>
                          .
                        </li>
                        <li className="leading-relaxed">
                          Start a chat and send the command <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-foreground">/newbot</code>.
                        </li>
                        <li className="leading-relaxed">
                          Enter a display name for your restaurant bot (e.g., <span className="font-medium text-foreground">Tasty Burger Express</span>).
                        </li>
                        <li className="leading-relaxed">
                          Choose a unique username ending in <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-foreground">bot</code> (e.g., <span className="font-medium text-foreground">tasty_burger_bot</span>).
                        </li>
                        <li className="leading-relaxed">
                          BotFather will generate an API Token. Copy that entire token string and paste it into the field above.
                        </li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview Panel */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-gradient-to-br from-sky-500/5 via-card to-card border-sky-500/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold">What you unlock with Telegram Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="p-2 h-9 w-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Telegram Mini App Ordering</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Customers launch a seamless food ordering catalog right inside Telegram with deep-linked customer profiles.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 h-9 w-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Automated Order Status Alerts</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Instantly notify customers when their order is accepted, preparing, or out for delivery.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 h-9 w-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 flex items-center justify-center">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">2-Way Inbox & Direct Broadcasts</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Chat directly with customers from your dashboard and send promotional broadcasts to opted-in users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* CONNECTED STATE: Management & Toggles */
        <div className="space-y-8">
          {/* Status Header Card */}
          <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-card to-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-bold">Connected as @{status?.botUsername}</h2>
                  </div>
                  {status?.connectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Connected on {new Date(status.connectedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  )}

                  {deepLinkUrl && (
                    <div className="flex items-center gap-2 pt-2">
                      <code className="bg-muted px-2.5 py-1 rounded text-xs font-mono text-sky-600 dark:text-sky-400 truncate max-w-xs">
                        {deepLinkUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(deepLinkUrl, 'Bot Deep Link')}
                        className="h-8 gap-1 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 gap-1 text-xs text-sky-600 dark:text-sky-400"
                      >
                        <a href={deepLinkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="p-3.5 rounded-xl bg-card border shadow-xs text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Users className="h-3.5 w-3.5 text-sky-500" />
                      <span className="text-[11px] font-medium">Linked Users</span>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight">
                      {status?.linkedCustomersCount ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border shadow-xs text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Megaphone className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[11px] font-medium">Opted In</span>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {status?.optInCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Settings Toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Feature Settings</CardTitle>
                  <CardDescription>
                    Enable or disable specific Telegram features for your restaurant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 divide-y divide-border/60">
                  {/* Toggle 1: Delivery Ordering */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-sky-500" />
                        <Label htmlFor="delivery-switch" className="text-sm font-semibold cursor-pointer">
                          Delivery Ordering (Mini App)
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Launches the Telegram Mini App "Order Food" catalog when customers interact with your bot.
                      </p>
                    </div>
                    <Switch
                      id="delivery-switch"
                      checked={status?.settings?.deliveryEnabled ?? true}
                      onCheckedChange={(checked) => handleToggleSetting('deliveryEnabled', checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  {/* Toggle 2: Order Status Notifications */}
                  <div className="flex items-center justify-between gap-4 pt-6">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-500" />
                        <Label htmlFor="notifications-switch" className="text-sm font-semibold cursor-pointer">
                          Order Status Notifications
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Automatically send Telegram updates when order statuses change (Accepted, Preparing, Ready, Out for Delivery).
                      </p>
                    </div>
                    <Switch
                      id="notifications-switch"
                      checked={status?.settings?.notificationsEnabled ?? true}
                      onCheckedChange={(checked) => handleToggleSetting('notificationsEnabled', checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  {/* Toggle 3: Marketing Broadcasts */}
                  <div className="flex items-center justify-between gap-4 pt-6">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-emerald-500" />
                        <Label htmlFor="marketing-switch" className="text-sm font-semibold cursor-pointer">
                          Marketing Messages & Broadcasts
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Enables sending promotional announcements and broadcast messages to opted-in customers.
                      </p>
                    </div>
                    <Switch
                      id="marketing-switch"
                      checked={status?.settings?.marketingEnabled ?? true}
                      onCheckedChange={(checked) => handleToggleSetting('marketingEnabled', checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>
                </CardContent>

                {!(status?.settings?.marketingEnabled ?? true) && (
                  <CardFooter className="bg-amber-500/10 border-t border-amber-500/20 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Marketing messages are currently disabled. Broadcast creation will be paused until re-enabled.</span>
                  </CardFooter>
                )}
              </Card>

              {/* Danger Zone: Disconnect */}
              <Card className="border-destructive/30">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Disconnect Bot
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Disconnecting will stop all automated notifications and support messaging. Your linked customer records will remain saved.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDisconnecting} className="gap-2 text-xs">
                        {isDisconnecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Disconnect Telegram Bot
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Telegram Bot?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will stop all Telegram order notifications and promotional broadcasts until reconnected. Existing customer account links are preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisconnect}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Confirm Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Printable Section */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-center gap-2">
                    <QrCode className="h-5 w-5 text-sky-500" />
                    Venue QR Code
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Print this QR code for table stands, flyers, or window displays to let customers link their account and order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-2">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-border inline-block">
                    <QRCodeCanvas
                      id="telegram-qr-canvas"
                      value={deepLinkUrl || 'https://t.me'}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    @{status?.botUsername}
                  </p>
                </CardContent>
                <CardFooter className="justify-center border-t py-3 bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                    className="gap-2 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PNG QR Code
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramSettingsPage;
