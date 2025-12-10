import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Stepper, Step } from '../components/ui/stepper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, Save } from 'lucide-react';
import { mappingAPI, columnMappingAPI } from '../services/api';
import { schemaAPI } from '../services/api';
import { Mapping, SqlPreviewResponse, ColumnMapping, ColumnMappingConfiguration } from '../types/mapping';
import { TableSchema } from '../types/schema';
import { ColumnMappingList } from '../components/mappings/ColumnMappingList';

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
  {
    id: 'scheduling',
    label: 'Schedule & Execute',
    description: 'Configure execution schedule',
  },
];

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
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>('');
  const [selectedSchema, setSelectedSchema] = useState<TableSchema | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [existingConfigId, setExistingConfigId] = useState<string | undefined>();

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
            setSelectedSchemaId(existingConfig.target_schema_id);
            setColumnMappings(existingConfig.column_mappings);

            // Load the selected schema
            const schema = await schemaAPI.get(existingConfig.target_schema_id);
            setSelectedSchema(schema);
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

  // Handle schema selection
  const handleSchemaSelect = async (schemaId: string) => {
    try {
      setSelectedSchemaId(schemaId);
      const schema = await schemaAPI.get(schemaId);
      setSelectedSchema(schema);
      // Reset mappings when schema changes
      setColumnMappings([]);
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!mappingId || !selectedSchemaId || !selectedSchema) {
      setError('Please select a target schema');
      return;
    }

    // Validate that all mappings have required fields
    const invalid = columnMappings.some((mapping) => {
      if (mapping.type === 'direct') {
        return !mapping.source_column || !mapping.target_field;
      } else if (mapping.type === 'split') {
        // Filter out empty strings before validation
        const validTargetFields = mapping.target_fields.filter(f => f && f.trim() !== '');
        return (
          !mapping.source_column ||
          !mapping.delimiter ||
          validTargetFields.length === 0
        );
      } else if (mapping.type === 'join') {
        // Filter out empty strings before validation
        const validSourceColumns = mapping.source_columns.filter(c => c && c.trim() !== '');
        return (
          validSourceColumns.length < 2 ||
          !mapping.target_field
        );
      }
      return false;
    });

    if (invalid) {
      // Build specific error message
      const invalidMappings = columnMappings
        .map((mapping, index) => {
          if (mapping.type === 'direct') {
            if (!mapping.source_column) return `Mapping ${index + 1} (Direct): Select a source column`;
            if (!mapping.target_field) return `Mapping ${index + 1} (Direct): Select a target field`;
          } else if (mapping.type === 'split') {
            const validFields = mapping.target_fields.filter(f => f && f.trim() !== '');
            if (!mapping.source_column) return `Mapping ${index + 1} (Split): Select a source column`;
            if (!mapping.delimiter) return `Mapping ${index + 1} (Split): Select a delimiter`;
            if (validFields.length === 0) return `Mapping ${index + 1} (Split): Add at least one target field`;
          } else if (mapping.type === 'join') {
            const validColumns = mapping.source_columns.filter(c => c && c.trim() !== '');
            if (validColumns.length < 2) return `Mapping ${index + 1} (Join): Add at least 2 source columns`;
            if (!mapping.target_field) return `Mapping ${index + 1} (Join): Select a target field`;
          }
          return null;
        })
        .filter(Boolean);

      const errorMsg = invalidMappings.length > 0
        ? invalidMappings.join('; ')
        : 'Please complete all mapping fields before saving';

      setError(errorMsg);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Clean up empty strings from mappings before saving
      const cleanedMappings = columnMappings.map((mapping) => {
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

      const config: Omit<ColumnMappingConfiguration, '_id' | 'created_at' | 'updated_at'> = {
        mapping_id: mappingId,
        target_schema_id: selectedSchemaId,
        column_mappings: cleanedMappings,
      };

      if (existingConfigId) {
        // Update existing config
        await columnMappingAPI.update(config);
      } else {
        // Create new config
        const created = await columnMappingAPI.create(config);
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
      {/* Header - Fixed */}
      <div className="bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Column Mapping</h1>
                {mapping && (
                  <p className="text-xs text-neutral-500">
                    Mapping: {mapping.name}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/mappings')}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedSchemaId || columnMappings.length === 0}
                size="sm"
                className="bg-primary-500 hover:bg-primary-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    Next: Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stepper - Full Width Below Header */}
        <div className="px-6 pb-4">
          <Stepper steps={WIZARD_STEPS} currentStep={2} />
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
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
              {/* Target Schema Selection */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Select Target Schema
                </h2>
                <div className="max-w-md">
                  <Label className="text-sm text-neutral-700">
                    Target Schema <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedSchemaId} onValueChange={handleSchemaSelect}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a target schema...">
                        {selectedSchema && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedSchema.name}</span>
                            <span className="text-xs text-neutral-500">
                              {selectedSchema.fields.length} fields
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {schemas.map((schema) => (
                        <SelectItem key={schema._id} value={schema._id}>
                          {schema.name}
                          {schema.description && (
                            <span className="text-xs text-neutral-500 ml-2">
                              - {schema.description}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSchema && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <p className="text-sm font-medium text-neutral-700 mb-2">
                      Schema Fields ({selectedSchema.fields.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSchema.fields.map((field) => (
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
                )}
              </div>

              {/* Column Mappings */}
              {selectedSchema && previewData && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <ColumnMappingList
                    mappings={columnMappings}
                    sourceColumns={previewData.columns}
                    targetFields={selectedSchema.fields}
                    sampleData={previewData.rows}
                    onChange={setColumnMappings}
                  />
                </div>
              )}

              {!selectedSchemaId && (
                <div className="text-center py-12">
                  <p className="text-neutral-600">
                    Please select a target schema to start mapping columns
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
