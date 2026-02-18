import { useState, useEffect, useCallback } from 'react';
import { MappingRun, MappingRunListResponse, MappingRunFilters } from '../types/mappingRun';
import { mappingRunAPI } from '../services/api';

const DEFAULT_PAGE_SIZE = 20;

export function useMappingRuns(initialFilters?: MappingRunFilters) {
  const [runs, setRuns] = useState<MappingRun[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MappingRunFilters | undefined>(initialFilters);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = page * DEFAULT_PAGE_SIZE;
      const data: MappingRunListResponse = await mappingRunAPI.list(filters, DEFAULT_PAGE_SIZE, offset);
      setRuns(data.runs);
      setTotalCount(data.total_count);
      setHasMore(data.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mapping runs');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const nextPage = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  };

  return {
    runs,
    totalCount,
    loading,
    error,
    page,
    hasMore,
    fetchRuns,
    setFilters,
    setPage,
    nextPage,
    prevPage,
  };
}
