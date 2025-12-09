import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Editor from '@monaco-editor/react';
import { MappingFormData, SqlPreviewResponse, TableInfo } from '../types/mapping';
import { useConnections } from '../hooks/useConnections';
import { useTables } from '../hooks/useTables';
import { mappingAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Combobox, ComboboxOption } from '../components/ui/combobox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { SqlPreviewTable } from '../components/mappings/SqlPreviewTable';
import { ArrowLeft, Loader2, AlertCircle, Play } from 'lucide-react';

const mappingSchema = z.object({
  name: z.string().min(1, 'Mapping name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  source_connection_id: z.string().min(1, 'Source connection is required'),
  source_table: z.string().min(1, 'Source table is required'),
  sql_query: z.string().min(1, 'SQL query is required'),
});

export function NewMappingPage() {
  const navigate = useNavigate();
  const { connections, loading: connectionsLoading } = useConnections();
  const [previewData, setPreviewData] = useState<SqlPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sqlManuallyEdited, setSqlManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MappingFormData>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      name: '',
      description: '',
      source_connection_id: '',
      source_table: '',
      sql_query: '',
    },
  });

  const sourceConnectionId = watch('source_connection_id');
  const sourceTable = watch('source_table');
  const sqlQuery = watch('sql_query');

  const { tables, loading: tablesLoading } = useTables(sourceConnectionId || null);

  // Convert tables to combobox options with schema.table_name (row_count) format
  const tableOptions: ComboboxOption[] = tables.map((table: TableInfo) => {
    const schemaPrefix = table.table_schema ? `${table.table_schema}.` : '';
    const rowCountSuffix = table.row_count !== null && table.row_count !== undefined
      ? ` (${table.row_count.toLocaleString()} rows)`
      : '';
    return {
      label: `${schemaPrefix}${table.table_name}${rowCountSuffix}`,
      value: table.table_name,
    };
  });

  // When table is selected, generate SQL query
  useEffect(() => {
    if (sourceTable && tables.length > 0) {
      const selectedTable = tables.find((t: TableInfo) => t.table_name === sourceTable);
      if (selectedTable) {
        // Check if user has manually edited the SQL
        if (sqlManuallyEdited && sqlQuery && sqlQuery.trim() !== '') {
          // Confirm with user before overwriting
          if (window.confirm('You have manually edited the SQL query. Do you want to overwrite it with the new table selection?')) {
            generateSqlQuery(selectedTable);
            setSqlManuallyEdited(false);
          } else {
            // Revert table selection
            setValue('source_table', '');
          }
        } else {
          generateSqlQuery(selectedTable);
        }
      }
    }
  }, [sourceTable, tables]);

  const generateSqlQuery = (table: TableInfo) => {
    const schemaPrefix = table.table_schema ? `${table.table_schema}.` : '';
    const tableName = `${schemaPrefix}${table.table_name}`;
    const query = `SELECT * FROM ${tableName}`;
    setValue('sql_query', query);
    setPreviewData(null);  // Clear previous preview
    setPreviewError(null);
  };

  const handleSqlChange = (value: string | undefined) => {
    setValue('sql_query', value || '');
    if (value && value.trim() !== '') {
      setSqlManuallyEdited(true);
    }
  };

  const handlePreview = async () => {
    if (!sourceConnectionId || !sqlQuery) {
      setPreviewError('Please select a connection and enter a SQL query');
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewData(null);

    try {
      const result = await mappingAPI.previewSql({
        connection_id: sourceConnectionId,
        sql_query: sqlQuery,
      });
      setPreviewData(result);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview query');
    } finally {
      setIsPreviewing(false);
    }
  };

  const onSubmit = (data: MappingFormData) => {
    // Phase 1: No save functionality yet
    console.log('Mapping data (not saved):', data);
    alert('Mapping preview completed! Save functionality will be added in Phase 2.');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mappings')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900">New Mapping</h1>
              <p className="text-sm text-neutral-500 mt-1">Configure your data mapping - Step 1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            {/* Mapping Name */}
            <div>
              <Label htmlFor="name" className="text-neutral-700">
                Mapping Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Users Data Import"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-neutral-700">
                Description <span className="text-neutral-400 text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what this mapping does..."
                className="mt-1.5"
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Source Connection */}
            <div>
              <Label htmlFor="source_connection_id" className="text-neutral-700">
                Source Connection <span className="text-red-500">*</span>
              </Label>
              <Select
                value={sourceConnectionId}
                onValueChange={(value) => {
                  setValue('source_connection_id', value);
                  setValue('source_table', '');  // Reset table when connection changes
                  setValue('sql_query', '');  // Reset query
                  setSqlManuallyEdited(false);
                  setPreviewData(null);
                  setPreviewError(null);
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={connectionsLoading ? "Loading connections..." : "Select a connection"} />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn._id} value={conn._id}>
                      {conn.name} ({conn.db_type.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.source_connection_id && (
                <p className="text-sm text-red-500 mt-1">{errors.source_connection_id.message}</p>
              )}
            </div>

            {/* Source Table */}
            {sourceConnectionId && (
              <div>
                <Label htmlFor="source_table" className="text-neutral-700">
                  Source Table <span className="text-red-500">*</span>
                </Label>
                <div className="mt-1.5">
                  <Combobox
                    options={tableOptions}
                    value={sourceTable}
                    onValueChange={(value) => setValue('source_table', value)}
                    placeholder="Select a table..."
                    searchPlaceholder="Search tables..."
                    emptyMessage="No tables found."
                    loading={tablesLoading}
                  />
                </div>
                {errors.source_table && (
                  <p className="text-sm text-red-500 mt-1">{errors.source_table.message}</p>
                )}
              </div>
            )}

            {/* SQL Query Editor */}
            {sourceConnectionId && (
              <div>
                <Label htmlFor="sql_query" className="text-neutral-700">
                  SQL Query <span className="text-red-500">*</span>
                </Label>
                <div className="mt-1.5 border border-neutral-300 rounded-md overflow-hidden">
                  <Editor
                    height="400px"
                    language="sql"
                    theme="vs-light"
                    value={sqlQuery}
                    onChange={handleSqlChange}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      readOnly: false,
                      automaticLayout: true,
                      padding: { top: 10, bottom: 10 },
                    }}
                  />
                </div>
                {errors.sql_query && (
                  <p className="text-sm text-red-500 mt-1">{errors.sql_query.message}</p>
                )}
              </div>
            )}

            {/* Preview Button */}
            {sqlQuery && (
              <div>
                <Button
                  type="button"
                  onClick={handlePreview}
                  disabled={isPreviewing || !sourceConnectionId}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing Query...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Preview Query Results
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Preview Error */}
            {previewError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{previewError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview Results */}
          {(previewData || isPreviewing) && (
            <SqlPreviewTable
              columns={previewData?.columns || []}
              rows={previewData?.rows || []}
              loading={isPreviewing}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-neutral-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/mappings')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={true}  // Disabled for Phase 1
              className="bg-neutral-400 cursor-not-allowed"
            >
              Next (Phase 2)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
