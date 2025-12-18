export type RunStatus = 'running' | 'success' | 'failed' | 'partial_success';
export type TriggerType = 'manual' | 'scheduled';

export interface MappingRun {
  _id: string;
  run_id: string;
  mapping_id: string;
  mapping_name?: string;  // Populated from mapping
  source_id: string;
  source_name?: string;  // Populated from connection
  source_type?: string;  // Populated from connection
  trigger_type: TriggerType;
  schedule_id?: string;
  status: RunStatus;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  rows_written_to_delta: number;
  rows_written_to_target: number;
  delta_table_path?: string;
  error_stage?: string;
  error_message?: string;
  error_stack_trace?: string;
  target_write_status?: string;
  created_at: string;
  updated_at: string;
}

export interface MappingRunListResponse {
  runs: MappingRun[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface MappingRunFilters {
  mapping_id?: string;
  source_id?: string;
  status?: RunStatus;
}
