// src/features/Table/pages/PrintMenuPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '@/app/store';
import { setSidebarCollapsed } from '@/components/Layout/layoutSlice';

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
import {
  Printer,
  Download,
  UtensilsCrossed,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Loader2,
  Table as TableIcon,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  QrCode,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useMenuItemsQuery, useMenuGroupsQuery } from '@/api/Queries/menuQueries';
import { useActiveCategoriesQuery } from '@/api/Queries/categoryQueries';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import { useTablesQuery, type Table } from '@/api/Queries/tableQueries';

// import {
//   MenuTemplateRenderer,
//   AVAILABLE_TEMPLATES,
//   type TemplateDefinition,
// } from '../Components/PrintMenu/templates';
import { downloadMenuAsPdf, triggerCleanMenuPrint } from '../Components/PrintMenu/utils/printPdfUtils';
import {
  type PrintMenuSettings,
  type PaperSize,
  type Orientation,
  type TemplateId,
  type PaperColor,
  type FontFamily,
  DEFAULT_PRINT_SETTINGS,
} from '../Components/PrintMenu/types';
import { getCategoryName } from '@/features/Menu/lib/categoryUtils';
import { AVAILABLE_TEMPLATES, MenuTemplateRenderer } from '../Components/PrintMenu/templates';

const STORAGE_KEY = 'rms_saved_physical_menu_design';

