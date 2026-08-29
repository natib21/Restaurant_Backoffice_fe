import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Store,
  MapPin,
  Contact,
  Clock,
  Save,
  Loader2,
  Upload,
  Camera,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  Globe,
  Percent,
  QrCode,
  Volume2,
  Utensils,
  Navigation,
  RefreshCw,
  X,
  Palette,
  ShieldCheck,
  Check,
  HelpCircle,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import { useMyMerchantQuery, useUpdateMeMutation } from '@/api/Queries/merchantQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface BusinessHourDay {
  enabled: boolean;
  open: string;
  close: string;
}

const defaultHours: Record<string, BusinessHourDay> = {
  Mon: { enabled: true, open: '08:00', close: '22:00' },
  Tue: { enabled: true, open: '08:00', close: '22:00' },
  Wed: { enabled: true, open: '08:00', close: '22:00' },
  Thu: { enabled: true, open: '08:00', close: '22:00' },
  Fri: { enabled: true, open: '08:00', close: '23:00' },
  Sat: { enabled: true, open: '09:00', close: '23:00' },
  Sun: { enabled: true, open: '09:00', close: '22:00' },
};

const SECTOR_OPTIONS = [
  'Restaurant',
  'Cafe',
  'Hotel',
  'Food Truck',
  'Ghost Kitchen',
  'Bakery',
  'Other',
];

const PRESET_CUISINES = [
  'Ethiopian',
  'Continental',
  'Italian',
  'Traditional',
  'Fast Food',
  'Bakery',
  'Coffee & Tea',
  'Barbecue',
  'Pizza',
  'Vegetarian',
];

