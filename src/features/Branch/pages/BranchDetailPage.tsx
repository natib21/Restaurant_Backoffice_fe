import React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Edit3,
  Info,
  Calendar,
  Layers,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranchQuery } from '../../../api/Queries/branchQueries';

interface BranchDetailPageProps {
  branchId: string;
  onEdit: () => void;
}

const BranchDetailPage: React.FC<BranchDetailPageProps> = ({
  branchId,
  onEdit,
}) => {
  const { data: branch, isLoading } = useBranchQuery(branchId);

  if (isLoading) {
    return <BranchDetailSkeleton />;
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Info className="h-10 w-10 mb-2 opacity-20" />
        <p>Branch information not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20">
      {/* 1. VISUAL HEADER */}
      <div className="relative h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl mb-6 overflow-hidden border border-primary/10">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Building2 className="h-24 w-24 text-primary" />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">
                {branch.name}
              </h2>
              {branch.isMain && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-[10px] font-black uppercase shadow-sm">
                  Main
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {branch.isActive ? (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Operational
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
                  <XCircle className="h-3 w-3" /> Offline
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={onEdit}
            size="sm"
            variant="secondary"
            className="rounded-full shadow-sm bg-background/80 backdrop-blur-sm border hover:bg-background"
          >
            <Edit3 className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* 2. QUICK STATS (PLACEHOLDERS) */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          {
            label: 'Status',
            value: branch.isActive ? 'Active' : 'Inactive',
            icon: Info,
          },
          {
            label: 'Type',
            value: branch.isMain ? 'HQ' : 'Branch',
            icon: Layers,
          },
          { label: 'City', value: branch.location.city, icon: MapPin },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-muted/30 border border-border/50 rounded-xl p-3"
          >
            <stat.icon className="h-4 w-4 text-primary/50 mb-2" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              {stat.label}
            </p>
            <p className="text-sm font-bold truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 3. DETAILED INFORMATION */}
      <div className="space-y-8">
        {/* Location Section */}
        <section className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Location Details
          </h4>
          <div className="grid grid-cols-1 gap-6 px-1">
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground font-medium uppercase">
                Primary Address
              </p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {branch.location.building && (
                  <span className="block font-bold">
                    {branch.location.building}
                  </span>
                )}
                {branch.location.specificArea && (
                  <span className="block italic">
                    {branch.location.specificArea}
                  </span>
                )}
                {branch.location.subCity && (
                  <span>{branch.location.subCity}, </span>
                )}
                <span className="font-bold">{branch.location.city}</span>
              </p>
            </div>
          </div>
        </section>

        <Separator className="opacity-50" />

        {/* Contact Section */}
        <section className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-primary" />
            Communication
          </h4>
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 border-dashed">
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
                Phone Number
              </p>
              <p className="text-lg font-mono font-bold tracking-tight text-primary">
                {branch.phone || 'No phone registered'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] uppercase font-bold"
              disabled={!branch.phone}
            >
              Call Now
            </Button>
          </div>
        </section>

        {/* Metadata */}
        <div className="pt-8 text-center">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <Calendar className="h-3 w-3" />
            Registered on {new Date(branch.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// Polished Loading State
const BranchDetailSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-32 w-full rounded-2xl" />
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
    <div className="space-y-4 pt-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Separator />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

export default BranchDetailPage;
