// src/features/Table/Components/PrintMenu/utils/exportMenuPdf.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import type { PrintMenuSettings, FontFamily, FontSize } from '../types';
import {
  renderMenuPdf,
  getRenderPdfEndpoint,
  type MenuItem,
  type MenuGroup,
} from '@/api/Queries/menuQueries';
export { getRenderPdfEndpoint };
import type { Category } from '@/api/Queries/categoryQueries';
import {
  filterAndGroupMenuData,
  type ProcessedCategory,
} from './templateUtils';

// ── Typed Backend Error ──────────────────────────────────────────
export class RenderPdfError extends Error {
  public status: number;
  public code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'RenderPdfError';
    this.status = status;
    this.code = code;
  }
}

// ── Backend PDF Render Specification Interfaces ──────────────────
export interface MenuPdfFontConfig {
  family: string;
  size: number;
  weight: number;
}

export interface MenuPdfItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
  isPopular?: boolean;
  tags?: string[];
  imageUrl?: string;
  photoUrl?: string;
  variants?: Array<{ name: string; price: number }>;
}

export interface MenuPdfCategory {
  name: string;
  layout: 'grid-2col' | 'list-with-photos' | 'compact-price-list' | string;
  backgroundTint?: 'none' | 'subtle' | 'card' | string;
  dividerStyle?: 'line' | 'dashed' | 'none' | string;
  density?: 'compact' | 'normal' | 'relaxed' | string;
  items: MenuPdfItem[];
}

export interface MenuPdfBranding {
  name: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  location?: string;
  accent?: string;
}

export interface MenuPdfColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface MenuPdfMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Top-level payload required by POST /api/v1/menu/render-pdf
 */
export interface MenuPdfPayload {
  templateId?: string;
  paperSize: 'a4' | 'a5' | 'letter' | 'legal' | 'tabloid' | string;
  orientation: 'portrait' | 'landscape' | string;
  title: string;
  subtitle?: string;
  branding: MenuPdfBranding;
  colors: MenuPdfColors;
  fonts: {
    heading: MenuPdfFontConfig;
    body: MenuPdfFontConfig;
    accent: MenuPdfFontConfig;
  };
  margins: MenuPdfMargins;
  categories: MenuPdfCategory[];
  items: MenuPdfItem[];
  qrCodeData: string;
}

export interface ExportMenuPdfOptions {
  settings: PrintMenuSettings;
  menuItems?: MenuItem[];
  categories?: Category[];
  menuGroups?: MenuGroup[];
  processedCategories?: ProcessedCategory[];
  qrUrl?: string;
  tableNumber?: string | number;
}

/**
 * Retrieve auth token from client storage if available (optional for public endpoint)
 */
export function getAuthToken(): string | null {
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    sessionStorage.getItem('jwtToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('auth_token') ||
    Cookies.get('jwt') ||
    Cookies.get('token') ||
    Cookies.get('auth_token') ||
    null
  );
}


/**
 * Maps font family and font size settings into font configurations with numeric weights
 */
function mapFonts(fontFamily: FontFamily, fontSize: FontSize) {
  let familyStr = 'Noto Sans';
  if (fontFamily === 'serif' || fontFamily === 'cinzel' || fontFamily === 'playfair') {
    familyStr = 'Noto Serif';
  } else if (fontFamily === 'mono') {
    familyStr = 'monospace';
  }

  if (fontSize === 'small') {
    return {
      heading: { family: familyStr, size: 18, weight: 700 },
      body: { family: familyStr, size: 12, weight: 400 },
      accent: { family: familyStr, size: 11, weight: 600 },
    };
  }

  if (fontSize === 'large') {
    return {
      heading: { family: familyStr, size: 26, weight: 700 },
      body: { family: familyStr, size: 16, weight: 400 },
      accent: { family: familyStr, size: 14, weight: 600 },
    };
  }

  // default 'medium'
  return {
    heading: { family: familyStr, size: 22, weight: 700 },
    body: { family: familyStr, size: 14, weight: 400 },
    accent: { family: familyStr, size: 12, weight: 600 },
  };
}

/**
 * Maps colors based on primary, secondary, accent, and paper tones
 */
