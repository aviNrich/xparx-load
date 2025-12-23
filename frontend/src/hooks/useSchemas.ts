import { useState, useEffect, useCallback } from 'react';
import { TableSchema, TableSchemaFormData } from '../types/schema';
import { schemaAPI } from '../services/api';

export function useSchemas() {
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schemaAPI.list();
      setSchemas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schemas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const createSchema = async (data: TableSchemaFormData): Promise<TableSchema> => {
    const newSchema = await schemaAPI.create(data);
    setSchemas(prev => [newSchema, ...prev]);
    return newSchema;
  };

  const updateSchema = async (id: string, data: Partial<TableSchemaFormData>): Promise<TableSchema> => {
    const updated = await schemaAPI.update(id, data);
    setSchemas(prev => prev.map(schema => schema._id === id ? updated : schema));
    return updated;
  };

  const archiveSchema = async (id: string): Promise<void> => {
    const archived = await schemaAPI.archive(id);
    setSchemas(prev => prev.map(schema => schema._id === id ? archived : schema));
  };

  const restoreSchema = async (id: string): Promise<void> => {
    const restored = await schemaAPI.restore(id);
    setSchemas(prev => prev.map(schema => schema._id === id ? restored : schema));
  };

  return {
    schemas,
    loading,
    error,
    fetchSchemas,
    createSchema,
    updateSchema,
    archiveSchema,
    restoreSchema,
  };
}
