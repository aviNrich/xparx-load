import { useState, useEffect, useCallback } from 'react';
import { ColumnMappingConfiguration } from '../types/mapping';
import { columnMappingAPI } from '../services/api';

export function useColumnMappings(mappingId: string | undefined) {
  const [config, setConfig] = useState<ColumnMappingConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!mappingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await columnMappingAPI.get(mappingId);
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch column mapping configuration');
    } finally {
      setLoading(false);
    }
  }, [mappingId]);

  useEffect(() => {
    if (mappingId) {
      fetchConfig();
    }
  }, [fetchConfig, mappingId]);

  const saveConfig = async (configuration: Omit<ColumnMappingConfiguration, '_id' | 'created_at' | 'updated_at'>): Promise<ColumnMappingConfiguration> => {
    if (config) {
      const updated = await columnMappingAPI.update(configuration);
      setConfig(updated);
      return updated;
    } else {
      const created = await columnMappingAPI.create(configuration);
      setConfig(created);
      return created;
    }
  };

  const archiveConfig = async (): Promise<void> => {
    if (!mappingId) return;
    await columnMappingAPI.archive(mappingId);
    setConfig(prev => prev ? { ...prev, archived: true } : null);
  };

  const restoreConfig = async (): Promise<void> => {
    if (!mappingId) return;
    await columnMappingAPI.restore(mappingId);
    setConfig(prev => prev ? { ...prev, archived: false } : null);
  };

  return {
    config,
    loading,
    error,
    fetchConfig,
    saveConfig,
    archiveConfig,
    restoreConfig,
  };
}
