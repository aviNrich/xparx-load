import { useReducer, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { SchemaConfiguration, ColumnMapping } from '@/types/mapping';
import { TableSchema } from '@/types/schema';
import { mappingAPI, columnMappingAPI } from '@/services/api';
import { useConnections } from '@/hooks/useConnections';
import { useTables } from '@/hooks/useTables';
import { useSchemas } from '@/hooks/useSchemas';
import { useSqlPreview } from '@/hooks/useSqlPreview';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Stepper, Step } from '@/components/ui/stepper';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { SqlEditor } from './components/SqlEditor';
import { ColumnMappingEditor } from './components/ColumnMappingEditor';

// --- Wizard State ---
interface WizardState {
  step: number;
  name: string;
  description: string;
  source_connection_id: string;
  sql_query: string;
  entity_root_id_column: string;
  entity_id_column: string;
  previewColumns: string[];
  previewRows: any[][];
  targetSchemas: SchemaConfiguration[];
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_FIELD'; field: keyof WizardState; value: any }
  | { type: 'SET_PREVIEW'; columns: string[]; rows: any[][] }
  | { type: 'SET_TARGET_SCHEMAS'; schemas: SchemaConfiguration[] }
  | { type: 'UPDATE_SCHEMA_MAPPINGS'; schemaId: string; mappings: ColumnMapping[] };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_PREVIEW':
      return { ...state, previewColumns: action.columns, previewRows: action.rows };
    case 'SET_TARGET_SCHEMAS':
      return { ...state, targetSchemas: action.schemas };
    case 'UPDATE_SCHEMA_MAPPINGS':
      return {
        ...state,
        targetSchemas: state.targetSchemas.map((ts) =>
          ts.schema_id === action.schemaId
            ? { ...ts, column_mappings: action.mappings }
            : ts
        ),
      };
    default:
      return state;
  }
}

const initialState: WizardState = {
  step: 1,
  name: '',
  description: '',
  source_connection_id: '',
  sql_query: '',
  entity_root_id_column: '',
  entity_id_column: '',
  previewColumns: [],
  previewRows: [],
  targetSchemas: [],
};

const STEPS: Step[] = [
  { id: 'source', label: 'Source', description: 'Name & connection' },
  { id: 'query', label: 'Query', description: 'SQL & preview' },
  { id: 'column-mapping', label: 'Column Mapping', description: 'Map columns' },
  { id: 'review', label: 'Review', description: 'Confirm & create' },
];

