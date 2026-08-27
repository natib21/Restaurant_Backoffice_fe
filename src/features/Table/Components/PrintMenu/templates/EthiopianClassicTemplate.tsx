// src/features/Table/Components/PrintMenu/templates/EthiopianClassicTemplate.tsx
import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Table } from '@/api/Queries/tableQueries';
import type { MenuItem, MenuGroup } from '@/api/Queries/menuQueries';
import type { Category } from '@/api/Queries/categoryQueries';
import type { Merchant } from '@/api/Queries/merchantQueries';
import type {
  PrintMenuSettings,
  BorderStyle,
  BorderThickness,
  BorderRadius,
  BorderColorMode,
  PaperColor,
  MenuTheme,
} from '../types';
import {
  mapToPagedSections,
  mapToPagedMerchant,
  paginateMenu,
  type PagedSection,
  type PagedCategory,
  type PagedMenuItem,
  type PagedMerchant,
  type MenuBlock,
} from '../utils/menuPaginator';

interface EthiopianClassicTemplateProps {
  table: Table;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  categories?: Category[];
  merchant?: Merchant | null;
  settings: PrintMenuSettings;
}

// ─── Theme Config ─────────────────────────────────────────────────────────────

interface ThemeCfg {
  secFont: string;
  catFont: string;
  priceFont: string;
  bodyFont: string;
  secDecor: 'flanked-ornament' | 'side-rule' | 'centered' | 'none';
  catDecor: 'rule-right' | 'diamond-right' | 'dots-right' | 'plain';
}

const THEMES: Record<MenuTheme, ThemeCfg> = {
  ethiopian: {
    secFont: "'Playfair Display', Georgia, serif",
    catFont: "'Source Sans 3', system-ui, sans-serif",
    priceFont: "'Source Sans 3', system-ui, sans-serif",
    bodyFont: "'Source Sans 3', system-ui, sans-serif",
    secDecor: 'flanked-ornament',
    catDecor: 'dots-right',
  },
  classic: {
    secFont: "'Playfair Display', Georgia, serif",
    catFont: "'Source Sans 3', system-ui, sans-serif",
    priceFont: "'Source Sans 3', system-ui, sans-serif",
    bodyFont: "'Source Sans 3', system-ui, sans-serif",
    secDecor: 'flanked-ornament',
    catDecor: 'rule-right',
  },
  luxury: {
    secFont: "'Playfair Display', Georgia, serif",
    catFont: "'Playfair Display', Georgia, serif",
    priceFont: "'Source Sans 3', system-ui, sans-serif",
    bodyFont: "'Source Sans 3', system-ui, sans-serif",
    secDecor: 'centered',
    catDecor: 'diamond-right',
  },
  coffee: {
    secFont: "'Playfair Display', Georgia, serif",
    catFont: "'Source Sans 3', system-ui, sans-serif",
    priceFont: "'Source Sans 3', system-ui, sans-serif",
    bodyFont: "'Source Sans 3', system-ui, sans-serif",
    secDecor: 'centered',
    catDecor: 'rule-right',
  },
  modern: {
    secFont: "'Source Sans 3', system-ui, sans-serif",
    catFont: "'Source Sans 3', system-ui, sans-serif",
    priceFont: "'Source Sans 3', system-ui, sans-serif",
    bodyFont: "'Source Sans 3', system-ui, sans-serif",
    secDecor: 'side-rule',
    catDecor: 'plain',
  },
  minimal: {
    secFont: "'Source Sans 3', system-ui, sans-serif",
    catFont: "'Source Sans 3', system-ui, sans-serif",
    priceFont: "'Source Sans 3', system-ui, sans-serif",
    bodyFont: "'Source Sans 3', system-ui, sans-serif",
    secDecor: 'none',
    catDecor: 'plain',
  },
};

const PAPER_BG: Record<PaperColor, string> = {
  white: '#ffffff',
  'warm-white': '#fefaf6',
  cream: '#fdf6e3',
  'light-beige': '#f5efe4',
};

// ─── Border Utilities ─────────────────────────────────────────────────────────

function getBorderColor(
  mode: BorderColorMode,
  customColor: string,
  merchantColor: string
): string {
  switch (mode) {
    case 'brand':
      return merchantColor || '#7B3F00';
    case 'black':
      return '#1a1a1a';
    case 'dark-gray':
      return '#505050';
    case 'gold':
      return '#B8960C';
    case 'custom':
      return customColor || '#7B3F00';
    default:
      return merchantColor || '#7B3F00';
  }
}

