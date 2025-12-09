export interface Mapping {
  _id: string;
  name: string;
  description?: string;
  source_connection_id: string;
  source_table: string;
  sql_query: string;
  created_at: string;
  updated_at: string;
}

export interface MappingFormData {
  name: string;
  description?: string;
  source_connection_id: string;
  source_table: string;
  sql_query: string;
}

export interface TableInfo {
  table_name: string;
  table_schema?: string;
  table_type?: string;
  row_count?: number;  // Estimated row count for display
}

export interface SqlPreviewRequest {
  connection_id: string;
  sql_query: string;
}

export interface SqlPreviewResponse {
  columns: string[];
  rows: any[][];
  row_count: number;
}
