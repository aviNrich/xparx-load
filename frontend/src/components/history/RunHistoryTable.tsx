import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Eye, Filter, X } from 'lucide-react';
import { MappingRun, MappingRunFilters, RunStatus } from '../../types/mappingRun';
import { mappingRunAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { toast } from 'sonner';

interface RunHistoryTableProps {
  filters?: MappingRunFilters;
  onRunClick?: (run: MappingRun) => void;
  pageSize?: number;
}

export function RunHistoryTable({
  filters,
  onRunClick,
  pageSize = 50
}: RunHistoryTableProps) {
  const [runs, setRuns] = useState<MappingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RunStatus | ''>('');

  const fetchRuns = async (currentPage: number = 0) => {
    setLoading(true);
    try {
      const combinedFilters: MappingRunFilters = {
        ...filters,
        ...(statusFilter && { status: statusFilter }),
      };

      console.log('[RunHistoryTable] Fetching runs with filters:', combinedFilters);

      const response = await mappingRunAPI.list(
        combinedFilters,
        pageSize,
        currentPage * pageSize
      );

      console.log('[RunHistoryTable] Received runs:', response.runs.length, 'runs');
      console.log('[RunHistoryTable] First run mapping_id:', response.runs[0]?.mapping_id);
      console.log('[RunHistoryTable] Filter mapping_id:', combinedFilters.mapping_id);

      setRuns(response.runs);
      setTotalCount(response.total_count);
      setHasMore(response.has_more);
    } catch (error: any) {
      toast.error('Failed to load run history', {
        description: error.response?.data?.detail || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchRuns(0);
  }, [filters, statusFilter]);

  const handlePreviousPage = () => {
    if (page > 0) {
      const newPage = page - 1;
      setPage(newPage);
      fetchRuns(newPage);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      const newPage = page + 1;
      setPage(newPage);
      fetchRuns(newPage);
    }
  };

  const getStatusBadge = (status: RunStatus) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600 hover:bg-green-700">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial_success':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Partial Success</Badge>;
      case 'running':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const clearStatusFilter = () => {
    setStatusFilter('');
  };

  if (loading && runs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-500">Loading run history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-neutral-500" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RunStatus | '')}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="partial_success">Partial Success</option>
            <option value="running">Running</option>
          </select>
          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearStatusFilter}
              className="h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Mapping
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Rows (Delta)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Rows (Target)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Trigger
                </th>
                {onRunClick && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={onRunClick ? 9 : 8} className="px-4 py-8 text-center text-neutral-500">
                    No run history found
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr
                    key={run._id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {formatDateTime(run.start_time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {run.mapping_name || run.mapping_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      <div className="flex flex-col">
                        <span>{run.source_name || run.source_id}</span>
                        {run.source_type && (
                          <span className="text-xs text-neutral-400">{run.source_type}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {formatDuration(run.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {run.rows_written_to_delta.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {run.rows_written_to_target.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="secondary" className="capitalize">
                        {run.trigger_type}
                      </Badge>
                    </td>
                    {onRunClick && (
                      <td className="px-4 py-3 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRunClick(run)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-neutral-600">
          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} runs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-neutral-600">
            Page {page + 1} of {Math.ceil(totalCount / pageSize) || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
