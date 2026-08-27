// src/features/Table/pages/PrintMenuPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Printer,
  Download,
  UtensilsCrossed,
  Sliders,
  ZoomIn,
  ZoomOut,
  LayoutTemplate,
  FileText,
  Check,
  RotateCcw,
  Layers,
  Sparkles,
  Globe,
  Square,
  ArrowLeft,
  Loader2,
  Table as TableIcon,
  Maximize2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMenuItemsQuery, useMenuGroupsQuery } from '@/api/Queries/menuQueries';
import { useActiveCategoriesQuery } from '@/api/Queries/categoryQueries';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import { useTablesQuery, type Table } from '@/api/Queries/tableQueries';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { PremiumALaCarteTemplate } from '../Components/PrintMenu/templates/PremiumALaCarteTemplate';
import { EthiopianClassicTemplate } from '../Components/PrintMenu/templates/EthiopianClassicTemplate';
import { downloadMenuAsPdf, triggerCleanMenuPrint } from '../Components/PrintMenu/utils/printPdfUtils';
import {
  type PrintMenuSettings,
  type PaperSize,
  type Orientation,
  type MenuTheme,
  type BorderStyle,
  type BorderThickness,
  type BorderColorMode,
  type PaperColor,
  type Density,
  DEFAULT_PRINT_SETTINGS,
} from '../Components/PrintMenu/types';

