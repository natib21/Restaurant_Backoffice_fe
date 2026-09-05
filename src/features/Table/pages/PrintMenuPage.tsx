// src/features/Table/pages/PrintMenuPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RootState, type AppDispatch } from '@/app/store';
import { setSidebarCollapsed } from '@/components/Layout/layoutSlice';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  GripVertical,
  LayoutGrid,
  ListFilter,
  AlignJustify,
  Image as ImageIcon,
  Palette,
  Layers,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

import { useMenuItemsQuery, useMenuGroupsQuery } from '@/api/Queries/menuQueries';
import { useActiveCategoriesQuery } from '@/api/Queries/categoryQueries';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import { useTablesQuery, type Table } from '@/api/Queries/tableQueries';

import {
  MenuTemplateRenderer,
  AVAILABLE_TEMPLATES,
} from '../Components/PrintMenu/templates';
import { downloadMenuAsPdf, triggerCleanMenuPrint } from '../Components/PrintMenu/utils/printPdfUtils';
import { getTableScanUrl } from '../Components/PrintMenu/utils/templateUtils';
import {
  type PrintMenuSettings,
  type PaperSize,
  type Orientation,
  type TemplateId,
  type PaperColor,
  type FontFamily,
  type SectionLayoutStyle,
  type SectionDividerStyle,
  type SectionSpacingDensity,
  type BrandingSlotPosition,
  DEFAULT_PRINT_SETTINGS,
  
} from '../Components/PrintMenu/types';

// Local copy of DEFAULT_SECTION_CONFIG to avoid import-cycle runtime issue
const DEFAULT_SECTION_CONFIG = {
  layout: 'list-with-photos',
  backgroundTint: 'none',
  dividerStyle: 'line',
  density: 'normal',
  showPhotos: true,
};
// Inline MENU_THEME_PRESETS to avoid runtime export resolution issues
const MENU_THEME_PRESETS = [
  {
    id: 'modern-bistro',
    name: 'Modern Bistro',
    category: 'Contemporary',
    description:
      'Crisp layout, deep indigo & bright blue accents with modern sans typography.',
    previewColors: { primary: '#091426', accent: '#2563eb', paper: '#ffffff' },
    settings: {
      theme: 'modern',
      paperColor: 'white',
      fontFamily: 'sans',
      fontSize: 'medium',
      primaryColor: '#091426',
      secondaryColor: '#64748b',
      accentColor: '#2563eb',
      borderStyle: 'none',
      defaultSectionLayout: 'list-with-photos',
      density: 'comfortable',
    },
  },
  {
    id: 'habesha-heritage',
    name: 'Habesha Heritage',
    category: 'Cultural',
    description:
      'Traditional Ethiopian warm tones, rich crimson, gold borders & Ge’ez styling.',
    previewColors: { primary: '#451a03', accent: '#b45309', paper: '#faf7f2' },
    settings: {
      theme: 'ethiopian',
      paperColor: 'warm-white',
      fontFamily: 'serif',
      fontSize: 'medium',
      primaryColor: '#451a03',
      secondaryColor: '#78350f',
      accentColor: '#b45309',
      borderStyle: 'ethiopian',
      showAmharic: true,
      defaultSectionLayout: 'grid-2col',
      density: 'comfortable',
    },
  },
  {
    id: 'luxury-noir',
    name: 'Luxury Gold & Noir',
    category: 'Fine Dining',
    description:
      'Refined dark slate with metallic champagne gold and luxury serif typography.',
    previewColors: { primary: '#f8fafc', accent: '#eab308', paper: '#0f172a' },
    settings: {
      theme: 'luxury',
      paperColor: 'dark-slate',
      fontFamily: 'cinzel',
      fontSize: 'medium',
      primaryColor: '#f8fafc',
      secondaryColor: '#94a3b8',
      accentColor: '#eab308',
      borderStyle: 'luxury-corner',
      defaultSectionLayout: 'compact-price-list',
      density: 'spacious',
    },
  },
  {
    id: 'artisan-cafe',
    name: 'Artisan Cafe & Bakery',
    category: 'Casual',
    description:
      'Warm cream paper, espresso brown notes, and generous dish photo cards.',
    previewColors: { primary: '#292524', accent: '#d97706', paper: '#fdfaf0' },
    settings: {
      theme: 'coffee',
      paperColor: 'cream',
      fontFamily: 'serif',
      fontSize: 'medium',
      primaryColor: '#292524',
      secondaryColor: '#78716c',
      accentColor: '#d97706',
      borderStyle: 'coffee-shop',
      showImages: true,
      defaultSectionLayout: 'list-with-photos',
      density: 'comfortable',
    },
  },
  {
    id: 'minimal-editorial',
    name: 'Minimalist Editorial',
    category: 'Modern',
    description:
      'Monochrome precision with stark typography, dotted leaders, and zero distractions.',
    previewColors: { primary: '#171717', accent: '#525252', paper: '#ffffff' },
    settings: {
      theme: 'minimal',
      paperColor: 'white',
      fontFamily: 'mono',
      fontSize: 'medium',
      primaryColor: '#171717',
      secondaryColor: '#737373',
      accentColor: '#000000',
      borderStyle: 'minimal',
      defaultSectionLayout: 'compact-price-list',
      density: 'compact',
    },
  },
];
import { getCategoryName } from '@/features/Menu/lib/categoryUtils';
import { exportMenuPdf } from '../Components/PrintMenu/utils/exportMenuPdf';
// Dynamic import to avoid static import-time resolution issues
// Resolve either a named export `PdfPreviewModal` or a default export; fall back to a noop component
const PdfPreviewModal = React.lazy(() =>
  import('../Components/PrintMenu/PdfPreviewModal').then((m) => ({
    default: m?.PdfPreviewModal ?? m?.default ?? (() => null),
  }))
);

