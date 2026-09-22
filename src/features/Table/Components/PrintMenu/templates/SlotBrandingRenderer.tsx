// src/features/Table/Components/PrintMenu/templates/SlotBrandingRenderer.tsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type { PrintMenuSettings, BrandingSlotPosition } from '../types';
import { getTableScanUrl } from '../utils/templateUtils';

export interface SlotBrandingProps {
  table: Table | null;
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
  primaryTextColor: string;
  secondaryTextColor: string;
  borderColor: string;
  accentColor?: string;
}

export const SlotBrandingHeader: React.FC<SlotBrandingProps> = ({
  table,
  merchant,
  settings,
  primaryTextColor,
  secondaryTextColor,
  borderColor,
  accentColor = '#2563eb',
}) => {
  const slots = settings.brandingSlots || {
    logo: { visible: true, position: 'top-left' },
    qrCode: { visible: true, position: 'top-right' },
    tableNumber: { visible: true, position: 'top-right' },
    tagline: { visible: true, position: 'top-left' },
  };

  const restaurantName =
    settings.restaurantName ||
    merchant?.businessName ||
    'Kinetic Ops';
  const tagline = settings.tagline || 'Fresh Flavors & Craft Hospitality';
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';
  const qrUrl = getTableScanUrl(table, undefined, settings);

  const qrSizePx =
    settings.qrSize === 'small' ? 52 : settings.qrSize === 'large' ? 76 : 64;

  const renderElement = (type: 'logo' | 'tagline' | 'tableNumber' | 'qrCode', inSlot: BrandingSlotPosition) => {
    switch (type) {
      case 'logo': {
        if (!settings.showLogo || !slots.logo.visible || slots.logo.position !== inSlot) return null;
        const logoSrc = settings.logoUrl || merchant?.logo;
        if (!logoSrc) return null;
        return (
          <img
            key="logo"
            src={logoSrc}
            alt={restaurantName}
            className="h-12 w-12 object-contain rounded-md"
            referrerPolicy="no-referrer"
          />
        );
      }

      case 'tagline': {
        if (!tagline || !slots.tagline.visible || slots.tagline.position !== inSlot) return null;
        return (
          <p
            key="tagline"
            className="text-xs sm:text-sm uppercase tracking-widest font-semibold mt-1"
            style={{ color: secondaryTextColor }}
          >
            {tagline}
          </p>
        );
      }

      case 'tableNumber': {
        if (!settings.showTableNumber || !slots.tableNumber.visible || slots.tableNumber.position !== inSlot) {
          return null;
        }
        return (
          <div
            key="tableNumber"
            className={`flex flex-col ${inSlot === 'top-center' ? 'items-center text-center' : inSlot === 'top-left' ? 'items-start text-left' : 'items-end text-right'}`}
          >
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-75" style={{ color: secondaryTextColor }}>
              DINE-IN TABLE
            </div>
            <div className="text-2xl sm:text-3xl font-black leading-none" style={{ color: primaryTextColor }}>
              #{tableNum}
            </div>
            {table?.section && (
              <div className="text-[10px] uppercase font-semibold mt-0.5" style={{ color: secondaryTextColor }}>
                {table.section}
              </div>
            )}
          </div>
        );
      }

      case 'qrCode': {
        if (!settings.showTableQR || !slots.qrCode.visible || slots.qrCode.position !== inSlot) return null;
        return (
          <div
            key="qrCode"
            className="flex flex-col items-center justify-center p-1.5 rounded-lg border bg-white shadow-xs"
            style={{ borderColor }}
          >
            <QRCodeSVG
              value={qrUrl}
              size={qrSizePx}
              level="M"
              includeMargin={false}
            />
            <span className="text-[8px] font-bold tracking-tight text-slate-800 uppercase mt-1">
              {settings.qrCtaText || 'Scan To Order'}
            </span>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getSlotElements = (position: 'top-left' | 'top-center' | 'top-right') => {
    return [
      renderElement('logo', position),
      renderElement('tagline', position),
      renderElement('tableNumber', position),
      renderElement('qrCode', position),
    ].filter(Boolean);
  };

  const leftElements = getSlotElements('top-left');
  const centerElements = getSlotElements('top-center');
  const rightElements = getSlotElements('top-right');

  return (
    <header className="border-b-4 pb-5 mb-6 flex justify-between items-end gap-4" style={{ borderColor: primaryTextColor }}>
      {/* ── Top Left Slot ── */}
      <div className="flex-1 flex items-center gap-3">
        {slots.logo.position === 'top-left' && renderElement('logo', 'top-left')}
        <div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-none"
            style={{ color: primaryTextColor }}
          >
            {restaurantName}
          </h1>
          {slots.tagline.position === 'top-left' && renderElement('tagline', 'top-left')}
          {/* Render any non-logo/tagline elements placed top-left */}
          <div className="flex items-center gap-3 mt-2">
            {slots.tableNumber.position === 'top-left' && renderElement('tableNumber', 'top-left')}
            {slots.qrCode.position === 'top-left' && renderElement('qrCode', 'top-left')}
          </div>
        </div>
      </div>

      {/* ── Top Center Slot (if any element assigned) ── */}
      {centerElements.length > 0 && (
        <div className="flex flex-col items-center justify-center text-center px-2 flex-shrink-0">
          {slots.logo.position === 'top-center' && renderElement('logo', 'top-center')}
          {slots.tagline.position === 'top-center' && renderElement('tagline', 'top-center')}
          {slots.tableNumber.position === 'top-center' && renderElement('tableNumber', 'top-center')}
          {slots.qrCode.position === 'top-center' && renderElement('qrCode', 'top-center')}
        </div>
      )}

      {/* ── Top Right Slot ── */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {slots.logo.position === 'top-right' && renderElement('logo', 'top-right')}
        {slots.tagline.position === 'top-right' && renderElement('tagline', 'top-right')}
        {slots.tableNumber.position === 'top-right' && renderElement('tableNumber', 'top-right')}
        {slots.qrCode.position === 'top-right' && renderElement('qrCode', 'top-right')}
      </div>
    </header>
  );
};

export const SlotBrandingFooter: React.FC<SlotBrandingProps> = ({
  table,
  merchant,
  settings,
  primaryTextColor,
  secondaryTextColor,
  borderColor,
}) => {
  const slots = settings.brandingSlots;
  const tableNum = settings.tableNumberOverride || table?.tableNumber || '01';
  const qrUrl = getTableScanUrl(table, undefined, settings);

  const isFooterElement = (pos?: string) => pos === 'footer';

  return (
    <footer
      className="mt-auto pt-4 border-t flex flex-row items-center justify-between gap-4 text-[10px] font-medium"
      style={{ borderColor, color: secondaryTextColor }}
    >
      <div className="flex items-center gap-3">
        {isFooterElement(slots?.logo?.position) && settings.showLogo && (settings.logoUrl || merchant?.logo) && (
          <img
            src={settings.logoUrl || merchant?.logo}
            alt="Logo"
            className="h-6 w-6 object-contain rounded"
            referrerPolicy="no-referrer"
          />
        )}
        <span>
          {settings.taxDisclaimer || 'All prices include applicable taxes. Please inform your server of any allergies.'}
        </span>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {isFooterElement(slots?.tagline?.position) && settings.tagline && (
          <span className="italic">{settings.tagline}</span>
        )}
        {settings.phone && <span>📞 {settings.phone}</span>}
        {settings.website && <span>🌐 {settings.website}</span>}

        {isFooterElement(slots?.tableNumber?.position) && settings.showTableNumber && (
          <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
            TABLE #{tableNum}
          </span>
        )}

        {isFooterElement(slots?.qrCode?.position) && settings.showTableQR && (
          <div className="flex items-center gap-1.5 p-1 bg-white border rounded">
            <QRCodeSVG value={qrUrl} size={36} level="M" />
            <span className="text-[7px] font-bold text-slate-800 uppercase">Order</span>
          </div>
        )}
      </div>
    </footer>
  );
};
