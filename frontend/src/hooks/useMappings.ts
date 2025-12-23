import { useState, useEffect, useCallback } from 'react';
import { Mapping, MappingFormData } from '../types/mapping';
import { mappingAPI } from '../services/api';

export function useMappings() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mappingAPI.list();
      setMappings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mappings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const createMapping = async (data: MappingFormData): Promise<Mapping> => {
    const newMapping = await mappingAPI.create(data);
    setMappings(prev => [newMapping, ...prev]);
    return newMapping;
  };

  const updateMapping = async (id: string, data: Partial<MappingFormData>): Promise<Mapping> => {
    const updated = await mappingAPI.update(id, data);
    setMappings(prev => prev.map(mapping => mapping._id === id ? updated : mapping));
    return updated;
  };

  const archiveMapping = async (id: string): Promise<void> => {
    const archived = await mappingAPI.archive(id);
    setMappings(prev => prev.map(mapping => mapping._id === id ? archived : mapping));
  };

  const restoreMapping = async (id: string): Promise<void> => {
    const restored = await mappingAPI.restore(id);
    setMappings(prev => prev.map(mapping => mapping._id === id ? restored : mapping));
  };

  return {
    mappings,
    loading,
    error,
    fetchMappings,
    createMapping,
    updateMapping,
    archiveMapping,
    restoreMapping,
  };
}
