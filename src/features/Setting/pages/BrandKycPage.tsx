import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  Image as ImageIcon,
  Palette,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  Utensils,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import { useMyMerchantQuery, useUpdateMeMutation } from '@/api/Queries/merchantQueries';

export const BrandKycPage: React.FC = () => {
  const { data: merchant, isLoading } = useMyMerchantQuery();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMeMutation();

  const [primaryColor, setPrimaryColor] = useState('#1E293B');
  const [secondaryColor, setSecondaryColor] = useState('#0058BE');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [taxCertFile, setTaxCertFile] = useState<File | null>(null);

  const [tinNumber, setTinNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const regInputRef = useRef<HTMLInputElement>(null);
  const taxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (merchant) {
      setPrimaryColor((merchant as any).brandColor || '#1E293B');
      setSecondaryColor((merchant as any).secondaryColor || '#0058BE');
      if (merchant.logo) setLogoPreview(merchant.logo);
      if (merchant.coverImage) setCoverPreview(merchant.coverImage);
      setTinNumber(merchant.tinId || '');
      setLicenseNumber((merchant as any).licenseNumber || merchant.tradeLicense?.licenseNumber || '');
    }
  }, [merchant]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      // JSON updates
      await updateMe({
        brandColor: primaryColor,
        secondaryColor: secondaryColor,
        tinId: tinNumber,
        licenseNumber: licenseNumber,
      } as any);

      // File updates if new files selected
      if (logoFile || coverFile || businessRegFile || taxCertFile) {
        const formData = new FormData();
        if (logoFile) formData.append('logo', logoFile);
        if (coverFile) formData.append('coverImage', coverFile);
        if (businessRegFile) {
          formData.append('documents', businessRegFile);
          formData.append('documentTypes[0]', 'business_registration');
        }
        if (taxCertFile) {
          formData.append('documents', taxCertFile);
          formData.append('documentTypes[1]', 'tax_certificate');
        }
        await updateMe(formData);
      }

      toast.success('Brand & verification settings saved successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save brand settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2170e4]" />
      </div>
    );
  }

  const restaurantName = merchant?.businessName || 'Sample Restaurant';
  const isVerified = Boolean((merchant as any)?.isVerified || merchant?.tradeLicense?.verified);

  return (
    <SettingPageLayout
      title="Brand & KYC Settings"
      subtitle="Manage your restaurant's brand identity and verify your business credentials."
      breadcrumbs={[{ label: 'Brand & KYC' }]}
      actions={
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Changes
            </>
          )}
        </button>
      }
    >
      {/* Top Grid: Brand Assets & Colors + Sticky Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Brand Forms (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Assets Card */}
          <section className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-6 rounded-lg shadow-xs">
            <h3 className="text-base font-semibold text-[#0B1C30] dark:text-slate-100 mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              Brand Assets
            </h3>

            <div className="space-y-6">
              {/* Primary Logo */}
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] dark:text-slate-200 mb-2">
                  Primary Logo
                </label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#CBD5E1] dark:border-slate-700 rounded-lg bg-[#F8F9FF] dark:bg-slate-950 cursor-pointer hover:border-[#2170E4] hover:bg-blue-50/20 transition-all text-center"
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-16 h-16 object-contain rounded-full border border-slate-200 bg-white p-1 shadow-xs"
                      />
                      <p className="text-xs text-blue-600 font-medium hover:underline">
                        Click to replace logo
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <div className="flex text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-[#0058BE] hover:underline">
                          Upload a file
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        PNG, JPG, SVG up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Cover Banner */}
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] dark:text-slate-200 mb-2">
                  Cover Banner (Optional)
                </label>
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="mt-1 flex flex-col items-center justify-center px-6 py-4 border-2 border-dashed border-[#CBD5E1] dark:border-slate-700 rounded-lg bg-[#F8F9FF] dark:bg-slate-950 cursor-pointer hover:border-[#2170E4] hover:bg-blue-50/20 transition-all text-center"
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  {coverPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={coverPreview}
                        alt="Cover Preview"
                        className="h-12 w-32 object-cover rounded border"
                      />
                      <p className="text-xs text-blue-600 font-medium hover:underline">
                        Replace banner image
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Upload store header banner (Recommended: 1200x400)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Brand Colors Card */}
          <section className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-6 rounded-lg shadow-xs">
            <h3 className="text-base font-semibold text-[#0B1C30] dark:text-slate-100 mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-slate-500" />
              Brand Colors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] dark:text-slate-200 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-9 rounded border border-[#CBD5E1] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="block w-full rounded border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs font-mono h-9 uppercase text-[#0B1C30] dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0B1C30] dark:text-slate-200 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-9 rounded border border-[#CBD5E1] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="block w-full rounded border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs font-mono h-9 uppercase text-[#0B1C30] dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Col: Live Preview (Sticky) */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-6 rounded-lg shadow-xs sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-slate-500" />
                Live Preview
              </h3>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Customer View</span>
            </div>

            <div className="border border-[#E2E8F0] dark:border-slate-800 rounded-lg p-5 bg-[#F8F9FF] dark:bg-slate-950 flex flex-col items-center justify-center min-h-[260px] shadow-xs">
              <div className="w-24 h-24 mb-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-2">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                ) : (
                  <Utensils className="h-10 w-10 text-slate-400" />
                )}
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 text-center">
                {restaurantName}
              </h4>

              <button
                type="button"
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white text-xs font-semibold py-2.5 px-4 rounded shadow-sm hover:opacity-90 transition-opacity"
              >
                Book a Table
              </button>

              <button
                type="button"
                style={{ color: secondaryColor, borderColor: secondaryColor }}
                className="w-full mt-2.5 bg-transparent border text-xs font-semibold py-2.5 px-4 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                View Menu
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Section: Business Verification / KYC Credentials */}
      <section className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-lg p-6 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Business Verification Status
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete your business verification to unlock online payments, custom domains, and all features.
            </p>
          </div>
          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified Merchant
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Verification Pending
              </span>
            )}
          </div>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Registration */}
          <div className="border border-[#CBD5E1] dark:border-slate-800 p-5 rounded-lg bg-[#F8F9FF] dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 mb-1 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-slate-500" /> Business Registration
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Upload your official business registration certificate or trade license document.
              </p>
            </div>
            <div>
              <input
                ref={regInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setBusinessRegFile(f);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => regInputRef.current?.click()}
                className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold py-2 px-4 border border-[#CBD5E1] dark:border-slate-700 rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                {businessRegFile ? businessRegFile.name : 'Upload Document'}
              </button>
            </div>
          </div>

          {/* Tax Certificate */}
          <div className="border border-[#CBD5E1] dark:border-slate-800 p-5 rounded-lg bg-[#F8F9FF] dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 mb-1 flex items-center">
                <Building className="h-4 w-4 mr-2 text-slate-500" /> Tax Certificate (TIN)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Upload your current tax clearance or official TIN registration certificate.
              </p>
            </div>
            <div>
              <input
                ref={taxInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setTaxCertFile(f);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => taxInputRef.current?.click()}
                className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold py-2 px-4 border border-[#CBD5E1] dark:border-slate-700 rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                {taxCertFile ? taxCertFile.name : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>

        {/* TIN & License Number Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Tax Identification Number (TIN)
            </label>
            <input
              type="text"
              value={tinNumber}
              onChange={(e) => setTinNumber(e.target.value)}
              placeholder="e.g. 0084938201"
              className="w-full h-9 px-3 rounded border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono outline-none focus:border-[#2170E4]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Trade License Number
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. TL-2024-94812"
              className="w-full h-9 px-3 rounded border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono outline-none focus:border-[#2170E4]"
            />
          </div>
        </div>
      </section>
    </SettingPageLayout>
  );
};

export default BrandKycPage;