function mapColors(settings: PrintMenuSettings): MenuPdfColors {
  const isDark = settings.paperColor === 'dark-slate';
  const background =
    settings.paperColor === 'cream'
      ? '#fdfaf2'
      : settings.paperColor === 'warm-white'
      ? '#faf9f6'
      : settings.paperColor === 'light-beige'
      ? '#f5f0e6'
      : isDark
      ? '#0f172a'
      : '#ffffff';

  const text = isDark ? '#f8fafc' : settings.primaryColor || '#111827';
  const border = isDark ? '#334155' : '#e5e7eb';

  return {
    primary: settings.primaryColor || '#1f2937',
    secondary: settings.secondaryColor || '#0f172a',
    accent: settings.accentColor || '#f59e0b',
    background,
    text,
    border,
  };
}

/**
 * Normalizes layout type to backend-supported values:
 * 'grid-2col' | 'list-with-photos' | 'compact-price-list'
 */
function normalizeLayout(layout?: string): 'grid-2col' | 'list-with-photos' | 'compact-price-list' {
  if (!layout) return 'list-with-photos';
  if (layout.includes('grid')) return 'grid-2col';
  if (layout.includes('compact') || layout.includes('price')) return 'compact-price-list';
  return 'list-with-photos';
}

/**
 * Normalizes density to 'compact' | 'normal' | 'relaxed'
 */
function normalizeDensity(density?: string): 'compact' | 'normal' | 'relaxed' {
  if (density === 'compact' || density === 'relaxed') return density;
  return 'normal';
}

/**
 * Normalizes paper size to backend supported keys:
 * 'a4' | 'a5' | 'letter' | 'legal' | 'tabloid'
 */
function normalizePaperSize(paperSize?: string): 'a4' | 'a5' | 'letter' | 'legal' | 'tabloid' {
  const lower = (paperSize || 'a4').toLowerCase();
  if (lower.includes('a5')) return 'a5';
  if (lower.includes('letter')) return 'letter';
  if (lower.includes('legal')) return 'legal';
  if (lower.includes('tabloid')) return 'tabloid';
  return 'a4';
}

/**
 * Builds the top-level structured backend payload as specified in:
 * POST /api/v1/menu/render-pdf
 */
export function buildMenuPdfPayload({
  settings,
  menuItems = [],
  categories = [],
  menuGroups = [],
  processedCategories: preProcessed,
  qrUrl,
}: ExportMenuPdfOptions): MenuPdfPayload {
  // 1. Resolve actual categories and items
  const resolvedCategories: ProcessedCategory[] =
    preProcessed ||
    filterAndGroupMenuData({
      menuItems,
      categories,
      menuGroups,
      settings,
    });

  const allItems: MenuPdfItem[] = [];

  // 2. Map categories & items with real names, descriptions, prices, tags, images
  const mappedCategories: MenuPdfCategory[] = resolvedCategories.map((cat) => {
    const sectionConf = settings.sectionConfigs?.[cat.id];
    const rawLayout = sectionConf?.layout || settings.defaultSectionLayout;
    const layout = normalizeLayout(rawLayout);
    const density = normalizeDensity(sectionConf?.density);
    const backgroundTint = (sectionConf?.backgroundTint as 'none' | 'subtle' | 'card') || 'none';
    const dividerStyle = (sectionConf?.dividerStyle as 'line' | 'dashed' | 'none') || 'line';

    const items: MenuPdfItem[] = cat.items.map((item) => {
      const imgUrl = item.image || '';
      const mappedItem: MenuPdfItem = {
        name: item.name,
        description: settings.showDescriptions ? item.description : undefined,
        price: settings.showPrices
          ? typeof item.price === 'number'
            ? item.price
            : parseFloat(String(item.price || 0)) || 0
          : 0,
        category: cat.name,
        isPopular: Boolean(item.isPopular || item.tags?.includes('Popular')),
        tags: settings.showDietary ? item.tags : [],
        imageUrl: imgUrl || undefined,
        photoUrl: imgUrl || undefined,
        variants: item.variants?.map((v) => ({
          name: v.name,
          price: typeof v.price === 'number' ? v.price : parseFloat(String(v.price || 0)) || 0,
        })),
      };
      allItems.push(mappedItem);
      return mappedItem;
    });

    return {
      name: cat.name,
      layout,
      backgroundTint,
      dividerStyle,
      density,
      items,
    };
  });

  // 3. QR code data
  const qrCodeData = qrUrl || settings.qrCodeData || 'https://restaurant.com/menu';

  return {
    templateId: settings.templateId || 'default-menu',
    paperSize: normalizePaperSize(settings.paperSize),
    orientation: settings.orientation === 'landscape' ? 'landscape' : 'portrait',
    title: settings.restaurantName || 'Restaurant Menu',
    subtitle: settings.tagline || settings.subTitle || 'Fresh cuisine',
    branding: {
      name: settings.restaurantName || 'Restaurant Name',
      logoUrl: settings.showLogo && settings.logoUrl ? settings.logoUrl : undefined,
      coverImageUrl: (settings as any).coverImageUrl || undefined,
      phone: settings.phone || undefined,
      location: settings.address || undefined,
      accent: settings.accentColor || '#f59e0b',
    },
    colors: mapColors(settings),
    fonts: mapFonts(settings.fontFamily, settings.fontSize),
    margins: {
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
    },
    categories: mappedCategories,
    items: allItems,
    qrCodeData,
  };
}

