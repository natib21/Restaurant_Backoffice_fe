// src/features/Table/Components/AssignStaffTableView.tsx
import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Table as TableIcon,
  Shield,
  ArrowRightLeft,
  Sparkles,
  Layers,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTablesQuery } from '@/api/Queries/tableQueries';
import { useMerchantStaffQuery } from '@/api/Queries/merchantQueries';
import { toast } from 'sonner';

interface AssignStaffTableViewProps {
  currentBranchId: string | null;
}

export const AssignStaffTableView: React.FC<AssignStaffTableViewProps> = ({ currentBranchId }) => {
  const { data: tables = [], isLoading: isTablesLoading } = useTablesQuery(currentBranchId);
  const { data: staffList = [], isLoading: isStaffLoading } = useMerchantStaffQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

  // Local state for assignments: { [tableId]: { staffId: string, staffName: string } }
  const [assignments, setAssignments] = useState<Record<string, { staffId: string; staffName: string }>>({});

  // Quick Bulk Assign Dialog State
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTargetSection, setBulkTargetSection] = useState('all');
  const [bulkStaffId, setBulkStaffId] = useState('');

  // Extract distinct sections from tables
  const sections = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t: any) => {
      if (t.section) set.add(t.section);
    });
    return Array.from(set);
  }, [tables]);

  // Waiter/Server staff filtered
  const activeStaff = useMemo(() => {
    return (staffList as any[]).filter((s) => s.isActive !== false);
  }, [staffList]);

  // Assign single table
  const handleAssignSingle = (tableId: string, staffId: string) => {
    if (staffId === 'unassigned') {
      setAssignments((prev) => {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      });
      toast.success('Table unassigned');
      return;
    }

    const staffMember = activeStaff.find((s) => s._id === staffId);
    const staffName = staffMember
      ? `${staffMember.firstName} ${staffMember.lastName}`
      : 'Staff Member';

    setAssignments((prev) => ({
      ...prev,
      [tableId]: { staffId, staffName },
    }));
    toast.success(`Assigned to ${staffName}`);
  };

  // Bulk assign all tables in a section
  const handleBulkAssign = () => {
    if (!bulkStaffId) {
      toast.error('Please select a staff member');
      return;
    }
    const staffMember = activeStaff.find((s) => s._id === bulkStaffId);
    const staffName = staffMember
      ? `${staffMember.firstName} ${staffMember.lastName}`
      : 'Staff Member';

    const targetTables = tables.filter((t: any) => {
      if (bulkTargetSection === 'all') return true;
      return (t.section || 'Main') === bulkTargetSection;
    });

    setAssignments((prev) => {
      const updated = { ...prev };
      targetTables.forEach((t: any) => {
        updated[t._id] = { staffId: bulkStaffId, staffName };
      });
      return updated;
    });

    setBulkDialogOpen(false);
    toast.success(`Assigned ${targetTables.length} tables to ${staffName}`);
  };

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t: any) => {
      const matchSearch =
        t.tableNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.section?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSection =
        selectedSection === 'all' || (t.section || 'Main') === selectedSection;
      return matchSearch && matchSection;
    });
  }, [tables, searchQuery, selectedSection]);

  const stats = useMemo(() => {
    const total = tables.length;
    const assignedCount = Object.keys(assignments).length;
    const unassignedCount = Math.max(0, total - assignedCount);
    return { total, assignedCount, unassignedCount };
  }, [tables, assignments]);

  if (isTablesLoading || isStaffLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground font-medium">Loading tables & staff roster...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Top Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Tables
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <TableIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Assigned to Waiters
              </p>
              <p className="text-2xl font-black text-emerald-600">
                {stats.assignedCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Unassigned Tables
              </p>
              <p className="text-2xl font-black text-amber-600">
                {stats.unassignedCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search table number or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Sections</SelectItem>
              {sections.map((sec) => (
                <SelectItem key={sec} value={sec} className="text-xs capitalize">
                  {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setBulkDialogOpen(true)}
          className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        >
          <Layers className="h-4 w-4" /> Bulk Assign Section
        </Button>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table: any) => {
          const assigned = assignments[table._id];
          return (
            <Card
              key={table._id}
              className={`border transition-all ${
                assigned
                  ? 'border-emerald-200 bg-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-800 text-base">
                      {table.tableNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        Table {table.tableNumber}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {table.section || 'Main'} • {table.capacity} seats
                      </p>
                    </div>
                  </div>

                  {assigned ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                      Assigned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Unassigned
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assigned Server / Waiter
                  </label>
                  <Select
                    value={assigned?.staffId || 'unassigned'}
                    onValueChange={(val) => handleAssignSingle(table._id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select Waiter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs text-rose-600 font-semibold">
                        -- Unassigned --
                      </SelectItem>
                      {activeStaff.map((staff: any) => (
                        <SelectItem key={staff._id} value={staff._id} className="text-xs">
                          {staff.firstName} {staff.lastName} ({staff.role?.name || 'Staff'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* BULK ASSIGN DIALOG */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              Bulk Assign Tables to Staff
            </DialogTitle>
            <DialogDescription className="text-xs">
              Quickly assign all tables in an entire section to a single waiter for their active shift.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Target Section</label>
              <Select value={bulkTargetSection} onValueChange={setBulkTargetSection}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Sections (Entire Floor)</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem key={sec} value={sec} className="text-xs capitalize">
                      {sec} Section
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Assign To Staff Member</label>
              <Select value={bulkStaffId} onValueChange={setBulkStaffId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose waiter / server" />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff.map((staff: any) => (
                    <SelectItem key={staff._id} value={staff._id} className="text-xs">
                      {staff.firstName} {staff.lastName} ({staff.role?.name || 'Staff'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleBulkAssign}
              disabled={!bulkStaffId}
            >
              Apply Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