function getThicks(t: BorderThickness) {
  switch (t) {
    case 'thin':
      return { o: 0.8, i: 0.4 };
    case 'thick':
      return { o: 2.2, i: 1.1 };
    case 'medium':
    default:
      return { o: 1.4, i: 0.7 };
  }
}

function getRx(r: BorderRadius): number {
  switch (r) {
    case 'small':
      return 3;
    case 'medium':
      return 7;
    case 'large':
      return 14;
    case 'sharp':
    default:
      return 0;
  }
}

function contentPad(style: BorderStyle): number {
  if (style === 'none') return 24;
  if (style === 'minimal') return 32;
  if (style === 'classic-double') return 40;
  if (style === 'ethiopian') return 38;
  return 34;
}

// ─── Border SVG ───────────────────────────────────────────────────────────────

function BorderSVG({
  style,
  thick,
  opacity,
  radius,
  color,
  w,
  h,
}: {
  style: BorderStyle;
  thick: BorderThickness;
  opacity: number;
  radius: BorderRadius;
  color: string;
  w: number;
  h: number;
}) {
  if (style === 'none') return null;

  const { o, i } = getThicks(thick);
  const rx = getRx(radius);
  const mg = 14; // margin from sheet edge
  const bw = w - mg * 2;
  const bh = h - mg * 2;

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full"
      viewBox={`0 0 ${w} ${h}`}
      style={{ opacity: opacity / 100 }}
      aria-hidden
    >
      {/* Minimal */}
      {style === 'minimal' && (
        <rect
          x={mg}
          y={mg}
          width={bw}
          height={bh}
          fill="none"
          stroke={color}
          strokeWidth={o}
          rx={rx}
        />
      )}

      {/* Classic Double */}
      {style === 'classic-double' && (
        <>
          <rect
            x={mg}
            y={mg}
            width={bw}
            height={bh}
            fill="none"
            stroke={color}
            strokeWidth={o}
            rx={rx}
          />
          <rect
            x={mg + 6}
            y={mg + 6}
            width={bw - 12}
            height={bh - 12}
            fill="none"
            stroke={color}
            strokeWidth={i}
            rx={Math.max(0, rx - 3)}
          />
          {([
            [mg, mg],
            [mg + bw, mg],
            [mg, mg + bh],
            [mg + bw, mg + bh],
          ] as [number, number][]).map(([cx, cy], qi) => (
            <rect
              key={qi}
              x={cx - 2.5}
              y={cy - 2.5}
              width={5}
              height={5}
              fill={color}
            />
          ))}
        </>
      )}

      {/* Luxury Corner */}
      {style === 'luxury-corner' && (
        <>
          <rect
            x={mg}
            y={mg}
            width={bw}
            height={bh}
            fill="none"
            stroke={color}
            strokeWidth={i * 0.5}
            strokeDasharray="1 3"
            strokeOpacity={0.45}
          />
          {([
            [mg, mg, 1, 1],
            [mg + bw, mg, -1, 1],
            [mg, mg + bh, 1, -1],
            [mg + bw, mg + bh, -1, -1],
          ] as [number, number, number, number][]).map(([cx, cy, sx, sy], qi) => (
            <g key={qi} transform={`translate(${cx},${cy}) scale(${sx},${sy})`}>
              <line x1={0} y1={0} x2={24} y2={0} stroke={color} strokeWidth={o} />
              <line x1={0} y1={0} x2={0} y2={24} stroke={color} strokeWidth={o} />
              <line
                x1={4}
                y1={4}
                x2={16}
                y2={4}
                stroke={color}
                strokeWidth={i * 0.7}
              />
              <line
                x1={4}
                y1={4}
                x2={4}
                y2={16}
                stroke={color}
                strokeWidth={i * 0.7}
              />
              <circle cx={12} cy={0} r={1.2} fill={color} />
              <circle cx={0} cy={12} r={1.2} fill={color} />
            </g>
          ))}
          {[
            [mg + bw / 2, mg],
            [mg + bw / 2, mg + bh],
            [mg, mg + bh / 2],
            [mg + bw, mg + bh / 2],
          ].map(([px, py], pi) => (
            <g key={pi} transform={`translate(${px},${py})`}>
              <polygon points="0,-3.5 3.5,0 0,3.5 -3.5,0" fill={color} />
            </g>
          ))}
        </>
      )}

      {/* Ethiopian Pattern */}
      {style === 'ethiopian' && (() => {
        const step = 11;
        const bandY = mg + 5;
        const bandH = 8;
        const cols = Math.floor((bw - 8) / step);
        const offsetX = mg + 4 + ((bw - 8) - cols * step) / 2;

        return (
          <>
            {/* Outer double frame */}
            <rect
              x={mg}
              y={mg}
              width={bw}
              height={bh}
              fill="none"
              stroke={color}
              strokeWidth={o}
            />
            <rect
              x={mg + 4.5}
              y={mg + 4.5}
              width={bw - 9}
              height={bh - 9}
              fill="none"
              stroke={color}
              strokeWidth={i * 0.5}
            />

            {/* Top diamond band */}
            {Array.from({ length: cols }, (_, ci) => {
              const cx = offsetX + ci * step + step / 2;
              const cy = bandY + bandH / 2;
              return (
                <g key={`t${ci}`}>
                  <polygon
                    points={`${cx},${cy - 3.5} ${cx + 3.5},${cy} ${cx},${cy + 3.5} ${cx - 3.5},${cy}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={i * 0.8}
                  />
                  <circle cx={cx} cy={cy} r={0.7} fill={color} />
                </g>
              );
            })}

            {/* Bottom diamond band (mirrored) */}
            {Array.from({ length: cols }, (_, ci) => {
              const cx = offsetX + ci * step + step / 2;
              const cy = mg + bh - 5 - bandH / 2;
              return (
                <g key={`b${ci}`}>
                  <polygon
                    points={`${cx},${cy - 3.5} ${cx + 3.5},${cy} ${cx},${cy + 3.5} ${cx - 3.5},${cy}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={i * 0.8}
                  />
                  <circle cx={cx} cy={cy} r={0.7} fill={color} />
                </g>
              );
            })}

            {/* Side cross patterns — vertical bands */}
            {[mg + 3, mg + bw - 3].map((vx, vi) => {
              const rows = Math.floor((bh - 20) / step);
              const startY = mg + 12 + ((bh - 20) - rows * step) / 2;
              return Array.from({ length: rows }, (_, ri) => {
                const cy = startY + ri * step + step / 2;
                return (
                  <g key={`v${vi}-${ri}`}>
                    <polygon
                      points={`${vx},${cy - 3} ${vx + 3},${cy} ${vx},${cy + 3} ${vx - 3},${cy}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={i * 0.7}
                    />
                  </g>
                );
              });
            })}

            {/* Four corner rosettes */}
            {([
              [mg + 3, mg + 3],
              [mg + bw - 3, mg + 3],
              [mg + 3, mg + bh - 3],
              [mg + bw - 3, mg + bh - 3],
            ] as [number, number][]).map(([cx, cy], ri) => (
              <g key={ri}>
                <polygon
                  points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={o * 0.8}
                />
                <polygon
                  points={`${cx - 3.5},${cy - 3.5} ${cx + 3.5},${cy - 3.5} ${cx + 3.5},${cy + 3.5} ${cx - 3.5},${cy + 3.5}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={i * 0.5}
                  transform={`rotate(45,${cx},${cy})`}
                />
                <circle cx={cx} cy={cy} r={1.2} fill={color} />
              </g>
            ))}
          </>
        );
      })()}

      {/* Coffee Shop */}
      {style === 'coffee-shop' && (
        <>
          <rect
            x={mg}
            y={mg}
            width={bw}
            height={bh}
            fill="none"
            stroke={color}
            strokeWidth={o}
            rx={rx}
          />
          {([
            [mg + 8, mg + 8, 0],
            [mg + bw - 8, mg + 8, 90],
            [mg + 8, mg + bh - 8, 270],
            [mg + bw - 8, mg + bh - 8, 180],
          ] as [number, number, number][]).map(([cx, cy, angle], qi) => (
            <g key={qi} transform={`translate(${cx},${cy}) rotate(${angle})`}>
              <ellipse
                cx={0}
                cy={0}
                rx={4.5}
                ry={7}
                fill="none"
                stroke={color}
                strokeWidth={i}
              />
              <line
                x1={0}
                y1={-6}
                x2={0}
                y2={6}
                stroke={color}
                strokeWidth={i * 0.5}
              />
              <line
                x1={0}
                y1={7}
                x2={2.5}
                y2={10}
                stroke={color}
                strokeWidth={i * 0.6}
              />
            </g>
          ))}
          {[
            [mg + bw / 2, mg],
            [mg + bw / 2, mg + bh],
            [mg, mg + bh / 2],
            [mg + bw, mg + bh / 2],
          ].map(([px, py], pi) => (
            <circle key={pi} cx={px} cy={py} r={2} fill={color} />
          ))}
        </>
      )}

      {/* Modern Geometric */}
      {style === 'modern-geometric' && (
        <>
          <rect
            x={mg}
            y={mg}
            width={bw}
            height={bh}
            fill="none"
            stroke={color}
            strokeWidth={i * 0.5}
          />
          {([
            [mg, mg, 1, 1],
            [mg + bw, mg, -1, 1],
            [mg, mg + bh, 1, -1],
            [mg + bw, mg + bh, -1, -1],
          ] as [number, number, number, number][]).map(([cx, cy, sx, sy], qi) => (
            <g key={qi} transform={`translate(${cx},${cy}) scale(${sx},${sy})`}>
              <line x1={0} y1={0} x2={20} y2={0} stroke={color} strokeWidth={o} />
              <line x1={0} y1={0} x2={0} y2={20} stroke={color} strokeWidth={o} />
              <line
                x1={6}
                y1={6}
                x2={14}
                y2={6}
                stroke={color}
                strokeWidth={i * 0.5}
              />
              <line
                x1={6}
                y1={6}
                x2={6}
                y2={14}
                stroke={color}
                strokeWidth={i * 0.5}
              />
            </g>
          ))}
          {[
            [mg + bw / 2, mg, mg + bw / 2, mg + 4],
            [mg + bw / 2, mg + bh - 4, mg + bw / 2, mg + bh],
            [mg, mg + bh / 2, mg + 4, mg + bh / 2],
            [mg + bw - 4, mg + bh / 2, mg + bw, mg + bh / 2],
          ].map(([x1, y1, x2, y2], ti) => (
            <line key={ti} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={o} />
          ))}
        </>
      )}
    </svg>
  );
}

// ─── Watermark ────────────────────────────────────────────────────────────────

function Watermark({ m }: { m: PagedMerchant }) {
  const initials =
    m.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('') || 'HK';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      style={{ opacity: 0.04, zIndex: 0 }}
    >
      <div className="text-center" style={{ color: '#000' }}>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '6.5rem',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </div>
        <div
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '0.9rem',
            letterSpacing: '0.35em',
            marginTop: '0.5rem',
            textTransform: 'uppercase',
          }}
        >
          {m.name}
        </div>
      </div>
    </div>
  );
}

// ─── Page Headers ─────────────────────────────────────────────────────────────

function FirstPageHeader({
  m,
  settings,
  color,
  theme,
}: {
  m: PagedMerchant;
  settings: PrintMenuSettings;
  color: string;
  theme: ThemeCfg;
}) {
  const initials =
    m.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('') || 'HK';

  const isEthiopian = settings.theme === 'ethiopian';
  const isLuxury = settings.theme === 'luxury';
  const isCompact = settings.density === 'compact';

  return (
    <div
      className="text-center shrink-0"
      style={{ marginBottom: isCompact ? 6 : 12 }}
    >
      {/* Logo Medallion */}
      {settings.showLogo && (
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: isCompact ? 40 : 50,
            height: isCompact ? 40 : 50,
            borderRadius: isEthiopian ? 0 : '50%',
            background: color,
            fontFamily: theme.secFont,
            color: '#fff',
            fontSize: isCompact ? '0.95rem' : '1.2rem',
            fontWeight: 700,
            marginBottom: 5,
            transform: isEthiopian ? 'rotate(45deg)' : undefined,
            boxShadow: isLuxury
              ? `0 0 0 2px ${color}40, 0 0 0 5px ${color}20`
              : undefined,
          }}
        >
          <span style={{ transform: isEthiopian ? 'rotate(-45deg)' : undefined }}>
            {initials}
          </span>
        </div>
      )}

      {/* Name */}
      <div
        style={{
          fontFamily: theme.secFont,
          fontSize: isCompact ? '0.95rem' : '1.15rem',
          fontWeight: 700,
          color: '#1a1a1a',
          letterSpacing: '0.04em',
        }}
      >
        {m.name}
      </div>

      {/* Amharic Name */}
      {settings.showAmharic && m.am && (
        <div
          style={{
            fontFamily: theme.secFont,
            fontSize: '0.68rem',
            fontStyle: 'italic',
            color: '#6b6b6b',
            marginTop: 1,
          }}
        >
          {m.am}
        </div>
      )}

      {/* Branch / Location */}
      {m.branch && (
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.62rem',
            color: '#888',
            marginTop: 2,
            letterSpacing: '0.06em',
          }}
        >
          {m.branch}
        </div>
      )}

      {/* Tagline */}
      {!isCompact && m.tagline && (
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.58rem',
            color: '#aaa',
            marginTop: 1.5,
            fontStyle: 'italic',
          }}
        >
          {m.tagline}
        </div>
      )}

      {/* Divider Ornament */}
      <div
        className="flex items-center justify-center gap-2 mx-auto"
        style={{ marginTop: 6, width: '55%' }}
      >
        <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.4 }} />
        {isEthiopian ? (
          <span style={{ fontSize: '7px', color, letterSpacing: 2.5 }}>◇◇◇</span>
        ) : settings.theme === 'luxury' ? (
          <span style={{ fontSize: '8px', color }}>◆</span>
        ) : settings.theme === 'coffee' ? (
          <span style={{ fontSize: '7px', color }}>●</span>
        ) : (
          <span style={{ fontSize: '7px', color }}>✦</span>
        )}
        <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.4 }} />
      </div>
    </div>
  );
}