export interface ExportMenuPdfResult {
  blob: Blob;
  blobUrl: string;
  filename: string;
  source: 'server';
}

/**
 * Sends POST /api/v1/menu/render-pdf, handles errors/timeouts, and triggers browser download
 * Strictly executes backend PDF rendering.
 */
export async function exportMenuPdf(options: ExportMenuPdfOptions): Promise<ExportMenuPdfResult> {
  const payload = buildMenuPdfPayload(options);
  let blob: Blob | null = null;

  // Primary execution: Attempt sending payload via menuQueries renderMenuPdf
  const sendRequest = async (body: any) => {
    return await renderMenuPdf(body);
  };

  try {
    // 1. Send top-level payload (Standard schema in summary)
    blob = await sendRequest(payload);
  } catch (primaryErr: any) {
    // If backend reports 400 "Invalid settings payload", try wrapping in { settings: payload }
    let serverMsg = primaryErr?.message;
    let serverCode = primaryErr?.code;
    let status = primaryErr?.response?.status;

    if (primaryErr?.response?.data instanceof Blob) {
      try {
        const text = await primaryErr.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed.error) serverMsg = parsed.error;
        if (parsed.message) serverMsg = parsed.message;
        if (parsed.code) serverCode = parsed.code;
      } catch {
        // ignore
      }
    }

    if (status === 400 && typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('settings')) {
      try {
        blob = await sendRequest({ settings: payload });
      } catch (retryErr: any) {
        throw new RenderPdfError(400, 'Invalid menu configuration: ' + (retryErr?.message || serverMsg), 'BAD_REQUEST');
      }
    } else if (status === 504 || primaryErr.code === 'ECONNABORTED') {
      throw new RenderPdfError(
        504,
        'PDF render timed out while generating menu preview. Try reducing menu items or content size.',
        'TIMEOUT'
      );
    } else if (status === 400) {
      throw new RenderPdfError(400, serverMsg || 'Invalid menu data payload.', serverCode || 'BAD_REQUEST');
    } else if (status === 401 || status === 403) {
      throw new RenderPdfError(status, serverMsg || 'Authentication required by server.', 'UNAUTHORIZED');
    } else {
      throw new RenderPdfError(
        status || 500,
        serverMsg || 'Backend PDF rendering failed. Please check backend server status.',
        serverCode || 'SERVER_ERROR'
      );
    }
  }

  if (!blob) {
    throw new RenderPdfError(500, 'Backend PDF render service returned an empty file.');
  }

  // Trigger browser download
  const safeName = (options.settings.restaurantName || 'restaurant')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const tablePart = options.tableNumber ? `-table-${options.tableNumber}` : '';
  const filename = `${safeName}${tablePart}-menu-${dateStr}.pdf`;

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  return {
    blob,
    blobUrl: downloadUrl,
    filename,
    source: 'server',
  };
}

/**
 * React hook providing a reactive loading state & trigger function for buttons
 */
export function useExportMenuPdf() {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<RenderPdfError | null>(null);

  const triggerExport = useCallback(async (options: ExportMenuPdfOptions): Promise<ExportMenuPdfResult> => {
    setIsExporting(true);
    setError(null);
    try {
      const result = await exportMenuPdf(options);
      return result;
    } catch (err: any) {
      setError(err instanceof RenderPdfError ? err : new RenderPdfError(500, err?.message || 'Export failed'));
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportMenuPdf: triggerExport,
    isExporting,
    error,
  };
}

