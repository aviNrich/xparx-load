import { useState, useEffect, useCallback } from 'react';
import { ScheduleConfiguration, ScheduleResponse } from '../types/schedule';
import { scheduleAPI } from '../services/schedule.api';

export function useSchedule(mappingId: string | undefined) {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!mappingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await scheduleAPI.get(mappingId);
      setSchedule(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSchedule(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
      }
    } finally {
      setLoading(false);
    }
  }, [mappingId]);

  useEffect(() => {
    if (mappingId) {
      fetchSchedule();
    }
  }, [fetchSchedule, mappingId]);

  const saveSchedule = async (config: ScheduleConfiguration): Promise<ScheduleResponse> => {
    const saved = await scheduleAPI.create(config);
    setSchedule(saved);
    return saved;
  };

  return {
    schedule,
    loading,
    error,
    fetchSchedule,
    saveSchedule,
  };
}
