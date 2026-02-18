import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plug, Database, GitBranch, History } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { MetricCard, MetricCardSkeleton } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useConnections } from '@/hooks/useConnections';
import { useSchemas } from '@/hooks/useSchemas';
import { useMappings } from '@/hooks/useMappings';
import { mappingRunAPI } from '@/services/api';
import { MappingRun } from '@/types/mappingRun';

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const statusToVariant: Record<string, 'success' | 'error' | 'warning' | 'running'> = {
  success: 'success',
  failed: 'error',
  partial_success: 'warning',
  running: 'running',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { connections, loading: connectionsLoading } = useConnections();
  const { schemas, loading: schemasLoading } = useSchemas();
  const { mappings, loading: mappingsLoading } = useMappings();
  const [recentRuns, setRecentRuns] = useState<MappingRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [runsLoading, setRunsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentRuns() {
      try {
        const data = await mappingRunAPI.list({}, 10, 0);
        setRecentRuns(data.runs);
        setTotalRuns(data.total_count);
      } catch {
        // silently fail - metrics will show 0
      } finally {
        setRunsLoading(false);
      }
    }
    fetchRecentRuns();
  }, []);

  const activeConnections = connections.filter(c => !c.archived).length;
  const activeSchemas = schemas.filter(s => !s.archived).length;
  const activeMappings = mappings.filter(m => !m.archived).length;
  const metricsLoading = connectionsLoading || schemasLoading || mappingsLoading || runsLoading;

  const runColumns = [
    {
      key: 'mapping_name',
      header: 'Mapping Name',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return <span className="font-medium text-neutral-900">{run.mapping_name || run.mapping_id}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return (
          <StatusBadge
            status={statusToVariant[run.status] || 'pending'}
            label={run.status.replace('_', ' ')}
          />
        );
      },
    },
    {
      key: 'trigger_type',
      header: 'Trigger',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return <Badge variant="secondary">{run.trigger_type}</Badge>;
      },
    },
    {
      key: 'start_time',
      header: 'Start Time',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return (
          <span className="text-neutral-600">
            {run.start_time ? format(new Date(run.start_time), 'MMM d, yyyy HH:mm') : '-'}
          </span>
        );
      },
    },
    {
      key: 'duration_seconds',
      header: 'Duration',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return <span className="text-neutral-600">{formatDuration(run.duration_seconds)}</span>;
      },
    },
    {
      key: 'rows_written_to_delta',
      header: 'Rows',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return <span className="text-neutral-600">{run.rows_written_to_delta.toLocaleString()}</span>;
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="ETL Engine overview" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Connections"
              value={activeConnections}
              icon={Plug}
              iconColor="text-info-600"
              iconBgColor="bg-info-100"
            />
            <MetricCard
              title="Total Schemas"
              value={activeSchemas}
              icon={Database}
              iconColor="text-primary-600"
              iconBgColor="bg-primary-100"
            />
            <MetricCard
              title="Total Mappings"
              value={activeMappings}
              icon={GitBranch}
              iconColor="text-success-600"
              iconBgColor="bg-success-100"
            />
            <MetricCard
              title="Recent Runs"
              value={totalRuns}
              icon={History}
              iconColor="text-warning-600"
              iconBgColor="bg-warning-100"
            />
          </>
        )}
      </div>

      {/* Recent Runs Section */}
      <h2 className="text-lg font-medium text-neutral-900 mt-8 mb-4">Recent Runs</h2>
      <Card>
        <DataTable
          columns={runColumns}
          data={recentRuns as unknown as Record<string, unknown>[]}
          onRowClick={(run) => navigate(`/runs/${(run as unknown as MappingRun).run_id}`)}
          loading={runsLoading}
          emptyIcon={History}
          emptyTitle="No runs yet"
          emptyDescription="Execute a mapping to see run history here."
        />
      </Card>

      {/* Quick Actions */}
      <h2 className="text-lg font-medium text-neutral-900 mt-8 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/connections">
          <Card className="p-4 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center">
                <Plug className="h-5 w-5 text-info-600" />
              </div>
              <span className="font-medium text-neutral-900">New Connection</span>
            </div>
          </Card>
        </Link>
        <Link to="/mappings/new">
          <Card className="p-4 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-success-600" />
              </div>
              <span className="font-medium text-neutral-900">New Mapping</span>
            </div>
          </Card>
        </Link>
        <Link to="/schemas">
          <Card className="p-4 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary-600" />
              </div>
              <span className="font-medium text-neutral-900">New Schema</span>
            </div>
          </Card>
        </Link>
      </div>
    </PageContainer>
  );
}