function CompactHeader({
  m,
  color,
  theme,
}: {
  m: PagedMerchant;
  color: string;
  theme: ThemeCfg;
}) {
  const initials =
    m.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('') || 'HK';

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        borderBottom: `0.75px solid ${color}30`,
        paddingBottom: 5,
        marginBottom: 6,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: theme.secFont,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#1a1a1a',
          }}
        >
          {m.name}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.58rem',
            color: '#999',
          }}
        >
          {m.branch}
        </div>
      </div>
      <div
        className="flex items-center justify-center text-white shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: color,
          fontFamily: theme.secFont,
          fontSize: '0.52rem',
          fontWeight: 700,
        }}
      >
        {initials}
      </div>
    </div>
  );
}

// ─── Menu Sections & Items ───────────────────────────────────────────────────

function SectionHeader({
  s,
  showAm,
  color,
  theme,
}: {
  s: PagedSection;
  showAm: boolean;
  color: string;
  theme: ThemeCfg;
}) {
  const decor = theme.secDecor;

  return (
    <div style={{ gridColumn: '1 / -1', marginTop: 10, marginBottom: 5 }}>
      {decor === 'flanked-ornament' && (
        <div className="flex items-center gap-2">
          <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.35 }} />
          <div
            style={{
              fontFamily: theme.secFont,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1a1a1a',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {s.name}
            {showAm && s.am && (
              <span
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: '0.6rem',
                  color: '#999',
                  marginLeft: 5,
                  textTransform: 'none',
                  fontWeight: 400,
                  fontStyle: 'italic',
                }}
              >
                / {s.am}
              </span>
            )}
          </div>
          <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.35 }} />
        </div>
      )}

      {decor === 'side-rule' && (
        <div className="flex items-center gap-2.5">
          <div style={{ width: 3, height: 14, background: color, borderRadius: 1 }} />
          <div
            style={{
              fontFamily: theme.secFont,
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#1a1a1a',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            {s.name}
            {showAm && s.am && (
              <span
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: '0.58rem',
                  color: '#999',
                  marginLeft: 5,
                  textTransform: 'none',
                  fontWeight: 400,
                }}
              >
                / {s.am}
              </span>
            )}
          </div>
        </div>
      )}

      {decor === 'centered' && (
        <>
          <div
            className="text-center"
            style={{
              fontFamily: theme.secFont,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#1a1a1a',
              fontStyle: 'italic',
              letterSpacing: '0.04em',
            }}
          >
            {s.name}
            {showAm && s.am && (
              <span
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: '0.58rem',
                  color: '#999',
                  marginLeft: 5,
                  fontStyle: 'normal',
                }}
              >
                / {s.am}
              </span>
            )}
          </div>
          <div
            style={{
              height: '0.5px',
              background: color,
              opacity: 0.3,
              marginTop: 3,
            }}
          />
        </>
      )}

      {decor === 'none' && (
        <div
          style={{
            fontFamily: theme.secFont,
            fontSize: '0.65rem',
            fontWeight: 400,
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
          }}
        >
          {s.name}
          {showAm && s.am && <span style={{ marginLeft: 5, color: '#bbb' }}>/ {s.am}</span>}
        </div>
      )}
    </div>
  );
}

