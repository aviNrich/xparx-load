import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Stepper, Step } from '../components/ui/stepper';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { EntityColumnSelectionDialog } from '../components/mappings/EntityColumnSelectionDialog';
import { ArrowLeft, Loader2, AlertCircle, Play } from 'lucide-react';

const mappingSchema = z.object({
  name: z.string().min(1, 'Mapping name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  source_connection_id: z.string().min(1, 'Source connection is required'),
  sql_query: z.string().min(1, 'SQL query is required'),
});

const WIZARD_STEPS: Step[] = [
  {
    id: 'source-preview',
    label: 'Source Preview',
    description: 'Configure source and preview data',
  },
  {
    id: 'column-mapping',
    label: 'Column Mapping',
    description: 'Map source to target columns',
  },
];

export function NewMappingPage() {
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!mappingId; // If we have a mappingId, this is edit mode
  const sourceFromQuery = searchParams.get('source');

  const { connections, loading: connectionsLoading } = useConnections();
  const [previewData, setPreviewData] = useState<SqlPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sqlManuallyEdited, setSqlManuallyEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingTableSelection, setPendingTableSelection] = useState<TableInfo | null>(null);
  const [sourceTable, setSourceTable] = useState('');
  const [entityColumnDialogOpen, setEntityColumnDialogOpen] = useState(false);
  const [existingEntityRootIdColumn, setExistingEntityRootIdColumn] = useState<string | undefined>(undefined);
  const [existingEntityIdColumn, setExistingEntityIdColumn] = useState<string | undefined>(undefined);

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
      source_connection_id: sourceFromQuery || '',
      sql_query: '',
    },
  });

  const sourceConnectionId = watch('source_connection_id');
  const sqlQuery = watch('sql_query');

  const { tables, loading: tablesLoading } = useTables(sourceConnectionId || null);

  // Get the selected connection to check if it's a file upload
  const selectedConnection = connections.find((conn) => conn._id === sourceConnectionId);
  const isFileUpload = selectedConnection?.db_type === 'file';

  // Set default query for file uploads
  useEffect(() => {
    // Skip in edit mode
    if (isEditMode) return;

    if (isFileUpload && sourceConnectionId) {
      // Only set if query is empty or hasn't been manually edited
      if (!sqlManuallyEdited && (!sqlQuery || sqlQuery.trim() === '')) {
        setValue('sql_query', 'select * from file');
        setPreviewData(null);
        setPreviewError(null);
      }
    }
  }, [isFileUpload, sourceConnectionId, isEditMode, sqlManuallyEdited, sqlQuery, setValue]);

  // Load existing mapping if mappingId is provided
  useEffect(() => {
    if (mappingId) {
      setIsLoading(true);
      mappingAPI.get(mappingId)
        .then(async (mapping) => {
          // Populate form with existing data
          setValue('name', mapping.name);
          setValue('description', mapping.description || '');
          setValue('source_connection_id', mapping.source_connection_id);
          setValue('sql_query', mapping.sql_query);

          // Store existing entity columns
          setExistingEntityRootIdColumn(mapping.entity_root_id_column);
          setExistingEntityIdColumn(mapping.entity_id_column);

          // Auto-run preview for readonly view
          setIsPreviewing(true);
          try {
            const result = await mappingAPI.previewSql({
              connection_id: mapping.source_connection_id,
              sql_query: mapping.sql_query,
            });
            setPreviewData(result);
            setPreviewError(null);
          } catch (error) {
            setPreviewError(error instanceof Error ? error.message : 'Failed to preview query');
          } finally {
            setIsPreviewing(false);
          }
        })
        .catch((error) => {
          setPreviewError('Failed to load mapping: ' + (error instanceof Error ? error.message : 'Unknown error'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [mappingId, setValue]);

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
    // Skip this effect in edit mode to avoid overwriting existing query
    if (isEditMode) return;

    if (sourceTable && tables.length > 0) {
      const selectedTable = tables.find((t: TableInfo) => t.table_name === sourceTable);
      if (selectedTable) {
        // Check if user has manually edited the SQL
        if (sqlManuallyEdited && sqlQuery && sqlQuery.trim() !== '') {
          // Show confirmation dialog before overwriting
          setPendingTableSelection(selectedTable);
          setConfirmDialogOpen(true);
        } else {
          generateSqlQuery(selectedTable);
        }
      }
    }
  }, [sourceTable, tables, isEditMode]);

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

  const handleConfirmOverwrite = () => {
    if (pendingTableSelection) {
      generateSqlQuery(pendingTableSelection);
      setSqlManuallyEdited(false);
      setPendingTableSelection(null);
    }
  };

  const handleCancelOverwrite = () => {
    // Revert table selection
    setSourceTable('');
    setPendingTableSelection(null);
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

  const handleEntityColumnSelection = async (entityRootIdColumn: string, entityIdColumn: string) => {
    if (isEditMode && mappingId) {
      // Update existing mapping with all changes including entity columns
      const formData = watch();
      try {
        await mappingAPI.update(mappingId, {
          name: formData.name,
          description: formData.description,
          sql_query: formData.sql_query,
          entity_root_id_column: entityRootIdColumn,
          entity_id_column: entityIdColumn,
        });
        navigate(`/mappings/${mappingId}/columns`);
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : 'Failed to update mapping');
      }
    } else {
      // Create new mapping with entity columns
      const formData = watch();
      if (!formData.name || !formData.source_connection_id || !formData.sql_query) {
        setPreviewError('Please fill in all required fields');
        return;
      }

      setIsSaving(true);
      try {
        const savedMapping = await mappingAPI.create({
          ...formData,
          entity_root_id_column: entityRootIdColumn,
          entity_id_column: entityIdColumn,
        });
        console.log('Mapping saved:', savedMapping);
        navigate(`/mappings/${savedMapping._id}/columns`);
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : 'Failed to save mapping');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNextClick = () => {
    if (!previewData || !previewData.columns || previewData.columns.length === 0) {
      setPreviewError('Please run the query preview first');
      return;
    }

    // Open the entity column selection dialog
    setEntityColumnDialogOpen(true);
  };

  const onSubmit = async (data: MappingFormData) => {
    // This is now handled by handleNextClick and handleEntityColumnSelection
    handleNextClick();
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Link to="/mappings">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  {isEditMode ? 'Edit Mapping' : 'New Mapping'}
                </h1>
                <p className="text-xs text-neutral-500">
                  {isEditMode ? 'Update mapping configuration' : 'Configure your data mapping'}
                </p>
              </div>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <Link to="/mappings">
                      Cancel
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!previewData || isSaving}
                    onClick={async () => {
                      const formData = watch();
                      setIsSaving(true);
                      try {
                        await mappingAPI.update(mappingId!, {
                          name: formData.name,
                          description: formData.description,
                          source_connection_id: formData.source_connection_id,
                          sql_query: formData.sql_query,
                        });
                      } catch (error) {
                        setPreviewError(error instanceof Error ? error.message : 'Failed to update mapping');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-primary-500 hover:bg-primary-600"
                    onClick={handleNextClick}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <Link to="/mappings">
                      Cancel
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={!previewData || isSaving}
                    size="sm"
                    className="bg-primary-500 hover:bg-primary-600"
                    onClick={handleSubmit(onSubmit)}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stepper - Full Width Below Header */}
        <div className="px-6 pb-4">
          <Stepper steps={WIZARD_STEPS} currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
              <p className="text-neutral-600">Loading mapping...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex overflow-hidden">
            {/* Left Column: Configuration Form */}
            <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 mb-4">Configuration</h2>
              </div>

              {/* Mapping Name */}
              <div>
                <Label htmlFor="name" className="text-neutral-700 text-xs">
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
                <Label htmlFor="description" className="text-neutral-700 text-xs">
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
                <Label htmlFor="source_connection_id" className="text-neutral-700 text-xs">
                  Source Connection <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={sourceConnectionId}
                  onValueChange={(value) => {
                    setValue('source_connection_id', value);
                    setSourceTable('');
                    setValue('sql_query', '');
                    setSqlManuallyEdited(false);
                    setPreviewData(null);
                    setPreviewError(null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={connectionsLoading ? "Loading..." : "Select connection"} />
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
                  <p className="text-xs text-red-500 mt-1">{errors.source_connection_id.message}</p>
                )}
              </div>

              {/* Source Table - Hidden for file uploads */}
              {sourceConnectionId && !isFileUpload && (
                <div>
                  <Label htmlFor="source_table" className="text-neutral-700 text-xs">
                    Source Table <span className="text-neutral-400 text-xs">(Optional)</span>
                  </Label>
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

              {/* Preview Error */}
              {previewError && (
                <Alert variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{previewError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Right Column: SQL Editor + Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {sourceConnectionId ? (
              <>
                {/* SQL Editor Section */}
                <div className="flex-shrink-0 bg-white border-b border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-neutral-700 text-xs font-semibold">
                      SQL Query <span className="text-red-500">*</span>
                    </Label>
                    {sqlQuery && (
                      <Button
                        type="button"
                        onClick={handlePreview}
                        disabled={isPreviewing || !sourceConnectionId}
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        {isPreviewing ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Run Query
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="border border-neutral-300 rounded-md overflow-hidden" style={{ height: '280px' }}>
                    <Editor
                      height="100%"
                      language="sql"
                      theme="vs-light"
                      value={sqlQuery}
                      onChange={handleSqlChange}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
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

                {/* Preview Results Section */}
                <div className="flex-1 overflow-hidden bg-neutral-50 p-4">
                  <div className="h-full">
                    {(previewData || isPreviewing) ? (
                      <SqlPreviewTable
                        columns={previewData?.columns || []}
                        rows={previewData?.rows || []}
                        loading={isPreviewing}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-neutral-200 border-dashed">
                        <div className="text-center">
                          <Play className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
                          <p className="text-sm text-neutral-500">Run query to see preview</p>
                          <p className="text-xs text-neutral-400 mt-1">Results will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                  <div className="text-neutral-400 mb-3">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-600 font-medium">Select a connection to begin</p>
                  <p className="text-xs text-neutral-400 mt-1">Configure the mapping settings on the left</p>
                </div>
              </div>
            )}
          </div>
        </form>
        )}
      </div>

      {/* Confirm Dialog for SQL Query Overwrite */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Overwrite SQL Query?"
        description="You have manually edited the SQL query. Do you want to overwrite it with the new table selection?"
        confirmText="Overwrite"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />

      {/* Entity Column Selection Dialog */}
      <EntityColumnSelectionDialog
        open={entityColumnDialogOpen}
        onOpenChange={setEntityColumnDialogOpen}
        columns={previewData?.columns || []}
        existingEntityRootIdColumn={existingEntityRootIdColumn}
        existingEntityIdColumn={existingEntityIdColumn}
        onConfirm={handleEntityColumnSelection}
        onCancel={() => setEntityColumnDialogOpen(false)}
      />
    </div>
  );
}
