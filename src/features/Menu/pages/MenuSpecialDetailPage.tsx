// src/features/Menu/Pages/ComboDetailPage.tsx

import React from 'react';
import {
  Edit3,
  Trash2,
  Gift,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Tag,
  Info,
  Layers,
  Package,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  useGetComboQuery,
  useDeleteComboMutation,
  useToggleComboAvailabilityMutation,
} from '../../../api/Queries/comboQueries';

type ComboDetailPageProps = {
  comboId: string;
  onEdit?: () => void;
};

const ComboDetailPage: React.FC<ComboDetailPageProps> = ({
  comboId,
  onEdit,
}) => {
  const { data: combo, isLoading, isError } = useGetComboQuery(comboId);

  const deleteMutation = useDeleteComboMutation();
  const toggleAvailabilityMutation = useToggleComboAvailabilityMutation();

  const handleDelete = async () => {
    if (!confirm(`Delete "${combo?.name}" permanently?`)) return;
    try {
      await deleteMutation.mutateAsync(comboId);
      toast.success('Special offer deleted successfully');
    } catch {
      toast.error('Failed to delete special offer');
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailabilityMutation.mutateAsync(comboId);
      toast.success(combo?.isActive ? 'Offer paused' : 'Offer is now active');
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const isGlobal = !combo?.branches || combo.branches.length === 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading special offer...</p>
      </div>
    );
  }

  if (isError || !combo) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Offer not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image */}
        <div className="relative h-72 w-full overflow-hidden bg-muted">
          {combo.image ? (
            <img
              src={
                combo.image.startsWith('http')
                  ? combo.image
                  : `/img/combo/${combo.image}`
              }
              alt={combo.name}
              className="h-full w-full object-cover transition-transform duration-1000 hover:scale-110"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-950">
              <Gift className="h-20 w-20 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                No Image
              </p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <Layers className="h-3.5 w-3.5" />
                Special Offer
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {combo.name}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={onEdit} variant="outline">
                <Edit3 className="h-4 w-4 mr-2" /> Edit Offer
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {combo.description && (
            <p className="text-base text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4">
              "{combo.description}"
            </p>
          )}

          <Separator />

          {/* Availability Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-3">
              {combo.isActive ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-zinc-400" />
              )}
              <div>
                <p className="font-semibold">
                  {combo.isActive ? 'Visible on Menu' : 'Hidden from Menu'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Customers {combo.isActive ? 'can' : 'cannot'} order this offer
                </p>
              </div>
            </div>
            <Switch
              checked={combo.isActive ?? false}
              onCheckedChange={handleToggleAvailability}
              className="data-[state=on]:bg-emerald-600"
            />
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Package className="h-4 w-4" /> Combo Price
              </div>
              <p className="text-2xl font-black text-primary">
                ETB {Number(combo.comboPrice).toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Gift className="h-4 w-4" /> Items Included
              </div>
              <p className="text-2xl font-bold">{combo.items.length}</p>
            </div>

            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Users className="h-4 w-4" /> Availability
              </div>
              <p className="text-lg font-bold">
                {isGlobal ? (
                  <Badge variant="default">All Branches (Global)</Badge>
                ) : (
                  <Badge variant="outline">
                    {combo.branches.length} Branch
                    {combo.branches.length > 1 ? 'es' : ''}
                  </Badge>
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Info className="h-4 w-4" /> Priority
              </div>
              <p className="text-lg font-bold">#{combo.priority || '—'}</p>
            </div>
          </div>

          {/* Tags */}
          {combo.tags && combo.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {combo.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Professional Branch Display */}
          <Separator />
          <div>
            <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4" /> Available Branches
            </h3>

            {isGlobal ? (
              <Badge variant="default" className="text-sm py-2 px-4">
                All Branches (Global)
              </Badge>
            ) : (
              <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {combo.branches.map((branch: any) => (
                    <Tooltip key={branch._id}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-sm py-1.5 px-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                        >
                          <span className="font-medium">{branch.name}</span>
                          {branch.location?.city && (
                            <span className="text-muted-foreground ml-1">
                              • {branch.location.city}
                            </span>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-sm">
                        <p className="font-medium">{branch.name}</p>
                        {branch.location?.formattedAddress && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {branch.location.formattedAddress}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            )}

            {!isGlobal && combo.branches.length > 6 && (
              <p className="text-sm text-muted-foreground mt-4">
                Available at <strong>{combo.branches.length}</strong> branch
                {combo.branches.length > 1 ? 'es' : ''}
              </p>
            )}
          </div>

          {/* Time & Day Restrictions */}
          {(combo.availableOnDays && combo.availableOnDays.length > 0) ||
          (combo.timeSlots && combo.timeSlots.length > 0) ? (
            <>
              <Separator />
              <div className="grid md:grid-cols-2 gap-8">
                {combo.availableOnDays && combo.availableOnDays.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4" /> Available Days
                    </h3>
                    <p className="text-base font-medium capitalize">
                      {combo.availableOnDays.join(', ')}
                    </p>
                  </div>
                )}
                {combo.timeSlots && combo.timeSlots.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4" /> Time Slots
                    </h3>
                    <div className="space-y-2">
                      {combo.timeSlots.map((slot: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-sm">
                          {slot.start} – {slot.end}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}

          <Separator />

          {/* Included Items */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">
              Included Items ({combo.items.length})
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {combo.items.map((item: any, index: number) => (
                <Card
                  key={index}
                  className="overflow-hidden transition-all hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold">
                          {item.nameFallback || 'Unknown Item'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity:{' '}
                          <span className="font-medium">{item.quantity}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboDetailPage;
