// src/features/Table/Components/ActiveSessionsView.tsx

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Utensils,
  ShoppingBag,
  ArrowRightLeft,
  Unlock,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Coffee,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSessionsQuery,
  useFreeSessionMutation,
  type TableSession,
} from '../../../api/Queries/sessionQueries';
import {
  useChangeTableMutation,
  useTablesQuery,
} from '../../../api/Queries/tableQueries';
import { toast } from 'sonner';

interface ActiveSessionsViewProps {
  currentBranchId: string | null;
  onOpenTableDetail: (table: any) => void;
}

const formatElapsedTime = (startedAt: string) => {
  try {
    const start = new Date(startedAt).getTime();
    if (isNaN(start)) return 'Just now';
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'}`;
    const hours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${hours}h ${remainingMins}m`;
  } catch {
    return 'Active';
  }
};

export const ActiveSessionsView: React.FC<ActiveSessionsViewProps> = ({
  currentBranchId,
  onOpenTableDetail,
}) => {
  const { data: sessions = [], isLoading, refetch } = useSessionsQuery({
    branchId: currentBranchId || undefined,
    // status: 'active',
  });

  const { data: tables = [] } = useTablesQuery(currentBranchId);
  const freeSessionMutation = useFreeSessionMutation();
  const changeTableMutation = useChangeTableMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ordered' | 'browsing'>('all');

  // Change Table Modal State
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);
  const [targetTableId, setTargetTableId] = useState('');
  const [moveReason, setMoveReason] = useState('');

  // Calculate Metrics
  const stats = useMemo(() => {
    const total = sessions.length;
    let orderedCount = 0;
    let browsingCount = 0;
    let totalRevenue = 0;

    sessions.forEach((s) => {
      const orders = s.orders || [];
      const hasOrders = orders.length > 0 || (s.totalOrders && s.totalOrders > 0);
      if (hasOrders) {
        orderedCount++;
        totalRevenue += s.totalSpent || 0;
      } else {
        browsingCount++;
      }
    });

    return { total, orderedCount, browsingCount, totalRevenue };
  }, [sessions]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const tableNumber = s.table?.tableNumber?.toLowerCase() || '';
      const customerName = s.customer?.fullName?.toLowerCase() || '';
      const customerPhone = s.customer?.phone?.toLowerCase() || '';
      const matchesSearch =
        tableNumber.includes(searchQuery.toLowerCase()) ||
        customerName.includes(searchQuery.toLowerCase()) ||
        customerPhone.includes(searchQuery.toLowerCase());

      const orders = s.orders || [];
      const hasOrders = orders.length > 0 || (s.totalOrders && s.totalOrders > 0);

      if (filterType === 'ordered' && !hasOrders) return false;
      if (filterType === 'browsing' && hasOrders) return false;

      return matchesSearch;
    });
  }, [sessions, searchQuery, filterType]);

  const handleFreeTable = async (session: TableSession) => {
    try {
      await freeSessionMutation.mutateAsync(session._id);
      refetch();
    } catch {
      // Toast handled by mutation
    }
  };

  const handleOpenMoveModal = (session: TableSession) => {
    setSelectedSession(session);
    setTargetTableId('');
    setMoveReason('');
    setIsMoveOpen(true);
  };

  const handleConfirmMove = async () => {
    if (!selectedSession || !targetTableId) {
      toast.error('Please select a destination table');
      return;
    }

    try {
      await changeTableMutation.mutateAsync({
        fromTableId: selectedSession.table._id,
        toTableId: targetTableId,
        reason: moveReason || undefined,
      });
      setIsMoveOpen(false);
      setSelectedSession(null);
      refetch();
    } catch {
      // Toast handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          Fetching live seated sessions...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* 1. TOP METRICS BENTO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Seated Tables
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Browsing (No Order)
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.browsingCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Coffee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Dining (With Orders)
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.orderedCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Utensils className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Table Spend
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">ETB</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. CONTROLS & FILTER ROW */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table #, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'default' : 'ghost'}
            className="h-8 text-xs font-semibold rounded-lg"
            onClick={() => setFilterType('all')}
          >
            All Sessions ({sessions.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'browsing' ? 'default' : 'ghost'}
            className="h-8 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-400"
            onClick={() => setFilterType('browsing')}
          >
            Browsing ({stats.browsingCount})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'ordered' ? 'default' : 'ghost'}
            className="h-8 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-400"
            onClick={() => setFilterType('ordered')}
          >
            With Orders ({stats.orderedCount})
          </Button>
        </div>
      </div>

      {/* 3. SESSIONS LIST GRID */}
      {filteredSessions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Active Seated Sessions
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            When guests scan the QR code on a table, their live session and dining status will show up here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const orders = session.orders || [];
            const hasOrders = orders.length > 0 || (session.totalOrders && session.totalOrders > 0);
            const totalSpent = session.totalSpent || 0;
            const tableObj = tables.find((t: any) => t._id === session.table?._id) || session.table;

            return (
              <Card
                key={session._id}
                className="group relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                {/* Status Indicator Stripe */}
                <div
                  className={`h-1.5 w-full ${
                    hasOrders ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                  }`}
                />

                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Table Number + Badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border font-black text-xl text-slate-900 dark:text-white">
                        {session.table?.tableNumber || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            Table {session.table?.tableNumber}
                          </h4>
                          {session.table?.branch?.name && (
                            <span className="text-[10px] text-muted-foreground">
                              • {session.table.branch.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Seated {formatElapsedTime(session.startedAt)} ago
                        </p>
                      </div>
                    </div>

                    {hasOrders ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold uppercase">
                        Dining
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 text-[10px] font-bold uppercase">
                        Browsing
                      </Badge>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Customer
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {session.customer?.fullName || (session.isAnonymous ? 'Guest Customer' : 'Walk-In')}
                      </p>
                      {session.customer?.phone && (
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {session.customer.phone}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Orders & Spend
                      </p>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                      </p>
                      {totalSpent > 0 && (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {totalSpent.toLocaleString()} ETB
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold flex-1 gap-1.5"
                      onClick={() => handleOpenMoveModal(session)}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
                      Move Table
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs font-semibold flex-1 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={() => handleFreeTable(session)}
                      disabled={freeSessionMutation.isPending}
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      Free Table
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onOpenTableDetail(tableObj)}
                      title="View Table Details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* TRANSFER / MOVE TABLE MODAL */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Transfer Table Session
            </DialogTitle>
            <DialogDescription>
              Transfer Table {selectedSession?.table?.tableNumber} session and all associated orders to another table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Destination Table
              </label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Select target table" />
                </SelectTrigger>
                <SelectContent>
                  {tables
                    .filter((t: any) => t._id !== selectedSession?.table?._id)
                    .map((t: any) => (
                      <SelectItem key={t._id} value={t._id} className="text-xs">
                        Table {t.tableNumber} ({t.section || 'Main'} • {t.status})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Transfer Reason (Optional)
              </label>
              <Input
                placeholder="e.g. Guest moved outdoors, combined tables"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleConfirmMove}
              disabled={changeTableMutation.isPending || !targetTableId}
            >
              {changeTableMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
