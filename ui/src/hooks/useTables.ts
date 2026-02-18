import { useState, useEffect, useCallback } from 'react';
import { TableInfo } from '../types/mapping';
import { mappingAPI } from '../services/api';

export function useTables(connectionId: string | null) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    if (!connectionId) {
      setTables([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await mappingAPI.listTables(connectionId);
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    loading,
    error,
    fetchTables,
  };
}
