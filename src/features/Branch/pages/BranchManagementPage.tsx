import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  MoreVertical,
  LayoutGrid,
  ListFilter,
  Globe,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import RightSideModal from '@/components/ui/RightSideModal';
import BranchFormPage from '../Components/BranchFormPage';
import BranchDetailPage from './BranchDetailPage';
import { toast } from 'sonner';
import { useBranchesQuery } from '../../../api/Queries/branchQueries';

const BranchManagementPage = () => {
  const navigate = useNavigate();
  const { data: branches = [], isLoading } = useBranchesQuery();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>(
    'detail'
  );
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBranches = useMemo(() => {
    return branches.filter(
      (branch: any) =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [branches, searchQuery]);

  const stats = useMemo(
    () => ({
      total: branches.length,
      active: branches.filter((b: any) => b.isActive).length,
      main: branches.filter((b: any) => b.isMain).length,
    }),
    [branches]
  );

  const openDetail = (branch: any) => {
    setSelectedBranch(branch);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedBranch(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedBranch(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      {/* PROFESSIONAL HEADER */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
        <div className="flex h-16 items-center px-4 sm:px-8 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Branches
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Globe className="h-3 w-3" /> {stats.total} Total Locations
              </span>
              <span className="text-[11px] font-medium text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {stats.active} Online
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-100/50 border-transparent focus:bg-white transition-all h-9 text-sm"
              />
            </div>
            <Button
              onClick={openAdd}
              size="sm"
              className="font-bold px-4 shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Branch
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-8">
        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading
            ? // SKELETON LOADING STATE
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-0 overflow-hidden border-slate-200">
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))
            : filteredBranches.map((branch: any) => (
                <Card
                  key={branch._id}
                  onClick={() => openDetail(branch)}
                  className="group relative cursor-pointer border-slate-200/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  {/* Visual Header */}
                  <div className="h-28 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                      <svg
                        className="h-full w-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0 100 C 20 0 50 0 100 100 Z"
                          fill="currentColor"
                          className="text-primary"
                        />
                      </svg>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge
                        variant={branch.isActive ? 'success' : 'destructive'}
                        className="px-2 py-0 h-5 text-[10px] backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-none shadow-sm font-bold uppercase tracking-wider"
                      >
                        {branch.isActive ? 'Online' : 'Offline'}
                      </Badge>
                      {branch.isMain && (
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-[9px] font-black h-5 uppercase px-2 shadow-sm border-none">
                          Main
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                        {branch.name}
                      </h3>
                    </div>

                    <div className="space-y-2.5 mt-4">
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">
                          {branch.location?.city}
                          {branch.location?.subCity &&
                            `, ${branch.location.subCity}`}
                        </span>
                      </div>

                      {branch.phone && (
                        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          <span>{branch.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Hover Indicator */}
                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                        View Details
                      </span>
                      <ArrowLeft className="h-3.5 w-3.5 text-primary rotate-180" />
                    </div>
                  </div>
                </Card>
              ))}
        </div>

        {/* EMPTY STATE */}
        {!isLoading && filteredBranches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 bg-white/40 border-2 border-dashed border-slate-200 rounded-[2.5rem] mt-4">
            <div className="p-6 bg-slate-100 rounded-full mb-6">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              No matching branches
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs text-center">
              We couldn't find any locations matching "{searchQuery}". Try a
              different name or city.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full px-8"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </div>
        )}
      </main>

      {/* MOBILE FLOATING ACTION */}
      <Button
        onClick={openAdd}
        size="lg"
        className="fixed bottom-8 right-8 rounded-2xl shadow-2xl z-50 md:hidden h-14 w-14 flex items-center justify-center bg-primary hover:bg-primary/90 transition-all active:scale-90"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
      </Button>

      {/* MODAL SYSTEM */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        className="sm:max-w-2xl"
        title={
          panelMode === 'add'
            ? 'Register New Branch'
            : panelMode === 'edit'
              ? 'Edit Branch'
              : selectedBranch?.name
        }
        description={
          panelMode === 'add'
            ? 'Set up a new physical location for your business.'
            : undefined
        }
      >
        {panelMode === 'detail' && selectedBranch && (
          <BranchDetailPage
            branchId={selectedBranch._id}
            onEdit={() => setPanelMode('edit')}
          />
        )}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <BranchFormPage
            initialData={panelMode === 'edit' ? selectedBranch : undefined}
            onSuccess={() => {
              toast.success(
                panelMode === 'add' ? 'New branch registered' : 'Branch updated'
              );
              closePanel();
            }}
            onCancel={closePanel}
          />
        )}
      </RightSideModal>
    </div>
  );
};

export default BranchManagementPage;