export const PrintMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { tableId: routeTableId } = useParams<{ tableId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId') || searchParams.get('id') || routeTableId || '';

  const currentBranchId = useSelector((state: RootState) => state.ui.currentBranchId);
  const previousSidebarState = useRef<boolean | null>(null);

  // Auto-collapse sidebar when in Physical Menu Designer mode
  useEffect(() => {
    // Save current collapse state and collapse sidebar
    dispatch(setSidebarCollapsed(true));

    return () => {
      // Restore normal sidebar state on unmount if needed
      dispatch(setSidebarCollapsed(false));
    };
  }, [dispatch]);

  // Data Queries (Source of truth from Menu Management & Table Management)
  const { data: allTables = [], isLoading: isTablesLoading } = useTablesQuery(currentBranchId);
  const { data: menuItems = [] } = useMenuItemsQuery();
  const { data: menuGroups = [] } = useMenuGroupsQuery();
  const { data: dbCategories = [] } = useActiveCategoriesQuery();
  const { data: merchant } = useMyMerchantQuery();

  const [selectedTableId, setSelectedTableId] = useState<string>(queryTableId);
  const [zoomLevel, setZoomLevel] = useState<number>(0.8);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Settings State (Loaded from localStorage draft or defaults)
  const [settings, setSettings] = useState<PrintMenuSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_PRINT_SETTINGS };
  });

  // Sync initial or updated table ID from query params or table list
  useEffect(() => {
    if (queryTableId && allTables.some((t) => t._id === queryTableId)) {
      setSelectedTableId(queryTableId);
    } else if (allTables.length > 0 && (!selectedTableId || !allTables.some((t) => t._id === selectedTableId))) {
      setSelectedTableId(allTables[0]._id);
    }
  }, [queryTableId, allTables, selectedTableId]);

  // Sync merchant business name if not customized
  useEffect(() => {
    if (merchant?.businessName && (!settings.restaurantName || settings.restaurantName === '')) {
      const addrStr = typeof merchant.address === 'string'
        ? merchant.address
        : merchant.address && typeof merchant.address === 'object'
        ? `${(merchant.address as any).street || ''} ${(merchant.address as any).city || ''}`.trim()
        : '';

      setSettings((prev) => ({
        ...prev,
        restaurantName: merchant.businessName,
        logoUrl: merchant.logo || prev.logoUrl,
        phone: merchant.phone || prev.phone,
        address: addrStr || prev.address,
      }));
    }
  }, [merchant, settings.restaurantName]);

  const activeTable = useMemo(() => {
    return allTables.find((t) => t._id === selectedTableId) || allTables[0] || null;
  }, [allTables, selectedTableId]);

  const handleTableChange = (newTableId: string) => {
    setSelectedTableId(newTableId);
    setSearchParams({ tableId: newTableId });
  };

  const updateSetting = <K extends keyof PrintMenuSettings>(
    key: K,
    value: PrintMenuSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save Design Draft to Local Storage
  const handleSaveDesign = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success('Menu design draft saved successfully!');
    } catch {
      toast.error('Failed to save menu design draft');
    }
  };

  // Reset to default settings
  const handleResetSettings = () => {
    setSettings({
      ...DEFAULT_PRINT_SETTINGS,
      restaurantName: merchant?.businessName || '',
      logoUrl: merchant?.logo || '',
      phone: merchant?.phone || '',
    });
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Settings reset to default');
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
      toast.success(`Opening clean print dialog for Table #${activeTable.tableNumber}`);
    } catch (err: any) {
      console.error('Print trigger error:', err);
      window.print();
    }
  };

  // Generate High-Res PDF Export
  const handleDownloadPdf = async () => {
    if (!activeTable) {
      toast.error('Please select a table to export PDF');
      return;
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading('Generating high-resolution menu PDF with embedded QR code...');

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
      toast.success(`Table #${activeTable.tableNumber} Menu PDF ready!`, { id: toastId });
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Failed to download PDF: ' + (err?.message || 'Unknown error'), { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Category Selection Handlers
  const handleToggleCategory = (catId: string, categoryItemIds: string[]) => {
    setSettings((prev) => {
      const selectedCats = new Set(prev.selectedCategoryIds);
      const selectedItems = new Set(prev.selectedMenuItemIds);

      const isCurrentlySelected = selectedCats.has(catId);

      if (isCurrentlySelected) {
        // Deselect category and all its items
        selectedCats.delete(catId);
        categoryItemIds.forEach((id) => selectedItems.delete(id));
      } else {
        // Select category and all its items
        selectedCats.add(catId);
        categoryItemIds.forEach((id) => selectedItems.add(id));
      }

      return {
        ...prev,
        selectedCategoryIds: Array.from(selectedCats),
        selectedMenuItemIds: Array.from(selectedItems),
      };
    });
  };

  const handleToggleMenuItem = (itemId: string, catId: string) => {
    setSettings((prev) => {
      const selectedItems = new Set(prev.selectedMenuItemIds);
      const selectedCats = new Set(prev.selectedCategoryIds);

      if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
      } else {
        selectedItems.add(itemId);
        selectedCats.add(catId);
      }

      return {
        ...prev,
        selectedCategoryIds: Array.from(selectedCats),
        selectedMenuItemIds: Array.from(selectedItems),
      };
    });
  };

  const handleSelectAllContent = () => {
    const allCatIds = dbCategories.map((c) => c.id || c._id || getCategoryName(c, 'en'));
    const allItemIds = menuItems.map((m) => m._id);

    setSettings((prev) => ({
      ...prev,
      selectedCategoryIds: allCatIds,
      selectedMenuItemIds: allItemIds,
    }));
    toast.success('All categories and menu items selected');
  };

  const handleDeselectAllContent = () => {
    setSettings((prev) => ({
      ...prev,
      selectedCategoryIds: [],
      selectedMenuItemIds: [],
    }));
    toast.info('Deselected all menu items');
  };

  const toggleCategoryExpanded = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // Group items by category for the right sidebar curation tree
  const categorizedHierarchy = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: typeof menuItems }>();

    // 1. Initialize from dbCategories
    dbCategories.forEach((cat) => {
      const id = cat.id || cat._id || getCategoryName(cat, 'en');
      const name = getCategoryName(cat, 'en');
      map.set(id, { id, name, items: [] });
    });

    // 2. Assign menu items
    menuItems.forEach((item) => {
      let catKey = 'general';
      let catName = 'Specialties';

      if (item.category) {
        if (typeof item.category === 'object') {
          const catObj = item.category as any;
          catKey = catObj.id || catObj._id || catObj.name?.en || 'general';
          catName = catObj.name?.en || 'Specialties';
        } else if (typeof item.category === 'string') {
          catKey = item.category;
          const found = dbCategories.find((c) => (c.id || c._id) === item.category);
          if (found) catName = getCategoryName(found, 'en');
          else catName = item.category;
        }
      }

      if (!map.has(catKey)) {
        map.set(catKey, { id: catKey, name: catName, items: [] });
      }
      map.get(catKey)!.items.push(item);
    });

    return Array.from(map.values()).filter((c) => c.items.length > 0);
  }, [dbCategories, menuItems]);

  // Paper Dimensions calculation for preview viewport
  const isLandscape = settings.orientation === 'landscape';

  const paperDimensions = useMemo(() => {
    switch (settings.paperSize) {
      case 'a5':
        return isLandscape ? { width: '210mm', height: '148mm' } : { width: '148mm', height: '210mm' };
      case 'a3':
        return isLandscape ? { width: '420mm', height: '297mm' } : { width: '297mm', height: '420mm' };
      case 'letter':
        return isLandscape ? { width: '11in', height: '8.5in' } : { width: '8.5in', height: '11in' };
      case 'a4':
      default:
        return isLandscape ? { width: '297mm', height: '210mm' } : { width: '210mm', height: '297mm' };
    }
  }, [settings.paperSize, isLandscape]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* ── Top Header Toolbar (RMS V2.0 Style) ────────────────────── */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tables')}
            className="h-8 gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Tables</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Physical Menu Designer
            </h1>
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
              V2.0
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Active Table Selector */}
          {allTables.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">Table:</span>
              <Select value={selectedTableId} onValueChange={handleTableChange}>
                <SelectTrigger className="h-8 text-xs font-bold w-[125px] sm:w-[150px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Table" />
                </SelectTrigger>
                <SelectContent>
                  {allTables.map((t) => (
                    <SelectItem key={t._id} value={t._id} className="text-xs font-semibold">
                      Table #{t.tableNumber} {t.section ? `(${t.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save Design */}
          <Button
            onClick={handleSaveDesign}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>

          {/* Generate PDF */}
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !activeTable}
            size="sm"
            className="h-8 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white gap-1.5 shadow-xs"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Generate PDF</span>
          </Button>

          {/* Quick Print */}
          <Button
            onClick={handlePrint}
            disabled={!activeTable}
            size="sm"
            className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print Menu</span>
          </Button>
        </div>
      </header>

      {/* ── 3-Pane Workspace Body ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── PANE 1: Left Sidebar - Template Selection (w-64) ─────── */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full flex-shrink-0 overflow-y-auto">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Templates ({AVAILABLE_TEMPLATES.length})
            </h2>
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-500">
              Pick Layout
            </Badge>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {AVAILABLE_TEMPLATES.map((tmpl) => {
              const isActive = settings.templateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => updateSetting('templateId', tmpl.id)}
                  className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden relative group ${
                    isActive
                      ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Selected Checkmark Badge */}
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-xs z-10">
                      <Check className="h-3 w-3" />
                    </div>
                  )}

                  {/* Abstract Representation of Menu Card */}
                  <div className="h-24 bg-slate-100 dark:bg-slate-800 p-3 flex flex-col gap-1.5 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="h-3 w-1/2 bg-slate-300 dark:bg-slate-700 rounded-sm" />
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 w-full bg-slate-300/80 dark:bg-slate-700 rounded-xs" />
                        <div className="h-1.5 w-4/5 bg-slate-300/80 dark:bg-slate-700 rounded-xs" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 w-full bg-slate-300/80 dark:bg-slate-700 rounded-xs" />
                        <div className="h-1.5 w-3/5 bg-slate-300/80 dark:bg-slate-700 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tmpl.name}
                      </h3>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {tmpl.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                      <span>{tmpl.columns}</span>
                      <span>•</span>
                      <span>{tmpl.defaultPaper}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── PANE 2: Center Canvas - Live Paper Preview ─────────────── */}
        <section className="flex-1 bg-slate-200/70 dark:bg-slate-950 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-start relative select-none">
          {/* Floating Zoom Controls Toolbar */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-full shadow-md flex items-center px-3 py-1.5 gap-2 z-20">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 min-w-[3.5ch] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              onClick={() => setZoomLevel(0.85)}
              className="px-2 py-1 text-[11px] font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Fit to screen"
            >
              Fit
            </button>

            <button
              onClick={() => setZoomLevel(1.0)}
              className="px-2 py-1 text-[11px] font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="100% Actual Scale"
            >
              100%
            </button>
          </div>

          {/* Scaled Printable Paper Mockup */}
          <div
            id="printable-menu-root"
            className="shadow-xl rounded-sm border border-slate-300 dark:border-slate-700 transition-transform origin-top flex-shrink-0 bg-white"
            style={{
              width: paperDimensions.width,
              minHeight: paperDimensions.height,
              transform: `scale(${zoomLevel})`,
              marginBottom: '80px',
            }}
          >
            {activeTable ? (
              <MenuTemplateRenderer
                table={activeTable}
                menuItems={menuItems}
                menuGroups={menuGroups}
                categories={dbCategories}
                merchant={merchant}
                settings={settings}
              />
            ) : (
              <div className="p-12 text-center text-slate-400">
                <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">No Table Selected</p>
                <p className="text-xs">Select or add a dining table to preview this print menu.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── PANE 3: Right Sidebar - Menu Configuration (w-80) ─────── */}
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full flex-shrink-0 overflow-y-auto">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
              <span>Configuration</span>
            </h2>
            <button
              onClick={handleResetSettings}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1"
              title="Reset all options to default"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <div className="p-4 flex flex-col gap-6">
            {/* 1. Document Setup */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                Document Setup
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Paper Size
                  </Label>
                  <Select
                    value={settings.paperSize}
                    onValueChange={(val) => updateSetting('paperSize', val as PaperSize)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4" className="text-xs">A4 (210×297mm)</SelectItem>
                      <SelectItem value="a5" className="text-xs">A5 (148×210mm)</SelectItem>
                      <SelectItem value="letter" className="text-xs">US Letter (8.5×11")</SelectItem>
                      <SelectItem value="a3" className="text-xs">A3 (297×420mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Orientation
                  </Label>
                  <Select
                    value={settings.orientation}
                    onValueChange={(val) => updateSetting('orientation', val as Orientation)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait" className="text-xs">Portrait</SelectItem>
                      <SelectItem value="landscape" className="text-xs">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Paper Tone & Columns */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Paper Background
                  </Label>
                  <Select
                    value={settings.paperColor}
                    onValueChange={(val) => updateSetting('paperColor', val as PaperColor)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white" className="text-xs">Pure White</SelectItem>
                      <SelectItem value="warm-white" className="text-xs">Warm White</SelectItem>
                      <SelectItem value="cream" className="text-xs">Classic Cream</SelectItem>
                      <SelectItem value="light-beige" className="text-xs">Light Beige</SelectItem>
                      <SelectItem value="dark-slate" className="text-xs">Dark Slate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Typography
                  </Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(val) => updateSetting('fontFamily', val as FontFamily)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans" className="text-xs">Modern Sans (Inter)</SelectItem>
                      <SelectItem value="serif" className="text-xs">Classic Serif</SelectItem>
                      <SelectItem value="cinzel" className="text-xs">Luxury Serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* 2. Content Curation (Categories & Individual Items) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Content Curation
                </h3>
                <div className="flex gap-2 text-[11px]">
                  <button
                    onClick={handleSelectAllContent}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleDeselectAllContent}
                    className="text-slate-400 font-medium hover:text-slate-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Categories list */}
              <div className="space-y-2">
                {categorizedHierarchy.map((category) => {
                  const catItemIds = category.items.map((i) => i._id);
                  const isCatSelected =
                    settings.selectedCategoryIds.length === 0 ||
                    settings.selectedCategoryIds.includes(category.id);

                  const selectedItemsCount = category.items.filter((i) =>
                    settings.selectedMenuItemIds.length === 0 ||
                    settings.selectedMenuItemIds.includes(i._id)
                  ).length;

                  const isExpanded = !!expandedCategories[category.id];

                  return (
                    <div
                      key={category.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900"
                    >
                      {/* Category Header Bar */}
                      <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-2 border-b border-slate-200/50 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isCatSelected}
                            onChange={() => handleToggleCategory(category.id, catItemIds)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {category.name}
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/60 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {selectedItemsCount}/{category.items.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCategoryExpanded(category.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Items List */}
                      {isExpanded && (
                        <div className="p-2 space-y-1.5 bg-white dark:bg-slate-900 pl-6 border-t border-slate-100 dark:border-slate-800">
                          {category.items.map((item) => {
                            const isItemSelected =
                              settings.selectedMenuItemIds.length === 0 ||
                              settings.selectedMenuItemIds.includes(item._id);

                            return (
                              <label
                                key={item._id}
                                className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isItemSelected}
                                    onChange={() => handleToggleMenuItem(item._id, category.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                  />
                                  <span className="truncate text-slate-700 dark:text-slate-300">
                                    {typeof item.name === 'string' ? item.name : item.name?.en || (item.name as any)?.am || 'Menu Item'}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 font-semibold tabular-nums ml-2">
                                  {item.price} {settings.currencySymbol}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* 3. Visible Elements Toggles */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Visible Elements
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Item Descriptions
                  </span>
                  <Switch
                    checked={settings.showDescriptions}
                    onCheckedChange={(checked) => updateSetting('showDescriptions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Item Prices
                  </span>
                  <Switch
                    checked={settings.showPrices}
                    onCheckedChange={(checked) => updateSetting('showPrices', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Item Thumbnails (Images)
                  </span>
                  <Switch
                    checked={settings.showImages}
                    onCheckedChange={(checked) => updateSetting('showImages', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Table Number Header
                  </span>
                  <Switch
                    checked={settings.showTableNumber}
                    onCheckedChange={(checked) => updateSetting('showTableNumber', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Scannable Table QR Code
                  </span>
                  <Switch
                    checked={settings.showTableQR}
                    onCheckedChange={(checked) => updateSetting('showTableQR', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dietary & Spice Badges
                  </span>
                  <Switch
                    checked={settings.showDietary}
                    onCheckedChange={(checked) => updateSetting('showDietary', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bilingual / Amharic Names
                  </span>
                  <Switch
                    checked={settings.showAmharic}
                    onCheckedChange={(checked) => updateSetting('showAmharic', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* 4. Branding & Footer Information */}
            <div className="space-y-3 pb-6">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Branding & Notes
              </h3>

              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Restaurant Name
                  </Label>
                  <Input
                    value={settings.restaurantName}
                    onChange={(e) => updateSetting('restaurantName', e.target.value)}
                    placeholder="Restaurant Name"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Tagline / Subtitle
                  </Label>
                  <Input
                    value={settings.tagline}
                    onChange={(e) => updateSetting('tagline', e.target.value)}
                    placeholder="Craft Burgers & Artisan Pizza"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Tax & Allergy Disclaimer
                  </Label>
                  <Input
                    value={settings.taxDisclaimer}
                    onChange={(e) => updateSetting('taxDisclaimer', e.target.value)}
                    placeholder="Please inform your server of any allergies."
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Currency Symbol
                  </Label>
                  <Input
                    value={settings.currencySymbol}
                    onChange={(e) => updateSetting('currencySymbol', e.target.value)}
                    placeholder="ETB, USD, €"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PrintMenuPage;
