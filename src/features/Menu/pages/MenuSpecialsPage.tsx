// src/features/Menu/Pages/MenuSpecialsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Search,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import RightSideModal from '@/components/ui/RightSideModal';
import PageHeader from '@/components/Layout/PageHeader';
import ComboFormPage from '../Components/ComboFormPage';
import ComboDetailPage from './MenuSpecialDetailPage';

import { toast } from 'sonner';
import {
  useGetAllCombosQuery,
  useDeleteComboMutation,
  useToggleComboAvailabilityMutation,
} from '../../../api/Queries/comboQueries';
import { useState, useMemo } from 'react';

const MenuSpecialsPage = () => {
  const navigate = useNavigate();
  const { data: combos = [], isLoading, isError } = useGetAllCombosQuery();
  const deleteMutation = useDeleteComboMutation();
  const toggleMutation = useToggleComboAvailabilityMutation();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'detail' | 'edit' | 'add'>(
    'detail'
  );
  const [selectedCombo, setSelectedCombo] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const filteredCombos = useMemo(() => {
    return combos.filter((combo: any) => {
      const matchesSearch =
        combo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      const matchesStatus =
        filterAvailability === 'all' ||
        (filterAvailability === 'active' && combo.isActive) ||
        (filterAvailability === 'inactive' && !combo.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [combos, searchQuery, filterAvailability]);

  const openDetail = (combo: any) => {
    setSelectedCombo(combo);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const openEdit = (combo: any) => {
    setSelectedCombo(combo);
    setPanelMode('edit');
    setPanelOpen(true);
  };

  const openAdd = () => {
    setSelectedCombo(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedCombo(null);
  };

  const switchToEdit = () => setPanelMode('edit');

  const onFormSuccess = () => {
    toast.success(
      panelMode === 'add' ? 'Special offer created!' : 'Special offer updated!'
    );
    if (panelMode === 'add') closePanel();
    else setPanelMode('detail');
  };

  const onFormCancel = () => {
    if (panelMode === 'add') closePanel();
    else setPanelMode('detail');
  };

  const openDeleteDialog = (id: string) => {
    setComboToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!comboToDelete) return;
    try {
      await deleteMutation.mutateAsync(comboToDelete);
      toast.success('Special offer deleted');
      setDeleteDialogOpen(false);
      setComboToDelete(null);
      closePanel();
    } catch {
      toast.error('Failed to delete special offer');
    }
  };

  const handleToggleAvailability = async (
    comboId: string,
    currentActive: boolean
  ) => {
    try {
      await toggleMutation.mutateAsync(comboId);
      toast.success(currentActive ? 'Offer paused' : 'Offer is now active');
    } catch {
      toast.error('Failed to update availability');
    }
  };

  // Professional branch display with tooltip
  const BranchBadges = ({ combo }: { combo: any }) => {
    const isGlobal = !combo.branches || combo.branches.length === 0;

    if (isGlobal) {
      return <Badge variant="secondary">All Branches</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {combo.branches.map((branch: any) => (
          <Tooltip key={branch._id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
              >
                {branch.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{branch.name}</p>
              {branch.location?.formattedAddress && (
                <p className="text-xs mt-1">
                  {branch.location.formattedAddress}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-72 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-background min-h-screen">
        <PageHeader
          title="Special Offers"
          subtitle="Manage combos and promotions"
          breadcrumbText="Menu"
          breadcrumbAction={() => navigate('/menu')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search offers..."
          actionLabel="Add Offer"
          onAction={openAdd}
        />

        {/* Main Content */}
        <main className="mx-auto p-4 lg:p-8">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10">
                <div>
                  <CardTitle className="text-xl font-semibold">
                    All Special Offers
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredCombos.length} of {combos.length} offers
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm">Availability</Label>
                    <Select
                      value={filterAvailability}
                      onValueChange={(v) => setFilterAvailability(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="min-w-64">Branches</TableHead>
                      <TableHead className="w-40">Availability</TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCombos.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No special offers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCombos.map((combo: any) => {
                        const isActive = combo.isActive === true;
                        return (
                          <TableRow
                            key={combo._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => openDetail(combo)}
                          >
                            <TableCell>
                              {combo.image ? (
                                <img
                                  src={
                                    combo.image.startsWith('http')
                                      ? combo.image
                                      : `/img/combo/${combo.image}`
                                  }
                                  alt={combo.name}
                                  className="h-12 w-12 rounded-md object-cover border"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                  <Gift className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Gift className="h-5 w-5 text-primary" />
                                {combo.name}
                              </div>
                            </TableCell>
                            <TableCell>{combo.items?.length || 0}</TableCell>
                            <TableCell className="font-medium">
                              ETB {Number(combo.comboPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="py-3">
                              <BranchBadges combo={combo} />
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center space-x-3">
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={() =>
                                    handleToggleAvailability(
                                      combo._id,
                                      isActive
                                    )
                                  }
                                  disabled={toggleMutation.isPending}
                                  className="data-[state=on]:bg-emerald-600"
                                />
                                <span className="text-sm font-medium">
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openDetail(combo)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                    Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openEdit(combo)}
                                  >
                                    <Edit3 className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeleteDialog(combo._id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-4 py-4 px-4">
                {filteredCombos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No special offers found.
                  </div>
                ) : (
                  filteredCombos.map((combo: any) => {
                    const isActive = combo.isActive === true;
                    return (
                      <Card
                        key={combo._id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openDetail(combo)}
                      >
                        <div className="flex gap-4 p-4">
                          {combo.image ? (
                            <img
                              src={
                                combo.image.startsWith('http')
                                  ? combo.image
                                  : `/img/combo/${combo.image}`
                              }
                              alt={combo.name}
                              className="h-20 w-20 rounded-md object-cover flex-shrink-0 border"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <Gift className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                              <Gift className="h-5 w-5 text-primary flex-shrink-0" />
                              {combo.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {combo.items?.length || 0} items
                            </p>
                            <p className="text-xl font-bold mt-2">
                              ETB {Number(combo.comboPrice).toFixed(2)}
                            </p>

                            <div className="mt-3">
                              <BranchBadges combo={combo} />
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                              <Switch
                                checked={isActive}
                                onCheckedChange={() =>
                                  handleToggleAvailability(combo._id, isActive)
                                }
                                disabled={toggleMutation.isPending}
                                className="data-[state=on]:bg-emerald-600"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-sm font-medium">
                                {isActive ? (
                                  <span className="text-emerald-600">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Inactive
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openDetail(combo)}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEdit(combo)}
                                >
                                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => openDeleteDialog(combo._id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </main>
        <TooltipProvider>
          <div className="bg-background min-h-screen">
            <RightSideModal
              open={panelOpen}
              onOpenChange={closePanel}
              title={
                panelMode === 'add'
                  ? 'Add New Special Offer'
                  : panelMode === 'edit'
                    ? `Edit ${selectedCombo?.name}`
                    : selectedCombo?.name || 'Offer Details'
              }
              description={
                panelMode === 'add'
                  ? 'Create a new combo or promotion'
                  : panelMode === 'edit'
                    ? 'Update offer details'
                    : 'View full offer information'
              }
            >
              {panelMode === 'detail' && selectedCombo && (
                <ComboDetailPage
                  comboId={selectedCombo._id}
                  onEdit={switchToEdit}
                />
              )}

              {(panelMode === 'edit' || panelMode === 'add') && (
                <ComboFormPage
                  initialData={panelMode === 'edit' ? selectedCombo : undefined}
                  onSuccess={onFormSuccess}
                  onCancel={onFormCancel}
                />
              )}
            </RightSideModal>
          </div>
        </TooltipProvider>
        {/* Right Side Modal */}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Special Offer?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This offer will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default MenuSpecialsPage;
