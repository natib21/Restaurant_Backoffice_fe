// src/features/Settings/components/BrandingSection.tsx
import { useRef } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, ImageIcon, X, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function BrandingSection({ form }: { form: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: any) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ url: reader.result as string, file: file });
      };
      reader.readAsDataURL(file);
    }
  };

  // Predefined brand colors for quick selection
  const PRESETS = [
    '#1A1A2E',
    '#E63946',
    '#F1FAEE',
    '#A8DADC',
    '#457B9D',
    '#1D3557',
    '#FFB703',
  ];

  return (
    <div className="max-w-2xl space-y-10 animate-in fade-in duration-500">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
          <Palette className="h-5 w-5 text-primary" /> Visual Identity
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Define your brand's presence on the platform.
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. Brand Color with Picker */}
        <FormField
          control={form.control}
          name="brandColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">
                Brand Accent Color
              </FormLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <FormControl>
                  <div className="flex items-center gap-2">
                    {/* The Color Picker Trigger */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-12 h-10 p-1 shrink-0 border-2"
                          style={{ borderColor: field.value }}
                        >
                          <div
                            className="w-full h-full rounded-sm shadow-inner"
                            style={{ backgroundColor: field.value }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3">
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Preset Colors
                          </p>
                          <div className="grid grid-cols-7 gap-2">
                            {PRESETS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className="h-6 w-6 rounded-md border border-black/10 transition-transform hover:scale-110 active:scale-90"
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                              />
                            ))}
                          </div>
                          <div className="relative flex items-center gap-2 pt-2 border-t">
                            <Pipette className="h-3 w-3 text-muted-foreground" />
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="w-full h-8 cursor-pointer bg-transparent border-none"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Input
                      {...field}
                      placeholder="#000000"
                      className="font-mono uppercase w-32 h-10"
                      maxLength={7}
                    />
                  </div>
                </FormControl>
              </div>
              <FormDescription>
                This color will be used for buttons and highlights.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. Logo Upload */}
        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <Label className="font-semibold mb-3 block">Business Logo</Label>
              <FormControl>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleImageChange(e, field.onChange)}
                  />

                  {field.value?.url ? (
                    <div className="relative w-40 h-40 rounded-xl border-2 border-dashed bg-muted/10 flex items-center justify-center overflow-hidden group transition-all">
                      <img
                        src={field.value.url}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => field.onChange(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Upload Business Logo</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended square 300x300px
                      </p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 3. Cover Image Upload */}
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <Label className="font-semibold mb-3 block">Cover Banner Image</Label>
              <FormControl>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      if (el) (window as any)._coverInput = el;
                    }}
                    onChange={(e) => handleImageChange(e, field.onChange)}
                  />

                  {field.value?.url ? (
                    <div className="relative w-full h-40 rounded-xl border-2 border-dashed bg-muted/10 flex items-center justify-center overflow-hidden group transition-all">
                      <img
                        src={field.value.url}
                        alt="Cover banner preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => (window as any)._coverInput?.click()}
                        >
                          Change Cover
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => field.onChange(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => (window as any)._coverInput?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Upload Cover Banner</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended 1200x400px landscape image
                      </p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
