import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MappingFormData, SqlPreviewResponse, ColumnMapping, ColumnMappingConfiguration, SchemaConfiguration } from '../types/mapping';
import { TableSchema } from '../types/schema';
import { mappingAPI, columnMappingAPI, schemaAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, Save, Workflow } from 'lucide-react';

// Import new hybrid UI components
import { SourcePanel } from '../components/mappings/hybrid/SourcePanel';
import { MappingCanvas } from '../components/mappings/hybrid/MappingCanvas';
import { TargetSchemaPanel } from '../components/mappings/hybrid/TargetSchemaPanel';

const mappingSchema = z.object({
  name: z.string().min(1, 'Mapping name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  source_connection_id: z.string().min(1, 'Source connection is required'),
  sql_query: z.string().min(1, 'SQL query is required'),
  entity_root_id_column: z.string().optional(),
  entity_id_column: z.string().optional(),
});

interface SchemaConfigState {
  schema_id: string;
  schema: TableSchema;
  column_mappings: ColumnMapping[];
}

export function UnifiedMappingPage() {
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!mappingId;
  const sourceFromQuery = searchParams.get('source');

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<SqlPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Schema & Mapping state
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [schemaConfigs, setSchemaConfigs] = useState<SchemaConfigState[]>([]);
  const [activeSchemaIndex, setActiveSchemaIndex] = useState<number>(0);
  const [existingConfigId, setExistingConfigId] = useState<string | undefined>();

  const {
    register,
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
      entity_root_id_column: '',
      entity_id_column: '',
    },
  });

  const sourceConnectionId = watch('source_connection_id');
  const sqlQuery = watch('sql_query');

  // Set source connection from query parameter
  useEffect(() => {
    if (sourceFromQuery && !isEditMode && !sourceConnectionId) {
      setValue('source_connection_id', sourceFromQuery);
    }
  }, [sourceFromQuery, isEditMode, sourceConnectionId, setValue]);

  // Load existing mapping if editing
  useEffect(() => {
    if (mappingId) {
      setLoading(true);
      Promise.all([
        mappingAPI.get(mappingId),
        schemaAPI.list(),
      ])
        .then(async ([mapping, schemasData]) => {
          // Populate form
          setValue('name', mapping.name);
          setValue('description', mapping.description || '');
          setValue('source_connection_id', mapping.source_connection_id);
          setValue('sql_query', mapping.sql_query);
          setValue('entity_root_id_column', mapping.entity_root_id_column || '');
          setValue('entity_id_column', mapping.entity_id_column || '');

          setSchemas(schemasData);

          // Load preview
          try {
            const preview = await mappingAPI.previewSql({
              connection_id: mapping.source_connection_id,
              sql_query: mapping.sql_query,
            });
            setPreviewData(preview);
          } catch (err: any) {
            console.error('Preview error:', err);
            setError(err?.response?.data?.detail || err?.message || 'Failed to load preview');
          }

          // Load existing column mapping config
          try {
            const existingConfig = await columnMappingAPI.get(mappingId);
            if (existingConfig) {
              setExistingConfigId(existingConfig._id);

              const loadedConfigs: SchemaConfigState[] = [];
              for (const config of existingConfig.target_schemas) {
                try {
                  const schema = await schemaAPI.get(config.schema_id);
                  loadedConfigs.push({
                    schema_id: config.schema_id,
                    schema: schema,
                    column_mappings: config.column_mappings,
                  });
                } catch (err) {
                  console.error(`Failed to load schema ${config.schema_id}:`, err);
                }
              }

              setSchemaConfigs(loadedConfigs);
              if (loadedConfigs.length > 0) {
                setActiveSchemaIndex(0);
              }
            }
          } catch (err: any) {
            // Ignore 404 - no config exists yet
            if (err.response?.status !== 404) {
              throw err;
            }
          }
        })
        .catch((err: any) => {
          setError(err?.response?.data?.detail || err?.message || 'Failed to load mapping');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Load schemas for new mapping
      schemaAPI.list()
        .then(setSchemas)
        .catch((err) => {
          console.error('Failed to load schemas:', err);
        });
    }
  }, [mappingId, setValue]);

  // Handle preview - wrapped in useCallback to prevent infinite loops
  const handlePreview = useCallback(async () => {
    console.log('[UnifiedMappingPage] handlePreview called', { sourceConnectionId, sqlQuery });

    if (!sourceConnectionId || !sqlQuery) {
      console.log('[UnifiedMappingPage] Preview skipped - missing connection or query');
      return;
    }

    console.log('[UnifiedMappingPage] Running preview...');
    setIsPreviewing(true);
    setError(null);
    setPreviewData(null);

    try {
      const result = await mappingAPI.previewSql({
        connection_id: sourceConnectionId,
        sql_query: sqlQuery,
      });
      console.log('[UnifiedMappingPage] Preview successful, columns:', result.columns);
      setPreviewData(result);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to preview query';
      console.error('[UnifiedMappingPage] Preview error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsPreviewing(false);
    }
  }, [sourceConnectionId, sqlQuery]);

  // Handle adding a schema
  const handleAddSchema = async (schemaId: string) => {
    try {
      if (schemaConfigs.some(config => config.schema_id === schemaId)) {
        setError('This schema has already been added');
        return;
      }

      const schema = await schemaAPI.get(schemaId);
      const newConfig: SchemaConfigState = {
        schema_id: schemaId,
        schema: schema,
        column_mappings: [],
      };

      setSchemaConfigs([...schemaConfigs, newConfig]);
      setActiveSchemaIndex(schemaConfigs.length);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load schema');
    }
  };

  // Handle removing a schema
  const handleRemoveSchema = (index: number) => {
    const newConfigs = schemaConfigs.filter((_, i) => i !== index);
    setSchemaConfigs(newConfigs);
    if (activeSchemaIndex >= newConfigs.length) {
      setActiveSchemaIndex(Math.max(0, newConfigs.length - 1));
    }
  };

  // Handle updating mappings
  const handleMappingsChange = (mappings: ColumnMapping[]) => {
    const newConfigs = [...schemaConfigs];
    newConfigs[activeSchemaIndex].column_mappings = mappings;
    setSchemaConfigs(newConfigs);
  };

  // Handle save
  const handleSave = async () => {
    if (!mappingId && schemaConfigs.length === 0) {
      setError('Please add at least one target schema and create mappings');
      return;
    }

    const formData = watch();

    // Validate
    if (!formData.name || !formData.source_connection_id || !formData.sql_query) {
      setError('Please fill in all required fields');
      return;
    }

    if (!previewData || !previewData.columns || previewData.columns.length === 0) {
      setError('Please run the query preview first');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let savedMappingId = mappingId;

      // Create or update mapping
      if (isEditMode && mappingId) {
        await mappingAPI.update(mappingId, {
          name: formData.name,
          description: formData.description,
          sql_query: formData.sql_query,
          entity_root_id_column: formData.entity_root_id_column,
          entity_id_column: formData.entity_id_column,
        });
      } else {
        const savedMapping = await mappingAPI.create({
          name: formData.name,
          description: formData.description,
          source_connection_id: formData.source_connection_id,
          sql_query: formData.sql_query,
          entity_root_id_column: formData.entity_root_id_column,
          entity_id_column: formData.entity_id_column,
        });
        savedMappingId = savedMapping._id;
      }

      // Save column mappings if we have schemas configured
      if (schemaConfigs.length > 0 && savedMappingId) {
        const target_schemas: SchemaConfiguration[] = schemaConfigs.map(config => {
          const cleanedMappings = config.column_mappings.map((mapping) => {
            if (mapping.type === 'split') {
              return {
                ...mapping,
                target_fields: mapping.target_fields.filter(f => f && f.trim() !== '')
              };
            } else if (mapping.type === 'join') {
              return {
                ...mapping,
                source_columns: mapping.source_columns.filter(c => c && c.trim() !== '')
              };
            }
            return mapping;
          });

          return {
            schema_id: config.schema_id,
            column_mappings: cleanedMappings,
          };
        });

        const columnConfig: Omit<ColumnMappingConfiguration, '_id' | 'created_at' | 'updated_at'> = {
          mapping_id: savedMappingId,
          target_schemas: target_schemas,
        };

        if (existingConfigId) {
          await columnMappingAPI.update(columnConfig);
        } else {
          const created = await columnMappingAPI.create(columnConfig);
          setExistingConfigId(created._id);
        }
      }

      // Navigate to mappings list or schedule page
      if (schemaConfigs.length > 0) {
        navigate(`/mappings/${savedMappingId}/schedule`);
      } else {
        navigate('/mappings');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to save mapping';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link to="/mappings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">
                {isEditMode ? 'Edit Mapping' : 'Create New Mapping'}
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Configure source, map columns, and define transformations in one view
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const sourceParam = sourceConnectionId ? `?source=${sourceConnectionId}` : '';
                navigate(isEditMode ? `/mappings/${mappingId}/wizard` : `/mappings/new/wizard${sourceParam}`);
              }}
              className="text-xs"
            >
              <Workflow className="h-3 w-3 mr-1" />
              Switch to Wizard
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate('/mappings')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !previewData}
              size="default"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Mapping
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content - Three Panel Layout */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Loading mapping...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Source Configuration */}
          <SourcePanel
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            previewData={previewData}
            isPreviewing={isPreviewing}
            onPreview={handlePreview}
            isEditMode={isEditMode}
          />

          {/* Center Panel - Mapping Canvas */}
          <MappingCanvas
            mappings={schemaConfigs[activeSchemaIndex]?.column_mappings || []}
            sourceColumns={previewData?.columns || []}
            targetFields={schemaConfigs[activeSchemaIndex]?.schema?.fields || []}
            sampleData={previewData?.rows || []}
            hasPreview={!!previewData}
            onMappingsChange={handleMappingsChange}
          />

          {/* Right Panel - Target Schemas */}
          <TargetSchemaPanel
            schemas={schemas}
            schemaConfigs={schemaConfigs}
            activeSchemaIndex={activeSchemaIndex}
            onAddSchema={handleAddSchema}
            onRemoveSchema={handleRemoveSchema}
            onSelectSchema={setActiveSchemaIndex}
          />
        </div>
      )}
    </div>
  );
}
