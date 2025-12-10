import api from './api';
import { ScheduleConfiguration, ScheduleResponse } from '../types/schedule';

export const scheduleAPI = {
  create: async (config: ScheduleConfiguration): Promise<ScheduleResponse> => {
    const response = await api.post<ScheduleResponse>('/schedules/', config);
    return response.data;
  },

  get: async (mappingId: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedules/${mappingId}`);
    return response.data;
  },
};

