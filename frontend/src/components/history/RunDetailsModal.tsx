import { format } from 'date-fns';
import { X, AlertCircle, CheckCircle, Clock, Database, FileText } from 'lucide-react';
import { MappingRun } from '../../types/mappingRun';
import { Dialog, DialogContent } from '../ui/dialog';
import { Badge } from '../ui/badge';

interface RunDetailsModalProps {
  run: MappingRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunDetailsModal({ run, open, onOpenChange }: RunDetailsModalProps) {
  if (!run) return null;

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds.toFixed(2)} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minutes ${remainingSeconds.toFixed(0)} seconds`;
  };

  const getStatusIcon = () => {
    switch (run.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'partial_success':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (run.status) {
      case 'success':
        return <Badge className="bg-green-600 hover:bg-green-700">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial_success':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Partial Success</Badge>;
      case 'running':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Running</Badge>;
      default:
        return <Badge variant="secondary">{run.status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white p-0 gap-0 border-none max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getStatusIcon()}
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Run Details
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Run ID: {run.run_id}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Mapping
                  </label>
                  <p className="text-sm text-neutral-900 mt-1">
                    {run.mapping_name || run.mapping_id}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Source
                  </label>
                  <p className="text-sm text-neutral-900 mt-1">
                    {run.source_name || run.source_id}
                    {run.source_type && (
                      <span className="text-xs text-neutral-500 ml-2">({run.source_type})</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Trigger Type
                  </label>
                  <p className="text-sm text-neutral-900 mt-1 capitalize">
                    {run.trigger_type}
                    {run.schedule_id && (
                      <span className="text-xs text-neutral-500 ml-2">(Schedule: {run.schedule_id})</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </label>
                  <p className="text-sm text-neutral-900 mt-1 capitalize">{run.status}</p>
                </div>
              </div>
            </section>

            {/* Timing Information */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Timing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Start Time
                  </label>
                  <p className="text-sm text-neutral-900 mt-1">{formatDateTime(run.start_time)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    End Time
                  </label>
                  <p className="text-sm text-neutral-900 mt-1">
                    {run.end_time ? formatDateTime(run.end_time) : 'In progress...'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Duration
                  </label>
                  <p className="text-sm text-neutral-900 mt-1">{formatDuration(run.duration_seconds)}</p>
                </div>
              </div>
            </section>

            {/* Data Metrics */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                <Database className="w-4 h-4 inline mr-2" />
                Data Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Rows Written to Delta Lake
                  </label>
                  <p className="text-2xl font-semibold text-blue-900 mt-2">
                    {run.rows_written_to_delta.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="text-xs font-medium text-green-700 uppercase tracking-wider">
                    Rows Written to Target
                  </label>
                  <p className="text-2xl font-semibold text-green-900 mt-2">
                    {run.rows_written_to_target.toLocaleString()}
                  </p>
                </div>
              </div>
            </section>

            {/* Delta Table Path */}
            {run.delta_table_path && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Delta Table Path
                </h3>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <code className="text-xs text-neutral-800 break-all">{run.delta_table_path}</code>
                </div>
              </section>
            )}

            {/* Target Write Status */}
            {run.target_write_status && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Target Write Status</h3>
                <p className="text-sm text-neutral-900">{run.target_write_status}</p>
              </section>
            )}

            {/* Error Information */}
            {(run.status === 'failed' || run.status === 'partial_success') && (
              <section>
                <h3 className="text-sm font-semibold text-red-900 mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Error Details
                </h3>
                <div className="space-y-3">
                  {run.error_stage && (
                    <div>
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Error Stage
                      </label>
                      <p className="text-sm text-red-700 mt-1 capitalize">
                        {run.error_stage.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {run.error_message && (
                    <div>
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Error Message
                      </label>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1">
                        <p className="text-sm text-red-900">{run.error_message}</p>
                      </div>
                    </div>
                  )}
                  {run.error_stack_trace && (
                    <div>
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Stack Trace
                      </label>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1 max-h-48 overflow-y-auto">
                        <pre className="text-xs text-red-900 whitespace-pre-wrap font-mono">
                          {run.error_stack_trace}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
