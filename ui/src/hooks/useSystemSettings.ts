import { useState, useEffect, useCallback } from 'react';
import { systemSettingsAPI, SystemSettings, TargetDatabaseConfig, TestConnectionResult } from '../services/api';

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await systemSettingsAPI.get();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateTargetDb = async (config: TargetDatabaseConfig): Promise<SystemSettings> => {
    const updated = await systemSettingsAPI.updateTargetDb(config);
    setSettings(updated);
    return updated;
  };

  const testTargetDb = async (config: TargetDatabaseConfig): Promise<TestConnectionResult> => {
    return await systemSettingsAPI.testTargetDb(config);
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateTargetDb,
    testTargetDb,
  };
}
