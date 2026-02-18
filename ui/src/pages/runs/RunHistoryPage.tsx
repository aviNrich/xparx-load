import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useMappingRuns } from '@/hooks/useMappingRuns';
import { useMappings } from '@/hooks/useMappings';
import { MappingRun, RunStatus } from '@/types/mappingRun';

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

const PAGE_SIZE = 20;

export function RunHistoryPage() {
  const navigate = useNavigate();
  const { mappings } = useMappings();
  const { runs, totalCount, loading, page, setPage, setFilters } = useMappingRuns();

  const activeMappings = mappings.filter(m => !m.archived);

  const handleMappingChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      mapping_id: value === 'all' ? undefined : value,
    }));
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value === 'all' ? undefined : (value as RunStatus),
    }));
    setPage(0);
  };

  const columns = [
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
      header: 'Rows to Delta',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return <span className="text-neutral-600">{run.rows_written_to_delta.toLocaleString()}</span>;
      },
    },
    {
      key: 'rows_written_to_target',
      header: 'Rows to Target',
      render: (item: Record<string, unknown>) => {
        const run = item as unknown as MappingRun;
        return <span className="text-neutral-600">{run.rows_written_to_target.toLocaleString()}</span>;
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Run History" description="View execution history" />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select onValueChange={handleMappingChange} defaultValue="all">
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Mappings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mappings</SelectItem>
            {activeMappings.map(mapping => (
              <SelectItem key={mapping._id} value={mapping._id}>
                {mapping.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleStatusChange} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="partial_success">Partial Success</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={runs as unknown as Record<string, unknown>[]}
          onRowClick={(run) => navigate(`/runs/${(run as unknown as MappingRun).run_id}`)}
          loading={loading}
          emptyIcon={History}
          emptyTitle="No runs found"
          emptyDescription="No mapping runs match your current filters."
        />
      </Card>

      {/* Pagination */}
      {totalCount > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={totalCount}
          onPageChange={setPage}
          className="mt-4"
        />
      )}
    </PageContainer>
  );
}
