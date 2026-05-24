// src/features/Menu/Pages/MenuGroupsPage.tsx

import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Search,
  Clock,
  Calendar,
  EyeOff,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MenuGroupDetailPage from './MenuGroupDetailpage';
import MenuItemPage from './MenuItemPage';
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
import RightSideModal from '@/components/ui/RightSideModal';
import MenuGroupFormPage from '../Components/MenuGroupFormPage';

import { toast } from 'sonner';
import {
  useMenuGroupsQuery,
  useDeleteMenuGroupMutation,
} from '../../../api/Queries/menuQueries';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

const MenuGroupsPage = () => {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, isError } = useMenuGroupsQuery();
  const deleteMutation = useDeleteMenuGroupMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<
    'add' | 'edit' | 'detail' | 'itemDetail'
  >('detail');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const [filterVisibility, setFilterVisibility] = useState<
    'all' | 'always' | 'scheduled' | 'hidden'
  >('all');

  const filteredGroups = useMemo(() => {
    return groups.filter((group: any) => {
      const matchesSearch = group.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesVisibility =
        filterVisibility === 'all' || group.visibility === filterVisibility;
      return matchesSearch && matchesVisibility;
    });
  }, [groups, searchQuery, filterVisibility]);

  const openAdd = () => {
    setSelectedGroup(null);
    setSelectedItem(null);
    setPanelMode('add');
    setPanelOpen(true);
  };

  const openEdit = (group: any) => {
    setSelectedGroup(group);
    setPanelMode('edit');
    setPanelOpen(true);
  };

  const openDetail = (group: any) => {
    setSelectedGroup(group);
    setSelectedItem(null);
    setPanelMode('detail');
    setPanelOpen(true);
  };

  const switchToEdit = () => {
    setPanelMode('edit');
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedGroup(null);
    setSelectedItem(null);
  };

  const onFormSuccess = () => {
    toast.success(
      panelMode === 'add' ? 'Menu group created!' : 'Menu group updated!'
    );
    if (panelMode === 'add') {
      closePanel();
    } else {
      setPanelMode('detail');
    }
  };

  const onFormCancel = () => {
    if (panelMode === 'add') {
      closePanel();
    } else {
      setPanelMode('detail');
    }
  };

  const openDeleteDialog = (id: string) => {
    setGroupToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteMutation.mutateAsync(groupToDelete);
      toast.success('Menu group deleted');
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      closePanel();
    } catch {
      toast.error('Failed to delete menu group');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'always':
        return <Clock className="h-3.5 w-3.5" />;
      case 'scheduled':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'hidden':
        return <EyeOff className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-10 w-96 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md text-center border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unable to load menu groups. Please try again.
            </p>
            <Button variant="outline" onClick={() => navigate('/menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
        <div className="mx-auto flex h-16 items-center px-4  gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/menu')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Menu Groups
              </h1>
              <p className="text-sm text-muted-foreground">
                Organize your menu into Groups
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="hidden md:flex w-72 lg:w-96">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>

            <Button onClick={openAdd} size="sm" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Group</span>
              <span className="sm:hidden">Group</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto  p-4 lg:p-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  All Menu Groups
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredGroups.length} of {groups.length} groups
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Visibility</Label>
                <Select
                  value={filterVisibility}
                  onValueChange={(v) => setFilterVisibility(v as any)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="always">Always Visible</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No menu groups found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups.map((group: any) => (
                      <TableRow
                        key={group._id}
                        className={cn(
                          'transition-colors hover:bg-muted/50',
                          group.isSystemDefault && 'bg-muted/30'
                        )}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <span>{group.name}</span>
                            {group.isSystemDefault && (
                              <Badge variant="secondary" className="text-xs">
                                System Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-md">
                          {group.description || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {group.items?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getVisibilityIcon(group.visibility)}
                            <span className="capitalize text-sm">
                              {group.visibility}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openDetail(group)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(group)}>
                                <Edit3 className="mr-2 h-4 w-4" /> Edit Group
                              </DropdownMenuItem>
                              {!group.isSystemDefault && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => openDeleteDialog(group._id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  Group
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No menu groups found.
                </div>
              ) : (
                filteredGroups.map((group: any) => (
                  <Card
                    key={group._id}
                    className={cn(
                      'transition-shadow hover:shadow-md',
                      group.isSystemDefault &&
                        'border-muted-foreground/20 bg-muted/20'
                    )}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {group.name}
                            {group.isSystemDefault && (
                              <Badge variant="secondary" className="text-xs">
                                System
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description || 'No description'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(group)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(group)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {!group.isSystemDefault && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteDialog(group._id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {group.items?.length || 0} items
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {getVisibilityIcon(group.visibility)}
                          <span className="capitalize">{group.visibility}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal */}
      <RightSideModal
        open={panelOpen}
        onOpenChange={closePanel}
        title={
          panelMode === 'add'
            ? 'Create Menu Group'
            : panelMode === 'edit'
              ? `Edit "${selectedGroup?.name}"`
              : panelMode === 'itemDetail'
                ? selectedItem?.name || 'Item Details'
                : selectedGroup?.name || 'Group Details'
        }
        description={
          panelMode === 'add'
            ? 'Define a new menu section with scheduling and item selection'
            : panelMode === 'edit'
              ? 'Update group settings, items, and display rules'
              : panelMode === 'itemDetail'
                ? 'View full item information'
                : 'View group information and contained items'
        }
      >
        {/* Group Detail */}
        {panelMode === 'detail' && selectedGroup && (
          <MenuGroupDetailPage
            groupId={selectedGroup._id}
            onEdit={switchToEdit}
            onOpenItemDetail={(itemId) => {
              // Store the selected item ID and switch to item detail mode
              setSelectedItem({ _id: itemId });
              setPanelMode('itemDetail');
            }}
          />
        )}

        {/* Item Detail */}
        {panelMode === 'itemDetail' && selectedItem && (
          <MenuItemPage
            itemId={selectedItem._id}
            onEdit={() => {
              // Optional: allow editing item from detail
              // setPanelMode('itemEdit');
            }}
          />
        )}

        {/* Edit / Add Group */}
        {(panelMode === 'edit' || panelMode === 'add') && (
          <MenuGroupFormPage
            initialData={panelMode === 'edit' ? selectedGroup : undefined}
            onSuccess={onFormSuccess}
            onCancel={onFormCancel}
          />
        )}
      </RightSideModal>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The group will be permanently
              removed from your menu system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuGroupsPage;
