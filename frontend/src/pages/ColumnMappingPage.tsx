import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Combobox } from '../components/ui/combobox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { MappingWizardHeader } from '../components/mappings/MappingWizardHeader';
import { ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';
import { mappingAPI, columnMappingAPI } from '../services/api';
import { schemaAPI } from '../services/api';
import { Mapping, SqlPreviewResponse, ColumnMapping, ColumnMappingConfiguration, SchemaConfiguration } from '../types/mapping';
import { TableSchema } from '../types/schema';
import { ColumnMappingList } from '../components/mappings/ColumnMappingList';
import { ColumnMappingDragDrop } from '../components/mappings/ColumnMappingDragDrop';

export function ColumnMappingPage() {
  const navigate = useNavigate();
  const { mappingId } = useParams<{ mappingId: string }>();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [previewData, setPreviewData] = useState<SqlPreviewResponse | null>(null);
  const [schemas, setSchemas] = useState<TableSchema[]>([]);

  // NEW: Multi-schema support
  interface SchemaConfigState {
    schema_id: string;
    schema: TableSchema;
    column_mappings: ColumnMapping[];
  }
  const [schemaConfigs, setSchemaConfigs] = useState<SchemaConfigState[]>([]);
  const [activeSchemaIndex, setActiveSchemaIndex] = useState<number>(0);
  const [existingConfigId, setExistingConfigId] = useState<string | undefined>();

  // Mode toggle: 'dragdrop' or 'form'
  const [viewMode, setViewMode] = useState<'dragdrop' | 'form'>('dragdrop');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!mappingId) {
        setError('Mapping ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load mapping
        const mappingData = await mappingAPI.get(mappingId);
        setMapping(mappingData);

        // Load SQL preview to get source columns
        const preview = await mappingAPI.previewSql({
          connection_id: mappingData.source_connection_id,
          sql_query: mappingData.sql_query,
        });
        setPreviewData(preview);

        // Load available schemas
        const schemasData = await schemaAPI.list();
        setSchemas(schemasData);

        // Try to load existing column mapping config
        try {
          const existingConfig = await columnMappingAPI.get(mappingId);
          if (existingConfig) {
            setExistingConfigId(existingConfig._id);

            // Load all schemas for the configs
            const loadedConfigs: SchemaConfigState[] = [];
            for (const config of existingConfig.target_schemas) {
              try {
                const schema = await schemaAPI.get(config.schema_id);
                loadedConfigs.push({
                  schema_id: config.schema_id,
                  schema: schema,
                  column_mappings: config.column_mappings
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
          // Ignore 404 errors - it just means no config exists yet
          if (err.response?.status !== 404) {
            throw err;
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mappingId]);

  // Handle adding a new schema
  const handleAddSchema = async (schemaId: string) => {
    try {
      // Check if schema already added
      if (schemaConfigs.some(config => config.schema_id === schemaId)) {
        setError('This schema has already been added');
        return;
      }

      const schema = await schemaAPI.get(schemaId);
      const newConfig: SchemaConfigState = {
        schema_id: schemaId,
        schema: schema,
        column_mappings: []
      };

      setSchemaConfigs([...schemaConfigs, newConfig]);
      setActiveSchemaIndex(schemaConfigs.length);
      setError(null);
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
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

  // Handle updating mappings for active schema
  const handleMappingsChange = (mappings: ColumnMapping[]) => {
    const newConfigs = [...schemaConfigs];
    newConfigs[activeSchemaIndex].column_mappings = mappings;
    setSchemaConfigs(newConfigs);

    // If split/join mappings are added, force form mode
    const hasAdvancedMappings = mappings.some(m => m.type === 'split' || m.type === 'join');
    if (hasAdvancedMappings && viewMode === 'dragdrop') {
      setViewMode('form');
    }
  };

  // Handle save - ALWAYS saves in NEW format
  const handleSave = async () => {
    if (!mappingId) {
      setError('Mapping ID is required');
      return;
    }

    if (schemaConfigs.length === 0) {
      setError('Please add at least one target schema');
      return;
    }

    // Validate all schema configs
    for (let i = 0; i < schemaConfigs.length; i++) {
      const config = schemaConfigs[i];
      const mappings = config.column_mappings;

      // Validate that all mappings have required fields
      for (let j = 0; j < mappings.length; j++) {
        const mapping = mappings[j];
        if (mapping.type === 'direct') {
          if (!mapping.source_column || !mapping.target_field) {
            setError(`Schema "${config.schema.name}" - Mapping ${j + 1}: incomplete direct mapping`);
            setActiveSchemaIndex(i);
            return;
          }
        } else if (mapping.type === 'split') {
          const validTargetFields = mapping.target_fields.filter(f => f && f.trim() !== '');
          if (!mapping.source_column || !mapping.delimiter || validTargetFields.length === 0) {
            setError(`Schema "${config.schema.name}" - Mapping ${j + 1}: incomplete split mapping`);
            setActiveSchemaIndex(i);
            return;
          }
        } else if (mapping.type === 'join') {
          const validSourceColumns = mapping.source_columns.filter(c => c && c.trim() !== '');
          if (validSourceColumns.length < 2 || !mapping.target_field) {
            setError(`Schema "${config.schema.name}" - Mapping ${j + 1}: incomplete join mapping`);
            setActiveSchemaIndex(i);
            return;
          }
        }
      }
    }

    try {
      setSaving(true);
      setError(null);

      // Build NEW format config
      const target_schemas: SchemaConfiguration[] = schemaConfigs.map(config => {
        // Clean up empty strings from mappings
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
          column_mappings: cleanedMappings
        };
      });

      const newConfig: Omit<ColumnMappingConfiguration, '_id' | 'created_at' | 'updated_at'> = {
        mapping_id: mappingId,
        target_schemas: target_schemas,
      };

      if (existingConfigId) {
        // Update existing config
        await columnMappingAPI.update(newConfig);
      } else {
        // Create new config
        const created = await columnMappingAPI.create(newConfig);
        setExistingConfigId(created._id);
      }

      // Navigate to scheduling page (Step 3)
      navigate(`/mappings/${mappingId}/schedule`);
    } catch (err) {
      console.error('Failed to save column mapping:', err);
      setError(err instanceof Error ? err.message : 'Failed to save column mapping');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (mappingId) {
      navigate(`/mappings/${mappingId}`);
    } else {
      navigate('/mappings');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header - Fixed with better visual hierarchy */}
      <MappingWizardHeader
        title="Column Mapping"
        description={mapping ? "Step 2: Map source columns to target ontology fields" : "Loading..."}
        currentStep={2}
        onBack={handleBack}
      />

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
                <p className="text-neutral-600">Loading mapping data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show error message but keep form visible */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {/* Add New Schema Section */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Add Ontology
                  </h2>

                  {/* Mode Toggle */}
                  {schemaConfigs.length > 0 && (
                    <>
                      {(() => {
                        const hasAdvancedMappings = schemaConfigs[activeSchemaIndex]?.column_mappings.some(
                          m => m.type === 'split' || m.type === 'join'
                        );
                        return (
                          <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                            <button
                              onClick={() => !hasAdvancedMappings && setViewMode('dragdrop')}
                              disabled={hasAdvancedMappings}
                              title={hasAdvancedMappings ? 'Drag & Drop mode does not support split/join mappings' : ''}
                              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                viewMode === 'dragdrop'
                                  ? 'bg-white text-primary-600 shadow-sm'
                                  : hasAdvancedMappings
                                  ? 'text-neutral-400 cursor-not-allowed'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              Drag & Drop
                            </button>
                            <button
                              onClick={() => setViewMode('form')}
                              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                viewMode === 'form'
                                  ? 'bg-white text-primary-600 shadow-sm'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              Form
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                <div className="flex gap-3 items-end max-w-md">
                  <div className="flex-1">
                    <Combobox
                      options={schemas
                        .filter(s => !schemaConfigs.some(c => c.schema_id === s._id))
                        .map((schema) => ({
                          label: schema.description
                            ? `${schema.name} - ${schema.description}`
                            : schema.name,
                          value: schema._id,
                        }))}
                      value=""
                      onValueChange={handleAddSchema}
                      placeholder="Select a target schema to add..."
                      searchPlaceholder="Search schemas..."
                      emptyMessage="No schemas available."
                    />
                  </div>
                </div>
              </div>

              {/* Schema Tabs */}
              {schemaConfigs.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200">
                  {/* Tab Headers */}
                  <div className="flex border-b border-neutral-200 overflow-x-auto">
                    {schemaConfigs.map((config, index) => (
                      <button
                        key={config.schema_id}
                        onClick={() => setActiveSchemaIndex(index)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                          activeSchemaIndex === index
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        <span>{config.schema.name}</span>
                        <span className="text-xs text-neutral-500">
                          ({config.column_mappings.length} mappings)
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSchema(index);
                          }}
                          className="ml-1 p-0.5 hover:bg-neutral-200 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </button>
                    ))}
                  </div>

                  {/* Active Tab Content */}
                  {schemaConfigs[activeSchemaIndex] && previewData && (
                    <div className="p-6">
                      {viewMode === 'form' ? (
                        <>
                          {/* Schema Info */}
                          <div className="mb-6 pb-4 border-b border-neutral-200">
                            <p className="text-sm font-medium text-neutral-700 mb-2">
                              Schema Fields ({schemaConfigs[activeSchemaIndex].schema.fields.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {schemaConfigs[activeSchemaIndex].schema.fields.map((field) => (
                                <div
                                  key={field.name}
                                  className="bg-neutral-100 rounded px-2 py-1 text-xs"
                                >
                                  <span className="font-medium text-neutral-900">{field.name}</span>
                                  <span className="text-neutral-600"> ({field.field_type})</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column Mappings - Form View */}
                          <ColumnMappingList
                            mappings={schemaConfigs[activeSchemaIndex].column_mappings}
                            sourceColumns={previewData.columns}
                            targetFields={schemaConfigs[activeSchemaIndex].schema.fields}
                            sampleData={previewData.rows}
                            onChange={handleMappingsChange}
                          />
                        </>
                      ) : (
                        /* Drag & Drop View */
                        <div style={{ height: 'calc(100vh - 500px)', minHeight: '500px' }}>
                          <ColumnMappingDragDrop
                            mappings={schemaConfigs[activeSchemaIndex].column_mappings}
                            sourceColumns={previewData.columns}
                            targetFields={schemaConfigs[activeSchemaIndex].schema.fields}
                            sampleData={previewData.rows}
                            onChange={handleMappingsChange}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {schemaConfigs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-neutral-600">
                    Please add a target schema to start mapping columns
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="default"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous: Source Preview
          </Button>

          <div className="flex items-center gap-3">
            <Button
              asChild
              type="button"
              variant="outline"
              size="default"
            >
              <Link to="/mappings">
                Cancel
              </Link>
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || schemaConfigs.length === 0}
              size="default"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next: Schedule & Execute
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
