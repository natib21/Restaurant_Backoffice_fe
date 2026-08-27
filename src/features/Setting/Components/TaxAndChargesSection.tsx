// src/features/Setting/Components/TaxAndChargesSection.tsx
import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Percent, Receipt, FileText, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { type SettingsFormValues } from '../lib/settingsSchema';

interface TaxAndChargesSectionProps {
  form: UseFormReturn<SettingsFormValues>;
}

export const TaxAndChargesSection: React.FC<TaxAndChargesSectionProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Percent className="h-5 w-5 text-amber-600" /> Taxes, VAT & Service Charges
          </CardTitle>
          <CardDescription className="text-xs">
            Configure government Value Added Tax (VAT), restaurant service charges, and customer tipping settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VAT / Tax Rate */}
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Standard VAT / Tax Rate (%)
                    </FormLabel>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {field.value || 0}%
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="pr-8 text-sm font-bold bg-white"
                        placeholder="15"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    Applied automatically to all subtotal bills (Standard in Ethiopia is 15% VAT).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Charge */}
            <FormField
              control={form.control}
              name="serviceCharge"
              render={({ field }) => (
                <FormItem className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Service Charge Rate (%)
                    </FormLabel>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {field.value || 0}%
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="pr-8 text-sm font-bold bg-white"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    Optional dine-in staff service charge added prior to tax calculation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tax Identification (TIN) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <FormField
              control={form.control}
              name="tinId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-700">
                    Taxpayer Identification Number (TIN)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 0012345678"
                      className="font-mono text-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Printed on official fiscal receipts and invoices.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-700">
                    Store Primary Currency
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                      value="ETB (Ethiopian Birr)"
                      className="text-xs font-semibold bg-slate-50"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Base ledger currency for all branch sales and pricing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipping Configuration */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <FormField
              control={form.control}
              name="tipsEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-bold text-slate-900">
                      Enable Digital Customer Tipping
                    </FormLabel>
                    <FormDescription className="text-[11px] text-muted-foreground">
                      Allows guests scanning table QR codes to add tips (10%, 15%, 20% or custom) during checkout.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