function CatHeader({
  c,
  cont,
  showAm,
  color,
  theme,
}: {
  c: PagedCategory;
  cont: boolean;
  showAm: boolean;
  color: string;
  theme: ThemeCfg;
}) {
  const decor = theme.catDecor;

  return (
    <div style={{ gridColumn: '1 / -1', marginTop: 6, marginBottom: 3 }}>
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: theme.catFont,
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#2a2a2a',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            whiteSpace: 'nowrap',
          }}
        >
          {c.name}
          {cont && (
            <span
              style={{
                fontWeight: 400,
                fontSize: '0.55rem',
                color: '#aaa',
                textTransform: 'none',
                letterSpacing: 0,
                marginLeft: 4,
              }}
            >
              — continued
            </span>
          )}
          {showAm && c.am && (
            <span
              style={{
                fontWeight: 400,
                fontSize: '0.55rem',
                color: '#bbb',
                textTransform: 'none',
                letterSpacing: 0,
                marginLeft: 4,
              }}
            >
              / {c.am}
            </span>
          )}
        </span>

        {decor === 'rule-right' && (
          <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.4 }} />
        )}
        {decor === 'diamond-right' && (
          <div className="flex items-center gap-1" style={{ flex: 1 }}>
            <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.3 }} />
            <svg width="5" height="5" viewBox="0 0 6 6">
              <polygon points="3,0 6,3 3,6 0,3" fill={color} fillOpacity={0.7} />
            </svg>
          </div>
        )}
        {decor === 'dots-right' && (
          <div className="flex items-center gap-1" style={{ flex: 1 }}>
            <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.25 }} />
            <span style={{ fontSize: '0.42rem', color, opacity: 0.5, letterSpacing: 1 }}>
              ◇ ◇
            </span>
          </div>
        )}
        {decor === 'plain' && (
          <div style={{ flex: 1, height: '0.5px', background: '#e0e0e0' }} />
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  settings,
  color,
  theme,
}: {
  item: PagedMenuItem;
  settings: PrintMenuSettings;
  color: string;
  theme: ThemeCfg;
}) {
  const density = settings.density;
  const spacing = density === 'compact' ? 2 : density === 'spacious' ? 7 : 4.5;

  return (
    <div
      style={{
        marginBottom: spacing,
        paddingBottom: density === 'spacious' ? 2 : 0,
      }}
    >
      {/* Name + Price Row */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
          <span
            style={{
              fontFamily: theme.secFont,
              fontSize: density === 'compact' ? '0.7rem' : '0.76rem',
              fontWeight: 500,
              color: '#1a1a1a',
              lineHeight: 1.25,
            }}
          >
            {item.name}
          </span>
          {item.tags &&
            item.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: '0.45rem',
                  padding: '0.5px 3px',
                  background: `${color}15`,
                  color,
                  letterSpacing: '0.03em',
                  border: `0.5px solid ${color}30`,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </span>
            ))}
        </div>

        {settings.showPrices && !item.variants && (
          <span
            style={{
              fontFamily: theme.priceFont,
              fontSize: density === 'compact' ? '0.68rem' : '0.74rem',
              fontWeight: 600,
              color: '#1a1a1a',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
            }}
          >
            {item.price.toLocaleString()}{' '}
            <span style={{ fontWeight: 400, fontSize: '0.6rem', color: '#888' }}>
              {settings.currencySymbol || 'ETB'}
            </span>
          </span>
        )}
      </div>

      {/* Amharic Name */}
      {settings.showAmharic && item.am && (
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.55rem',
            color: '#999',
            marginTop: 0.5,
            fontStyle: 'italic',
          }}
        >
          {item.am}
        </div>
      )}

      {/* Description */}
      {settings.showDescriptions && item.desc && (
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.58rem',
            color: '#777',
            marginTop: 1,
            lineHeight: 1.4,
          }}
        >
          {item.desc}
        </div>
      )}

      {/* Variants */}
      {settings.showPrices && item.variants && (
        <div className="flex flex-wrap gap-2.5 mt-0.5">
          {item.variants.map((v) => (
            <span
              key={v.n}
              style={{
                fontFamily: theme.bodyFont,
                fontSize: '0.56rem',
                color: '#555',
              }}
            >
              {v.n}:{' '}
              <strong
                style={{
                  fontFamily: theme.priceFont,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                {v.p.toLocaleString()} {settings.currencySymbol || 'ETB'}
              </strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contact Page Content ─────────────────────────────────────────────────────

function ContactPageContent({
  m,
  table,
  color,
  theme,
}: {
  m: PagedMerchant;
  table: Table;
  color: string;
  theme: ThemeCfg;
}) {
  const initials =
    m.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('') || 'HK';

  const qrImageSrc =
    table.qrCode &&
    (table.qrCode.startsWith('data:image') || table.qrCode.startsWith('http'))
      ? table.qrCode
      : null;
  const qrUrl =
    table.qrUrl ||
    (table.qrCode && !table.qrCode.startsWith('data:image') ? table.qrCode : '') ||
    'https://restaurant.com';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3.5 py-4">
      {/* Medallion */}
      <div
        className="flex items-center justify-center text-white rounded-full"
        style={{
          width: 54,
          height: 54,
          background: color,
          fontFamily: theme.secFont,
          fontSize: '1.25rem',
          fontWeight: 700,
        }}
      >
        {initials}
      </div>

      {/* Names */}
      <div>
        <div
          style={{
            fontFamily: theme.secFont,
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '0.03em',
          }}
        >
          {m.name}
        </div>
        {m.am && (
          <div
            style={{
              fontFamily: theme.secFont,
              fontSize: '0.65rem',
              fontStyle: 'italic',
              color: '#888',
              marginTop: 1.5,
            }}
          >
            {m.am}
          </div>
        )}
      </div>

      {/* Thank You Note */}
      <div>
        <div
          style={{
            fontFamily: theme.secFont,
            fontSize: '1.05rem',
            fontWeight: 500,
            color: '#1a1a1a',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Thank You
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.62rem',
            color: '#888',
            fontStyle: 'italic',
            marginTop: 3,
            lineHeight: 1.7,
          }}
        >
          Thank you for dining with us.
          <br />
          <span style={{ fontFamily: theme.secFont, fontStyle: 'normal' }}>
            እንኳን ደህና መጡ።
          </span>
        </div>
      </div>

      {/* Table QR Code */}
      <div className="flex flex-col items-center">
        <div
          className="border bg-white rounded-lg p-1.5 shadow-2xs"
          style={{
            width: 72,
            height: 72,
            borderColor: `${color}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {qrImageSrc ? (
            <img
              src={qrImageSrc}
              alt={`Table ${table.tableNumber} QR`}
              className="w-full h-full object-contain"
            />
          ) : (
            <QRCodeSVG value={qrUrl} size={60} level="M" />
          )}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontSize: '0.55rem',
            color: '#777',
            letterSpacing: '0.1em',
            marginTop: 4,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          Table {table.tableNumber} • Scan to Order
        </div>
      </div>

      {/* Contact Info Footer */}
      <div
        style={{
          borderTop: `0.5px solid ${color}25`,
          paddingTop: 12,
          width: '72%',
        }}
      >
        {[
          ['📍', m.addr],
          ['☎', m.phone],
          ['🌐', m.web],
        ].map(([icon, val]) => (
          <div
            key={val}
            style={{
              fontFamily: theme.bodyFont,
              fontSize: '0.58rem',
              color: '#666',
              marginBottom: 3.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <span>{icon}</span>
            <span>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageFooter({
  n,
  total,
  color,
  theme,
}: {
  n: number;
  total: number;
  color: string;
  theme: ThemeCfg;
}) {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        borderTop: `0.5px solid ${color}22`,
        paddingTop: 4,
        marginTop: 3,
      }}
    >
      <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.12 }} />
      <span
        style={{
          fontFamily: theme.bodyFont,
          fontSize: '0.52rem',
          color: '#a0a0a0',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0 8px',
        }}
      >
        Page {n} of {total}
      </span>
      <div style={{ flex: 1, height: '0.5px', background: color, opacity: 0.12 }} />
    </div>
  );
}

// ─── Single Menu Page Sheet ───────────────────────────────────────────────────

function MenuPageSheet({
  blocks,
  idx,
  total,
  table,
  m,
  settings,
  sz,
}: {
  blocks: MenuBlock[];
  idx: number;
  total: number;
  table: Table;
  m: PagedMerchant;
  settings: PrintMenuSettings;
  sz: { w: number; h: number };
}) {
  const isFirst = idx === 0;
  const isContact = blocks.length === 1 && blocks[0].k === 'contact';
  const color = getBorderColor(
    settings.borderColorMode,
    settings.customBorderColor,
    m.color
  );
  const pad = contentPad(settings.borderStyle);
  const theme = THEMES[settings.theme || 'ethiopian'];

  return (
    <div
      className="menu-print-page relative shadow-2xl overflow-hidden rounded-sm select-none"
      style={{
        width: '100%',
        maxWidth: sz.w,
        aspectRatio: `${sz.w} / ${sz.h}`,
        background: PAPER_BG[settings.paperColor || 'warm-white'],
        flexShrink: 0,
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Vector SVG Border */}
      <BorderSVG
        style={settings.borderStyle}
        thick={settings.borderThickness}
        opacity={settings.borderOpacity}
        radius={settings.borderRadius}
        color={color}
        w={sz.w}
        h={sz.h}
      />

      {/* Merchant Watermark */}
      {settings.showWatermark && !isContact && <Watermark m={m} />}

      {/* Page Content */}
      <div
        className="absolute inset-0 flex flex-col justify-between"
        style={{ padding: pad, zIndex: 1 }}
      >
        {isContact ? (
          <ContactPageContent m={m} table={table} color={color} theme={theme} />
        ) : (
          <>
            {isFirst ? (
              <FirstPageHeader
                m={m}
                settings={settings}
                color={color}
                theme={theme}
              />
            ) : (
              <CompactHeader m={m} color={color} theme={theme} />
            )}

            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns:
                  settings.columnsCount === 2 ? '1fr 1fr' : '1fr',
                columnGap: settings.columnsCount === 2 ? 16 : 0,
                alignContent: 'start',
              }}
            >
              {blocks.map((bl, bi) => {
                if (bl.k === 'sec') {
                  return (
                    <SectionHeader
                      key={bi}
                      s={bl.s}
                      showAm={settings.showAmharic}
                      color={color}
                      theme={theme}
                    />
                  );
                }
                if (bl.k === 'cat') {
                  return (
                    <CatHeader
                      key={bi}
                      c={bl.c}
                      cont={bl.cont}
                      showAm={settings.showAmharic}
                      color={color}
                      theme={theme}
                    />
                  );
                }
                if (bl.k === 'item') {
                  return (
                    <ItemRow
                      key={bi}
                      item={bl.i}
                      settings={settings}
                      color={color}
                      theme={theme}
                    />
                  );
                }
                return null;
              })}
            </div>

            <PageFooter n={idx + 1} total={total} color={color} theme={theme} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Template 2 Component ────────────────────────────────────────────────

export const EthiopianClassicTemplate: React.FC<EthiopianClassicTemplateProps> = ({
  table,
  menuItems,
  menuGroups = [],
  categories = [],
  merchant,
  settings,
}) => {
  const m = useMemo(() => mapToPagedMerchant(merchant, settings), [
    merchant,
    settings,
  ]);

  const sections = useMemo(
    () => mapToPagedSections(menuItems, menuGroups, categories),
    [menuItems, menuGroups, categories]
  );

  const pages = useMemo(() => paginateMenu(sections, settings), [
    sections,
    settings,
  ]);

  // Dimensions based on paper size & orientation
  const sz = useMemo(() => {
    if (settings.orientation === 'landscape') {
      return { w: 808, h: 572 };
    }
    if (settings.paperSize === 'letter') {
      return { w: 572, h: 740 };
    }
    return { w: 572, h: 808 }; // A4 Portrait
  }, [settings.paperSize, settings.orientation]);

  return (
    <div className="w-full flex flex-col items-center gap-8 py-2">
      {pages.map((blocks, idx) => {
        const isContact = blocks.length === 1 && blocks[0].k === 'contact';
        const label = isContact
          ? 'Contact / Thank You Page'
          : idx === 0
          ? 'Front Menu Cover'
          : `Menu Page ${idx + 1}`;

        return (
          <div
            key={idx}
            className="w-full flex flex-col items-center gap-2 print:gap-0"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:hidden">
              {label}
            </div>
            <MenuPageSheet
              blocks={blocks}
              idx={idx}
              total={pages.length}
              table={table}
              m={m}
              settings={settings}
              sz={sz}
            />
          </div>
        );
      })}
    </div>
  );
};