export const MerchantProfilePage: React.FC = () => {
  const { data: merchant, isLoading, refetch } = useMyMerchantQuery();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMeMutation();

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('business');

  // Business Information state
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [sector, setSector] = useState('Restaurant');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [newCuisine, setNewCuisine] = useState('');
  const [brandColor, setBrandColor] = useState('#2170E4');
  const [phone, setPhone] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tinId, setTinId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Location state
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [subcity, setSubcity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Ethiopia');

  // Owner state
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerGender, setOwnerGender] = useState<'Male' | 'Female'>('Female');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Operating Hours
  const [hours, setHours] = useState<Record<string, BusinessHourDay>>(defaultHours);

  // Logo & Cover file uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [requireWaiterConfirmation, setRequireWaiterConfirmation] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);

  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');
  const [taxRate, setTaxRate] = useState(15);
  const [serviceCharge, setServiceCharge] = useState(0);

  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [allowCustomTip, setAllowCustomTip] = useState(true);
  const [tipOptionsStr, setTipOptionsStr] = useState('10, 15, 20');

  const [language, setLanguage] = useState<'en' | 'am' | 'both'>('both');
  const [defaultLanguage, setDefaultLanguage] = useState<'en' | 'am'>('am');

  const [showTableNumberOnQR, setShowTableNumberOnQR] = useState(true);
  const [qrStyle, setQrStyle] = useState<'classic' | 'modern' | 'rounded' | 'dots'>('modern');
  const [qrLogoEnabled, setQrLogoEnabled] = useState(true);
  const [qrForegroundColor, setQrForegroundColor] = useState('#000000');
  const [qrBackgroundColor, setQrBackgroundColor] = useState('#FFFFFF');

  const [orderSoundEnabled, setOrderSoundEnabled] = useState(true);
  const [newOrderSound, setNewOrderSound] = useState('default');
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Synchronize state with loaded merchant profile
  useEffect(() => {
    if (merchant) {
      setBusinessName(merchant.businessName || '');
      setLegalName((merchant as any).legalName || merchant.businessName || '');
      setSector((merchant.sector as string) || 'Restaurant');
      setCuisines(Array.isArray(merchant.cuisineType) ? merchant.cuisineType : ['Ethiopian']);
      setBrandColor(merchant.brandColor || '#2170E4');
      setPhone(merchant.phone || merchant.owner?.phone || '');
      setPublicEmail((merchant as any).email || merchant.owner?.email || '');
      setWebsiteUrl((merchant as any).websiteUrl || '');
      setDescription((merchant as any).description || '');
      setTinId(merchant.tinId || (merchant as any).taxId || '');
      setLicenseNumber(
        merchant.tradeLicense?.licenseNumber ||
          (merchant as any).licenseNumber ||
          ''
      );

      // Location
      const loc = merchant.location || { address: '', city: '', subcity: '' };
      setStreetAddress(loc.address || merchant.address || '');
      setCity(loc.city || 'Addis Ababa');
      setSubcity(loc.subcity || '');
      setPostalCode((merchant as any).postalCode || '');
      setCountry((merchant as any).country || 'Ethiopia');

      // Owner
      if (merchant.owner) {
        setOwnerFullName(merchant.owner.fullName || merchant.ownerName || '');
        setOwnerGender(merchant.owner.gender === 'Male' ? 'Male' : 'Female');
        setOwnerPhone(merchant.owner.phone || '');
        setOwnerEmail(merchant.owner.email || '');
      }

      // Images
      const currentLogoUrl =
        typeof merchant.logo === 'object' && merchant.logo !== null
          ? merchant.logo.url
          : typeof merchant.logo === 'string'
          ? merchant.logo
          : null;
      setLogoPreview(currentLogoUrl);

      const currentCoverUrl =
        typeof merchant.coverImage === 'object' && merchant.coverImage !== null
          ? merchant.coverImage.url
          : typeof merchant.coverImage === 'string'
          ? merchant.coverImage
          : null;
      setCoverPreview(currentCoverUrl);

      // Hours
      const savedHours =
        merchant.settings?.businessHours || (merchant as any).businessHours;
      if (savedHours) {
        setHours(savedHours);
      }

      // Settings
      if (merchant.settings) {
        const s = merchant.settings;
        if (s.onlineOrderingEnabled !== undefined) setOnlineOrderingEnabled(s.onlineOrderingEnabled);
        if (s.deliveryEnabled !== undefined) setDeliveryEnabled(s.deliveryEnabled);
        if (s.pickupEnabled !== undefined) setPickupEnabled(s.pickupEnabled);
        if (s.autoAcceptOrders !== undefined) setAutoAcceptOrders(s.autoAcceptOrders);
        if (s.requireWaiterConfirmation !== undefined) setRequireWaiterConfirmation(s.requireWaiterConfirmation);
        if (s.prepTimeMinutes !== undefined) setPrepTimeMinutes(s.prepTimeMinutes);

        if (s.currency) setCurrency(s.currency as 'ETB' | 'USD');
        if (s.taxRate !== undefined) setTaxRate(s.taxRate);
        if (s.serviceCharge !== undefined) setServiceCharge(s.serviceCharge);

        if (s.tipsEnabled !== undefined) setTipsEnabled(s.tipsEnabled);
        if (s.allowCustomTip !== undefined) setAllowCustomTip(s.allowCustomTip);
        if (Array.isArray(s.tipOptions)) setTipOptionsStr(s.tipOptions.join(', '));

        if (s.language) setLanguage(s.language as 'en' | 'am' | 'both');
        if (s.defaultLanguage) setDefaultLanguage(s.defaultLanguage as 'en' | 'am');

        if (s.showTableNumberOnQR !== undefined) setShowTableNumberOnQR(s.showTableNumberOnQR);
        if (s.qrStyle) setQrStyle(s.qrStyle as any);
        if (s.qrLogoEnabled !== undefined) setQrLogoEnabled(s.qrLogoEnabled);
        if (s.qrForegroundColor) setQrForegroundColor(s.qrForegroundColor);
        if (s.qrBackgroundColor) setQrBackgroundColor(s.qrBackgroundColor);

        if (s.notifications) {
          if (s.notifications.orderSoundEnabled !== undefined) setOrderSoundEnabled(s.notifications.orderSoundEnabled);
          if (s.notifications.newOrderSound) setNewOrderSound(s.notifications.newOrderSound);
          if (s.notifications.smsNotifications !== undefined) setSmsNotifications(s.notifications.smsNotifications);
          if (s.notifications.emailNotifications !== undefined) setEmailNotifications(s.notifications.emailNotifications);
        }
      }
    }
  }, [merchant]);

  // Cuisine handlers
  const toggleCuisine = (cuisine: string) => {
    if (cuisines.includes(cuisine)) {
      setCuisines(cuisines.filter((c) => c !== cuisine));
    } else {
      setCuisines([...cuisines, cuisine]);
    }
  };

  const handleAddCustomCuisine = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCuisine.trim()) {
      e.preventDefault();
      if (!cuisines.includes(newCuisine.trim())) {
        setCuisines([...cuisines, newCuisine.trim()]);
      }
      setNewCuisine('');
    }
  };

  // Logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.info('Logo selected. Click "Upload Logo" or "Save Changes" to save.');
  };

  // Cover image file selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be less than 5MB');
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.info('Cover image selected. Click "Upload Cover" or "Save Changes" to save.');
  };

  // Direct single upload for logo
  const handleUploadLogoOnly = async () => {
    if (!logoFile) {
      logoInputRef.current?.click();
      return;
    }
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      await updateMe(formData);
      setLogoFile(null);
      toast.success('Restaurant logo uploaded successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Direct single upload for cover image
  const handleUploadCoverOnly = async () => {
    if (!coverFile) {
      coverInputRef.current?.click();
      return;
    }
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('coverImage', coverFile);
      await updateMe(formData);
      setCoverFile(null);
      toast.success('Cover image uploaded successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload cover image');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Hours toggle and update
  const toggleDay = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day]?.enabled },
    }));
  };

  const updateTime = (day: string, field: 'open' | 'close', value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // Parse tip options from string input
  const parseTipOptions = (): number[] => {
    return tipOptionsStr
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0 && n <= 100);
  };

  // Consolidated Save All (Handles Business Information, Images, and Settings)
  const handleSaveAll = async () => {
    try {
      if (!businessName.trim()) {
        toast.error('Business name is required');
        return;
      }

      // Prepare settings payload
      const settingsPayload = {
        showTableNumberOnQR,
        qrStyle,
        qrLogoEnabled,
        qrForegroundColor,
        qrBackgroundColor,
        tipsEnabled,
        tipOptions: parseTipOptions(),
        allowCustomTip,
        language,
        defaultLanguage,
        notifications: {
          orderSoundEnabled,
          newOrderSound,
          smsNotifications,
          emailNotifications,
        },
        currency,
        taxRate: Number(taxRate) || 0,
        serviceCharge: Number(serviceCharge) || 0,
        onlineOrderingEnabled,
        deliveryEnabled,
        pickupEnabled,
        autoAcceptOrders,
        requireWaiterConfirmation,
        prepTimeMinutes: Number(prepTimeMinutes) || 15,
        businessHours: hours,
      };

      if (logoFile || coverFile) {
        // Send multipart form data if images are queued
        const formData = new FormData();
        formData.append('businessName', businessName.trim());
        formData.append('phone', phone.trim());
        formData.append('sector', sector);
        formData.append('cuisineType', JSON.stringify(cuisines));
        formData.append('brandColor', brandColor);

        // Location
        formData.append('location[address]', streetAddress.trim());
        formData.append('location[city]', city.trim());
        formData.append('location[subcity]', subcity.trim());

        // Owner
        formData.append('owner[fullName]', ownerFullName.trim());
        formData.append('owner[gender]', ownerGender);
        formData.append('owner[phone]', ownerPhone.trim());
        formData.append('owner[email]', ownerEmail.trim());

        // Legal
        if (tinId.trim()) formData.append('tinId', tinId.trim());
        if (licenseNumber.trim()) {
          formData.append('tradeLicense[licenseNumber]', licenseNumber.trim());
        }

        // Settings
        formData.append('settings', JSON.stringify(settingsPayload));

        // Images
        if (logoFile) formData.append('logo', logoFile);
        if (coverFile) formData.append('coverImage', coverFile);

        await updateMe(formData);
        setLogoFile(null);
        setCoverFile(null);
      } else {
        // Send standard JSON
        const jsonPayload = {
          businessName: businessName.trim(),
          phone: phone.trim(),
          sector,
          cuisineType: cuisines,
          brandColor,
          location: {
            address: streetAddress.trim(),
            city: city.trim(),
            subcity: subcity.trim(),
          },
          owner: {
            fullName: ownerFullName.trim(),
            gender: ownerGender,
            phone: ownerPhone.trim(),
            email: ownerEmail.trim(),
          },
          tinId: tinId.trim(),
          tradeLicense: {
            licenseNumber: licenseNumber.trim(),
          },
          settings: settingsPayload,
          legalName: legalName.trim(),
          websiteUrl: websiteUrl.trim(),
          description: description.trim(),
        };

        await updateMe(jsonPayload);
      }

      toast.success('Merchant profile and settings saved successfully');
      refetch();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save merchant settings';
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2170E4]" />
        <p className="text-xs text-slate-500 font-medium">Loading merchant profile...</p>
      </div>
    );
  }

  const activeLogo = logoPreview;
  const activeCover = coverPreview;

  return (
    <SettingPageLayout
      title="Merchant Profile & Settings"
      subtitle="Manage your restaurant profile, upload brand assets, and configure operational settings."
      breadcrumbs={[{ label: 'Merchant Profile' }]}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reload
          </Button>

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || isUploadingLogo || isUploadingCover}
            className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 font-semibold text-xs transition-all shadow-xs gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      }
    >
      {/* Hidden File Inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleLogoChange}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleCoverChange}
      />

      {/* Header Profile Card with Cover & Logo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-gradient-to-r from-slate-800 via-blue-900 to-slate-900 overflow-hidden group">
          {activeCover ? (
            <img
              src={activeCover}
              alt="Restaurant Cover"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800/80">
              <ImageIcon className="h-10 w-10 text-slate-500 mb-1" />
              <span className="text-xs font-medium">No cover image uploaded</span>
            </div>
          )}

          {/* Cover Overlay Action */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {coverFile && (
              <Button
                type="button"
                size="sm"
                onClick={handleUploadCoverOnly}
                disabled={isUploadingCover}
                className="bg-[#2170E4] hover:bg-blue-700 text-white text-xs font-semibold h-8 shadow-md"
              >
                {isUploadingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 mr-1" />
                )}
                Save Cover
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              className="bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-800 dark:text-slate-100 text-xs font-semibold backdrop-blur-sm shadow-md h-8 gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              {activeCover ? 'Change Cover' : 'Upload Cover'}
            </Button>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 sm:-mt-16 z-10">
            {/* Logo Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-md overflow-hidden flex items-center justify-center">
                {activeLogo ? (
                  <img
                    src={activeLogo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Store className="h-10 w-10 text-[#2170E4]" />
                  </div>
                )}
              </div>

              {/* Logo Upload Trigger */}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                title="Change Logo"
              >
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-semibold">Change</span>
              </button>
            </div>

            {/* Merchant Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {businessName || merchant?.businessName || 'Your Restaurant'}
                </h1>
                <Badge
                  variant={merchant?.status === 'approved' ? 'default' : 'secondary'}
                  className={
                    merchant?.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-semibold'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-semibold'
                  }
                >
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {merchant?.status ? merchant.status.toUpperCase() : 'ACTIVE'}
                </Badge>

                {merchant?.subscriptionPlan && (
                  <Badge variant="outline" className="text-xs uppercase font-semibold border-blue-200 text-[#2170E4] bg-blue-50/50 dark:bg-blue-950/30">
                    {merchant.subscriptionPlan} PLAN
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Utensils className="h-3.5 w-3.5 text-slate-400" />
                  {sector}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {[city, country].filter(Boolean).join(', ')}
                </span>
                {phone && (
                  <span className="flex items-center gap-1 font-mono">
                    {phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Logo Save if file chosen */}
          {logoFile && (
            <div className="flex items-center gap-2 z-10 pt-2 sm:pt-0">
              <span className="text-xs text-amber-600 font-medium">New logo selected</span>
              <Button
                type="button"
                size="sm"
                onClick={handleUploadLogoOnly}
                disabled={isUploadingLogo}
                className="bg-[#2170E4] hover:bg-blue-700 text-white text-xs h-8"
              >
                {isUploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                Upload Logo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Layout for Seamless Configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl grid grid-cols-3 w-full max-w-md shadow-xs">
          <TabsTrigger
            value="business"
            className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2170E4] data-[state=active]:text-white transition-all py-2"
          >
            <Store className="h-3.5 w-3.5 mr-1.5" />
            Business Info
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2170E4] data-[state=active]:text-white transition-all py-2"
          >
            <Sliders className="h-3.5 w-3.5 mr-1.5" />
            Operations & Settings
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2170E4] data-[state=active]:text-white transition-all py-2"
          >
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
            Logo & Branding
          </TabsTrigger>
        </TabsList>

        {/* =========================================================
            TAB 1: Business Information
        ========================================================= */}
        <TabsContent value="business" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Business Information */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <Store className="h-5 w-5 text-[#2170E4]" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      General Business Information
                    </h2>
                    <p className="text-xs text-slate-500">
                      Primary trading identity, sector, cuisines, and registration credentials.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Business / Trading Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Yeshi's Restaurant & Cafe"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Legal Entity Name
                    </label>
                    <Input
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="e.g. Yeshi Hospitality PLC"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Business Sector
                    </label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                    >
                      {SECTOR_OPTIONS.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Taxpayer Identification (TIN ID - 10 Digits)
                    </label>
                    <Input
                      value={tinId}
                      onChange={(e) => setTinId(e.target.value)}
                      placeholder="e.g. 0012345678"
                      className="h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Trade License Number
                    </label>
                    <Input
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. AA-12345-2024"
                      className="h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Public Contact Phone
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +251911234567"
                      className="h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Public Email
                    </label>
                    <Input
                      type="email"
                      value={publicEmail}
                      onChange={(e) => setPublicEmail(e.target.value)}
                      placeholder="e.g. contact@yeshisrestaurant.com"
                      className="h-9"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Website URL
                    </label>
                    <Input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://www.yeshisrestaurant.com"
                      className="h-9"
                    />
                  </div>

                  {/* Cuisine Types Tag Selector */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Cuisine Specialties
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_CUISINES.map((cuisine) => {
                        const isSelected = cuisines.includes(cuisine);
                        return (
                          <button
                            key={cuisine}
                            type="button"
                            onClick={() => toggleCuisine(cuisine)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-[#2170E4] text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {cuisine}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={newCuisine}
                        onChange={(e) => setNewCuisine(e.target.value)}
                        onKeyDown={handleAddCustomCuisine}
                        placeholder="Add custom cuisine (press Enter)..."
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (newCuisine.trim() && !cuisines.includes(newCuisine.trim())) {
                            setCuisines([...cuisines, newCuisine.trim()]);
                            setNewCuisine('');
                          }
                        }}
                        className="h-8 text-xs font-semibold shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Brand Color Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-9 w-10 p-0.5 rounded border border-input cursor-pointer bg-background shrink-0"
                      />
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#2170E4"
                        className="h-9 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Restaurant Description (Max 200 characters)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                      rows={3}
                      placeholder="Share a brief overview of your restaurant atmosphere, dining specialties, and guest experiences..."
                      className="w-full p-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4] resize-none"
                    />
                    <div className="text-right text-[11px] text-slate-400 mt-1">
                      {description.length}/200
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <MapPin className="h-5 w-5 text-[#2170E4]" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Physical Location & Address
                    </h2>
                    <p className="text-xs text-slate-500">
                      Physical restaurant premises used for maps, deliveries, and table QR codes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Street Address / Landmarks
                    </label>
                    <Input
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Bole Road, near Mexican Embassy"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Addis Ababa"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subcity / District
                    </label>
                    <Input
                      value={subcity}
                      onChange={(e) => setSubcity(e.target.value)}
                      placeholder="e.g. Bole"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Postal Code
                    </label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 1000"
                      className="h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                    >
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Kenya">Kenya</option>
                      <option value="UAE">United Arab Emirates</option>
                    </select>
                  </div>
                </div>

                {/* Location Preview Card */}
                <div className="mt-5 p-4 rounded-lg bg-blue-50/50 dark:bg-slate-950 border border-blue-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#2170E4] text-white flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {streetAddress || 'No street address set'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {[subcity, city, country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success('Address coordinates verified')}
                    className="text-xs text-[#2170E4] hover:text-blue-700 font-semibold gap-1"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Calibrate Pin
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-6">
              {/* Owner Information */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                  <Contact className="h-5 w-5 text-[#2170E4]" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Owner & Principal
                    </h2>
                    <p className="text-xs text-slate-500">
                      Authorized primary legal contact.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <Input
                      value={ownerFullName}
                      onChange={(e) => setOwnerFullName(e.target.value)}
                      placeholder="e.g. Yeshi Bekele"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={ownerGender}
                      onChange={(e) => setOwnerGender(e.target.value as any)}
                      className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Phone
                    </label>
                    <Input
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="+251911234567"
                      className="h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Email
                    </label>
                    <Input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="yeshi@yeshisrestaurant.com"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <Clock className="h-5 w-5 text-[#2170E4]" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Operating Hours
                    </h2>
                    <p className="text-xs text-slate-500">
                      Standard service schedule.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(hours).map(([day, config]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={() => toggleDay(day)}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            config.enabled
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {day}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 transition-opacity ${
                          config.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'
                        }`}
                      >
                        <input
                          type="time"
                          value={config.open}
                          onChange={(e) => updateTime(day, 'open', e.target.value)}
                          className="h-7 px-1.5 rounded border border-input bg-background text-xs font-mono"
                        />
                        <span className="text-slate-400 text-xs">-</span>
                        <input
                          type="time"
                          value={config.close}
                          onChange={(e) => updateTime(day, 'close', e.target.value)}
                          className="h-7 px-1.5 rounded border border-input bg-background text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* =========================================================
            TAB 2: Operational Settings
        ========================================================= */}
        <TabsContent value="settings" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders & Fulfillment Operations */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Utensils className="h-5 w-5 text-[#2170E4]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Order Operations & Flow
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control dining channels, auto-accept logic, and prep expectations.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Online Ordering
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Allow customers to order from the web & QR digital menu
                    </p>
                  </div>
                  <Switch
                    checked={onlineOrderingEnabled}
                    onCheckedChange={setOnlineOrderingEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Pickup / Takeaway
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Permit self-collection pickup orders
                    </p>
                  </div>
                  <Switch
                    checked={pickupEnabled}
                    onCheckedChange={setPickupEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Home Delivery
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enable delivery options for customers
                    </p>
                  </div>
                  <Switch
                    checked={deliveryEnabled}
                    onCheckedChange={setDeliveryEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Auto-Accept Orders
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Automatically route new orders straight to kitchen
                    </p>
                  </div>
                  <Switch
                    checked={autoAcceptOrders}
                    onCheckedChange={setAutoAcceptOrders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Waiter Confirmation Required
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Table QR orders must be approved by floor staff
                    </p>
                  </div>
                  <Switch
                    checked={requireWaiterConfirmation}
                    onCheckedChange={setRequireWaiterConfirmation}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Kitchen Prep Time (Minutes: 5 - 180)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={5}
                      max={180}
                      value={prepTimeMinutes}
                      onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value) || 15)}
                      className="h-9 w-32 font-mono"
                    />
                    <span className="text-xs text-slate-500">minutes estimated time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing, Taxes & Currency */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Percent className="h-5 w-5 text-[#2170E4]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Currency, Taxes & Tips
                  </h3>
                  <p className="text-xs text-slate-500">
                    Financial rules, VAT rates, and tipping preferences.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operational Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'ETB' | 'USD')}
                    className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                  >
                    <option value="ETB">ETB (Ethiopian Birr - Br)</option>
                    <option value="USD">USD (United States Dollar - $)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      VAT / Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Service Charge (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                      className="h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Enable Customer Tipping
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Display gratuity options during checkout
                      </p>
                    </div>
                    <Switch
                      checked={tipsEnabled}
                      onCheckedChange={setTipsEnabled}
                    />
                  </div>

                  {tipsEnabled && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tip Percentage Options (Comma separated)
                        </label>
                        <Input
                          value={tipOptionsStr}
                          onChange={(e) => setTipOptionsStr(e.target.value)}
                          placeholder="10, 15, 20"
                          className="h-9 font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Allow Custom Tip Amount
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Let guests input an arbitrary tip
                          </p>
                        </div>
                        <Switch
                          checked={allowCustomTip}
                          onCheckedChange={setAllowCustomTip}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Menu Settings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <QrCode className="h-5 w-5 text-[#2170E4]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    QR Code & Table Presentation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Styling and layout rules for table and takeaway QR codes.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Show Table Number on QR
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Print designated table identifier directly on QR standee
                    </p>
                  </div>
                  <Switch
                    checked={showTableNumberOnQR}
                    onCheckedChange={setShowTableNumberOnQR}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    QR Code Visual Style
                  </label>
                  <select
                    value={qrStyle}
                    onChange={(e) => setQrStyle(e.target.value as any)}
                    className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                  >
                    <option value="modern">Modern (Smooth Corners)</option>
                    <option value="classic">Classic (Standard Square)</option>
                    <option value="rounded">Rounded (Circular Elements)</option>
                    <option value="dots">Dots (Pixelated Micro-matrix)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Center Logo in QR Code
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Overlay restaurant brand mark in the center of the QR
                    </p>
                  </div>
                  <Switch
                    checked={qrLogoEnabled}
                    onCheckedChange={setQrLogoEnabled}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Foreground Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrForegroundColor}
                        onChange={(e) => setQrForegroundColor(e.target.value)}
                        className="h-9 w-10 p-0.5 rounded border border-input cursor-pointer bg-background shrink-0"
                      />
                      <Input
                        value={qrForegroundColor}
                        onChange={(e) => setQrForegroundColor(e.target.value)}
                        className="h-9 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={qrBackgroundColor}
                        onChange={(e) => setQrBackgroundColor(e.target.value)}
                        className="h-9 w-10 p-0.5 rounded border border-input cursor-pointer bg-background shrink-0"
                      />
                      <Input
                        value={qrBackgroundColor}
                        onChange={(e) => setQrBackgroundColor(e.target.value)}
                        className="h-9 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Language & Notifications */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Globe className="h-5 w-5 text-[#2170E4]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Languages & Notification Alerts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Multilingual localization and manager alert preferences.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Menu Language Mode
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                    >
                      <option value="both">Both (English & Amharic)</option>
                      <option value="am">Amharic (አማርኛ)</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Default Initial Language
                    </label>
                    <select
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value as any)}
                      className="w-full h-9 px-3 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:border-[#2170E4] focus:ring-1 focus:ring-[#2170E4]"
                    >
                      <option value="am">Amharic (አማርኛ)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Order Chime Audio Alert
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Play sound notifications when new orders land on KDS/POS
                      </p>
                    </div>
                    <Switch
                      checked={orderSoundEnabled}
                      onCheckedChange={setOrderSoundEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Email Notifications
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Receive daily and shift summaries via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        SMS Urgent Alerts
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Receive text message for canceled or disputed orders
                      </p>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* =========================================================
            TAB 3: Logo & Cover Images
        ========================================================= */}
        <TabsContent value="media" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <Store className="h-5 w-5 text-[#2170E4]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Restaurant Logo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Square avatar used on digital receipts, QR standees, and headers.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 mb-4">
                  <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center mb-3">
                    {activeLogo ? (
                      <img
                        src={activeLogo}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Store className="h-12 w-12 text-slate-300" />
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recommended: 512 × 512px
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Maximum size: 2MB • JPEG, PNG, WebP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 text-xs font-semibold border-slate-300 dark:border-slate-700"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Select File
                </Button>

                <Button
                  type="button"
                  onClick={handleUploadLogoOnly}
                  disabled={!logoFile || isUploadingLogo}
                  className="flex-1 bg-[#2170E4] hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Cover Image Upload Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <ImageIcon className="h-5 w-5 text-[#2170E4]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cover Banner Image
                    </h3>
                    <p className="text-xs text-slate-500">
                      Landscape photo showcased as your customer menu hero banner.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 mb-4">
                  <div className="w-full h-32 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center mb-3">
                    {activeCover ? (
                      <img
                        src={activeCover}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-slate-300" />
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recommended: 1920 × 1080px (16:9)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Maximum size: 5MB • JPEG, PNG, WebP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex-1 text-xs font-semibold border-slate-300 dark:border-slate-700"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Select File
                </Button>

                <Button
                  type="button"
                  onClick={handleUploadCoverOnly}
                  disabled={!coverFile || isUploadingCover}
                  className="flex-1 bg-[#2170E4] hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload Cover
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HelpCircle className="h-4 w-4 text-slate-400" />
          <span>Any unsaved changes can be saved in a single batch.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold"
          >
            Discard
          </Button>

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || isUploadingLogo || isUploadingCover}
            className="bg-[#2170E4] hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 shadow-sm gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" /> Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </SettingPageLayout>
  );
};

export default MerchantProfilePage;
