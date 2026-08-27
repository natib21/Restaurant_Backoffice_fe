// src/features/Setting/Components/PaymentMethodsSection.tsx
import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Building,
  Key,
  Save,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PaymentGateway {
  id: string;
  name: string;
  type: 'mobile_money' | 'card_gateway' | 'cash' | 'pos' | 'bank';
  enabled: boolean;
  isDefault?: boolean;
  accountNumber?: string;
  accountName?: string;
  merchantCode?: string;
  apiKey?: string;
  environment?: 'live' | 'test';
  instructions?: string;
  badgeText?: string;
}

const initialGateways: PaymentGateway[] = [
  {
    id: 'telebirr',
    name: 'Telebirr SuperApp & USSD',
    type: 'mobile_money',
    enabled: true,
    isDefault: true,
    merchantCode: 'TB-MERCHANT-8842',
    accountNumber: '+251911223344',
    environment: 'live',
    badgeText: 'Ethiopia #1 Mobile Money',
  },
  {
    id: 'chapa',
    name: 'Chapa (Visa, Mastercard, Telebirr, CBEBirr)',
    type: 'card_gateway',
    enabled: true,
    apiKey: 'CHASECK_TEST-••••••••••••••••',
    environment: 'live',
    badgeText: 'Online Card & QR Checkout',
  },
  {
    id: 'cbebirr',
    name: 'CBE Birr (Commercial Bank of Ethiopia)',
    type: 'mobile_money',
    enabled: true,
    merchantCode: 'CBE-TILL-9901',
    accountNumber: '1000234567890',
    accountName: 'Restaurant Operations',
    environment: 'live',
    badgeText: 'Instant Bank Transfer',
  },
  {
    id: 'cash',
    name: 'Cash Payment at Counter / Table',
    type: 'cash',
    enabled: true,
    instructions: 'Customer pays cash to waiter or cashier before/after dining.',
    badgeText: 'Standard Dine-In',
  },
  {
    id: 'pos_terminal',
    name: 'Physical POS Terminal (Bank Card Swipe)',
    type: 'pos',
    enabled: true,
    merchantCode: 'POS-TERM-01',
    instructions: 'Waiter brings portable CBE / Awash / Dashen POS machine to table.',
    badgeText: 'Hardware POS',
  },
];

export const PaymentMethodsSection: React.FC = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>(initialGateways);
  const [isSaving, setIsSaving] = useState(false);

  const toggleGateway = (id: string) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    );
  };

  const updateGatewayField = (id: string, field: keyof PaymentGateway, value: any) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Payment methods configuration saved successfully');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Payment Methods & Digital Wallets
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Configure payment gateways, Telebirr merchant till codes, Chapa integration, and cash/POS handling for customer orders.
              </CardDescription>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Payment Methods'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {gateways.map((gateway) => (
              <div
                key={gateway.id}
                className={`p-4 rounded-xl border transition-all ${
                  gateway.enabled
                    ? 'border-slate-200 bg-white shadow-2xs'
                    : 'border-slate-100 bg-slate-50/70 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        gateway.type === 'mobile_money'
                          ? 'bg-amber-50 text-amber-600'
                          : gateway.type === 'card_gateway'
                          ? 'bg-indigo-50 text-indigo-600'
                          : gateway.type === 'pos'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {gateway.type === 'mobile_money' && <Smartphone className="h-5 w-5" />}
                      {gateway.type === 'card_gateway' && <CreditCard className="h-5 w-5" />}
                      {gateway.type === 'pos' && <Building className="h-5 w-5" />}
                      {gateway.type === 'cash' && <Banknote className="h-5 w-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{gateway.name}</h4>
                        {gateway.badgeText && (
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {gateway.badgeText}
                          </Badge>
                        )}
                        {gateway.isDefault && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {gateway.enabled ? 'Active on customer checkout & waiter POS' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      {gateway.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={gateway.enabled}
                      onCheckedChange={() => toggleGateway(gateway.id)}
                    />
                  </div>
                </div>

                {/* Gateway Detail Configuration Inputs */}
                {gateway.enabled && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gateway.merchantCode !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">
                          Merchant / Till Code
                        </Label>
                        <Input
                          value={gateway.merchantCode}
                          onChange={(e) =>
                            updateGatewayField(gateway.id, 'merchantCode', e.target.value)
                          }
                          placeholder="e.g. TB-12345"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    )}

                    {gateway.accountNumber !== undefined && (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">
                          Phone or Account #
                        </Label>
                        <Input
                          value={gateway.accountNumber}
                          onChange={(e) =>
                            updateGatewayField(gateway.id, 'accountNumber', e.target.value)
                          }
                          placeholder="+251911..."
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    )}

                    {gateway.apiKey !== undefined && (
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-bold text-slate-600">
                          Secret API Key
                        </Label>
                        <Input
                          type="password"
                          value={gateway.apiKey}
                          onChange={(e) =>
                            updateGatewayField(gateway.id, 'apiKey', e.target.value)
                          }
                          placeholder="Secret key from gateway dashboard"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    )}

                    {gateway.instructions !== undefined && (
                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <Label className="text-[11px] font-bold text-slate-600">
                          Staff / Customer Note
                        </Label>
                        <Input
                          value={gateway.instructions}
                          onChange={(e) =>
                            updateGatewayField(gateway.id, 'instructions', e.target.value)
                          }
                          placeholder="Instructions shown on receipt or checkout"
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
