export type FieldType = 'string' | 'integer' | 'date' | 'boolean' | 'enum';

export interface SchemaField {
  name: string;
  field_type: FieldType;
  description?: string;
  enum_values?: Record<string, string>;
  default_enum_key?: string;  // Default/fallback enum key for unmapped values
}

export interface TableSchema {
  _id: string;
  name: string;
  schema_handler: string;
  description?: string;
  fields: SchemaField[];
  created_at: string;
  updated_at: string;
  archived: boolean;
  archived_at?: string;
}

export interface TableSchemaFormData {
  name: string;
  schema_handler: string;
  description?: string;
  fields: SchemaField[];
}

// Delta table query types
export interface ColumnInfo {
  name: string;
  type: string;
}

export interface DeltaQueryRequest {
  table_name: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface DeltaQueryResponse {
  data: Record<string, any>[];
  total_count: number;
  columns: ColumnInfo[];
  limit: number;
  offset: number;
}

export interface TableSchemaInfo {
  table_name: string;
  table_path: string;
  columns: ColumnInfo[];
}
