// src/features/Settings/components/OrderingSection.tsx
import { type UseFormReturn } from 'react-hook-form';
import { type SettingsFormValues } from '../lib/settingsSchema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ShoppingBag, ReceiptCent } from 'lucide-react';

export function OrderingSection({
  form,
}: {
  form: UseFormReturn<SettingsFormValues>;
}) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Ordering & Payment
        </CardTitle>
        <CardDescription>Control taxes and service flows</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-8 md:grid-cols-2 px-0">
        {/* Left Column: Sliders */}
        <div className="space-y-8 p-6 rounded-xl border bg-slate-50/50">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ReceiptCent className="h-4 w-4" /> Rates & Fees
          </h3>

          <FormField
            control={form.control}
            name="taxRate"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex justify-between">
                  <FormLabel>Tax Rate</FormLabel>
                  <span className="text-xs font-bold text-primary">
                    {field.value}%
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={0}
                    max={25}
                    step={0.1}
                    value={[field.value]}
                    onValueChange={([v]) => field.onChange(v)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceCharge"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex justify-between">
                  <FormLabel>Service Charge</FormLabel>
                  <span className="text-xs font-bold text-primary">
                    {field.value}%
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={0}
                    max={20}
                    step={0.5}
                    value={[field.value]}
                    onValueChange={([v]) => field.onChange(v)}
                  />
                </FormControl>
                <FormDescription className="text-[10px]">
                  Applied to all subtotal amounts before tax.
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* Right Column: Toggles (FIXED) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold px-1">Order Channels</h3>
          {[
            { id: 'onlineOrderingEnabled', label: 'Online Ordering' },
            { id: 'deliveryEnabled', label: 'Delivery' },
            { id: 'pickupEnabled', label: 'Self Pickup' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={form.control}
              name={item.id as any}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 p-4 rounded-lg border bg-white shadow-sm">
                  <FormLabel className="font-medium cursor-pointer">
                    {item.label}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
