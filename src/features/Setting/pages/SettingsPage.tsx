import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Store,
  Palette,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Hooks & Types
import {
  useMyMerchantQuery,
  useUpdateMeMutation,
} from '@/api/Queries/merchantQueries';
import { ProfileSection } from '../Components/ProfileSection';
import { BrandingSection } from '../Components/BrandingSection';
import {
  formSchema,
  type SettingsFormValues,
  defaultValues,
} from '../lib/settingsSchema';

const STEPS = [
  {
    id: 'profile',
    title: 'Business',
    icon: Store,
    component: ProfileSection,
  },
  {
    id: 'details',
    title: 'Location & Owner',
    icon: MapPin,
    component: ProfileSection,
  },
  {
    id: 'branding',
    title: 'Branding',
    icon: Palette,
    component: BrandingSection,
  },
];

export default function SettingsPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const { data: merchant, isLoading: isFetching } = useMyMerchantQuery();
  const { mutateAsync: updateMe } = useUpdateMeMutation();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
    mode: 'onChange',
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (merchant) {
      form.reset({
        ...defaultValues,
        businessName: merchant.businessName || '',
        slug: merchant.slug || '',
        sector: (merchant as any).sector || 'Restaurant',
        logo: merchant.logo ? { url: merchant.logo } : null,
        brandColor: (merchant as any).brandColor || '#1A1A2E',
        owner: {
          fullName: merchant.owner?.fullName || '',
          gender: merchant.owner?.gender || 'Male',
          phone: merchant.owner?.phone || '',
          email: merchant.owner?.email || '',
        },
        tinId: merchant.tinId || '',
        licenseNumber: merchant.licenseNumber || '',
        tradeLicense: merchant.tradeLicense?.url
          ? { url: merchant.tradeLicense.url }
          : null,
        location: {
          city: merchant.location?.city || 'Addis Ababa',
          subcity: merchant.location?.subcity || '',
          address: merchant.location?.address || '',
        },
      });
      setTimeout(() => form.trigger(), 100);
    }
  }, [merchant, form]);

  const ActiveStepComponent = STEPS[currentStep].component;

  const nextStep = async () => {
    const fields = getFieldsForStep(STEPS[currentStep].id);
    const isStepValid = await form.trigger(fields as any);

    if (isStepValid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      const formData = new FormData();
      formData.append('businessName', data.businessName);
      formData.append('slug', data.slug);
      formData.append('sector', data.sector);
      formData.append('brandColor', data.brandColor || '#1A1A2E');

      if (data.taxRate) formData.append('taxRate', data.taxRate.toString());
      if (data.tinId) formData.append('tinId', data.tinId);
      formData.append('licenseNumber', data.licenseNumber || '');

      if (data.tradeLicense?.file instanceof File) {
        formData.append('tradeLicense', data.tradeLicense.file);
      }
      if (data.logo?.file instanceof File) {
        formData.append('logo', data.logo.file);
      }

      formData.append('owner[fullName]', data.owner.fullName);
      formData.append('owner[gender]', data.owner.gender);
      formData.append('owner[phone]', data.owner.phone);
      formData.append('owner[email]', data.owner.email);
      formData.append('location[address]', data.location.address);
      formData.append('location[city]', data.location.city);

      if (data.location.subcity)
        formData.append('location[subcity]', data.location.subcity);

      await updateMe(formData);
      toast.success('Settings Synced');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Update failed.');
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading preferences...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold leading-none">Settings</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">
                Merchant Suite
              </p>
            </div>
          </div>

          <nav className="hidden md:flex flex-1 justify-center max-w-2xl px-8">
            <ol className="flex items-center w-full gap-2">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                const isLastStep = idx === STEPS.length - 1;

                return (
                  <li
                    key={step.id}
                    className={cn('flex items-center', !isLastStep && 'flex-1')}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300',
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : isActive
                              ? 'border-primary text-primary ring-4 ring-primary/10'
                              : 'border-muted text-muted-foreground'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold whitespace-nowrap transition-colors duration-300 hidden lg:block',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {!isLastStep && (
                      <div className="flex-1 mx-3 h-[1px] bg-border" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Step
              </span>
              <span className="text-xs font-bold text-primary">
                {currentStep + 1} / {STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-8 md:py-12 ">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {STEPS[currentStep].title}
          </h2>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden ">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col"
            >
              <div className=" md:p-10 min-h-[400px]">
                <ActiveStepComponent
                  form={form}
                  stepId={STEPS[currentStep].id}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="flex items-center gap-3">
                  {currentStep === STEPS.length - 1 ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Finish
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="min-w-[120px]"
                    >
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

// Updated field mapping: 'details' now triggers validation for both location and owner
function getFieldsForStep(stepId: string) {
  switch (stepId) {
    case 'profile':
      return [
        'businessName',
        'slug',
        'sector',
        'tinId',
        'licenseNumber',
        'tradeLicense',
      ];
    case 'details':
      return [
        'location.city',
        'location.subcity',
        'location.address',
        'owner.fullName',
        'owner.gender',
        'owner.phone',
        'owner.email',
      ];
    case 'branding':
      return ['brandColor', 'logo'];
    case 'ordering':
      return ['taxRate', 'onlineOrderingEnabled'];
    case 'qr':
      return ['qrStyle', 'qrLogoEnabled', 'showTableNumberOnQR'];
    default:
      return [];
  }
}
