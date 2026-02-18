export type ScheduleMode = 'once' | 'scheduled';
export type ScheduleType = 'interval' | 'daily' | 'weekly' | 'cron';
export type IntervalUnit = 'minutes' | 'hours' | 'days';
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface IntervalConfig {
  value: number;
  unit: IntervalUnit;
}

export interface DailyConfig {
  time: string; // "HH:MM"
}

export interface WeeklyConfig {
  days: WeekDay[];
  time: string; // "HH:MM"
}

export interface ScheduleConfiguration {
  mapping_id: string;
  mode: ScheduleMode;
  schedule_type?: ScheduleType;
  interval?: IntervalConfig;
  daily?: DailyConfig;
  weekly?: WeeklyConfig;
  cron_expression?: string;
  enabled: boolean;
}

export interface ScheduleResponse extends ScheduleConfiguration {
  _id: string;
  created_at: string;
  updated_at: string;
}
