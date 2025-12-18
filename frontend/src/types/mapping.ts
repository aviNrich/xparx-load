export interface Mapping {
  _id: string;
  name: string;
  description?: string;
  source_connection_id: string;
  source_name?: string;  // Populated from connection name
  source_type?: string;  // Populated from connection db_type (mysql, postgresql, file)
  sql_query: string;
  entity_root_id_column?: string;  // Entity root ID column (e.g., "poi_id")
  entity_id_column?: string;  // Row ID column (e.g., "id")
  created_at: string;
  updated_at: string;
}

export interface MappingFormData {
  name: string;
  description?: string;
  source_connection_id: string;
  sql_query: string;
  entity_root_id_column?: string;
  entity_id_column?: string;
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

// Column Mapping types
export type MappingType = 'direct' | 'split' | 'join';

export interface DirectMapping {
  type: 'direct';
  source_column: string;
  target_field: string;
}

export interface SplitMapping {
  type: 'split';
  source_column: string;
  delimiter: string;
  target_fields: string[];  // Ordered positions
}

export interface JoinMapping {
  type: 'join';
  source_columns: string[];  // Ordered
  separator: string;
  target_field: string;
}

export type ColumnMapping = DirectMapping | SplitMapping | JoinMapping;

// NEW: Schema configuration for multiple schemas support
export interface SchemaConfiguration {
  schema_id: string;
  column_mappings: ColumnMapping[];
}

export interface ColumnMappingConfiguration {
  _id?: string;
  mapping_id: string;
  target_schemas: SchemaConfiguration[];
  created_at?: string;
  updated_at?: string;
}
