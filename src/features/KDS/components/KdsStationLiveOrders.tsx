// src/features/KDS/components/KdsStationLiveOrders.tsx
import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Check,
  Play,
  CheckCircle2,
  X,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';
import { formatOrderItemName } from '@/features/Order/lib/orderUtils';
import type { KdsTicket, KdsStation, KdsTicketStatus } from '../types/kdsTypes';

interface KdsStationLiveOrdersProps {
  station: KdsStation | null;
  tickets: KdsTicket[];
  onAcceptTicket: (ticketId: string) => void;
  onStartTicket: (ticketId: string) => void;
  onReadyTicket: (ticketId: string) => void;
  onCancelTicketClick: (ticket: KdsTicket) => void;
  onToggleItem: (ticketId: string, itemId: string, completed: boolean) => void;
  isDarkMode?: boolean;
}

export const KdsStationLiveOrders: React.FC<KdsStationLiveOrdersProps> = ({
  station,
  tickets,
  onAcceptTicket,
  onStartTicket,
  onReadyTicket,
  onCancelTicketClick,
  onToggleItem,
  isDarkMode = true,
}) => {
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [mobileColumnFilter, setMobileColumnFilter] = useState<'all' | KdsTicketStatus>('all');

  // Live second-by-second ticker for accurate elapsed times
  useEffect(() => {
    setCurrentTimeMs(Date.now());
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (createdAt: string): string => {
    if (!currentTimeMs) return '00:00';
    const diffSec = Math.max(0, Math.floor((currentTimeMs - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedSeconds = (createdAt: string): number => {
    if (!currentTimeMs) return 0;
    return Math.max(0, Math.floor((currentTimeMs - new Date(createdAt).getTime()) / 1000));
  };

  // Group tickets into 4 workflow columns
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const acceptedTickets = tickets.filter((t) => t.status === 'accepted');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const readyTickets = tickets.filter((t) => t.status === 'ready');

  const columns: {
    id: KdsTicketStatus;
    title: string;
    badgeCount: number;
    badgeColor: string;
    tickets: KdsTicket[];
  }[] = [
    {
      id: 'pending',
      title: 'PENDING',
      badgeCount: pendingTickets.length,
      badgeColor: isDarkMode
        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        : 'bg-rose-100 text-rose-700 border-rose-300',
      tickets: pendingTickets,
    },
    {
      id: 'accepted',
      title: 'ACCEPTED',
      badgeCount: acceptedTickets.length,
      badgeColor: isDarkMode
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        : 'bg-blue-100 text-blue-700 border-blue-300',
      tickets: acceptedTickets,
    },
    {
      id: 'in_progress',
      title: 'IN PROGRESS',
      badgeCount: inProgressTickets.length,
      badgeColor: isDarkMode
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-amber-100 text-amber-800 border-amber-300',
      tickets: inProgressTickets,
    },
    {
      id: 'ready',
      title: 'READY (EXPO)',
      badgeCount: readyTickets.length,
      badgeColor: isDarkMode
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      tickets: readyTickets,
    },
  ];

  const visibleColumns =
    mobileColumnFilter === 'all'
      ? columns
      : columns.filter((col) => col.id === mobileColumnFilter);

  const renderTicketCard = (ticket: KdsTicket) => {
    const elapsedSec = getElapsedSeconds(ticket.createdAt);
    const isRush = ticket.priority === 'rush';
    const isOverdue = elapsedSec > 600; // > 10 min

    return (
      <div
        key={ticket._id}
        className={`rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs ${
          ticket.status === 'ready'
            ? isDarkMode
              ? 'bg-[#0E1626]/70 border-emerald-900/40 opacity-85'
              : 'bg-emerald-50/50 border-emerald-200'
            : isDarkMode
            ? 'bg-[#111827] border-[#1E293B] hover:border-slate-600'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Card Header */}
        <div className={`p-3.5 sm:p-4 border-b ${isDarkMode ? 'border-[#1E293B]' : 'border-slate-100'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg sm:text-xl font-black font-mono tracking-wider ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {ticket.ticketNumber}
                </span>

                {isRush && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3B171A] border border-[#FF5A5F]/40 text-[#FF5A5F] uppercase">
                    <Flame className="h-3 w-3" />
                    RUSH
                  </span>
                )}
              </div>

              {/* Order reference & table */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs font-mono font-semibold ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {ticket.orderNumber}
                </span>

                {ticket.tableNumber && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ticket.tableNumber}
                  </span>
                )}

                {ticket.orderType === 'dine_in' && (
                  <span
                    className={`text-[11px] flex items-center gap-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <UtensilsCrossed className="h-3 w-3" /> Dine-in
                  </span>
                )}
                {ticket.orderType === 'takeaway' && (
                  <span
                    className={`text-[11px] flex items-center gap-1 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    <ShoppingBag className="h-3 w-3" /> Takeout
                  </span>
                )}
                {ticket.orderType === 'delivery' && (
                  <span
                    className={`text-[11px] flex items-center gap-1 ${
                      isDarkMode ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  >
                    <Truck className="h-3 w-3" /> Delivery
                  </span>
                )}
              </div>
            </div>

            {/* Elapsed Time Badge */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                isRush || isOverdue
                  ? 'bg-[#3B171A] border-[#FF5A5F]/40 text-[#FF5A5F]'
                  : isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>{formatElapsed(ticket.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Card Items List */}
        <div className="p-3 sm:p-4 space-y-2.5 flex-1">
          {ticket.items.map((item) => {
            const isItemDone = !!item.completed;
            return (
              <div
                key={item._id}
                onClick={() => onToggleItem(ticket._id, item._id, !isItemDone)}
                className={`p-2 rounded-lg cursor-pointer transition-colors border ${
                  isItemDone
                    ? isDarkMode
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                    : isDarkMode
                    ? 'bg-[#1E293B]/40 border-slate-800 hover:bg-[#1E293B]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-white"
                    >
                      {isItemDone ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                        <span className="font-mono font-black text-amber-500">
                          {item.quantity}x
                        </span>
                        <span
                          className={
                            isItemDone
                              ? 'line-through text-slate-400'
                              : isDarkMode
                              ? 'text-slate-100'
                              : 'text-slate-900'
                          }
                        >
                          {formatOrderItemName(item.name || item.menuItemName || item)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-rose-400 mt-0.5 font-medium">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Actions Footer */}
        <div
          className={`p-3 sm:p-4 border-t flex items-center justify-between gap-2 ${
            isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          {ticket.status !== 'ready' && (
            <button
              onClick={() => onCancelTicketClick(ticket)}
              title="Cancel Ticket"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {ticket.status === 'pending' && (
            <button
              onClick={() => onAcceptTicket(ticket._id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors shadow-xs"
            >
              <Check className="h-4 w-4" />
              <span>Accept</span>
            </button>
          )}

          {ticket.status === 'accepted' && (
            <button
              onClick={() => onStartTicket(ticket._id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors shadow-xs"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Start Prep</span>
            </button>
          )}

          {ticket.status === 'in_progress' && (
            <button
              onClick={() => onReadyTicket(ticket._id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark Ready</span>
            </button>
          )}

          {ticket.status === 'ready' && (
            <div className="w-full flex items-center justify-center gap-2 py-1.5 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Ready for Pass / Expo</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`p-3 sm:p-5 lg:p-6 flex-1 flex flex-col min-w-0 overflow-y-auto scroll-smooth ${
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'
      }`}
    >
      {/* Mobile & Tablet Column Filter Tabs */}
      <div className="flex lg:hidden items-center gap-1.5 mb-4 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setMobileColumnFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase shrink-0 transition-colors ${
            mobileColumnFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : isDarkMode
              ? 'bg-[#1E293B] text-slate-300'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          All ({tickets.length})
        </button>
        {columns.map((col) => (
          <button
            key={col.id}
            onClick={() => setMobileColumnFilter(col.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase shrink-0 transition-colors ${
              mobileColumnFilter === col.id
                ? 'bg-blue-600 text-white shadow-xs'
                : isDarkMode
                ? 'bg-[#1E293B] text-slate-300'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {col.title} ({col.badgeCount})
          </button>
        ))}
      </div>

      {/* Responsive Kanban Columns Grid */}
      <div
        className={`grid gap-4 sm:gap-5 flex-1 items-start ${
          mobileColumnFilter === 'all'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1'
        }`}
      >
        {visibleColumns.map((col) => (
          <div
            key={col.id}
            className={`rounded-xl border flex flex-col max-h-full transition-colors ${
              isDarkMode ? 'bg-[#0D1322] border-[#1E293B]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {/* Column Header */}
            <div
              className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? 'border-[#1E293B] bg-[#111A2E]' : 'border-slate-200 bg-white'
              }`}
            >
              <h3
                className={`text-xs sm:text-sm font-black font-mono tracking-wider uppercase ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {col.title}
              </h3>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${col.badgeColor}`}
              >
                {col.badgeCount} {col.badgeCount === 1 ? 'TICKET' : 'TICKETS'}
              </span>
            </div>

            {/* Column Content with Smooth Vertical Scroll */}
            <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[calc(100vh-13rem)] scroll-smooth">
              {col.tickets.length === 0 ? (
                <div className="py-10 sm:py-12 flex flex-col items-center justify-center text-center">
                  <UtensilsCrossed
                    className={`h-7 w-7 mb-2 ${
                      isDarkMode ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  />
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    No {col.title} Tickets
                  </p>
                </div>
              ) : (
                col.tickets.map(renderTicketCard)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default KdsStationLiveOrders;