export const PrintMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { tableId: routeTableId } = useParams<{ tableId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId') || searchParams.get('id') || routeTableId || '';

  const currentBranchId = useSelector((state: RootState) => state.ui.currentBranchId);

  // Queries
  const { data: allTables = [], isLoading: isTablesLoading } = useTablesQuery(currentBranchId);
  const { data: menuItems = [] } = useMenuItemsQuery();
  const { data: menuGroups = [] } = useMenuGroupsQuery();
  const { data: dbCategories = [] } = useActiveCategoriesQuery();
  const { data: merchant } = useMyMerchantQuery();

  const [selectedTableId, setSelectedTableId] = useState<string>(queryTableId);
  const [activeTab, setActiveTab] = useState<'preview' | 'template'>('preview');
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Settings State
  const [settings, setSettings] = useState<PrintMenuSettings>({
    ...DEFAULT_PRINT_SETTINGS,
    restaurantName: merchant?.businessName || 'Habesha Kitchen',
    logoUrl: merchant?.logo || '',
  });

  // Sync initial or updated table ID from query params / tables list
  useEffect(() => {
    if (queryTableId && allTables.some((t) => t._id === queryTableId)) {
      setSelectedTableId(queryTableId);
    } else if (allTables.length > 0 && (!selectedTableId || !allTables.some((t) => t._id === selectedTableId))) {
      setSelectedTableId(allTables[0]._id);
    }
  }, [queryTableId, allTables]);

  // Keep merchant name synced
  useEffect(() => {
    if (merchant?.businessName && (!settings.restaurantName || settings.restaurantName === 'Habesha Kitchen')) {
      setSettings((prev) => ({
        ...prev,
        restaurantName: merchant.businessName,
        logoUrl: merchant.logo || prev.logoUrl,
        primaryColor: prev.primaryColor || '#7B3F00',
      }));
    }
  }, [merchant]);

  const activeTable = useMemo(() => {
    return allTables.find((t) => t._id === selectedTableId) || allTables[0] || null;
  }, [allTables, selectedTableId]);

  const handleTableChange = (newTableId: string) => {
    setSelectedTableId(newTableId);
    setSearchParams({ tableId: newTableId });
  };

  // Print Menu Trigger
  const handlePrint = () => {
    if (!activeTable) {
      toast.error('Please select a table to print');
      return;
    }

    try {
      triggerCleanMenuPrint({
        containerId: 'printable-menu-root',
        settings,
      });
      toast.success(`Opening print window for Table ${activeTable.tableNumber}`);
    } catch (err: any) {
      console.error('Print trigger error:', err);
      window.print();
    }
  };

  // Download Multi-Page Vector PDF
  const handleDownloadPdf = async () => {
    if (!activeTable) {
      toast.error('Please select a table to export PDF');
      return;
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading('Generating high-resolution menu PDF...');

    try {
      await downloadMenuAsPdf({
        containerId: 'printable-menu-root',
        settings,
        tableNumber: activeTable.tableNumber,
        restaurantName: settings.restaurantName || merchant?.businessName,
        onProgress: (msg) => {
          toast.loading(msg, { id: toastId });
        },
      });
      toast.success('Table menu PDF downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Failed to download PDF: ' + (err?.message || 'Unknown error'), { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const updateSetting = <K extends keyof PrintMenuSettings>(
    key: K,
    value: PrintMenuSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (newTheme: MenuTheme) => {
    const themeDefaultBorder: Record<MenuTheme, BorderStyle> = {
      ethiopian: 'ethiopian',
      classic: 'classic-double',
      luxury: 'luxury-corner',
      coffee: 'coffee-shop',
      modern: 'modern-geometric',
      minimal: 'minimal',
    };

    setSettings((prev) => ({
      ...prev,
      theme: newTheme,
      borderStyle: themeDefaultBorder[newTheme] || prev.borderStyle,
    }));
  };

  const handleResetSettings = () => {
    setSettings({
      ...DEFAULT_PRINT_SETTINGS,
      restaurantName: merchant?.businessName || 'Habesha Kitchen',
      logoUrl: merchant?.logo || '',
    });
    toast.success('Customizations reset to defaults');
  };

  const isLandscape = settings.orientation === 'landscape';
  const paperAspect = isLandscape ? 'aspect-[297/210]' : 'aspect-[210/297]';
  const isTemplate2 = settings.templateId === 'ethiopian-classic';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col h-screen overflow-hidden">
      {/* Top Application Header */}
      <header className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tables')}
            className="h-9 gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Tables</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Table Menu Studio
                </h1>
                <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 hidden md:inline-flex">
                  {settings.templateId === 'ethiopian-classic' ? 'Ethiopian Classic' : 'Premium À La Carte'}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 hidden lg:inline-flex">
                  {settings.paperSize.toUpperCase()} • {isLandscape ? 'Landscape' : 'Portrait'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Print physical dining menus with high-resolution vector layout & embedded table QR code
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions: Table Switcher, Download PDF & Print Menu */}
        <div className="flex items-center gap-2">
          {/* Table Switcher */}
          {allTables.length > 0 && (
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-xs font-semibold text-slate-500 hidden md:inline">Table:</span>
              <Select value={selectedTableId} onValueChange={handleTableChange}>
                <SelectTrigger className="h-8 text-xs font-bold w-[130px] sm:w-[150px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Table" />
                </SelectTrigger>
                <SelectContent>
                  {allTables.map((t) => (
                    <SelectItem key={t._id} value={t._id} className="text-xs font-semibold">
                      Table {t.tableNumber} {t.section ? `(${t.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Download PDF Action */}
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !activeTable}
            variant="outline"
            className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 shadow-2xs border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Download className="h-3.5 w-3.5 text-primary" />
            )}
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>

          {/* Print Menu Action */}
          <Button
            onClick={handlePrint}
            disabled={!activeTable}
            className="h-8 px-3.5 text-xs font-bold rounded-xl gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-white"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Menu</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Customization Studio Drawer */}
        <div className="w-full lg:w-[360px] xl:w-[400px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full flex-shrink-0 z-10">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="flex-1 flex flex-col h-full"
          >
            <div className="px-4 pt-3 border-b border-slate-100 dark:border-slate-800">
              <TabsList className="grid grid-cols-2 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="preview" className="text-xs font-semibold gap-1.5 py-1.5">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Customization</span>
                </TabsTrigger>
                <TabsTrigger value="template" className="text-xs font-semibold gap-1.5 py-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span>Templates</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Customization Settings Tab Content */}
            <TabsContent value="preview" className="flex-1 overflow-y-auto p-4 space-y-5 m-0">
              {/* If Template 2 is active, show Theme & Border options */}
              {isTemplate2 && (
                <>
                  {/* 1. Theme Selection */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Menu Theme</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: 'ethiopian', label: 'Ethiopian', badge: 'Habesha' },
                          { key: 'classic', label: 'Classic', badge: 'Serif' },
                          { key: 'luxury', label: 'Luxury', badge: 'Editorial' },
                          { key: 'coffee', label: 'Coffee', badge: 'Ceremony' },
                          { key: 'modern', label: 'Modern', badge: 'Clean' },
                          { key: 'minimal', label: 'Minimal', badge: 'Simple' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => handleThemeChange(t.key)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            settings.theme === t.key
                              ? 'border-primary bg-primary/10 font-bold text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="text-[11px] leading-tight">{t.label}</div>
                          <div className="text-[9px] text-slate-400 font-normal mt-0.5">{t.badge}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Border Style & Pattern */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                      <span>Border System & Pattern</span>
                    </h3>

                    <div className="space-y-2">
                      <Label className="text-[11px] text-slate-500">Border Style</Label>
                      <Select
                        value={settings.borderStyle}
                        onValueChange={(val) => updateSetting('borderStyle', val as BorderStyle)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethiopian" className="text-xs">Ethiopian Pattern (Geometric Rosettes)</SelectItem>
                          <SelectItem value="classic-double" className="text-xs">Classic Double Frame</SelectItem>
                          <SelectItem value="luxury-corner" className="text-xs">Luxury Corner Motifs</SelectItem>
                          <SelectItem value="coffee-shop" className="text-xs">Coffee Shop Leaves & Beans</SelectItem>
                          <SelectItem value="modern-geometric" className="text-xs">Modern Geometric Brackets</SelectItem>
                          <SelectItem value="minimal" className="text-xs">Minimal Single Line</SelectItem>
                          <SelectItem value="none" className="text-xs">None (Borderless)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.borderStyle !== 'none' && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Border Color Mode</Label>
                          <Select
                            value={settings.borderColorMode}
                            onValueChange={(val) => updateSetting('borderColorMode', val as BorderColorMode)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brand" className="text-xs">Brand Accent Color</SelectItem>
                              <SelectItem value="black" className="text-xs">Charcoal Black</SelectItem>
                              <SelectItem value="gold" className="text-xs">Luxury Gold (#B8960C)</SelectItem>
                              <SelectItem value="dark-gray" className="text-xs">Dark Gray</SelectItem>
                              <SelectItem value="custom" className="text-xs">Custom Hex Color</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-500">Thickness</Label>
                          <Select
                            value={settings.borderThickness}
                            onValueChange={(val) => updateSetting('borderThickness', val as BorderThickness)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="thin" className="text-xs">Fine / Thin</SelectItem>
                              <SelectItem value="medium" className="text-xs">Medium Standard</SelectItem>
                              <SelectItem value="thick" className="text-xs">Bold / Thick</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Paper Background Tint */}
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-[11px] text-slate-500">Paper Texture & Color</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(
                          [
                            { key: 'warm-white', label: 'Warm', color: '#fefaf6' },
                            { key: 'white', label: 'White', color: '#ffffff' },
                            { key: 'cream', label: 'Cream', color: '#fdf6e3' },
                            { key: 'light-beige', label: 'Beige', color: '#f5efe4' },
                          ] as const
                        ).map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => updateSetting('paperColor', p.key as PaperColor)}
                            className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                              settings.paperColor === p.key
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-md border border-slate-300/60 shadow-2xs"
                              style={{ background: p.color }}
                            />
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                              {p.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Page & Format Layout */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Page & Layout</span>
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">Paper Size</Label>
                    <Select
                      value={settings.paperSize}
                      onValueChange={(val) => updateSetting('paperSize', val as PaperSize)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4" className="text-xs">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="a5" className="text-xs">A5 (Compact)</SelectItem>
                        <SelectItem value="letter" className="text-xs">US Letter (8.5 × 11 in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">Orientation</Label>
                    <Select
                      value={settings.orientation}
                      onValueChange={(val) => updateSetting('orientation', val as Orientation)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait" className="text-xs">Portrait</SelectItem>
                        <SelectItem value="landscape" className="text-xs">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">Columns</Label>
                    <Select
                      value={String(settings.columnsCount)}
                      onValueChange={(val) => updateSetting('columnsCount', Number(val) as any)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1" className="text-xs">1 Column</SelectItem>
                        <SelectItem value="2" className="text-xs">2 Columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">Density</Label>
                    <Select
                      value={settings.density || 'comfortable'}
                      onValueChange={(val) => updateSetting('density', val as Density)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comfortable" className="text-xs">Comfortable (Balanced)</SelectItem>
                        <SelectItem value="compact" className="text-xs">Compact (Dense)</SelectItem>
                        <SelectItem value="spacious" className="text-xs">Spacious (Open)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Cultural & Amharic Language Header */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Restaurant Info & Cultural Branding</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">English Restaurant Name</Label>
                    <Input
                      value={settings.restaurantName}
                      onChange={(e) => updateSetting('restaurantName', e.target.value)}
                      placeholder="e.g. Habesha Kitchen"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Amharic Name (ስም)</Label>
                      <Input
                        value={settings.amharicRestaurantName || ''}
                        onChange={(e) => updateSetting('amharicRestaurantName', e.target.value)}
                        placeholder="e.g. ሃበሻ ኩሽና"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Branch / Location</Label>
                      <Input
                        value={settings.branchName || ''}
                        onChange={(e) => updateSetting('branchName', e.target.value)}
                        placeholder="e.g. Bole Road — Addis Ababa"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">Tagline / Motto</Label>
                    <Input
                      value={settings.tagline}
                      onChange={(e) => updateSetting('tagline', e.target.value)}
                      placeholder="e.g. Authentic Ethiopian Cuisine & Coffee Ceremony"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500">Brand Color Accent</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor || '#7B3F00'}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs font-mono text-slate-500">
                        {settings.primaryColor || '#7B3F00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Display Toggles</span>
                </h3>

                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Amharic Translations
                      </Label>
                      <span className="text-[10px] text-slate-400">Show Amharic item & category names</span>
                    </div>
                    <Switch
                      checked={settings.showAmharic !== false}
                      onCheckedChange={(checked) => updateSetting('showAmharic', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Merchant Watermark
                      </Label>
                      <span className="text-[10px] text-slate-400">Subtle background monogram</span>
                    </div>
                    <Switch
                      checked={settings.showWatermark !== false}
                      onCheckedChange={(checked) => updateSetting('showWatermark', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Contact & Thank-You Page
                      </Label>
                      <span className="text-[10px] text-slate-400">Include QR ordering back page</span>
                    </div>
                    <Switch
                      checked={settings.showContactPage !== false}
                      onCheckedChange={(checked) => updateSetting('showContactPage', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Item Descriptions
                      </Label>
                      <span className="text-[10px] text-slate-400">Show ingredients & flavor notes</span>
                    </div>
                    <Switch
                      checked={settings.showDescriptions}
                      onCheckedChange={(checked) => updateSetting('showDescriptions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Item Prices
                      </Label>
                      <span className="text-[10px] text-slate-400">Render price tags next to items</span>
                    </div>
                    <Switch
                      checked={settings.showPrices}
                      onCheckedChange={(checked) => updateSetting('showPrices', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Reset Customizations Action */}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSettings}
                  className="w-full text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 gap-1.5 h-8"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Customizations</span>
                </Button>
              </div>
            </TabsContent>

            {/* Template Selector Tab Content */}
            <TabsContent value="template" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Select between the available fine-dining menu designs:
                </p>

                {/* Template 2 Card: Ethiopian Classic */}
                <div
                  onClick={() => updateSetting('templateId', 'ethiopian-classic')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                    settings.templateId === 'ethiopian-classic'
                      ? 'border-amber-600 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white font-serif">
                        Template 2 — Ethiopian Classic
                      </span>
                      <Badge className="bg-amber-600 text-white text-[10px] h-4 px-1.5">
                        Figma Inspired
                      </Badge>
                    </div>
                    {settings.templateId === 'ethiopian-classic' && (
                      <Check className="h-4 w-4 text-amber-600" />
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Signature cultural and traditional restaurant menu featuring vector Ethiopian diamond & rosette borders, Amharic headings, medallion header, watermark, continuation headers, and dedicated Table QR contact page.
                  </p>

                  {/* Miniature Preview Thumbnail */}
                  <div className="p-3 bg-[#fefaf6] rounded-xl border border-amber-200/80 text-[9px] font-serif space-y-1.5 text-slate-800 shadow-2xs">
                    <div className="text-center border-b border-amber-300/40 pb-1">
                      <span className="font-bold tracking-wider text-[#7B3F00]">HABESHA KITCHEN</span>
                      <span className="block text-[8px] text-slate-400 italic">ሃበሻ ኩሽና • Authentic Cuisine</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                      <div>
                        <strong className="block text-[#7B3F00] font-sans text-[7.5px] uppercase">TRADITIONAL DISHES</strong>
                        <span className="block text-slate-600">Doro Wat • 280 ETB</span>
                        <span className="block text-slate-500 text-[7px] italic">ዶሮ ወጥ</span>
                      </div>
                      <div>
                        <strong className="block text-[#7B3F00] font-sans text-[7.5px] uppercase">FASTING FOOD</strong>
                        <span className="block text-slate-600">Beyaynetu • 220 ETB</span>
                        <span className="block text-slate-500 text-[7px] italic">በያይነቱ</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={settings.templateId === 'ethiopian-classic' ? 'default' : 'outline'}
                    className={`w-full h-8 text-xs font-semibold rounded-xl mt-1 ${
                      settings.templateId === 'ethiopian-classic' ? 'bg-amber-700 hover:bg-amber-800 text-white' : ''
                    }`}
                  >
                    {settings.templateId === 'ethiopian-classic' ? 'Selected Template' : 'Use Template'}
                  </Button>
                </div>

                {/* Template 1 Card: Premium A La Carte */}
                <div
                  onClick={() => updateSetting('templateId', 'premium-alacarte')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                    settings.templateId === 'premium-alacarte'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white font-serif">
                        Template 1 — Premium À La Carte
                      </span>
                      <Badge className="bg-emerald-500 text-white text-[10px] h-4 px-1.5">
                        Standard
                      </Badge>
                    </div>
                    {settings.templateId === 'premium-alacarte' && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Luxury multi-column fine dining template featuring editorial typography, section dividers, dietary markers, and embedded table QR code.
                  </p>

                  {/* Miniature Preview Thumbnail */}
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[9px] font-serif space-y-1.5 opacity-90 shadow-2xs">
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-bold uppercase tracking-wider">HOTTO</span>
                      <span className="uppercase tracking-widest text-slate-400">YOUKOUS / WELCOME</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                      <div>
                        <strong className="block border-b mb-0.5">SOUP & SALAD</strong>
                        <span className="block text-slate-500">Miso Soup • Wakame</span>
                      </div>
                      <div>
                        <strong className="block border-b mb-0.5">LARGE PLATES</strong>
                        <span className="block text-slate-500">Miso Black Cod</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={settings.templateId === 'premium-alacarte' ? 'default' : 'outline'}
                    className="w-full h-8 text-xs font-semibold rounded-xl mt-1"
                  >
                    {settings.templateId === 'premium-alacarte' ? 'Selected Template' : 'Use Template'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Full Live Interactive Print Preview Canvas */}
        <div className="flex-1 bg-slate-200/70 dark:bg-slate-950/80 p-3 sm:p-6 lg:p-8 flex flex-col items-center justify-start overflow-y-auto relative">
          {/* Zoom & Table Indicator Floating Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {activeTable ? `Table ${activeTable.tableNumber} Print Preview` : 'Menu Print Preview'}
              </span>
              <span className="text-slate-400">•</span>
              <span>{menuItems.length} items loaded</span>
            </div>

            {/* Zoom Controls & Fit Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(0.9)}
                className="h-7 text-[11px] px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Fit Page
              </Button>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-2xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                </button>
                <span className="text-[11px] font-mono font-semibold px-1 w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Scaled Printable Sheet Container */}
          <div
            id="printable-menu-root"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
            className="w-full max-w-4xl transition-transform duration-150 my-auto pb-12"
          >
            {activeTable ? (
              settings.templateId === 'ethiopian-classic' ? (
                <EthiopianClassicTemplate
                  table={activeTable}
                  menuItems={menuItems}
                  menuGroups={menuGroups}
                  categories={dbCategories}
                  merchant={merchant}
                  settings={settings}
                />
              ) : (
                <div className={`w-full ${paperAspect} bg-white shadow-2xl border border-slate-300/80 rounded-sm overflow-hidden`}>
                  <PremiumALaCarteTemplate
                    table={activeTable}
                    menuItems={menuItems}
                    menuGroups={menuGroups}
                    merchant={merchant}
                    settings={settings}
                  />
                </div>
              )
            ) : isTablesLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Loading tables and menu configuration...</span>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <TableIcon className="h-8 w-8 text-slate-300" />
                <span>No table found. Please create or select a table first.</span>
              </div>
            )}
          </div>

          {/* Bottom Note */}
          <div className="text-[11px] text-slate-400 text-center pt-2 pb-2 print:hidden flex-shrink-0">
            Click <strong>Download PDF</strong> for high-resolution 300-DPI vector PDF export or <strong>Print Menu</strong> for physical printer output.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintMenuPage;
