import { type UseFormReturn } from 'react-hook-form';
import { type SettingsFormValues } from '../lib/settingsSchema';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  User,
  Building2,
  MapPin,
  Globe,
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  form: UseFormReturn<SettingsFormValues>;
  stepId?: string;
}

export function ProfileSection({ form, stepId }: ProfileSectionProps) {
  return (
    <div className="space-y-4 md:space-y-6 ">
      {(stepId === 'profile' || !stepId) && (
        <>
          <Card className="transition-all duration-300 border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg md:text-xl">
                  Merchant Information
                </CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">
                Basic details about your business identity
              </CardDescription>
            </CardHeader>
            {/* grid-cols-1 for mobile, md:grid-cols-2 for desktop */}
            <CardContent className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 p-4 md:p-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tiru Cafe & Restaurant"
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug (Read-only)</FormLabel>
                    <FormControl>
                      <div className="flex shadow-sm rounded-md overflow-hidden bg-slate-100">
                        <span className="inline-flex items-center border border-r-0 bg-slate-200 px-2 md:px-3 text-[10px] md:text-xs text-slate-600 font-mono whitespace-nowrap">
                          menuroom.et/
                        </span>
                        <Input
                          className="rounded-l-none bg-slate-100 font-mono text-xs cursor-not-allowed"
                          readOnly
                          disabled
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-slate-500 mt-1">Drives public QR code & web routing. Fixed once provisioned.</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          'Cafe',
                          'Restaurant',
                          'Hotel',
                          'Food Truck',
                          'Bakery',
                          'Other',
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+2519..."
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 border-l-4 border-l-amber-500 bg-primary/5 dark:bg-amber-950/5 shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg md:text-xl">
                  Legal & Verification
                </CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">
                Official documents for compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 p-4 md:p-6">
              <FormField
                control={form.control}
                name="tinId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" /> TIN Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="10-digit Tax ID"
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" /> License Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="MT/AA/1/..."
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeLicense"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Trade License Document</FormLabel>
                    <FormControl>
                      <div
                        className={cn(
                          'relative border-2 border-dashed rounded-lg p-4 md:p-8 transition-all',
                          field.value?.url
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-muted-foreground/25 hover:border-amber-500/50'
                        )}
                      >
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              field.onChange({
                                file,
                                url: URL.createObjectURL(file),
                              });
                          }}
                        />
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                          {field.value?.url ? (
                            <div className="space-y-3">
                              <div className="relative mx-auto h-24 w-36 md:h-32 md:w-48 overflow-hidden rounded-md border bg-background">
                                <img
                                  src={field.value.url}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute top-1 right-1 bg-amber-600 text-white rounded-full p-0.5 md:p-1">
                                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                </div>
                              </div>
                              <p className="text-[10px] md:text-xs font-medium text-amber-700">
                                Change document
                              </p>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground mb-1" />
                              <p className="text-xs md:text-sm font-semibold">
                                Upload License
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* --- STEP 2: COMBINED LOCATION & OWNER --- */}
      {stepId === 'details' && (
        <>
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg md:text-xl">
                  Location Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 p-4 md:p-6">
              <FormField
                control={form.control}
                name="location.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" /> City
                    </FormLabel>
                    <Input {...field} readOnly className="bg-muted text-sm" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.subcity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcity *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-background text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Bole',
                          'Kirkos',
                          'Arada',
                          'Yeka',
                          'Nifas Silk',
                          'Lideta',
                        ].map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address *</FormLabel>
                    <Input
                      placeholder="Bole Atlas, Bldg 402"
                      {...field}
                      className="text-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary bg-primary/5 shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg md:text-xl">Owner Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 p-4 md:p-6">
              <FormField
                control={form.control}
                name="owner.fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <Input
                      placeholder="Abebe Bikila"
                      {...field}
                      className="text-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <Input
                      type="email"
                      placeholder="owner@email.com"
                      {...field}
                      className="text-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner.gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-background text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <Input
                      placeholder="+2517..."
                      {...field}
                      className="text-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
