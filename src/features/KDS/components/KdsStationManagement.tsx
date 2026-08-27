import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  Eye,
  UtensilsCrossed,
  Clock,
  Users,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  useKitchenStationsQuery,
  useKitchenTicketsQuery,
  useCreateStationMutation,
  useUpdateStationMutation,
  useDeleteStationMutation,
} from '@/api/Queries/kitchenQueries';
import type {
  KdsStation,
  CreateKitchenStationDto,
  UpdateKitchenStationDto,
} from '@/features/KDS/types/kdsTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface KdsStationManagementProps {
  darkMode?: boolean;
  onSelectStationForLiveView?: (stationId: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

export const KdsStationManagement: React.FC<KdsStationManagementProps> = ({
  darkMode = true,
  onSelectStationForLiveView,
}) => {
  const { data: stations = [], isLoading, refetch } = useKitchenStationsQuery();
  const { data: allTickets = [] } = useKitchenTicketsQuery();

  const createMutation = useCreateStationMutation();
  const updateMutation = useUpdateStationMutation();
  const deleteMutation = useDeleteStationMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<KdsStation | null>(null);
  const [deleteConfirmStation, setDeleteConfirmStation] = useState<KdsStation | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    displayOrder: number;
    color: string;
    isActive: boolean;
  }>({
    name: '',
    code: '',
    description: '',
    displayOrder: 1,
    color: '#3B82F6',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<{ name?: string; code?: string }>({});

  const openCreateModal = () => {
    setEditingStation(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      displayOrder: (stations?.length || 0) + 1,
      color: PRESET_COLORS[(stations?.length || 0) % PRESET_COLORS.length],
      isActive: true,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (station: KdsStation) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      code: station.code,
      description: station.description || '',
      displayOrder: station.displayOrder ?? 0,
      color: station.color || '#3B82F6',
      isActive: station.isActive,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; code?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Station name is required (e.g. Category 1 - Hot Mains)';
    }

    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      errors.code = 'Station code is required (e.g. CAT-01, PIZZA, EXPO)';
    } else if (!/^[A-Z0-9_-]{1,20}$/.test(cleanCode)) {
      errors.code = 'Code must be 1-20 uppercase letters, numbers, or dashes';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingStation) {
      const updatePayload: UpdateKitchenStationDto = {
        name: formData.name.trim(),
        code: cleanCode,
        description: formData.description.trim(),
        displayOrder: Number(formData.displayOrder) || 0,
        color: formData.color,
        isActive: formData.isActive,
      };

      await updateMutation.mutateAsync({
        stationId: editingStation._id || editingStation.stationId,
        data: updatePayload,
      });
      setIsFormModalOpen(false);
    } else {
      const createPayload: CreateKitchenStationDto = {
        name: formData.name.trim(),
        code: cleanCode,
        description: formData.description.trim(),
        displayOrder: Number(formData.displayOrder) || 0,
        color: formData.color,
      };

      await createMutation.mutateAsync(createPayload);
      setIsFormModalOpen(false);
    }
  };

  const handleToggleActive = async (station: KdsStation) => {
    await updateMutation.mutateAsync({
      stationId: station._id || station.stationId,
      data: { isActive: !station.isActive },
    });
  };

  const handleMoveOrder = async (station: KdsStation, direction: 'up' | 'down') => {
    const currentOrder = station.displayOrder ?? 0;
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    await updateMutation.mutateAsync({
      stationId: station._id || station.stationId,
      data: { displayOrder: newOrder },
    });
  };

  const handleDeleteStation = async () => {
    if (!deleteConfirmStation) return;
    await deleteMutation.mutateAsync({
      stationId: deleteConfirmStation._id || deleteConfirmStation.stationId,
    });
    setDeleteConfirmStation(null);
  };

  // Get active tickets for a station
  const getStationActiveTicketsCount = (station: KdsStation) => {
    const sId = (station.stationId || station.code || '').toLowerCase();
    const sName = station.name.toLowerCase();
    return allTickets.filter(
      (t) =>
        (t.stationId?.toLowerCase() === sId || t.stationName?.toLowerCase() === sName) &&
        (t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress')
    ).length;
  };

  // Filter stations
  const filteredStations = stations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterActive === 'all'
        ? true
        : filterActive === 'active'
        ? s.isActive
        : !s.isActive;

    return matchesSearch && matchesStatus;
  });

  const activeCount = stations.filter((s) => s.isActive).length;
  const inactiveCount = stations.filter((s) => !s.isActive).length;

  return (
    <div
      id="kds-station-management-root"
      className={`min-h-full p-4 sm:p-6 transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}
            >
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Kitchen Station Management
              </h1>
              <p
                className={`text-xs sm:text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Configure kitchen categories, station routing codes, display orders, and operational status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className={`gap-2 ${
              darkMode
                ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={openCreateModal}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Station
          </Button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800/80'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Total Stations
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold">{stations.length}</span>
            <Layers className="h-4 w-4 text-blue-500 opacity-70" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800/80'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-500">
            Active Routing
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-500">{activeCount}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-70" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800/80'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-500">
            Inactive / Maint.
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-500">{inactiveCount}</span>
            <Power className="h-4 w-4 text-amber-500 opacity-70" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800/80'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
            Active Tickets Load
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-indigo-400">
              {allTickets.filter((t) => t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress').length}
            </span>
            <UtensilsCrossed className="h-4 w-4 text-indigo-400 opacity-70" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations by name, code or description..."
            className={`pl-9 text-sm ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-200 placeholder:text-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex p-1 rounded-lg border text-xs font-medium ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterActive === 'all'
                  ? darkMode
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-900 font-semibold'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({stations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterActive === 'active'
                  ? darkMode
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                    : 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterActive === 'inactive'
                  ? darkMode
                    ? 'bg-slate-800 text-amber-400'
                    : 'bg-amber-50 text-amber-700 font-semibold border border-amber-200'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Stations List Grid */}
      {filteredStations.length === 0 ? (
        <div
          className={`p-12 text-center rounded-2xl border ${
            darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <Layers className="h-12 w-12 mx-auto text-slate-400 mb-3 opacity-50" />
          <h3 className="text-lg font-semibold mb-1">No Kitchen Stations Found</h3>
          <p className={`text-sm max-w-md mx-auto mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {searchQuery
              ? `No station matching "${searchQuery}". Try clearing search.`
              : 'Create your first kitchen station or category routing to start dispatching tickets.'}
          </p>
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Create Kitchen Station
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStations.map((station, index) => {
            const activeTickets = getStationActiveTicketsCount(station);
            const stationColor = station.color || '#3B82F6';

            return (
              <div
                key={station._id || station.stationId || station.code}
                className={`relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  station.isActive
                    ? darkMode
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    : darkMode
                    ? 'bg-slate-950/60 border-slate-900 opacity-70'
                    : 'bg-slate-100/70 border-slate-200 opacity-75'
                }`}
              >
                {/* Accent Top Bar */}
                <div
                  className="h-1.5 w-full"
                  style={{
                    backgroundColor: station.isActive ? stationColor : '#64748B',
                  }}
                />

                <div className="p-5 flex-1 flex flex-col justify-between">
                  {/* Top Row: Code Badge & Order & Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-1 rounded-md text-xs font-mono font-bold text-white shadow-2xs tracking-wider"
                          style={{ backgroundColor: stationColor }}
                        >
                          {station.code}
                        </span>

                        <Badge
                          variant="outline"
                          className={`text-[11px] font-mono ${
                            darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          Order #{station.displayOrder ?? index + 1}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Move order up"
                          onClick={() => handleMoveOrder(station, 'up')}
                          className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                            darkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Move order down"
                          onClick={() => handleMoveOrder(station, 'down')}
                          className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                            darkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(station)}
                          title={station.isActive ? 'Deactivate station' : 'Activate station'}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            station.isActive
                              ? darkMode
                                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : darkMode
                              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              station.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {station.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    {/* Station Name & Description */}
                    <h3 className="text-lg font-bold tracking-tight mb-1">{station.name}</h3>
                    <p
                      className={`text-xs line-clamp-2 min-h-[32px] ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {station.description || 'No operational description configured.'}
                    </p>
                  </div>

                  {/* Operational Metrics Bar */}
                  <div
                    className={`mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs ${
                      darkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-blue-500" />
                      <span>
                        <strong className="font-semibold">{activeTickets}</strong> active ticket{activeTickets !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        Avg:{' '}
                        <strong className="font-semibold">
                          {Math.floor((station.avgTicketTimeSeconds || 300) / 60)}m{' '}
                          {(station.avgTicketTimeSeconds || 300) % 60}s
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  className={`px-5 py-3 border-t flex items-center justify-between gap-2 ${
                    darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {onSelectStationForLiveView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectStationForLiveView(station.stationId || station._id)}
                      className={`text-xs gap-1.5 h-8 px-2.5 ${
                        darkMode ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-800' : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Live Board
                    </Button>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(station)}
                      className={`text-xs gap-1.5 h-8 px-2.5 ${
                        darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmStation(station)}
                      className={`text-xs gap-1.5 h-8 px-2.5 text-red-500 hover:text-red-400 ${
                        darkMode ? 'hover:bg-red-950/40' : 'hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT STATION MODAL */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent
          className={`sm:max-w-[500px] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              {editingStation ? `Edit Kitchen Station: ${editingStation.code}` : 'Add New Kitchen Station'}
            </DialogTitle>
            <DialogDescription className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
              {editingStation
                ? 'Update station routing parameters, name, display order, or operational color.'
                : 'Define a new kitchen category or preparation station for automatic ticket routing.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {/* Station Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Station Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Category 1 - Hot Mains"
                className={`${formErrors.name ? 'border-red-500' : ''} ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>
              )}
            </div>

            {/* Station Code & Display Order Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Routing Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CAT-01, EX-05"
                  maxLength={20}
                  className={`font-mono uppercase ${formErrors.code ? 'border-red-500' : ''} ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                />
                {formErrors.code && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.code}</p>
                )}
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Unique uppercase code (e.g. CAT-01)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Display Order
                </label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                  className={`${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Lower numbers appear first on KDS
                </span>
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Station Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                      formData.color === c ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {formData.color === c && <CheckCircle2 className="h-4 w-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Operational Description / Menu Routing
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Category 1 - Hot & Main Course Orders, grilled and wok preparations"
                className={`w-full text-sm rounded-lg p-2.5 border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Active Toggle (for edit) */}
            {editingStation && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold block">Station Active Status</span>
                  <span className="text-[11px] text-slate-400">
                    Inactive stations will not receive new ticket dispatches
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    formData.isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {formData.isActive ? 'Active (Open)' : 'Inactive (Closed)'}
                </button>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                className={darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200'}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {editingStation ? 'Save Station Changes' : 'Create Station'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirmStation} onOpenChange={(open) => !open && setDeleteConfirmStation(null)}>
        <DialogContent
          className={`sm:max-w-[420px] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Confirm Station Deletion
            </DialogTitle>
            <DialogDescription className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
              Are you sure you want to deactivate or remove station{' '}
              <strong className="text-white dark:text-slate-200">
                {deleteConfirmStation?.name} ({deleteConfirmStation?.code})
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          {deleteConfirmStation && getStationActiveTicketsCount(deleteConfirmStation) > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5 my-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold">Station has active tickets!</p>
                <p className="mt-0.5 opacity-90">
                  There are currently {getStationActiveTicketsCount(deleteConfirmStation)} active order tickets on this station. Please complete or reassign tickets before removing this station.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 my-2">
              This action will soft-delete the station and preserve order history and metrics.
            </p>
          )}

          <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmStation(null)}
              className={darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200'}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteStation}
              disabled={
                deleteMutation.isPending ||
                (deleteConfirmStation ? getStationActiveTicketsCount(deleteConfirmStation) > 0 : false)
              }
              className="bg-red-600 hover:bg-red-700 text-white gap-2 font-medium"
            >
              {deleteMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
