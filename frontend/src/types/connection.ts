export type DatabaseType = 'mysql' | 'postgresql';

export interface Connection {
  _id: string;
  name: string;
  db_type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  last_test_status?: 'success' | 'failed';
}

export interface ConnectionFormData {
  name: string;
  db_type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    db_type?: string;
    version?: string;
    error_type?: string;
    traceback?: string;
  };
}