const STORAGE_KEY = 'rms_saved_physical_menu_design';

export const PrintMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { tableId: routeTableId } = useParams<{ tableId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId') || searchParams.get('id') || routeTableId || '';

  const currentBranchId = useSelector((state: RootState) => state.ui.currentBranchId);

  // Auto-collapse sidebar when in Physical Menu Designer mode
  useEffect(() => {
    dispatch(setSidebarCollapsed(true));
    return () => {
      dispatch(setSidebarCollapsed(false));
    };
  }, [dispatch]);

  // Data Queries (Source of truth from Menu Management & Table Management)
  const { data: allTables = [] } = useTablesQuery(currentBranchId);
  const { data: menuItems = [] } = useMenuItemsQuery();
  const { data: menuGroups = [] } = useMenuGroupsQuery();
  const { data: dbCategories = [] } = useActiveCategoriesQuery();
  const { data: merchant } = useMyMerchantQuery();

  const [selectedTableId, setSelectedTableId] = useState<string>(queryTableId);
  const [zoomLevel, setZoomLevel] = useState<number>(0.8);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeCategoryTab, setActiveCategoryTab] = useState<Record<string, 'style' | 'items'>>({});

  // Responsive mobile/tablet tabs & PDF preview modal state
  const [activeMobileTab, setActiveMobileTab] = useState<'templates' | 'preview' | 'customize'>('preview');
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('menu.pdf');
  const [previewSource, setPreviewSource] = useState<'server' | 'client'>('server');

  // Auto-set sensible initial zoom based on screen width
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) {
        setZoomLevel(0.42);
      } else if (window.innerWidth < 1024) {
        setZoomLevel(0.65);
      }
    }
  }, []);

  // ── React Hook Form + Zod Setup ──────────────────────────────────
  const initialSettings = useMemo<PrintMenuSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_PRINT_SETTINGS };
  }, []);

  const form = useForm<PrintMenuSettings>({
    defaultValues: initialSettings,
  });

  // Watch entire form state to drive preview & PDF export seamlessly
  const settings = form.watch();

  // Sync initial or updated table ID from query params or table list
  useEffect(() => {
    if (queryTableId && allTables.some((t) => t._id === queryTableId)) {
      setSelectedTableId(queryTableId);
    } else if (allTables.length > 0 && (!selectedTableId || !allTables.some((t) => t._id === selectedTableId))) {
      setSelectedTableId(allTables[0]._id);
    }
  }, [queryTableId, allTables, selectedTableId]);

  const activeTable = useMemo(() => {
    return allTables.find((t) => t._id === selectedTableId) || allTables[0] || null;
  }, [allTables, selectedTableId]);

  // Sync table scan URL into qrCodeData if empty
  useEffect(() => {
    if (activeTable) {
      const scanUrl = getTableScanUrl(activeTable);
      if (!settings.qrCodeData) {
        form.setValue('qrCodeData', scanUrl);
      }
    }
  }, [activeTable, settings.qrCodeData, form]);

  // Sync merchant business name if not customized
  useEffect(() => {
    if (merchant?.businessName && (!settings.restaurantName || settings.restaurantName === '')) {
      const addrStr =
        typeof merchant.address === 'string'
          ? merchant.address
          : merchant.address && typeof merchant.address === 'object'
          ? `${(merchant.address as any).street || ''} ${(merchant.address as any).city || ''}`.trim()
          : '';

      form.setValue('restaurantName', merchant.businessName);
      if (merchant.logo && !settings.logoUrl) form.setValue('logoUrl', merchant.logo);
      if (merchant.phone && !settings.phone) form.setValue('phone', merchant.phone);
      if (addrStr && !settings.address) form.setValue('address', addrStr);
    }
  }, [merchant, settings.restaurantName, settings.logoUrl, settings.phone, settings.address, form]);

  const handleTableChange = (newTableId: string) => {
    setSelectedTableId(newTableId);
    setSearchParams({ tableId: newTableId });
    const targetTable = allTables.find((t) => t._id === newTableId);
    if (targetTable) {
      form.setValue('qrCodeData', getTableScanUrl(targetTable));
    }
  };

  // Generic updater
  const updateSetting = <K extends keyof PrintMenuSettings>(key: K, value: PrintMenuSettings[K]) => {
    (form.setValue as any)(key, value, { shouldDirty: true });
  };

  // Save Design Draft to Local Storage
  const handleSaveDesign = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form.getValues()));
      toast.success('Menu design draft saved successfully!');
    } catch {
      toast.error('Failed to save menu design draft');
    }
  };

  // Reset to default settings
  const handleResetSettings = () => {
    form.reset({
      ...DEFAULT_PRINT_SETTINGS,
      restaurantName: merchant?.businessName || '',
      logoUrl: merchant?.logo || '',
      phone: merchant?.phone || '',
      qrCodeData: activeTable ? getTableScanUrl(activeTable) : '',
    });
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Settings reset to default');
  };

  // ── THEME PRESET PICKER HANDLER ──────────────────────────────────
  const handleApplyTheme = (theme: ThemePreset) => {
    Object.entries(theme.settings).forEach(([k, v]) => {
      form.setValue(k as any, v);
    });
    toast.success(`Applied "${theme.name}" theme preset!`);
  };

  // Print Menu Trigger
  const handlePrint = () => {
    if (!activeTable) {
      toast.error('Please select a table to print');
      return;
    }

    // Switch to preview tab on mobile/tablet so printable root is mounted in DOM
    setActiveMobileTab('preview');

    try {
      toast.info(`Preparing print for Table #${activeTable.tableNumber}...`);
      triggerCleanMenuPrint({
        containerId: 'printable-menu-root',
        settings,
      });
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
      const tableScanUrl = getTableScanUrl(activeTable);

      // Attempt server-side rendering first
      const result = await exportMenuPdf({
        settings,
        menuItems,
        categories: dbCategories,
        menuGroups,
        qrUrl: tableScanUrl,
        tableNumber: activeTable.tableNumber,
      });

      setPreviewPdfUrl(result.blobUrl);
      setPreviewFilename(result.filename);
      setPreviewSource('server');
      setPdfModalOpen(true);
      toast.success(`Menu PDF generated and saved to your Downloads folder!`, { id: toastId });
    } catch (err: any) {
      console.error('Server PDF render error:', { err, status: err?.status ?? null });

      const isTimeout = err?.status === 504;
      toast.loading(
        isTimeout
          ? 'Server rendering timed out. Generating client-side vector PDF instead...'
          : 'Server PDF endpoint unavailable. Generating client-side vector PDF...',
        { id: toastId }
      );

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
        toast.success(`Table #${activeTable.tableNumber} Menu PDF downloaded to your device!`, { id: toastId });
      } catch (fallbackErr: any) {
        console.error('Client PDF export fallback error:', fallbackErr);
        toast.error('Failed to download PDF: ' + (fallbackErr?.message || err?.message || 'Unknown error'), { id: toastId });
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Auto-fit zoom to available canvas width
  const handleFitToScreen = () => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 1280;
    const availableWidth = isMobile ? window.innerWidth - 32 : window.innerWidth - 680;
    const pixelWidth = paperDimensions.width.endsWith('mm')
      ? (parseFloat(paperDimensions.width) * 96) / 25.4
      : paperDimensions.width.endsWith('in')
      ? parseFloat(paperDimensions.width) * 96
      : parseInt(paperDimensions.width, 10) || 794;
    const targetZoom = Math.min(1.0, Math.max(0.35, Number((availableWidth / pixelWidth).toFixed(2))));
    setZoomLevel(targetZoom);
  };

  // ── Content Categorization & Hierarchy ───────────────────────────
  const rawCategorizedHierarchy = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: typeof menuItems }>();

    dbCategories.forEach((cat) => {
      const id = cat.id || cat._id || getCategoryName(cat, 'en');
      const name = getCategoryName(cat, 'en');
      map.set(id, { id, name, items: [] });
    });

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

  // Order categories according to DnD categoryOrder in settings
  const categorizedHierarchy = useMemo(() => {
    const orderList = settings.categoryOrder || [];
    if (orderList.length === 0) return rawCategorizedHierarchy;

    const orderMap = new Map<string, number>();
    orderList.forEach((id, index) => orderMap.set(id, index));

    return [...rawCategorizedHierarchy].sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
      return idxA - idxB;
    });
  }, [rawCategorizedHierarchy, settings.categoryOrder]);

  // ── DnD Sensor & Reorder Handlers ─────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categorizedHierarchy.findIndex((c) => c.id === active.id);
    const newIndex = categorizedHierarchy.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(categorizedHierarchy, oldIndex, newIndex);
      const newOrderIds = reordered.map((c) => c.id);
      form.setValue('categoryOrder', newOrderIds);
      toast.success('Section order updated');
    }
  };

  // Category Selection Handlers
  const handleToggleCategory = (catId: string, categoryItemIds: string[]) => {
    const selectedCats = new Set(settings.selectedCategoryIds || []);
    const selectedItems = new Set(settings.selectedMenuItemIds || []);

    const isCurrentlySelected = selectedCats.has(catId);

    if (isCurrentlySelected) {
      selectedCats.delete(catId);
      categoryItemIds.forEach((id) => selectedItems.delete(id));
    } else {
      selectedCats.add(catId);
      categoryItemIds.forEach((id) => selectedItems.add(id));
    }

    form.setValue('selectedCategoryIds', Array.from(selectedCats));
    form.setValue('selectedMenuItemIds', Array.from(selectedItems));
  };

  const handleToggleMenuItem = (itemId: string, catId: string) => {
    const selectedItems = new Set(settings.selectedMenuItemIds || []);
    const selectedCats = new Set(settings.selectedCategoryIds || []);

    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId);
    } else {
      selectedItems.add(itemId);
      selectedCats.add(catId);
    }

    form.setValue('selectedCategoryIds', Array.from(selectedCats));
    form.setValue('selectedMenuItemIds', Array.from(selectedItems));
  };

  const handleSelectAllContent = () => {
    const allCatIds = dbCategories.map((c) => c.id || c._id || getCategoryName(c, 'en'));
    const allItemIds = menuItems.map((m) => m._id);

    form.setValue('selectedCategoryIds', allCatIds);
    form.setValue('selectedMenuItemIds', allItemIds);
    toast.success('All categories and menu items selected');
  };

  const handleDeselectAllContent = () => {
    form.setValue('selectedCategoryIds', []);
    form.setValue('selectedMenuItemIds', []);
    toast.info('Deselected all menu items');
  };

  const toggleCategoryExpanded = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // ── Per-Section Config Updater ────────────────────────────────────
  const updateSectionConfig = (
    catId: string,
    updates: Partial<typeof DEFAULT_SECTION_CONFIG>
  ) => {
    const current = settings.sectionConfigs?.[catId] || {
      ...DEFAULT_SECTION_CONFIG,
      layout: settings.defaultSectionLayout || 'list-with-photos',
      showPhotos: settings.showImages,
    };

    form.setValue('sectionConfigs', {
      ...settings.sectionConfigs,
      [catId]: { ...current, ...updates },
    });
  };

  // ── Slot-based Branding Updater ───────────────────────────────────
  const updateBrandingSlot = (
    element: 'logo' | 'qrCode' | 'tableNumber' | 'tagline',
    field: 'visible' | 'position',
    value: any
  ) => {
    const current = settings.brandingSlots || {
      logo: { visible: true, position: 'top-left' },
      qrCode: { visible: true, position: 'top-right' },
      tableNumber: { visible: true, position: 'top-right' },
      tagline: { visible: true, position: 'top-left' },
    };

    form.setValue('brandingSlots', {
      ...current,
      [element]: {
        ...current[element],
        [field]: value,
      },
    });
  };

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
      {/* ── Top Header Toolbar ──────────────────────────────────────── */}
      <header className="min-h-14 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tables')}
            className="h-8 px-2 sm:px-3 gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Tables</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Physical Menu Designer
            </h1>
            <Badge
              variant="secondary"
              className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 hidden xs:inline-flex"
            >
              V2.5
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap ml-auto">
          {/* Active Table Selector */}
          {allTables.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-500 hidden lg:inline">Table:</span>
              <Select value={selectedTableId} onValueChange={handleTableChange}>
                <SelectTrigger className="h-8 text-xs font-bold w-[110px] sm:w-[140px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
            className="h-8 px-2.5 sm:px-3 text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 gap-1.5"
            title="Save Draft Design"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Save Draft</span>
          </Button>

          {/* Generate PDF */}
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !activeTable}
            size="sm"
            className="h-8 px-2.5 sm:px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white gap-1.5 shadow-xs"
            title="Generate high-resolution printable PDF"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Generate PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>

          {/* Quick Print */}
          <Button
            onClick={handlePrint}
            disabled={!activeTable}
            size="sm"
            className="h-8 px-2.5 sm:px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
            title="Print Menu"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print Menu</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </header>

      {/* ── Responsive View Switcher for Mobile & Tablet (< xl) ─────── */}
      <div className="xl:hidden flex items-center justify-around p-1.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 gap-1 flex-shrink-0 z-20">
        <button
          type="button"
          onClick={() => setActiveMobileTab('templates')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
            activeMobileTab === 'templates'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
            activeMobileTab === 'preview'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" />
          <span>Live Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab('customize')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
            activeMobileTab === 'customize'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Customize</span>
        </button>
      </div>

      {/* ── 3-Pane Workspace Body ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── PANE 1: Left Sidebar - Base Template Selection (w-64) ──── */}
        <aside
          className={`w-full xl:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col h-full flex-shrink-0 overflow-y-auto ${
            activeMobileTab === 'templates' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Templates ({AVAILABLE_TEMPLATES.length})
            </h2>
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-500">
              Pick Base
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
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-xs z-10">
                      <Check className="h-3 w-3" />
                    </div>
                  )}

                  <div className="h-20 bg-slate-100 dark:bg-slate-800 p-2.5 flex flex-col gap-1.5 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="h-2.5 w-1/2 bg-slate-300 dark:bg-slate-700 rounded-sm" />
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

                  <div className="p-2.5">
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
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── PANE 2: Center Canvas - Live Paper Preview ─────────────── */}
        <section
          className={`flex-1 bg-slate-200/70 dark:bg-slate-950 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex-col items-center justify-start relative select-none ${
            activeMobileTab === 'preview' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          {/* Zoom Controls Toolbar */}
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
              onClick={handleFitToScreen}
              className="px-2 py-1 text-[11px] font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Fit to Screen"
            >
              Fit
            </button>

            <button
              onClick={() => setZoomLevel(1.0)}
              className="px-2 py-1 text-[11px] font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              100%
            </button>
          </div>

          {/* Scaled Printable Paper Root */}
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

        {/* ── PANE 3: Right Sidebar - Customization Engine (w-88) ────── */}
        <aside
          className={`w-full xl:w-88 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col h-full flex-shrink-0 overflow-y-auto ${
            activeMobileTab === 'customize' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
              <span>Menu Customization</span>
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
            {/* ── 1. THEME PRESETS ──────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-blue-600" />
                  <span>Theme Presets</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-400">1-Click Style</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {MENU_THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyTheme(preset)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 text-left transition-all group flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: preset.previewColors.primary }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: preset.previewColors.accent }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: preset.previewColors.paper }}
                      />
                      <span className="text-[9px] font-bold text-slate-400 ml-auto uppercase">
                        {preset.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* ── 2. REORDERABLE SECTIONS & PER-SECTION STYLING (DnD) ── */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    <span>Sections & Layouts</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Drag handle to reorder sections</p>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <button onClick={handleSelectAllContent} className="text-blue-600 font-bold hover:underline">
                    All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button onClick={handleDeselectAllContent} className="text-slate-400 font-medium hover:text-slate-600">
                    Clear
                  </button>
                </div>
              </div>

              {/* DnD Context for Category Ordering */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext
                  items={categorizedHierarchy.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categorizedHierarchy.map((category) => {
                      const catItemIds = category.items.map((i) => i._id);
                      const isCatSelected =
                        (settings.selectedCategoryIds || []).length === 0 ||
                        settings.selectedCategoryIds.includes(category.id);

                      const selectedItemsCount = category.items.filter(
                        (i) =>
                          (settings.selectedMenuItemIds || []).length === 0 ||
                          settings.selectedMenuItemIds.includes(i._id)
                      ).length;

                      const isExpanded = !!expandedCategories[category.id];
                      const activeTab = activeCategoryTab[category.id] || 'style';
                      const sectionConf = settings.sectionConfigs?.[category.id] || {
                        ...DEFAULT_SECTION_CONFIG,
                        layout: settings.defaultSectionLayout || 'list-with-photos',
                        showPhotos: settings.showImages,
                      };

                      return (
                        <SortableCategoryCard
                          key={category.id}
                          id={category.id}
                          category={category}
                          isCatSelected={isCatSelected}
                          selectedItemsCount={selectedItemsCount}
                          isExpanded={isExpanded}
                          activeTab={activeTab}
                          sectionConf={sectionConf}
                          currencySymbol={settings.currencySymbol}
                          selectedMenuItemIds={settings.selectedMenuItemIds || []}
                          onToggleCategory={() => handleToggleCategory(category.id, catItemIds)}
                          onToggleExpand={() => toggleCategoryExpanded(category.id)}
                          onTabChange={(tab) =>
                            setActiveCategoryTab((prev) => ({ ...prev, [category.id]: tab }))
                          }
                          onUpdateSectionConfig={(updates) => updateSectionConfig(category.id, updates)}
                          onToggleItem={(itemId) => handleToggleMenuItem(itemId, category.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* ── 3. SLOT-BASED BRANDING & POSITIONS ─────────────────── */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                <span>Slot-Based Branding</span>
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                Choose which slot each element occupies (Top Left, Center, Top Right, or Footer).
              </p>

              <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {/* Logo Slot */}
                <SlotRow
                  title="Restaurant Logo"
                  visible={settings.brandingSlots?.logo?.visible ?? true}
                  position={settings.brandingSlots?.logo?.position || 'top-left'}
                  onToggleVisible={(v) => updateBrandingSlot('logo', 'visible', v)}
                  onChangePosition={(pos) => updateBrandingSlot('logo', 'position', pos)}
                />

                {/* Scannable QR Code */}
                <SlotRow
                  title="Table QR Code"
                  visible={settings.brandingSlots?.qrCode?.visible ?? true}
                  position={settings.brandingSlots?.qrCode?.position || 'top-right'}
                  onToggleVisible={(v) => updateBrandingSlot('qrCode', 'visible', v)}
                  onChangePosition={(pos) => updateBrandingSlot('qrCode', 'position', pos)}
                />

                {/* Table Number Badge */}
                <SlotRow
                  title="Table Number"
                  visible={settings.brandingSlots?.tableNumber?.visible ?? true}
                  position={settings.brandingSlots?.tableNumber?.position || 'top-right'}
                  onToggleVisible={(v) => updateBrandingSlot('tableNumber', 'visible', v)}
                  onChangePosition={(pos) => updateBrandingSlot('tableNumber', 'position', pos)}
                />

                {/* Tagline / Subtitle */}
                <SlotRow
                  title="Tagline / Motto"
                  visible={settings.brandingSlots?.tagline?.visible ?? true}
                  position={settings.brandingSlots?.tagline?.position || 'top-left'}
                  onToggleVisible={(v) => updateBrandingSlot('tagline', 'visible', v)}
                  onChangePosition={(pos) => updateBrandingSlot('tagline', 'position', pos)}
                />

                {/* Encoded QR Code URL Payload */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                    QR Code URL Target (qrCodeData)
                  </Label>
                  <Input
                    value={settings.qrCodeData || ''}
                    onChange={(e) => updateSetting('qrCodeData', e.target.value)}
                    placeholder="https://restoflow.app/tables/101/order"
                    className="h-7 text-xs font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    Encoded into physical QR print for instant customer mobile ordering.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* ── 4. DOCUMENT SETUP & TYPOGRAPHY ─────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Document Paper & Fonts
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Paper Tone
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
                      <SelectItem value="cinzel" className="text-xs">Luxury Serif (Cinzel)</SelectItem>
                      <SelectItem value="mono" className="text-xs">Editorial Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* ── 5. GLOBAL CONTENT TOGGLES ──────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Global Elements & Badges
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
                    Global Item Photos
                  </span>
                  <Switch
                    checked={settings.showImages}
                    onCheckedChange={(checked) => updateSetting('showImages', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dietary & Spicy Badges
                  </span>
                  <Switch
                    checked={settings.showDietary}
                    onCheckedChange={(checked) => updateSetting('showDietary', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amharic / Bilingual Names
                  </span>
                  <Switch
                    checked={settings.showAmharic}
                    onCheckedChange={(checked) => updateSetting('showAmharic', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* ── 6. BRANDING & FOOTER TEXT ──────────────────────────── */}
            <div className="space-y-3 pb-6">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Restaurant Info & Notes
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

      {/* ── Generated Menu PDF Preview & Actions Modal ───────────────── */}
      <React.Suspense fallback={null}>
        <PdfPreviewModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          pdfBlobUrl={previewPdfUrl}
          filename={previewFilename}
          tableNumber={activeTable?.tableNumber}
          source={previewSource}
        />
      </React.Suspense>
    </div>
  );
};

// ── SORTABLE CATEGORY COMPONENT ──────────────────────────────────────
interface SortableCategoryCardProps {
  id: string;
  category: { id: string; name: string; items: any[] };
  isCatSelected: boolean;
  selectedItemsCount: number;
  isExpanded: boolean;
  activeTab: 'style' | 'items';
  sectionConf: typeof DEFAULT_SECTION_CONFIG;
  currencySymbol: string;
  selectedMenuItemIds: string[];
  onToggleCategory: () => void;
  onToggleExpand: () => void;
  onTabChange: (tab: 'style' | 'items') => void;
  onUpdateSectionConfig: (updates: Partial<typeof DEFAULT_SECTION_CONFIG>) => void;
  onToggleItem: (itemId: string) => void;
}

const SortableCategoryCard: React.FC<SortableCategoryCardProps> = ({
  id,
  category,
  isCatSelected,
  selectedItemsCount,
  isExpanded,
  activeTab,
  sectionConf,
  currencySymbol,
  selectedMenuItemIds,
  onToggleCategory,
  onToggleExpand,
  onTabChange,
  onUpdateSectionConfig,
  onToggleItem,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden bg-white dark:bg-slate-900 transition-all ${
        isDragging
          ? 'ring-2 ring-blue-500 shadow-md z-20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Category Header Bar with Grab Handle */}
      <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between gap-2 border-b border-slate-200/50 dark:border-slate-800">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          title="Drag to reorder section"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isCatSelected}
            onChange={onToggleCategory}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {category.name}
          </span>
        </label>

        {/* Current Layout Badge */}
        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
          {sectionConf.layout === 'grid-2col'
            ? 'Grid'
            : sectionConf.layout === 'compact-price-list'
            ? 'Compact'
            : 'List'}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/60 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {selectedItemsCount}/{category.items.length}
          </span>
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls: Section Style vs Items */}
      {isExpanded && (
        <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Sub-tabs inside Section: Section Style vs Dish Curation */}
          <div className="flex border-b border-slate-150 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onTabChange('style')}
              className={`pb-1 px-2 border-b-2 transition-colors ${
                activeTab === 'style'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Section Layout & Style
            </button>
            <button
              type="button"
              onClick={() => onTabChange('items')}
              className={`pb-1 px-2 border-b-2 transition-colors ${
                activeTab === 'items'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Dishes ({category.items.length})
            </button>
          </div>

          {activeTab === 'style' ? (
            /* ── Per-Section Customization Controls ── */
            <div className="space-y-3 pt-1">
              {/* Layout Style Picker */}
              <div>
                <Label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Layout Style
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSectionConfig({ layout: 'list-with-photos' })}
                    className={`py-1.5 px-2 rounded border text-center flex flex-col items-center gap-1 transition-all ${
                      sectionConf.layout === 'list-with-photos'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="text-[10px] leading-tight">List</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSectionConfig({ layout: 'grid-2col' })}
                    className={`py-1.5 px-2 rounded border text-center flex flex-col items-center gap-1 transition-all ${
                      sectionConf.layout === 'grid-2col'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="text-[10px] leading-tight">2-Col Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSectionConfig({ layout: 'compact-price-list' })}
                    className={`py-1.5 px-2 rounded border text-center flex flex-col items-center gap-1 transition-all ${
                      sectionConf.layout === 'compact-price-list'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <AlignJustify className="h-3.5 w-3.5" />
                    <span className="text-[10px] leading-tight">Compact Dots</span>
                  </button>
                </div>
              </div>

              {/* Background Tint & Divider Style */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Background Tint
                  </Label>
                  <Select
                    value={sectionConf.backgroundTint || 'none'}
                    onValueChange={(val) => onUpdateSectionConfig({ backgroundTint: val })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None (Transparent)</SelectItem>
                      <SelectItem value="subtle" className="text-xs">Subtle Shade</SelectItem>
                      <SelectItem value="card" className="text-xs">Card Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Divider Style
                  </Label>
                  <Select
                    value={sectionConf.dividerStyle || 'line'}
                    onValueChange={(val) => onUpdateSectionConfig({ dividerStyle: val as SectionDividerStyle })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line" className="text-xs">Solid Line</SelectItem>
                      <SelectItem value="dashed" className="text-xs">Dashed Line</SelectItem>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Spacing Density & Photo Toggle */}
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Density
                  </Label>
                  <Select
                    value={sectionConf.density || 'normal'}
                    onValueChange={(val) => onUpdateSectionConfig({ density: val as SectionSpacingDensity })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="relaxed" className="text-xs">Relaxed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Photos
                  </span>
                  <Switch
                    checked={sectionConf.showPhotos ?? true}
                    onCheckedChange={(checked) => onUpdateSectionConfig({ showPhotos: checked })}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Dish Checklist ── */
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {category.items.map((item) => {
                const isItemSelected =
                  selectedMenuItemIds.length === 0 || selectedMenuItemIds.includes(item._id);

                return (
                  <label
                    key={item._id}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isItemSelected}
                        onChange={() => onToggleItem(item._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {typeof item.name === 'string'
                          ? item.name
                          : item.name?.en || (item.name as any)?.am || 'Menu Item'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold tabular-nums ml-2">
                      {item.price} {currencySymbol}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── SLOT ROW CONTROLLER ──────────────────────────────────────────────
interface SlotRowProps {
  title: string;
  visible: boolean;
  position: BrandingSlotPosition;
  onToggleVisible: (v: boolean) => void;
  onChangePosition: (pos: BrandingSlotPosition) => void;
}

const SlotRow: React.FC<SlotRowProps> = ({
  title,
  visible,
  position,
  onToggleVisible,
  onChangePosition,
}) => {
  const positions: { key: BrandingSlotPosition; label: string }[] = [
    { key: 'top-left', label: 'TL' },
    { key: 'top-center', label: 'TC' },
    { key: 'top-right', label: 'TR' },
    { key: 'footer', label: 'Foot' },
  ];

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Switch checked={visible} onCheckedChange={onToggleVisible} />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0">
        {positions.map((p) => {
          const isSelected = position === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={!visible}
              onClick={() => onChangePosition(p.key)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              } ${!visible ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={`Position: ${p.key}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PrintMenuPage;
