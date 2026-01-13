import { useState, useEffect, useRef } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { MappingFormData, SqlPreviewResponse, TableInfo } from '../../../types/mapping';
import { useConnections } from '../../../hooks/useConnections';
import { useTables } from '../../../hooks/useTables';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Combobox, ComboboxOption } from '../../ui/combobox';
import { SqlPreviewTable } from '../SqlPreviewTable';
import { Loader2, Play, ChevronDown, ChevronUp } from 'lucide-react';

interface SourcePanelProps {
  register: UseFormRegister<MappingFormData>;
  errors: FieldErrors<MappingFormData>;
  watch: UseFormWatch<MappingFormData>;
  setValue: UseFormSetValue<MappingFormData>;
  previewData: SqlPreviewResponse | null;
  isPreviewing: boolean;
  onPreview: () => void;
  isEditMode: boolean;
}

export function SourcePanel({
  register,
  errors,
  watch,
  setValue,
  previewData,
  isPreviewing,
  onPreview,
  isEditMode,
}: SourcePanelProps) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [sourceTable, setSourceTable] = useState('');
  const [sqlManuallyEdited, setSqlManuallyEdited] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  // Track if we've already run auto-preview to prevent loops
  const hasRunFilePreview = useRef(false);
  const hasRunTablePreview = useRef<string | null>(null);

  const sourceConnectionId = watch('source_connection_id');
  const sqlQuery = watch('sql_query');

  const { connections, loading: connectionsLoading } = useConnections();
  const { tables, loading: tablesLoading } = useTables(sourceConnectionId || null);

  const selectedConnection = connections.find((conn) => conn._id === sourceConnectionId);
  const isFileUpload = selectedConnection?.db_type === 'file';

  // Convert tables to combobox options
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

  // Auto-preview for file uploads when connection is selected
  useEffect(() => {
    if (isEditMode || !isFileUpload || !sourceConnectionId) return;

    // Set default query for file uploads
    const query = 'SELECT * FROM file';
    setValue('sql_query', query);
    setSqlManuallyEdited(false);

    console.log('[SourcePanel] File upload detected, setting query to:', query);
  }, [isFileUpload, sourceConnectionId, isEditMode, setValue]);

  // Auto-run preview for file uploads when query is set
  useEffect(() => {
    if (isEditMode || !isFileUpload || !sourceConnectionId || !sqlQuery) return;
    if (sqlQuery !== 'SELECT * FROM file' && sqlQuery !== 'select * from file') return;
    if (hasRunFilePreview.current) return; // Prevent re-running

    console.log('[SourcePanel] File upload query detected, running preview');
    hasRunFilePreview.current = true;

    setTimeout(() => {
      onPreview();
    }, 100);
  }, [isFileUpload, sourceConnectionId, sqlQuery, isEditMode, onPreview]);

  // Reset preview flag when connection changes
  useEffect(() => {
    hasRunFilePreview.current = false;
    hasRunTablePreview.current = null;
  }, [sourceConnectionId]);

  // When table is selected, generate SQL query and auto-run preview
  useEffect(() => {
    if (isEditMode || !sourceTable || tables.length === 0 || !sourceConnectionId) return;
    if (hasRunTablePreview.current === sourceTable) return; // Prevent re-running for same table

    const selectedTable = tables.find((t: TableInfo) => t.table_name === sourceTable);
    if (selectedTable) {
      const schemaPrefix = selectedTable.table_schema ? `${selectedTable.table_schema}.` : '';
      const tableName = `${schemaPrefix}${selectedTable.table_name}`;
      const query = `SELECT * FROM ${tableName}`;
      setValue('sql_query', query);
      setSqlManuallyEdited(false);

      console.log('[SourcePanel] Table selected:', sourceTable, 'Query:', query);

      // Auto-run preview in simple mode
      if (!isAdvancedMode) {
        console.log('[SourcePanel] Running preview for table selection');
        hasRunTablePreview.current = sourceTable; // Mark this table as previewed

        setTimeout(() => {
          onPreview();
        }, 300);
      }
    }
  }, [sourceTable, tables, isEditMode, sourceConnectionId, isAdvancedMode, setValue, onPreview]);

  const handleSqlChange = (value: string | undefined) => {
    setValue('sql_query', value || '');
    if (value && value.trim() !== '') {
      setSqlManuallyEdited(true);
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-neutral-200 flex flex-col overflow-hidden">
      {/* Configuration Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Source Configuration</h3>
        </div>

        {/* Mapping Name */}
        <div>
          <Label htmlFor="name" className="text-neutral-700 text-xs font-medium">
            Mapping Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Users Data Import"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-neutral-700 text-xs font-medium">
            Description <span className="text-neutral-400 text-xs">(Optional)</span>
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Describe what this mapping does..."
            className="mt-1"
            rows={2}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Source Connection */}
        <div>
          <Label htmlFor="source_connection_id" className="text-neutral-700 text-xs font-medium">
            Source Connection <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <Combobox
              options={connections.map((conn) => ({
                label: `${conn.name} (${conn.db_type.toUpperCase()})`,
                value: conn._id,
              }))}
              value={sourceConnectionId}
              onValueChange={(value) => {
                setValue('source_connection_id', value);
                setSourceTable('');
                setValue('sql_query', '');
                setSqlManuallyEdited(false);
                setIsAdvancedMode(false);
              }}
              placeholder={connectionsLoading ? "Loading..." : "Select connection..."}
              searchPlaceholder="Search connections..."
              emptyMessage="No connections found."
              loading={connectionsLoading}
            />
          </div>
          {errors.source_connection_id && (
            <p className="text-xs text-red-500 mt-1">{errors.source_connection_id.message}</p>
          )}
        </div>

        {/* File Upload Info - Show for file connections */}
        {sourceConnectionId && isFileUpload && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-neutral-700 text-xs font-medium">
                File Preview
              </Label>
              {sqlQuery && (
                <Button
                  type="button"
                  onClick={onPreview}
                  disabled={isPreviewing || !sourceConnectionId}
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 px-2"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3 w-3" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                File data will be automatically loaded
              </p>
            </div>
          </div>
        )}

        {/* Source Table - Hidden for file uploads and in advanced mode */}
        {sourceConnectionId && !isFileUpload && !isAdvancedMode && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="source_table" className="text-neutral-700 text-xs font-medium">
                Source Table <span className="text-red-500">*</span>
              </Label>
              {sourceTable && sqlQuery && (
                <Button
                  type="button"
                  onClick={onPreview}
                  disabled={isPreviewing || !sourceConnectionId}
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 px-2"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3 w-3" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="mt-1">
              <Combobox
                options={tableOptions}
                value={sourceTable}
                onValueChange={(value) => setSourceTable(value)}
                placeholder="Select a table..."
                searchPlaceholder="Search tables..."
                emptyMessage="No tables found."
                loading={tablesLoading}
              />
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        {sourceConnectionId && !isFileUpload && (
          <div className="flex items-center justify-between pt-2">
            <Label className="text-neutral-700 text-xs font-medium">
              {isAdvancedMode ? 'Advanced Mode' : 'Simple Mode'}
            </Label>
            <button
              type="button"
              onClick={() => {
                setIsAdvancedMode(!isAdvancedMode);
                if (!isAdvancedMode) {
                  // Switching to advanced
                  setSqlManuallyEdited(false);
                } else {
                  // Switching to simple
                  if (sqlManuallyEdited) {
                    setValue('sql_query', '');
                    setSourceTable('');
                  }
                }
              }}
              className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
            >
              {isAdvancedMode ? 'Switch to Simple' : 'Switch to Advanced'}
            </button>
          </div>
        )}

        {/* SQL Editor - Advanced Mode */}
        {isAdvancedMode && sourceConnectionId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-neutral-700 text-xs font-medium">
                SQL Query <span className="text-red-500">*</span>
              </Label>
              {sqlQuery && (
                <Button
                  type="button"
                  onClick={onPreview}
                  disabled={isPreviewing || !sourceConnectionId}
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-xs h-7"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3 w-3" />
                      Run
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="border border-neutral-300 rounded-md overflow-hidden" style={{ height: '200px' }}>
              <Editor
                height="100%"
                language="sql"
                theme="vs-light"
                value={sqlQuery}
                onChange={handleSqlChange}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  readOnly: false,
                  automaticLayout: true,
                  padding: { top: 8, bottom: 8 },
                }}
              />
            </div>
            {errors.sql_query && (
              <p className="text-xs text-red-500 mt-1">{errors.sql_query.message}</p>
            )}
          </div>
        )}

        {/* Entity Columns */}
        {previewData && previewData.columns.length > 0 && (
          <div className="pt-2 border-t border-neutral-200">
            <Label className="text-neutral-700 text-xs font-medium mb-2 block">
              Entity Columns
            </Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="entity_root_id_column" className="text-neutral-600 text-xs">
                  Root ID
                </Label>
                <Combobox
                  options={previewData.columns.map(col => ({
                    label: col,
                    value: col,
                  }))}
                  value={watch('entity_root_id_column') || ''}
                  onValueChange={(value) => setValue('entity_root_id_column', value)}
                  placeholder="Select column..."
                  searchPlaceholder="Search columns..."
                  emptyMessage="No columns found."
                />
              </div>
              <div>
                <Label htmlFor="entity_id_column" className="text-neutral-600 text-xs">
                  Entity ID
                </Label>
                <Combobox
                  options={previewData.columns.map(col => ({
                    label: col,
                    value: col,
                  }))}
                  value={watch('entity_id_column') || ''}
                  onValueChange={(value) => setValue('entity_id_column', value)}
                  placeholder="Select column..."
                  searchPlaceholder="Search columns..."
                  emptyMessage="No columns found."
                />
              </div>
            </div>
          </div>
        )}

        {/* Source Columns List */}
        {previewData && previewData.columns.length > 0 && (
          <div className="pt-2 border-t border-neutral-200">
            <Label className="text-neutral-700 text-xs font-medium mb-2 block">
              Source Columns ({previewData.columns.length})
            </Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {previewData.columns.map((column) => {
                const sampleValue = previewData.rows.length > 0 ? (previewData.rows[0] as Record<string, any>)[column] : undefined;
                return (
                  <div
                    key={column}
                    className="flex items-center justify-between p-2 bg-neutral-50 rounded text-xs border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-grab"
                    draggable
                  >
                    <span className="font-medium text-neutral-900">{column}</span>
                    {sampleValue && (
                      <span className="text-neutral-500 truncate ml-2 max-w-[100px]" title={String(sampleValue)}>
                        {String(sampleValue)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preview Section - Collapsible */}
      {previewData && (
        <div className="border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={() => setPreviewExpanded(!previewExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-neutral-100 transition-colors"
          >
            <span className="text-xs font-medium text-neutral-700">Preview Data</span>
            {previewExpanded ? (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            )}
          </button>
          {previewExpanded && (
            <div className="p-3 pt-0 max-h-64 overflow-auto">
              <SqlPreviewTable
                columns={previewData.columns}
                rows={previewData.rows.slice(0, 5)}
                loading={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
