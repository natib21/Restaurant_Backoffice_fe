// src/features/AuditLog/components/AuditStatsCards.tsx
import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Users,
  Layers,
} from 'lucide-react';
import { DataCard } from '@/components/Common';
import type { AuditStats } from '../types/auditLogTypes';

interface AuditStatsCardsProps {
  stats?: AuditStats | null;
  isLoading?: boolean;
  onFilterCritical?: () => void;
  onFilterFailures?: () => void;
}

export const AuditStatsCards: React.FC<AuditStatsCardsProps> = ({
  stats,
  isLoading = false,
  onFilterCritical,
  onFilterFailures,
}) => {
  const totalLogs = stats?.totalLogs ?? 0;
  const criticalCount = stats?.bySeverity?.critical ?? 0;
  const failureCount = stats?.byOutcome?.failure ?? 0;
  const highCount = stats?.bySeverity?.high ?? 0;
  const successCount = stats?.byOutcome?.success ?? 0;
  const topUser = stats?.topUsers?.[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <DataCard
        title="Total Audited Events"
        value={totalLogs.toLocaleString()}
        icon={<Layers className="h-5 w-5" />}
        theme="indigo"
        subtitle="Across all resources & branches"
        isLoading={isLoading}
      />

      <DataCard
        title="Critical Security Events"
        value={criticalCount.toLocaleString()}
        icon={<ShieldAlert className="h-5 w-5" />}
        theme={criticalCount > 0 ? 'rose' : 'slate'}
        subtitle={criticalCount > 0 ? 'Immediate review recommended' : 'No critical alerts'}
        badge={criticalCount > 0 ? 'Attention' : undefined}
        badgeVariant={criticalCount > 0 ? 'destructive' : undefined}
        isLoading={isLoading}
        action={
          criticalCount > 0 && onFilterCritical
            ? {
                label: 'View Critical',
                onClick: onFilterCritical,
              }
            : undefined
        }
      />

      <DataCard
        title="Failed Operations"
        value={failureCount.toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
        theme={failureCount > 0 ? 'amber' : 'emerald'}
        subtitle={`${successCount.toLocaleString()} operations succeeded`}
        isLoading={isLoading}
        action={
          failureCount > 0 && onFilterFailures
            ? {
                label: 'View Failures',
                onClick: onFilterFailures,
              }
            : undefined
        }
      />

      <DataCard
        title="Most Active Operator"
        value={topUser ? topUser.name || topUser.email : 'None'}
        icon={<Users className="h-5 w-5" />}
        theme="sky"
        subtitle={topUser ? `${topUser.actionCount} logged actions` : 'No staff activity recorded'}
        isLoading={isLoading}
      />
    </div>
  );
};
