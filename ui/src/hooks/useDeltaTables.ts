import { useState, useCallback } from 'react';
import { DeltaQueryRequest, DeltaQueryResponse, TableSchemaInfo, ColumnInfo } from '../types/schema';
import { deltaTableAPI } from '../services/api';

export function useDeltaTables() {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryTable = useCallback(async (request: DeltaQueryRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response: DeltaQueryResponse = await deltaTableAPI.query(request);
      setData(response.data);
      setColumns(response.columns);
      setTotalCount(response.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query delta table');
    } finally {
      setLoading(false);
    }
  }, []);

  const getSchema = useCallback(async (tableName: string): Promise<TableSchemaInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const schema = await deltaTableAPI.getSchema(tableName);
      return schema;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get table schema');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getData = useCallback(async (tableName: string, limit?: number, offset?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response: DeltaQueryResponse = await deltaTableAPI.getData(tableName, limit, offset);
      setData(response.data);
      setColumns(response.columns);
      setTotalCount(response.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get table data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    columns,
    totalCount,
    loading,
    error,
    queryTable,
    getSchema,
    getData,
  };
}