export function MappingCreatePage() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { connections, loading: connectionsLoading } = useConnections();
  const { tables, loading: tablesLoading } = useTables(state.source_connection_id || null);
  const { schemas } = useSchemas();
  const { preview, loading: previewLoading, error: previewError, runPreview } = useSqlPreview();
  const [creating, setCreating] = useReducer((_: boolean, v: boolean) => v, false);

  // Connection options for Combobox
  const connectionOptions = useMemo(() => {
    return connections
      .filter((c) => !c.archived)
      .map((c) => ({ value: c._id, label: c.name }));
  }, [connections]);

  // Available schemas (non-archived)
  const availableSchemas = useMemo(() => {
    return schemas.filter((s) => !s.archived);
  }, [schemas]);

  // Selected schema objects
  const selectedSchemaObjects = useMemo(() => {
    return state.targetSchemas
      .map((ts) => availableSchemas.find((s) => s._id === ts.schema_id))
      .filter(Boolean) as TableSchema[];
  }, [state.targetSchemas, availableSchemas]);

  // Preview columns for selects
  const columnOptions = state.previewColumns.length > 0 ? state.previewColumns : (preview?.columns || []);

  const setField = (field: keyof WizardState, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const goNext = () => dispatch({ type: 'SET_STEP', step: Math.min(state.step + 1, 4) });
  const goPrev = () => dispatch({ type: 'SET_STEP', step: Math.max(state.step - 1, 1) });

  // Validation per step
  const canGoNext = useMemo(() => {
    switch (state.step) {
      case 1:
        return state.name.trim() !== '' && state.source_connection_id !== '';
      case 2:
        return state.sql_query.trim() !== '' && columnOptions.length > 0;
      case 3:
        return state.targetSchemas.length > 0;
      default:
        return true;
    }
  }, [state.step, state.name, state.source_connection_id, state.sql_query, columnOptions, state.targetSchemas]);

  const handlePreview = async () => {
    if (!state.source_connection_id || !state.sql_query.trim()) return;
    await runPreview(state.source_connection_id, state.sql_query);
  };

  // When preview changes, store columns
  useMemo(() => {
    if (preview) {
      dispatch({ type: 'SET_PREVIEW', columns: preview.columns, rows: preview.rows });
    }
  }, [preview]);

  const handleTableClick = (tableName: string) => {
    setField('sql_query', `SELECT * FROM ${tableName}`);
  };

  const toggleSchema = (schemaId: string) => {
    const exists = state.targetSchemas.find((ts) => ts.schema_id === schemaId);
    if (exists) {
      dispatch({
        type: 'SET_TARGET_SCHEMAS',
        schemas: state.targetSchemas.filter((ts) => ts.schema_id !== schemaId),
      });
    } else {
      dispatch({
        type: 'SET_TARGET_SCHEMAS',
        schemas: [...state.targetSchemas, { schema_id: schemaId, column_mappings: [] }],
      });
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Create the mapping
      const mapping = await mappingAPI.create({
        name: state.name,
        description: state.description || undefined,
        source_connection_id: state.source_connection_id,
        sql_query: state.sql_query,
        entity_root_id_column: state.entity_root_id_column || undefined,
        entity_id_column: state.entity_id_column || undefined,
      });

      // Create column mapping configuration if there are target schemas
      if (state.targetSchemas.length > 0) {
        await columnMappingAPI.create({
          mapping_id: mapping._id,
          target_schemas: state.targetSchemas,
        });
      }

      toast.success(`Mapping "${mapping.name}" created successfully`);
      navigate(`/mappings/${mapping._id}`);
    } catch (err: any) {
      toast.error(`Failed to create mapping: ${err.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Mapping"
        description="Configure a new ETL data mapping"
        breadcrumbs={[
          { label: 'Mappings', href: '/mappings' },
          { label: 'Create Mapping' },
        ]}
      />

      {/* Stepper */}
      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={state.step} />
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto">
        {state.step === 1 && (
          <StepSource
            name={state.name}
            description={state.description}
            connectionId={state.source_connection_id}
            connectionOptions={connectionOptions}
            connectionsLoading={connectionsLoading}
            tables={tables}
            tablesLoading={tablesLoading}
            onNameChange={(v) => setField('name', v)}
            onDescriptionChange={(v) => setField('description', v)}
            onConnectionChange={(v) => setField('source_connection_id', v)}
            onTableClick={handleTableClick}
          />
        )}

        {state.step === 2 && (
          <StepQuery
            sqlQuery={state.sql_query}
            onSqlChange={(v) => setField('sql_query', v)}
            onPreview={handlePreview}
            previewLoading={previewLoading}
            previewError={previewError}
            previewColumns={columnOptions}
            previewRows={state.previewRows}
            entityRootIdColumn={state.entity_root_id_column}
            entityIdColumn={state.entity_id_column}
            onEntityRootIdColumnChange={(v) => setField('entity_root_id_column', v)}
            onEntityIdColumnChange={(v) => setField('entity_id_column', v)}
          />
        )}

        {state.step === 3 && (
          <StepColumnMapping
            availableSchemas={availableSchemas}
            targetSchemas={state.targetSchemas}
            selectedSchemaObjects={selectedSchemaObjects}
            sourceColumns={columnOptions}
            onToggleSchema={toggleSchema}
            onUpdateMappings={(schemaId, mappings) =>
              dispatch({ type: 'UPDATE_SCHEMA_MAPPINGS', schemaId, mappings })
            }
          />
        )}

        {state.step === 4 && (
          <StepReview
            state={state}
            selectedSchemaObjects={selectedSchemaObjects}
            connections={connections}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={state.step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          {state.step < 4 ? (
            <Button onClick={goNext} disabled={!canGoNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Create Mapping
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

// ====== Step 1: Source ======
interface StepSourceProps {
  name: string;
  description: string;
  connectionId: string;
  connectionOptions: { value: string; label: string }[];
  connectionsLoading: boolean;
  tables: { table_name: string; row_count?: number }[];
  tablesLoading: boolean;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onConnectionChange: (v: string) => void;
  onTableClick: (tableName: string) => void;
}

function StepSource({
  name,
  description,
  connectionId,
  connectionOptions,
  connectionsLoading,
  tables,
  tablesLoading,
  onNameChange,
  onDescriptionChange,
  onConnectionChange,
  onTableClick,
}: StepSourceProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mapping Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">
              Name <span className="text-error-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter mapping name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">Description</Label>
            <Input
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">
              Connection <span className="text-error-500">*</span>
            </Label>
            <Combobox
              options={connectionOptions}
              value={connectionId}
              onValueChange={onConnectionChange}
              placeholder="Select a connection..."
              searchPlaceholder="Search connections..."
              loading={connectionsLoading}
            />
          </div>

          {/* Tables list */}
          {connectionId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Available Tables</Label>
              {tablesLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading tables...
                </div>
              ) : tables.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2">No tables found for this connection.</p>
              ) : (
                <div className="border border-neutral-200 rounded-lg max-h-60 overflow-y-auto">
                  {tables.map((table) => (
                    <button
                      key={table.table_name}
                      type="button"
                      onClick={() => onTableClick(table.table_name)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors flex items-center justify-between border-b border-neutral-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-neutral-400" />
                        <span className="font-mono text-neutral-700">{table.table_name}</span>
                      </div>
                      {table.row_count != null && (
                        <span className="text-xs text-neutral-400">
                          ~{table.row_count.toLocaleString()} rows
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ====== Step 2: Query ======
interface StepQueryProps {
  sqlQuery: string;
  onSqlChange: (v: string) => void;
  onPreview: () => void;
  previewLoading: boolean;
  previewError: string | null;
  previewColumns: string[];
  previewRows: any[][];
  entityRootIdColumn: string;
  entityIdColumn: string;
  onEntityRootIdColumnChange: (v: string) => void;
  onEntityIdColumnChange: (v: string) => void;
}

function StepQuery({
  sqlQuery,
  onSqlChange,
  onPreview,
  previewLoading,
  previewError,
  previewColumns,
  previewRows,
  entityRootIdColumn,
  entityIdColumn,
  onEntityRootIdColumnChange,
  onEntityIdColumnChange,
}: StepQueryProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SQL Query</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              disabled={previewLoading || !sqlQuery.trim()}
            >
              {previewLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SqlEditor value={sqlQuery} onChange={onSqlChange} height="200px" />

          {previewError && (
            <div className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg p-3">
              {previewError}
            </div>
          )}

          {/* Preview results */}
          {previewColumns.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">
                Preview Results ({previewRows.length} rows shown)
              </Label>
              <div className="border border-neutral-200 rounded-lg overflow-x-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewColumns.map((col) => (
                        <TableHead key={col} className="text-xs whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                            {cell != null ? String(cell) : <span className="text-neutral-300">null</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entity columns */}
      {previewColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entity Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">Entity Root ID Column</Label>
                <Select
                  value={entityRootIdColumn || undefined}
                  onValueChange={onEntityRootIdColumnChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {previewColumns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">Entity ID Column</Label>
                <Select
                  value={entityIdColumn || undefined}
                  onValueChange={onEntityIdColumnChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {previewColumns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ====== Step 3: Column Mapping ======
interface StepColumnMappingProps {
  availableSchemas: TableSchema[];
  targetSchemas: SchemaConfiguration[];
  selectedSchemaObjects: TableSchema[];
  sourceColumns: string[];
  onToggleSchema: (schemaId: string) => void;
  onUpdateMappings: (schemaId: string, mappings: ColumnMapping[]) => void;
}

function StepColumnMapping({
  availableSchemas,
  targetSchemas,
  selectedSchemaObjects,
  sourceColumns,
  onToggleSchema,
  onUpdateMappings,
}: StepColumnMappingProps) {
  return (
    <div className="space-y-6">
      {/* Schema selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target Schemas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-3">
            Select the target schemas for this mapping.
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSchemas.map((schema) => {
              const isSelected = targetSchemas.some((ts) => ts.schema_id === schema._id);
              return (
                <button
                  key={schema._id}
                  type="button"
                  onClick={() => onToggleSchema(schema._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {schema.name}
                </button>
              );
            })}
          </div>
          {availableSchemas.length === 0 && (
            <p className="text-sm text-neutral-500">No schemas available. Create a schema first.</p>
          )}
        </CardContent>
      </Card>

      {/* Column mapping editors per schema */}
      {selectedSchemaObjects.map((schema) => {
        const schemaConfig = targetSchemas.find((ts) => ts.schema_id === schema._id);
        if (!schemaConfig) return null;
        return (
          <Card key={schema._id}>
            <CardContent className="pt-6">
              <ColumnMappingEditor
                sourceColumns={sourceColumns}
                schema={schema}
                mappings={schemaConfig.column_mappings}
                onChange={(mappings) => onUpdateMappings(schema._id, mappings)}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ====== Step 4: Review ======
interface StepReviewProps {
  state: WizardState;
  selectedSchemaObjects: TableSchema[];
  connections: { _id: string; name: string }[];
}

function StepReview({ state, selectedSchemaObjects, connections }: StepReviewProps) {
  const connectionName = connections.find((c) => c._id === state.source_connection_id)?.name || 'Unknown';
  const totalMappings = state.targetSchemas.reduce((acc, ts) => acc + ts.column_mappings.length, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Mapping Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-neutral-500">Name</Label>
              <p className="text-sm font-medium text-neutral-900">{state.name}</p>
            </div>
            {state.description && (
              <div>
                <Label className="text-xs text-neutral-500">Description</Label>
                <p className="text-sm text-neutral-700">{state.description}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-neutral-500">Source Connection</Label>
              <p className="text-sm font-medium text-neutral-900">{connectionName}</p>
            </div>
            {state.entity_root_id_column && (
              <div>
                <Label className="text-xs text-neutral-500">Entity Root ID Column</Label>
                <p className="text-sm font-mono text-neutral-700">{state.entity_root_id_column}</p>
              </div>
            )}
            {state.entity_id_column && (
              <div>
                <Label className="text-xs text-neutral-500">Entity ID Column</Label>
                <p className="text-sm font-mono text-neutral-700">{state.entity_id_column}</p>
              </div>
            )}
          </div>

          {/* SQL */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">SQL Query</Label>
            <div className="font-mono text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 border border-neutral-200 whitespace-pre-wrap">
              {state.sql_query}
            </div>
          </div>

          {/* Target schemas summary */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">Target Schemas</Label>
            <div className="flex flex-wrap gap-2">
              {selectedSchemaObjects.map((schema) => {
                const config = state.targetSchemas.find((ts) => ts.schema_id === schema._id);
                return (
                  <span
                    key={schema._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                  >
                    {schema.name}
                    <span className="text-primary-400">
                      ({config?.column_mappings.length || 0} mappings)
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="text-sm text-neutral-700">
              <span className="font-medium">{totalMappings}</span> column mapping(s) across{' '}
              <span className="font-medium">{state.targetSchemas.length}</span> target schema(s)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
