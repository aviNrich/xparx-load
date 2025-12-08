import { useState, useEffect, useCallback } from 'react';
import { Connection, ConnectionFormData } from '../types/connection';
import { connectionAPI } from '../services/api';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await connectionAPI.list();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const createConnection = async (data: ConnectionFormData): Promise<Connection> => {
    const newConnection = await connectionAPI.create(data);
    setConnections(prev => [newConnection, ...prev]);
    return newConnection;
  };

  const updateConnection = async (id: string, data: Partial<ConnectionFormData>): Promise<Connection> => {
    const updated = await connectionAPI.update(id, data);
    setConnections(prev => prev.map(conn => conn._id === id ? updated : conn));
    return updated;
  };

  const deleteConnection = async (id: string): Promise<void> => {
    await connectionAPI.delete(id);
    setConnections(prev => prev.filter(conn => conn._id !== id));
  };

  return {
    connections,
    loading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
  };
}
