import { useState, useCallback } from 'react';
import { SqlPreviewResponse } from '../types/mapping';
import { mappingAPI } from '../services/api';

export function useSqlPreview() {
  const [preview, setPreview] = useState<SqlPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreview = useCallback(async (connectionId: string, sqlQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mappingAPI.previewSql({
        connection_id: connectionId,
        sql_query: sqlQuery,
      });
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview SQL query');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return {
    preview,
    loading,
    error,
    runPreview,
    clearPreview,
  };
}
