export type FieldType = 'string' | 'integer' | 'date' | 'boolean';

export interface SchemaField {
  name: string;
  field_type: FieldType;
  description?: string;
}

export interface TableSchema {
  _id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  created_at: string;
  updated_at: string;
}

export interface TableSchemaFormData {
  name: string;
  description?: string;
  fields: SchemaField[];
}
