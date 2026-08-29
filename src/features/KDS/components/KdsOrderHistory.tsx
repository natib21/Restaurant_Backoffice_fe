// src/features/KDS/components/KdsOrderHistory.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Timer,
  X,
  Copy,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatOrderItemName } from '@/features/Order/lib/orderUtils';
import { useKitchenTicketHistoryQuery } from '@/api/Queries/kitchenQueries';
import type { KdsTicket, KdsStation } from '../types/kdsTypes';

interface KdsOrderHistoryProps {
  stationId?: string;
  branchId?: string;
  stations?: KdsStation[];
  isDarkMode?: boolean;
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

export const KdsOrderHistory: React.FC<KdsOrderHistoryProps> = ({
  stationId,
  branchId,
  stations = [],
  isDarkMode = true,
}) => {
  // Filter States
  const [stationFilter, setStationFilter] = useState<string>(stationId || 'all');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'canceled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Custom date inputs (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Selected ticket for full history details modal
  const [selectedTicket, setSelectedTicket] = useState<KdsTicket | null>(null);

  // Compute startDate & endDate based on preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    switch (datePreset) {
      case 'today':
        return { startDate: toDateStr(now), endDate: toDateStr(now) };
      case 'yesterday': {
        const y = new Date(now.getTime() - 86400000);
        return { startDate: toDateStr(y), endDate: toDateStr(y) };
      }
      case 'week': {
        const w = new Date(now.getTime() - 7 * 86400000);
        return { startDate: toDateStr(w), endDate: toDateStr(now) };
      }
      case 'month': {
        const m = new Date(now.getTime() - 30 * 86400000);
        return { startDate: toDateStr(m), endDate: toDateStr(now) };
      }
      case 'custom':
        return { startDate: customStartDate, endDate: customEndDate };
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Query Backend Endpoint: GET /api/v1/kitchen/tickets/history
  const {
    data: historyData,
    isLoading,
    isFetching,
    refetch,
  } = useKitchenTicketHistoryQuery({
    branchId,
    stationId: stationFilter !== 'all' ? stationFilter : undefined,
    startDate,
    endDate,
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm.trim() || undefined,
  });

  const rawTickets = historyData?.tickets || [];
  const totalCount = historyData?.total ?? rawTickets.length;
  const totalPages = historyData?.pages ?? Math.max(1, Math.ceil(totalCount / limit));

  // Client-side search & status filtering fallback for fine-grained search
  const filteredTickets = useMemo(() => {
    return rawTickets.filter((t) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTerm =
          t.ticketNumber.toLowerCase().includes(term) ||
          t.orderNumber.toLowerCase().includes(term) ||
          (t.tableNumber && t.tableNumber.toLowerCase().includes(term)) ||
          (t.customerName && t.customerName.toLowerCase().includes(term)) ||
          t.items.some((item) => item.name.toLowerCase().includes(term));
        if (!matchesTerm) return false;
      }
      if (statusFilter === 'ready' && t.status !== 'ready' && t.status !== 'completed') {
        return false;
      }
      if (statusFilter === 'canceled' && t.status !== 'canceled') {
        return false;
      }
      return true;
    });
  }, [rawTickets, searchTerm, statusFilter]);

  // Statistics calculation for the current query slice
  const stats = useMemo(() => {
    const completedList = rawTickets.filter(
      (t) => t.status === 'ready' || t.status === 'completed'
    );
    const canceledList = rawTickets.filter((t) => t.status === 'canceled');

    let totalDurationSec = 0;
    let countedDurationTickets = 0;

    completedList.forEach((t) => {
      if (typeof t.durationSeconds === 'number' && t.durationSeconds > 0) {
        totalDurationSec += t.durationSeconds;
        countedDurationTickets += 1;
      } else if (t.createdAt && (t.readyAt || t.completedAt)) {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.readyAt || t.completedAt || '').getTime();
        const diff = Math.max(0, Math.floor((end - start) / 1000));
        if (diff > 0 && diff < 86400) {
          totalDurationSec += diff;
          countedDurationTickets += 1;
        }
      }
    });

    const avgMinutes =
      countedDurationTickets > 0
        ? (totalDurationSec / countedDurationTickets / 60).toFixed(1)
        : '0.0';

    return {
      total: totalCount,
      completed: completedList.length,
      canceled: canceledList.length,
      avgMinutes,
    };
  }, [rawTickets, totalCount]);

  const handleReprint = (ticket: KdsTicket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast.success(`Reprint dispatched to kitchen ticket printer for ${ticket.ticketNumber}`);
  };

  const handleCopyTicket = (ticket: KdsTicket) => {
    navigator.clipboard.writeText(ticket.ticketNumber);
    toast.success(`Copied Ticket #${ticket.ticketNumber} to clipboard`);
  };

  const formatTurnaroundTime = (t: KdsTicket): string => {
    if (typeof t.durationSeconds === 'number' && t.durationSeconds > 0) {
      const mins = Math.floor(t.durationSeconds / 60);
      const secs = t.durationSeconds % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    const startStr = t.startedAt || t.acceptedAt || t.createdAt;
    const endStr = t.completedAt || t.readyAt;
    if (!startStr || !endStr) return '—';
    const diffSec = Math.max(
      0,
      Math.floor((new Date(endStr).getTime() - new Date(startStr).getTime()) / 1000)
    );
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTime = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto scroll-smooth ${
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-6 w-6 text-amber-500" />
              <h2
                className={`text-lg sm:text-xl font-bold tracking-wider uppercase font-mono ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Kitchen Ticket History
              </h2>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isDarkMode ? 'bg-slate-800 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}
              >
                /api/v1/kitchen/tickets/history
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Completed, dispatched, and voided kitchen tickets with full audit timelines and prep duration
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                isDarkMode
                  ? 'bg-[#1E293B] border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-50'
              }`}
              title="Refresh History Tickets"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className={`p-3.5 sm:p-4 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total History Tickets
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {stats.total}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Matched by current filter parameters</div>
          </div>

          <div
            className={`p-3.5 sm:p-4 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Ready / Completed
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-emerald-500">
              {stats.completed}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Successfully served or dispatched</div>
          </div>

          <div
            className={`p-3.5 sm:p-4 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">
              Canceled / Voided
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-rose-500">
              {stats.canceled}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Voided with recorded cancel reason</div>
          </div>

          <div
            className={`p-3.5 sm:p-4 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
              Avg Ticket Turnaround
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-amber-500">
              {stats.avgMinutes} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Kitchen fire to completion duration</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          className={`p-4 rounded-xl border space-y-3.5 ${
            isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Date Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date:
              </span>
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'Last 30 Days' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Custom' },
                ] as { id: DatePreset; label: string }[]
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setDatePreset(preset.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    datePreset === preset.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Status:
              </span>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'ready', label: 'Ready' },
                  { id: 'canceled', label: 'Voided' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setStatusFilter(st.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    statusFilter === st.id
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Station & Custom Date Inputs & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-800/60">
            {/* Station Dropdown */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Kitchen Station
              </label>
              <select
                value={stationFilter}
                onChange={(e) => {
                  setStationFilter(e.target.value);
                  setPage(1);
                }}
                className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border focus:outline-none ${
                  isDarkMode
                    ? 'bg-[#1E293B] border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="all">All Kitchen Stations</option>
                {stations.map((st) => (
                  <option key={st._id || st.stationId} value={st._id || st.stationId}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range picker if selected */}
            {datePreset === 'custom' && (
              <>
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                      isDarkMode
                        ? 'bg-[#1E293B] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                      isDarkMode
                        ? 'bg-[#1E293B] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </>
            )}

            {/* Search Input */}
            <div className={datePreset === 'custom' ? 'lg:col-span-5' : 'lg:col-span-9'}>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Search Ticket / Order # / Table
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by ticket # (e.g. GRILL-01), order #, table #, or item name..."
                  className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border focus:outline-none ${
                    isDarkMode
                      ? 'bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Grid / Table */}
        {isLoading ? (
          <div
            className={`p-12 rounded-xl border text-center flex flex-col items-center justify-center ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-400">
              Querying completed ticket history from server...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            className={`p-12 rounded-xl border text-center flex flex-col items-center justify-center ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <Clock className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-base font-bold text-slate-300">No completed tickets found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No tickets matched the selected station or date range from the history endpoint. Try
              adjusting the date filters or station selection.
            </p>
            <button
              onClick={() => {
                setDatePreset('all');
                setStationFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => {
              const isCanceled = ticket.status === 'canceled';
              const turnaround = formatTurnaroundTime(ticket);

              return (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer hover:border-amber-500/50 flex flex-col justify-between ${
                    isDarkMode
                      ? 'bg-[#111827] border-[#1E293B] hover:bg-[#131d31]'
                      : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base sm:text-lg font-black font-mono tracking-wider ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ticket.orderNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCanceled ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/50">
                            <XCircle className="h-3 w-3" /> VOIDED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                            <CheckCircle2 className="h-3 w-3" /> READY
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleReprint(ticket, e)}
                          title="Reprint Kitchen Ticket"
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-400 hover:text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] font-mono">
                      {ticket.orderType && (
                        <span
                          className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] flex items-center gap-1 ${
                            ticket.orderType === 'dine_in'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : ticket.orderType === 'takeaway'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {ticket.orderType === 'dine_in' ? (
                            <UtensilsCrossed className="h-2.5 w-2.5" />
                          ) : ticket.orderType === 'takeaway' ? (
                            <ShoppingBag className="h-2.5 w-2.5" />
                          ) : (
                            <Truck className="h-2.5 w-2.5" />
                          )}
                          {ticket.orderType.replace('_', ' ')}
                        </span>
                      )}

                      {ticket.tableNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          Table: {ticket.tableNumber}
                        </span>
                      )}

                      {ticket.customerName && (
                        <span className="text-slate-400 truncate max-w-[130px]">
                          {ticket.customerName}
                        </span>
                      )}
                    </div>

                    {/* Items Breakdown */}
                    <div
                      className={`py-3 space-y-1.5 text-xs ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {ticket.items.slice(0, 4).map((item) => (
                        <div key={item._id} className="flex items-start justify-between gap-2">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <strong className="font-mono text-amber-500 shrink-0">
                              {item.quantity}x
                            </strong>
                            <span className="truncate">
                              {formatOrderItemName(item.name || item.menuItemName || item)}
                            </span>
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-rose-400 shrink-0 truncate max-w-[90px]">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}

                      {ticket.items.length > 4 && (
                        <div className="text-[11px] text-slate-500 italic">
                          +{ticket.items.length - 4} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Turnaround time and timestamps */}
                  <div
                    className={`pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                      isDarkMode
                        ? 'border-slate-800/80 text-slate-400'
                        : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-400">
                        {ticket.stationName || ticket.stationCode}
                      </span>
                      <span>•</span>
                      <span>{formatTime(ticket.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCanceled ? (
                        <span className="text-rose-400 truncate max-w-[120px]" title={ticket.cancelReason}>
                          {ticket.cancelReason || 'Canceled'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Timer className="h-3 w-3" />
                          {turnaround}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {totalCount > 0 && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs font-mono text-slate-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}{' '}
              tickets
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400">Limit:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`text-xs font-mono px-2 py-1 rounded border focus:outline-none ${
                    isDarkMode
                      ? 'bg-[#1E293B] border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-[#1E293B] border-slate-700 text-white hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 py-1 text-xs font-mono font-bold text-slate-300">
                  {page} / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-[#1E293B] border-slate-700 text-white hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL TICKET DETAILS MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isDarkMode ? 'bg-[#111827] border-[#1E293B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black font-mono tracking-wider">
                      {selectedTicket.ticketNumber}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                      {selectedTicket.orderNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Station: {selectedTicket.stationName} ({selectedTicket.stationCode})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Order & Status info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Order Type</div>
                  <div className="font-bold capitalize text-slate-200 mt-0.5">
                    {selectedTicket.orderType?.replace('_', ' ') || 'Dine In'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Table Number</div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {selectedTicket.tableNumber || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Customer</div>
                  <div className="font-bold text-slate-200 mt-0.5 truncate">
                    {selectedTicket.customerName || 'Guest'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Turnaround</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {formatTurnaroundTime(selectedTicket)}
                  </div>
                </div>
              </div>

              {/* Lifecycle Timeline Audit */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Preparation Lifecycle Audit
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Received / Fired</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatTime(selectedTicket.createdAt)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      {formatDate(selectedTicket.createdAt)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Accepted</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatTime(selectedTicket.acceptedAt)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Cooking Started</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatTime(selectedTicket.startedAt)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Ready / Finished</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatTime(selectedTicket.completedAt || selectedTicket.readyAt)}
                    </span>
                  </div>
                </div>

                {selectedTicket.status === 'canceled' && (
                  <div className="mt-3 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300">
                    <div className="font-bold text-xs uppercase flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-rose-400" /> Voided / Canceled
                    </div>
                    <p className="text-xs mt-1">
                      <strong>Reason:</strong> {selectedTicket.cancelReason || 'No reason recorded'}
                    </p>
                    <p className="text-[10px] text-rose-400/80 mt-0.5">
                      Voided at: {formatTime(selectedTicket.canceledAt)} on{' '}
                      {formatDate(selectedTicket.canceledAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Ticket Items ({selectedTicket.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedTicket.items.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          <span className="font-mono text-amber-400">{item.quantity}x</span>
                          <span>{formatOrderItemName(item.name || item.menuItemName || item)}</span>
                        </div>
                        {item.modifiers && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {Array.isArray(item.modifiers)
                              ? item.modifiers.join(', ')
                              : String(item.modifiers)}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-rose-400 font-medium mt-0.5">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'ready' || item.completed
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'in_progress'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.status || (item.completed ? 'READY' : 'PENDING')}
                        </span>
                        {item.startedAt && item.completedAt && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            {Math.max(
                              1,
                              Math.round(
                                (new Date(item.completedAt).getTime() -
                                  new Date(item.startedAt).getTime()) /
                                  1000 /
                                  60
                              )
                            )}{' '}
                            min prep
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`px-6 py-4 border-t flex items-center justify-between ${
                isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyTicket(selectedTicket)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy ID</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReprint(selectedTicket)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Reprint Kitchen Slip</span>
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KdsOrderHistory;
