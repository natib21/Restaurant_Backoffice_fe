// src/features/Table/Components/PrintMenu/utils/exportMenuPdf.ts
import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import type { PrintMenuSettings, FontFamily, FontSize } from '../types';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import {
  filterAndGroupMenuData,
  formatPrice,
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

// ── Payload Shape Required by POST /api/v1/menu/render-pdf ────────
export interface MenuPdfFontConfig {
  family: string;
  size: number;
  weight: string;
}

export interface MenuPdfPayload {
  settings: {
    title: string;
    subtitle?: string;
    paperSize: string;
    orientation: string;
    qrCodeData: string;
    branding: {
      name: string;
      logoUrl?: string;
      phone?: string;
      location?: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      border: string;
    };
    fonts: {
      heading: MenuPdfFontConfig;
      body: MenuPdfFontConfig;
      accent: MenuPdfFontConfig;
    };
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    categories: Array<{
      id?: string;
      name: string;
      amharicName?: string;
      description?: string;
      layout?: string;
      items: Array<{
        id?: string;
        name: string;
        amharicName?: string;
        description?: string;
        price: number;
        formattedPrice?: string;
        tags?: string[];
        image?: string;
        variants?: Array<{ name: string; price: number }>;
      }>;
    }>;
  };
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
 * Retrieve auth token from all possible client storage locations
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
 * Determine full endpoint URL for PDF rendering
 */
export function getRenderPdfEndpoint(): string {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    return '/api/v1/menu/render-pdf';
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/api')) {
    return `${cleanBase}/v1/menu/render-pdf`;
  }
  if (cleanBase.endsWith('/api/v1')) {
    return `${cleanBase}/menu/render-pdf`;
  }
  return `${cleanBase}/api/v1/menu/render-pdf`;
}

/**
 * Maps font family and font size settings into font configurations
 */
function mapFonts(fontFamily: FontFamily, fontSize: FontSize) {
  let familyStr = "'Noto Sans', sans-serif";
  if (fontFamily === 'serif') {
    familyStr = "'Noto Serif', Georgia, serif";
  } else if (fontFamily === 'cinzel') {
    familyStr = "'Cinzel', 'Noto Serif', serif";
  } else if (fontFamily === 'playfair') {
    familyStr = "'Playfair Display', 'Noto Serif', serif";
  } else if (fontFamily === 'mono') {
    familyStr = "monospace";
  } else if (fontFamily === 'inter') {
    familyStr = "'Inter', 'Noto Sans', sans-serif";
  }

  if (fontSize === 'small') {
    return {
      heading: { family: familyStr, size: 18, weight: '700' },
      body: { family: familyStr, size: 12, weight: '400' },
      accent: { family: familyStr, size: 11, weight: '600' },
    };
  }

  if (fontSize === 'large') {
    return {
      heading: { family: familyStr, size: 26, weight: '700' },
      body: { family: familyStr, size: 16, weight: '400' },
      accent: { family: familyStr, size: 14, weight: '600' },
    };
  }

  // default 'medium'
  return {
    heading: { family: familyStr, size: 22, weight: '700' },
    body: { family: familyStr, size: 14, weight: '400' },
    accent: { family: familyStr, size: 12, weight: '600' },
  };
}

/**
 * Maps colors based on primary, secondary, accent, and paper tones
 */
function mapColors(settings: PrintMenuSettings) {
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

  const text = isDark ? '#f8fafc' : settings.primaryColor || '#091426';
  const border = isDark ? '#334155' : '#e2e8f0';

  return {
    primary: settings.primaryColor || '#091426',
    secondary: settings.secondaryColor || '#64748b',
    accent: settings.accentColor || '#2170e4',
    background,
    text,
    border,
  };
}

/**
 * Builds the structured backend payload expected by POST /api/v1/menu/render-pdf
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

  // 2. Map categories & items with real names, descriptions, prices, tags
  const mappedCategories = resolvedCategories.map((cat) => {
    const sectionConf = settings.sectionConfigs?.[cat.id];
    const layout = sectionConf?.layout || settings.defaultSectionLayout || 'list-with-photos';
    const showPhotos = sectionConf?.showPhotos !== undefined ? sectionConf.showPhotos : settings.showImages;

    return {
      id: cat.id,
      name: cat.name,
      amharicName: settings.showAmharic ? cat.amName : undefined,
      description: settings.showCategoryDescriptions ? cat.description : undefined,
      layout,
      items: cat.items.map((item) => ({
        id: item.id,
        name: item.name,
        amharicName: settings.showAmharic ? item.amName : undefined,
        description: settings.showDescriptions ? item.description : undefined,
        price: settings.showPrices ? item.price : 0,
        formattedPrice: formatPrice(item.price, settings.currencySymbol),
        tags: settings.showDietary ? item.tags : [],
        image: showPhotos ? item.image : undefined,
        variants: item.variants,
      })),
    };
  });

  // 3. Fallback QR code data
  const qrCodeData = qrUrl || settings.qrCodeData || 'https://restoflow.app/order';

  return {
    settings: {
      title: settings.restaurantName || 'Restaurant Menu',
      subtitle: settings.tagline || settings.subTitle || undefined,
      paperSize: settings.paperSize || 'a4',
      orientation: settings.orientation || 'portrait',
      qrCodeData,
      branding: {
        name: settings.restaurantName || 'Restaurant',
        logoUrl: settings.showLogo ? settings.logoUrl : undefined,
        phone: settings.phone || undefined,
        location: settings.address || undefined,
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
    },
  };
}

export interface ExportMenuPdfResult {
  blob: Blob;
  blobUrl: string;
  filename: string;
  source: 'server' | 'client';
}

/**
 * Sends POST /api/v1/menu/render-pdf, handles errors/timeouts, and triggers browser download
 */
export async function exportMenuPdf(options: ExportMenuPdfOptions): Promise<ExportMenuPdfResult> {
  const payload = buildMenuPdfPayload(options);
  const endpoint = getRenderPdfEndpoint();
  const token = getAuthToken();

  // Log endpoint and payload for debugging in browser console
  try {
    // eslint-disable-next-line no-console
    console.log('exportMenuPdf: endpoint', endpoint);
    // eslint-disable-next-line no-console
    console.log('exportMenuPdf: payload', payload);
  } catch (e) {
    // ignore logging errors
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/pdf',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      credentials: 'include', // Ensures HttpOnly auth cookies are sent
      body: JSON.stringify(payload),
    });
  } catch (networkError: any) {
    throw new RenderPdfError(
      0,
      networkError?.message || 'Network error: Failed to connect to PDF render service.',
      'NETWORK_ERROR'
    );
  }

  if (!response.ok) {
    let errorData: { message?: string; code?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      // Body may not be valid JSON
    }

    if (response.status === 504) {
      throw new RenderPdfError(
        504,
        errorData.message || 'Rendering timed out — try again or reduce content size.',
        errorData.code || 'TIMEOUT'
      );
    }

    if (response.status === 400) {
      throw new RenderPdfError(
        400,
        errorData.message || 'Invalid menu configuration or payload parameters.',
        errorData.code || 'BAD_REQUEST'
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new RenderPdfError(
        response.status,
        errorData.message || 'Authentication required to render menu PDF.',
        errorData.code || 'UNAUTHORIZED'
      );
    }

    throw new RenderPdfError(
      response.status,
      errorData.message || `PDF render failed with HTTP status ${response.status}`,
      errorData.code || 'SERVER_ERROR'
    );
  }

  const blob = await response.blob();

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
