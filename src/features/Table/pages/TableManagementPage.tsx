// src/features/Table/Pages/TableManagementPage.tsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  ArrowLeft,
  Plus,
  Search,
  QrCode,
  Users,
  CheckCircle2,
  AlertCircle,
  Ban,
  Filter,
  Building2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RightSideModal from '@/components/ui/RightSideModal';
import TableFormPage from '../Components/TableFormPage';
import TableDetailPage from './TableDetailPage';
import { toast } from 'sonner';
import { useTablesQuery } from '../../../api/Queries/tableQueries'; // ← Smart hook
import { useGetMeQuery } from '../../../api/Queries/authQueries';
import { useBranchesQuery } from '../../../api/Queries/branchQueries';

// Sophisticated Status Configuration
const statusConfig: Record<
  string,
  { label: string; border: string; accent: string; icon: any }
> = {
  available: {
    label: 'Available',
    border: 'border-emerald-500/50',
    accent: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  occupied: {
    label: 'Occupied',
    border: 'border-rose-500/50',
    accent: 'bg-rose-500',
    icon: Users,
  },
  'needs-cleaning': {
    label: 'Needs Cleaning',
    border: 'border-amber-500/50',
    accent: 'bg-amber-500',
    icon: AlertCircle,
  },
  disabled: {
    label: 'Disabled',
    border: 'border-slate-300',
    accent: 'bg-slate-400',
    icon: Ban,
  },
};

const TableManagementPage = () => {
  const navigate = useNavigate();

  // Current branch from Header selector
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  // User & role
  const { data: user } = useGetMeQuery();
  const isSuperAdmin = user?.role?.name === 'SUPER-MERCHANT-ADMIN';

  // All branches for name lookup
  const { data: branches = [] } = useBranchesQuery();

  // Current branch name
  const currentBranch = branches.find((b) => b._id === currentBranchId);
  const currentBranchName = currentBranch?.name || 'All Locations';

  // Smart fetch: automatically uses correct endpoint based on currentBranchId
  const { data: tables = [], isLoading } = useTablesQuery(currentBranchId);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>(
    'detail'
  );
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');

  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const sections = useMemo(() => {
    const unique = new Set(tables.map((t: any) => t.section).filter(Boolean));
    return ['all', ...Array.from(unique).sort()];
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((table: any) => {
      const matchesSearch =
        table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (currentBranchId === null &&
          table.branch?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterStatus === 'all' || table.status === filterStatus;
      const matchesSection =
        filterSection === 'all' || table.section === filterSection;

      return matchesSearch && matchesStatus && matchesSection;
    });
  }, [tables, searchQuery, filterStatus, filterSection, currentBranchId]);

  const openDetail = (table: any) => {
    setSelectedTable(table);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedTable(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedTable(null);
  };

  const isAllBranches = currentBranchId === null && isSuperAdmin;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <div className="animate-pulse text-slate-400 font-medium">
          Loading Floor Plan...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
        <div className="flex h-16 items-center px-4 sm:px-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Table Management
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {currentBranchName}
              </span>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {
                  tables.filter((t: any) => t.status === 'available').length
                }{' '}
                Available
              </span>

              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{tables.length} Total</span>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tables, sections, or branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 bg-slate-100/50 border-none focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="sm:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Add Button */}
          <Button
            onClick={openAdd}
            size="sm"
            className="hidden sm:flex shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="px-4 pb-4 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-100/50 border-none focus-visible:ring-1"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="border-t bg-white/50 dark:bg-slate-900/50">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters {showFilters ? '▲' : '▼'}
              </Button>

              <span className="text-xs text-slate-500">
                {filteredTables.length} table
                {filteredTables.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              className={`mt-3 space-y-3 sm:space-y-0 sm:flex sm:gap-4 ${showFilters ? 'block' : 'hidden sm:flex'}`}
            >
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-full sm:w-[160px] text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.keys(statusConfig).map((k) => (
                    <SelectItem key={k} value={k}>
                      {statusConfig[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="h-9 w-full sm:w-[160px] text-sm">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((sec) => (
                    <SelectItem key={sec} value={sec} className="capitalize">
                      {sec === 'all' ? 'All Sections' : sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Floor Plan Grid */}
      <main className="p-4 sm:p-8 pb-24 sm:pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 sm:gap-8">
          {filteredTables.map((table: any) => {
            const config = statusConfig[table.status] || statusConfig.available;
            const StatusIcon = config.icon;
            const isRound =
              table.shape === 'round' || table.tableNumber.startsWith('R');

            return (
              <div
                key={table._id}
                onClick={() => openDetail(table)}
                className="group relative flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div
                  className={`absolute top-0 w-12 h-1 ${config.accent} rounded-full z-10 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                />

                <Card
                  className={`
                    relative aspect-square w-full flex flex-col items-center justify-center
                    border-2 ${config.border} shadow-sm group-hover:shadow-xl transition-shadow
                    bg-white dark:bg-slate-900
                    ${isRound ? 'rounded-full' : 'rounded-[2rem]'}
                  `}
                >
                  <div className="text-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white block mb-1">
                      {table.tableNumber}
                    </span>
                    <div
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.accent} text-[10px] font-bold text-white uppercase tracking-tighter`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </div>
                </Card>

                <div className="mt-3 w-full text-center space-y-1">
                  <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {table.capacity}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>{table.section || 'Main'}</span>
                  </div>

                  {/* Show branch name only in "All Locations" mode */}
                  {isAllBranches && table.branch && (
                    <p className="text-[9px] text-slate-400 uppercase mt-1">
                      {table.branch.name}
                    </p>
                  )}

                  <div className="flex justify-center mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                      <QrCode className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <QrCode className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No tables found
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              {isAllBranches
                ? 'No tables across all branches match your filters.'
                : `No tables in ${currentBranchName} match your filters.`}
            </p>
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <Button
        onClick={openAdd}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full shadow-2xl z-50 sm:hidden h-14 w-14 flex items-center justify-center bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Add new table"
      >
        <Plus className="h-7 w-7" strokeWidth={3} />
      </Button>

      {/* Right Side Modal */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        title={
          panelMode === 'add'
            ? 'New Table Configuration'
            : `Table ${selectedTable?.tableNumber}`
        }
      >
        {panelMode === 'detail' && selectedTable && (
          <TableDetailPage
            tableId={selectedTable._id}
            onEdit={() => setPanelMode('edit')}
          />
        )}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <TableFormPage
            initialData={panelMode === 'edit' ? selectedTable : undefined}
            onSuccess={() => {
              toast.success('Floor plan updated');
              closePanel();
            }}
            onCancel={closePanel}
          />
        )}
      </RightSideModal>
    </div>
  );
};

export default TableManagementPage;
