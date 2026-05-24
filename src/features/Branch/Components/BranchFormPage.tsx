import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  MapPin,
  Phone,
  Info,
  CheckCircle2,
  Navigation,
  Crosshair,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import { toast } from 'sonner';
import {
  useCreateBranchMutation,
  useUpdateBranchMutation,
} from '../../../api/Queries/branchQueries';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  city: z.string().min(1, 'City is required'),
  subCity: z.string().optional(),
  specificArea: z.string().optional(),
  building: z.string().optional(),
  // Added Coordinates for GPS
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().default(true),
  isMain: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface BranchFormPageProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const BranchFormPage: React.FC<BranchFormPageProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const isEdit = !!initialData;
  const createMutation = useCreateBranchMutation();
  const updateMutation = useUpdateBranchMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      city: initialData?.location?.city || '',
      subCity: initialData?.location?.subCity || '',
      specificArea: initialData?.location?.specificArea || '',
      building: initialData?.location?.building || '',
      latitude: initialData?.location?.coordinates?.[1], // GeoJSON format usually [lng, lat]
      longitude: initialData?.location?.coordinates?.[0],
      isActive: initialData?.isActive ?? true,
      isMain: initialData?.isMain ?? false,
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser');
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('latitude', position.coords.latitude);
        form.setValue('longitude', position.coords.longitude);
        setIsLocating(false);
        toast.success('Location captured from GPS');
      },
      (error) => {
        setIsLocating(false);
        toast.error('Could not get location. Please ensure GPS is enabled.');
        console.error(error);
      },
      { enableHighAccuracy: true }
    );
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        location: {
          city: values.city,
          subCity: values.subCity,
          specificArea: values.specificArea,
          building: values.building,
          // Format for MongoDB GeoJSON: [longitude, latitude]
          coordinates:
            values.longitude && values.latitude
              ? [values.longitude, values.latitude]
              : undefined,
          type: 'Point',
        },
      };
      console.log('Payload ' + payload);
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialData._id,
          input: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative flex flex-col h-full overflow-hidden"
      >
        <div className="flex-1 space-y-8 pb-28 overflow-y-auto px-1">
          {/* Section 1: Core Identity */}
          <section className="space-y-4 pt-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
              <Building2 className="h-4 w-4" />
              General Details
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                      Branch Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Bole Medhanialem"
                        className="h-11 bg-slate-50 border-slate-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                      Phone Number *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="+251 ..."
                          className="pl-10 h-11 bg-slate-50 border-slate-200"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Section 2: Address & GPS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <MapPin className="h-4 w-4" />
                Physical Address
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="h-8 text-[10px] font-bold uppercase bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
              >
                {isLocating ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Crosshair className="mr-2 h-3 w-3" />
                )}
                {isLocating ? 'Locating...' : 'Auto-Capture GPS'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                      City *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Addis Ababa"
                        className="h-11 bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                      Sub-City
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Bole"
                        className="h-11 bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="col-span-2 grid grid-cols-2 gap-4 p-3 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-bold text-slate-400">
                        LATITUDE
                      </FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          placeholder="0.0000"
                          className="h-9 bg-white text-xs font-mono"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-bold text-slate-400">
                        LONGITUDE
                      </FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          placeholder="0.0000"
                          className="h-9 bg-white text-xs font-mono"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specificArea"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">
                      Specific Area
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Navigation className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Near Edna Mall"
                          className="pl-10 h-11 bg-slate-50"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Section 3: Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
              <Info className="h-4 w-4" />
              Settings
            </div>
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-slate-50/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold">
                        Operational
                      </FormLabel>
                      <FormDescription className="text-[11px]">
                        Allow sales at this location
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

              <FormField
                control={form.control}
                name="isMain"
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-4 transition-colors',
                      field.value
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-slate-50/50'
                    )}
                  >
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-primary">
                        Global HQ
                      </FormLabel>
                      <FormDescription className="text-[11px]">
                        Primary business branch
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={initialData?.isMain}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 z-30">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onCancel}
          >
            Discard
          </Button>
          <Button type="submit" className="flex-[2] font-bold">
            {isEdit ? 'Save Changes' : 'Register Branch'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BranchFormPage;
