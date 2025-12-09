import axios from 'axios';
import { Connection, ConnectionFormData, TestConnectionResult } from '../types/connection';
import { TableSchema, TableSchemaFormData } from '../types/schema';
import { TableInfo, SqlPreviewRequest, SqlPreviewResponse, Mapping, MappingFormData, ColumnMappingConfiguration } from '../types/mapping';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const connectionAPI = {
  // List all connections
  list: async (): Promise<Connection[]> => {
    const response = await api.get<Connection[]>('/connections/');
    return response.data;
  },

  // Get single connection
  get: async (id: string): Promise<Connection> => {
    const response = await api.get<Connection>(`/connections/${id}`);
    return response.data;
  },

  // Create new connection
  create: async (data: ConnectionFormData): Promise<Connection> => {
    const response = await api.post<Connection>('/connections/', data);
    return response.data;
  },

  // Update connection
  update: async (id: string, data: Partial<ConnectionFormData>): Promise<Connection> => {
    const response = await api.put<Connection>(`/connections/${id}`, data);
    return response.data;
  },

  // Delete connection
  delete: async (id: string): Promise<void> => {
    await api.delete(`/connections/${id}`);
  },

  // Test new connection
  test: async (data: ConnectionFormData): Promise<TestConnectionResult> => {
    const response = await api.post<TestConnectionResult>('/connections/test', data);
    return response.data;
  },

  // Test existing connection
  testExisting: async (id: string): Promise<TestConnectionResult> => {
    const response = await api.post<TestConnectionResult>(`/connections/${id}/test`);
    return response.data;
  },
};

export const schemaAPI = {
  // List all schemas
  list: async (): Promise<TableSchema[]> => {
    const response = await api.get<TableSchema[]>('/schemas/');
    return response.data;
  },

  // Get single schema
  get: async (id: string): Promise<TableSchema> => {
    const response = await api.get<TableSchema>(`/schemas/${id}`);
    return response.data;
  },

  // Create new schema
  create: async (data: TableSchemaFormData): Promise<TableSchema> => {
    const response = await api.post<TableSchema>('/schemas/', data);
    return response.data;
  },

  // Update schema
  update: async (id: string, data: Partial<TableSchemaFormData>): Promise<TableSchema> => {
    const response = await api.put<TableSchema>(`/schemas/${id}`, data);
    return response.data;
  },

  // Delete schema
  delete: async (id: string): Promise<void> => {
    await api.delete(`/schemas/${id}`);
  },
};

export const mappingAPI = {
  // List all mappings
  list: async (): Promise<Mapping[]> => {
    const response = await api.get<Mapping[]>('/mappings/');
    return response.data;
  },

  // Get single mapping
  get: async (id: string): Promise<Mapping> => {
    const response = await api.get<Mapping>(`/mappings/${id}`);
    return response.data;
  },

  // Create new mapping
  create: async (data: MappingFormData): Promise<Mapping> => {
    const response = await api.post<Mapping>('/mappings/', data);
    return response.data;
  },

  // Update mapping
  update: async (id: string, data: Partial<MappingFormData>): Promise<Mapping> => {
    const response = await api.put<Mapping>(`/mappings/${id}`, data);
    return response.data;
  },

  // Delete mapping
  delete: async (id: string): Promise<void> => {
    await api.delete(`/mappings/${id}`);
  },

  // List tables from a connection
  listTables: async (connectionId: string): Promise<TableInfo[]> => {
    const response = await api.get<TableInfo[]>(`/mappings/connections/${connectionId}/tables`);
    return response.data;
  },

  // Preview SQL query results
  previewSql: async (data: SqlPreviewRequest): Promise<SqlPreviewResponse> => {
    const response = await api.post<SqlPreviewResponse>('/mappings/preview', data);
    return response.data;
  },
};

export const columnMappingAPI = {
  // Create column mapping configuration
  create: async (config: Omit<ColumnMappingConfiguration, '_id' | 'created_at' | 'updated_at'>): Promise<ColumnMappingConfiguration> => {
    const response = await api.post<ColumnMappingConfiguration>(`/mappings/${config.mapping_id}/column-mappings`, config);
    return response.data;
  },

  // Get column mapping configuration by mapping ID
  get: async (mappingId: string): Promise<ColumnMappingConfiguration | null> => {
    try {
      const response = await api.get<ColumnMappingConfiguration>(`/mappings/${mappingId}/column-mappings`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update column mapping configuration (upsert)
  update: async (config: Omit<ColumnMappingConfiguration, '_id' | 'created_at' | 'updated_at'>): Promise<ColumnMappingConfiguration> => {
    const response = await api.put<ColumnMappingConfiguration>(`/mappings/${config.mapping_id}/column-mappings`, config);
    return response.data;
  },

  // Delete column mapping configuration
  delete: async (mappingId: string): Promise<void> => {
    await api.delete(`/mappings/${mappingId}/column-mappings`);
  },
};

export default api;
