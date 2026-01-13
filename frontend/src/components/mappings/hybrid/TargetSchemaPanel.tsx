import { TableSchema } from '../../../types/schema';
import { ColumnMapping } from '../../../types/mapping';
import { Combobox } from '../../ui/combobox';
import { Plus, X, CheckCircle2, Circle } from 'lucide-react';

interface SchemaConfigState {
  schema_id: string;
  schema: TableSchema;
  column_mappings: ColumnMapping[];
}

interface TargetSchemaPanelProps {
  schemas: TableSchema[];
  schemaConfigs: SchemaConfigState[];
  activeSchemaIndex: number;
  onAddSchema: (schemaId: string) => void;
  onRemoveSchema: (index: number) => void;
  onSelectSchema: (index: number) => void;
}

export function TargetSchemaPanel({
  schemas,
  schemaConfigs,
  activeSchemaIndex,
  onAddSchema,
  onRemoveSchema,
  onSelectSchema,
}: TargetSchemaPanelProps) {
  // Get mapped target fields for a schema config
  const getMappedFields = (config: SchemaConfigState): Set<string> => {
    const mapped = new Set<string>();
    config.column_mappings.forEach((mapping) => {
      if (mapping.type === 'direct') {
        mapped.add(mapping.target_field);
      } else if (mapping.type === 'split') {
        mapping.target_fields.forEach(field => {
          if (field && field.trim() !== '') {
            mapped.add(field);
          }
        });
      } else if (mapping.type === 'join') {
        mapped.add(mapping.target_field);
      }
    });
    return mapped;
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-neutral-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-200 p-4">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Target Schemas</h3>

        {/* Add Schema Dropdown */}
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
          onValueChange={onAddSchema}
          placeholder="Add schema..."
          searchPlaceholder="Search schemas..."
          emptyMessage="No schemas available."
        />
      </div>

      {/* Schema List */}
      <div className="flex-1 overflow-y-auto">
        {schemaConfigs.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600">
              Add a target schema to start mapping columns
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {schemaConfigs.map((config, index) => {
              const mappedFields = getMappedFields(config);
              const totalFields = config.schema.fields.length;
              const mappedCount = mappedFields.size;
              const isActive = activeSchemaIndex === index;

              return (
                <div
                  key={config.schema_id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    isActive
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  {/* Schema Header */}
                  <div
                    onClick={() => onSelectSchema(index)}
                    className="p-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          isActive ? 'text-primary-900' : 'text-neutral-900'
                        }`}>
                          {config.schema.name}
                        </h4>
                        {config.schema.description && (
                          <p className={`text-xs truncate mt-0.5 ${
                            isActive ? 'text-primary-700' : 'text-neutral-500'
                          }`}>
                            {config.schema.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSchema(index);
                        }}
                        className="ml-2 p-1 hover:bg-neutral-200 rounded flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-neutral-500" />
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={isActive ? 'text-primary-700' : 'text-neutral-600'}>
                          {mappedCount} of {totalFields} fields mapped
                        </span>
                        <span className={`font-medium ${
                          mappedCount === totalFields
                            ? 'text-green-600'
                            : isActive
                            ? 'text-primary-700'
                            : 'text-neutral-600'
                        }`}>
                          {totalFields > 0 ? Math.round((mappedCount / totalFields) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            mappedCount === totalFields
                              ? 'bg-green-500'
                              : isActive
                              ? 'bg-primary-500'
                              : 'bg-neutral-400'
                          }`}
                          style={{ width: `${totalFields > 0 ? (mappedCount / totalFields) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field List - Only show for active schema */}
                  {isActive && (
                    <div className="border-t border-neutral-200 bg-white">
                      <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
                        <div className="text-xs font-medium text-neutral-700 mb-2">
                          Fields ({totalFields})
                        </div>
                        {config.schema.fields.map((field) => {
                          const isMapped = mappedFields.has(field.name);
                          return (
                            <div
                              key={field.name}
                              className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                                isMapped
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {isMapped ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-neutral-300 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${
                                  isMapped ? 'text-green-900' : 'text-neutral-900'
                                }`}>
                                  {field.name}
                                </div>
                                <div className={`flex items-center gap-1 mt-0.5 ${
                                  isMapped ? 'text-green-700' : 'text-neutral-500'
                                }`}>
                                  <span className="px-1 py-0.5 bg-white rounded">
                                    {field.field_type}
                                  </span>
                                  {field.field_type === 'enum' && field.enum_values && (
                                    <span className="opacity-75">
                                      ({Object.keys(field.enum_values).length} values)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Unmapped Fields Summary */}
                      {mappedCount < totalFields && (
                        <div className="p-2 bg-blue-50 border-t border-blue-200">
                          <p className="text-xs text-blue-700">
                            <span className="font-medium">{totalFields - mappedCount}</span> field
                            {totalFields - mappedCount !== 1 ? 's' : ''} still unmapped
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
