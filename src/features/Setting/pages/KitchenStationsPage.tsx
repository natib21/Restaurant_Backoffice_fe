import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Filter,
  Edit2,
  Trash2,
  Route,
  Layers,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tv,
} from 'lucide-react';
import { SettingPageLayout } from '../Components/SettingPageLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useKitchenStationsQuery,
  useCreateStationMutation,
  useUpdateStationMutation,
  useDeleteStationMutation,
  type KdsStation,
} from '@/api/Queries/kitchenQueries';
import { useCategoriesQuery } from '@/api/Queries/categoryQueries';
import { getCategoryName } from '@/features/Menu/lib/categoryUtils';

const getSafeStationName = (name: any): string => {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') return name.en || name.am || Object.values(name)[0] || '';
  return String(name);
};

const getSafeStationDescription = (desc: any): string => {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  if (typeof desc === 'object') return desc.en || desc.am || Object.values(desc)[0] || '';
  return String(desc);
};

export const KitchenStationsPage: React.FC = () => {
  const { data: stations = [], isLoading, refetch } = useKitchenStationsQuery();
  const { mutateAsync: createStation, isPending: isCreating } = useCreateStationMutation();
  const { mutateAsync: updateStation, isPending: isUpdating } = useUpdateStationMutation();
  const { mutateAsync: deleteStation, isPending: isDeleting } = useDeleteStationMutation();
  const { data: categories = [] } = useCategoriesQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<KdsStation | null>(null);

  // New / Edit station form state
  const [stationName, setStationName] = useState('');
  const [stationCode, setStationCode] = useState('');
  const [stationDesc, setStationDesc] = useState('');
  const [stationColor, setStationColor] = useState('#2170E4');

  const filteredStations = stations.filter((s) => {
    const sName = getSafeStationName(s.name).toLowerCase();
    const sCode = (s.code || '').toLowerCase();
    const sDesc = getSafeStationDescription(s.description).toLowerCase();
    const q = searchQuery.toLowerCase();
    return sName.includes(q) || sCode.includes(q) || sDesc.includes(q);
  });

  const handleOpenAdd = () => {
    setEditingStation(null);
    setStationName('');
    setStationCode('');
    setStationDesc('');
    setStationColor('#2170E4');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (station: KdsStation) => {
    setEditingStation(station);
    setStationName(getSafeStationName(station.name));
    setStationCode(station.code || '');
    setStationDesc(getSafeStationDescription(station.description));
    setStationColor(station.color || '#2170E4');
    setIsAddOpen(true);
  };

  const handleSaveStation = async () => {
    if (!stationName.trim()) {
      toast.error('Station name is required');
      return;
    }
    const code = (stationCode || stationName.slice(0, 3)).trim().toUpperCase();

    try {
      if (editingStation) {
        await updateStation({
          stationId: editingStation._id || editingStation.stationId,
          data: {
            name: stationName.trim(),
            code,
            description: stationDesc.trim(),
            color: stationColor,
          },
        });
        toast.success(`Station "${stationName}" updated`);
      } else {
        await createStation({
          name: stationName.trim(),
          code,
          description: stationDesc.trim(),
          color: stationColor,
        });
        toast.success(`Kitchen station "${stationName}" created`);
      }
      setIsAddOpen(false);
      refetch();
    } catch (err: any) {
      // Error handled by mutation toast
    }
  };

  const handleDeleteStation = async (station: KdsStation) => {
    const id = station._id || station.stationId;
    if (!id) return;
    const displayName = getSafeStationName(station.name) || 'Station';
    if (confirm(`Are you sure you want to delete station "${displayName}"?`)) {
      try {
        await deleteStation({ stationId: id });
        refetch();
      } catch (err) {
        // Handled by mutation toast
      }
    }
  };

  return (
    <SettingPageLayout
      title="Kitchen Stations"
      subtitle="Configure physical prep stations, assign KDS screens or ticket printers, and manage menu routing."
      breadcrumbs={[{ label: 'Kitchen Stations' }]}
      actions={
        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-[#2170E4] hover:bg-blue-700 text-white h-9 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Station
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stations Table Card (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              Configured Stations ({stations.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-8 pr-2.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none w-36 sm:w-44 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs">Loading kitchen stations...</span>
              </div>
            ) : stations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Tv className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No kitchen stations yet
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Create your first kitchen prep station (e.g. Grill, Bar, Fryer, Salad) to route incoming orders.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E293B] text-white rounded text-xs font-semibold hover:bg-[#091426] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Station
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-[#E2E8F0] dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-[25%]">Station / Code</th>
                    <th className="py-3 px-4 w-[35%] hidden sm:table-cell">Description</th>
                    <th className="py-3 px-4 w-[20%]">Status</th>
                    <th className="py-3 px-4 text-right w-[20%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {filteredStations.map((station) => (
                    <tr
                      key={station._id || station.stationId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group h-12"
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: station.color || '#2170E4' }}
                          />
                          <div>
                            <span>{getSafeStationName(station.name)}</span>
                            <span className="ml-2 font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {station.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[200px] hidden sm:table-cell">
                        {getSafeStationDescription(station.description) || 'No description'}
                      </td>
                      <td className="py-2.5 px-4">
                        {station.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(station)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Edit Station"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStation(station)}
                            className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                            title="Delete Station"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Menu Routing Overview (Right Column - 1/3) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden flex flex-col relative shadow-xs">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8F9FF] dark:bg-slate-950">
            <h3 className="text-sm font-semibold text-[#0B1C30] dark:text-slate-100 flex items-center gap-2">
              <Route className="h-4 w-4 text-[#0058be]" />
              Station Categories
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Active catalog categories mapped to kitchen fulfillment.
            </p>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No menu categories found in catalog.
              </p>
            ) : (
              categories.map((cat: any) => {
                const categoryName = getCategoryName(cat);
                const amharicName = typeof cat.name === 'object' ? cat.name?.am : undefined;

                return (
                  <div
                    key={cat._id || cat.id}
                    className="bg-[#F8F9FF] dark:bg-slate-950 rounded-lg border border-[#E2E8F0] dark:border-slate-800 p-3 flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {categoryName}
                      </span>
                      {amharicName && amharicName !== categoryName && (
                        <span className="text-[10px] text-slate-400 font-normal truncate">
                          {amharicName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {cat.itemCount ? `${cat.itemCount} items` : 'Active'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Station Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingStation ? 'Edit Kitchen Station' : 'Add Kitchen Station'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-semibold mb-1">Station Name *</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="e.g. Grill Station"
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Station Code (Short)</label>
              <input
                type="text"
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value.toUpperCase())}
                placeholder="e.g. GRL, BAR, PREP"
                maxLength={6}
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Description</label>
              <input
                type="text"
                value={stationDesc}
                onChange={(e) => setStationDesc(e.target.value)}
                placeholder="e.g. Hot prep, steaks, and burger queue"
                className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Color Identifier</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stationColor}
                  onChange={(e) => setStationColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs text-slate-500 uppercase">
                  {stationColor}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 border rounded text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStation}
              disabled={isCreating || isUpdating}
              className="px-4 py-1.5 bg-[#2170E4] hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5"
            >
              {(isCreating || isUpdating) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingStation ? 'Update Station' : 'Create Station'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingPageLayout>
  );
};

export default KitchenStationsPage;

