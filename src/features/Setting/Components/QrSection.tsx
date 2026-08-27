// src/features/Settings/components/QrSection.tsx
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
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { QrCode, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QrSection({
  form,
}: {
  form: UseFormReturn<SettingsFormValues>;
}) {
  const tipOptions = [5, 10, 15, 20];
  const selectedTips = form.watch('tipOptions') || [];
  const isTipsEnabled = form.watch('tipsEnabled');

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          QR & Tipping
        </CardTitle>
        <CardDescription>
          Configure the customer checkout experience via QR code.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 px-0">
        {/* Fixed: Wrapped inside FormField/FormItem to resolve context error */}
        <FormField
          control={form.control}
          name="tipsEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-white shadow-sm transition-all">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-semibold cursor-pointer">
                  Enable Tipping
                </FormLabel>
                <FormDescription className="text-xs">
                  Give customers the option to leave a tip during checkout.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isTipsEnabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Quick Tip Percentages
            </div>

            <div className="flex flex-wrap gap-3">
              {tipOptions.map((pct) => {
                const isSelected = selectedTips.includes(pct);
                return (
                  <Badge
                    key={pct}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'h-12 px-6 rounded-full cursor-pointer text-sm font-bold transition-all active:scale-95 select-none',
                      isSelected
                        ? 'bg-primary shadow-md shadow-primary/20'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => {
                      const next = isSelected
                        ? selectedTips.filter((t) => t !== pct)
                        : [...selectedTips, pct];
                      form.setValue('tipOptions', next, {
                        shouldValidate: true,
                      });
                    }}
                  >
                    {pct}%
                  </Badge>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Selected values will appear as quick-action buttons for your
              customers.
            </p>
          </div>
        )}
      </CardContent>
      {/* Note: Save button removed here as it is handled by the SettingsPage layout */}
    </Card>
  );
}
