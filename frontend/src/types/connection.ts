export type DatabaseType = 'file' | 'mysql' | 'postgresql';
export type FileType = 'csv' | 'json' | 'excel';

export interface Connection {
  _id: string;
  name: string;
  db_type: DatabaseType;
  // Database fields (optional for file type)
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  // File fields
  file_type?: FileType;
  file_paths?: string[];
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  last_test_status?: 'success' | 'failed';
}

export interface ConnectionFormData {
  name: string;
  db_type: DatabaseType;
  // Database fields (optional for file type)
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  // File fields
  file_type?: FileType;
  files?: File[];
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
