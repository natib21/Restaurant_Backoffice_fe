// src/features/Table/Components/PrintMenu/utils/printPdfUtils.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { PrintMenuSettings } from '../types';

interface GeneratePdfOptions {
  containerId?: string;
  settings: PrintMenuSettings;
  tableNumber: string | number;
  restaurantName?: string;
  onProgress?: (msg: string) => void;
}

/**
 * Generates and downloads a high-resolution, multi-page vector-crisp PDF
 * using html2canvas and jsPDF.
 */
export async function downloadMenuAsPdf({
  containerId = 'printable-menu-root',
  settings,
  tableNumber,
  restaurantName = 'Restaurant',
  onProgress,
}: GeneratePdfOptions): Promise<void> {
  const root = document.getElementById(containerId);
  if (!root) {
    throw new Error('Printable menu container not found');
  }

  // Find all page sheets
  let pageElements = Array.from(
    root.querySelectorAll<HTMLElement>('.menu-print-page')
  );

  // If no .menu-print-page elements found, treat the root as a single page
  if (pageElements.length === 0) {
    pageElements = [root];
  }

  onProgress?.('Preparing pages for high-res export...');

  const isLandscape = settings.orientation === 'landscape';
  const paperFormat = settings.paperSize === 'letter' ? 'letter' : settings.paperSize === 'a5' ? 'a5' : 'a4';

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: paperFormat,
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    onProgress?.(`Rendering page ${i + 1} of ${pageElements.length}...`);

    // Ensure element is visible during capture
    const originalTransform = pageEl.style.transform;
    pageEl.style.transform = 'none';

    try {
      const canvas = await html2canvas(pageEl, {
        scale: 2.5, // Crisp 300-DPI equivalent
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Remove any hidden print elements or shadows in cloned document
          const clonedPage = clonedDoc.querySelector<HTMLElement>('.menu-print-page');
          if (clonedPage) {
            clonedPage.style.boxShadow = 'none';
            clonedPage.style.transform = 'none';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage(paperFormat, isLandscape ? 'landscape' : 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    } finally {
      pageEl.style.transform = originalTransform;
    }
  }

  onProgress?.('Saving PDF file...');
  const cleanName = (restaurantName || 'Menu')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const fileName = `${cleanName}_Table_${tableNumber}_Menu.pdf`;
  pdf.save(fileName);
}

/**
 * Triggers clean browser print via an isolated iframe with complete styles,
 * avoiding modal clipping, transforms, or blank white pages.
 */
export function triggerCleanMenuPrint({
  containerId = 'printable-menu-root',
  settings,
}: {
  containerId?: string;
  settings: PrintMenuSettings;
}): void {
  const root = document.getElementById(containerId);
  if (!root) {
    window.print();
    return;
  }

  // Gather all stylesheets and inline styles from current document
  let stylesHtml = '';
  const headElements = document.querySelectorAll('style, link[rel="stylesheet"]');
  headElements.forEach((el) => {
    stylesHtml += el.outerHTML;
  });

  const isLandscape = settings.orientation === 'landscape';
  const paperFormat = settings.paperSize === 'letter' ? 'letter' : settings.paperSize === 'a5' ? 'a5' : 'a4';

  // Create isolated hidden printing iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.id = 'menu-print-frame';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const printCss = `
    @page {
      size: ${paperFormat} ${isLandscape ? 'landscape' : 'portrait'};
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      width: 100% !important;
      height: 100% !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .print-container {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .menu-print-page {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100% !important;
      max-height: 100% !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      position: relative !important;
      overflow: hidden !important;
    }
    .print\\:hidden {
      display: none !important;
    }
  `;

  // Clone printable content and remove transform scale
  const clone = root.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.maxWidth = '100%';
  clone.style.margin = '0';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print Menu - Table</title>
        ${stylesHtml}
        <style>${printCss}</style>
      </head>
      <body>
        <div class="print-container">
          ${clone.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait for images and fonts to load before calling print
  const triggerPrint = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error invoking print:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 500);
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = triggerPrint;
    // Fallback trigger in case onload already fired
    setTimeout(triggerPrint, 800);
  } else {
    window.print();
  }
}
