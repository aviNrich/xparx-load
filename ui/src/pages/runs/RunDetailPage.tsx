import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Rows3, HardDrive, AlertCircle, XCircle } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { ConnectionTypeBadge } from '@/components/shared/ConnectionTypeBadge';
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

const statusIconColor: Record<string, { iconColor: string; iconBgColor: string }> = {
  success: { iconColor: 'text-success-600', iconBgColor: 'bg-success-100' },
  failed: { iconColor: 'text-error-600', iconBgColor: 'bg-error-100' },
  partial_success: { iconColor: 'text-warning-600', iconBgColor: 'bg-warning-100' },
  running: { iconColor: 'text-info-600', iconBgColor: 'bg-info-100' },
};

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<MappingRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRun() {
      if (!runId) return;
      setLoading(true);
      try {
        const data = await mappingRunAPI.get(runId);
        setRun(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch run details');
      } finally {
        setLoading(false);
      }
    }
    fetchRun();
  }, [runId]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState variant="inline" text="Loading run details..." />
      </PageContainer>
    );
  }

  if (error || !run) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Run not found'}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const truncatedId = run.run_id.length > 12
    ? `${run.run_id.substring(0, 12)}...`
    : run.run_id;

  const colors = statusIconColor[run.status] || statusIconColor.running;

  return (
    <PageContainer>
      <PageHeader
        title="Run Details"
        breadcrumbs={[
          { label: 'Run History', href: '/runs' },
          { label: truncatedId },
        ]}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Status"
          value={0}
          icon={AlertCircle}
          iconColor={colors.iconColor}
          iconBgColor={colors.iconBgColor}
          footer={
            <StatusBadge
              status={statusToVariant[run.status] || 'pending'}
              label={run.status.replace('_', ' ')}
              size="md"
            />
          }
        />
        <MetricCard
          title="Duration"
          value={run.duration_seconds || 0}
          icon={Clock}
          iconColor="text-info-600"
          iconBgColor="bg-info-100"
          suffix="s"
          description={formatDuration(run.duration_seconds)}
        />
        <MetricCard
          title="Rows to Delta"
          value={run.rows_written_to_delta}
          icon={HardDrive}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-100"
        />
        <MetricCard
          title="Rows to Target"
          value={run.rows_written_to_target}
          icon={Rows3}
          iconColor="text-success-600"
          iconBgColor="bg-success-100"
        />
      </div>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Run Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Mapping Name</p>
              <p className="text-sm font-medium text-neutral-900">{run.mapping_name || run.mapping_id}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Source Name</p>
              <p className="text-sm font-medium text-neutral-900">{run.source_name || run.source_id}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Source Type</p>
              <div className="mt-0.5">
                {run.source_type ? (
                  <ConnectionTypeBadge type={run.source_type as 'mysql' | 'postgresql' | 'file'} />
                ) : (
                  <span className="text-sm text-neutral-600">-</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Trigger Type</p>
              <div className="mt-0.5">
                <Badge variant="secondary">{run.trigger_type}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Start Time</p>
              <p className="text-sm text-neutral-700">
                {run.start_time ? format(new Date(run.start_time), 'MMM d, yyyy HH:mm') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">End Time</p>
              <p className="text-sm text-neutral-700">
                {run.end_time ? format(new Date(run.end_time), 'MMM d, yyyy HH:mm') : '-'}
              </p>
            </div>
            {run.delta_table_path && (
              <div className="md:col-span-2">
                <p className="text-xs text-neutral-500 mb-1">Delta Table Path</p>
                <p className="text-sm font-mono text-neutral-700">{run.delta_table_path}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Section */}
      {run.status === 'failed' && (run.error_message || run.error_stage) && (
        <Alert variant="destructive" className="mt-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>
            Error{run.error_stage ? ` in ${run.error_stage}` : ''}
          </AlertTitle>
          <AlertDescription>
            <p className="mt-1">{run.error_message || 'An unknown error occurred.'}</p>
            {run.error_stack_trace && (
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="stack-trace" className="border-red-200">
                  <AccordionTrigger className="text-sm text-red-800 hover:bg-red-100 py-2 px-2">
                    Stack Trace
                  </AccordionTrigger>
                  <AccordionContent className="px-2">
                    <pre className="font-mono text-xs text-red-800 whitespace-pre-wrap bg-red-100 p-3 rounded overflow-auto max-h-80">
                      {run.error_stack_trace}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </AlertDescription>
        </Alert>
      )}
    </PageContainer>
  );
}
