import React from 'react';
import { ColumnMapping, MappingType } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { DirectMappingRow } from './DirectMappingRow';
import { SplitMappingRow } from './SplitMappingRow';
import { JoinMappingRow } from './JoinMappingRow';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ColumnMappingListProps {
  mappings: ColumnMapping[];
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData?: any[][];
  connectionId: string;
  sqlQuery: string;
  onChange: (mappings: ColumnMapping[]) => void;
}

export function ColumnMappingList({
  mappings,
  sourceColumns,
  targetFields,
  sampleData,
  connectionId,
  sqlQuery,
  onChange,
}: ColumnMappingListProps) {
  const handleAddMapping = (type: MappingType) => {
    let newMapping: ColumnMapping;

    switch (type) {
      case 'direct':
        newMapping = {
          type: 'direct',
          source_column: '',
          target_field: '',
        };
        break;
      case 'split':
        newMapping = {
          type: 'split',
          source_column: '',
          delimiter: ',',
          target_fields: [],
        };
        break;
      case 'join':
        newMapping = {
          type: 'join',
          source_columns: [],
          separator: ' ',
          target_field: '',
        };
        break;
    }

    onChange([...mappings, newMapping]);
  };

  const handleUpdateMapping = (index: number, mapping: ColumnMapping) => {
    const newMappings = [...mappings];
    newMappings[index] = mapping;
    onChange(newMappings);
  };

  const handleDeleteMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  // Get unmapped source columns
  const unmappedSourceColumns = React.useMemo(() => {
    const usedColumns = new Set<string>();
    mappings.forEach((mapping) => {
      if (mapping.type === 'direct' || mapping.type === 'split') {
        if (mapping.source_column) {
          usedColumns.add(mapping.source_column);
        }
      } else if (mapping.type === 'join') {
        mapping.source_columns.forEach((col) => {
          if (col) usedColumns.add(col);
        });
      }
    });
    return sourceColumns.filter((col) => !usedColumns.has(col));
  }, [mappings, sourceColumns]);

  // Get unmapped target fields
  const unmappedTargetFields = React.useMemo(() => {
    const usedFields = new Set<string>();
    mappings.forEach((mapping) => {
      if (mapping.type === 'direct' || mapping.type === 'join') {
        if (mapping.target_field) {
          usedFields.add(mapping.target_field);
        }
      } else if (mapping.type === 'split') {
        mapping.target_fields.forEach((field) => {
          if (field) usedFields.add(field);
        });
      }
    });
    return targetFields.filter((field) => !usedFields.has(field.name));
  }, [mappings, targetFields]);

  // Validation errors
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];

    // Check for duplicate target field mappings
    const targetFieldCounts = new Map<string, number>();
    mappings.forEach((mapping) => {
      if (mapping.type === 'direct' || mapping.type === 'join') {
        if (mapping.target_field) {
          targetFieldCounts.set(
            mapping.target_field,
            (targetFieldCounts.get(mapping.target_field) || 0) + 1
          );
        }
      } else if (mapping.type === 'split') {
        mapping.target_fields.forEach((field) => {
          if (field) {
            targetFieldCounts.set(field, (targetFieldCounts.get(field) || 0) + 1);
          }
        });
      }
    });

    targetFieldCounts.forEach((count, field) => {
      if (count > 1) {
        errors.push(`Target field "${field}" is mapped multiple times`);
      }
    });

    return errors;
  }, [mappings]);

  return (
    <div className="space-y-4">
      {/* Add Mapping Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-neutral-900">Column Mappings</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-primary-500 hover:bg-primary-600">
              <Plus className="h-3 w-3 mr-1" />
              Add Mapping
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAddMapping('direct')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Direct (1:1)</div>
                  <div className="text-xs text-neutral-500">Map one column to one field</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddMapping('split')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Split (1:many)</div>
                  <div className="text-xs text-neutral-500">Split one column into multiple fields</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddMapping('join')}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Join (many:1)</div>
                  <div className="text-xs text-neutral-500">Combine multiple columns into one field</div>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Mapping Rows */}
      <div className="space-y-3">
        {mappings.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
            <p className="text-sm text-neutral-600">No mappings defined yet.</p>
            <p className="text-xs text-neutral-500 mt-1">Click "Add Mapping" to get started.</p>
          </div>
        ) : (
          mappings.map((mapping, index) => {
            switch (mapping.type) {
              case 'direct':
                return (
                  <DirectMappingRow
                    key={index}
                    mapping={mapping}
                    sourceColumns={sourceColumns}
                    targetFields={targetFields}
                    sampleData={sampleData}
                    connectionId={connectionId}
                    sqlQuery={sqlQuery}
                    onChange={(updated) => handleUpdateMapping(index, updated)}
                    onDelete={() => handleDeleteMapping(index)}
                  />
                );
              case 'split':
                return (
                  <SplitMappingRow
                    key={index}
                    mapping={mapping}
                    sourceColumns={sourceColumns}
                    targetFields={targetFields}
                    sampleData={sampleData}
                    onChange={(updated) => handleUpdateMapping(index, updated)}
                    onDelete={() => handleDeleteMapping(index)}
                  />
                );
              case 'join':
                return (
                  <JoinMappingRow
                    key={index}
                    mapping={mapping}
                    sourceColumns={sourceColumns}
                    targetFields={targetFields}
                    sampleData={sampleData}
                    onChange={(updated) => handleUpdateMapping(index, updated)}
                    onDelete={() => handleDeleteMapping(index)}
                  />
                );
            }
          })
        )}
      </div>

      {/* Unmapped Info */}
      {(unmappedSourceColumns.length > 0 || unmappedTargetFields.length > 0) && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Unmapped Fields</h4>

          {unmappedSourceColumns.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-blue-700 mb-1">Source columns:</p>
              <div className="flex flex-wrap gap-1">
                {unmappedSourceColumns.map((col) => (
                  <span
                    key={col}
                    className="bg-white border border-blue-200 rounded px-2 py-0.5 text-xs text-blue-900"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unmappedTargetFields.length > 0 && (
            <div>
              <p className="text-xs text-blue-700 mb-1">Target fields:</p>
              <div className="flex flex-wrap gap-1">
                {unmappedTargetFields.map((field) => (
                  <span
                    key={field.name}
                    className="bg-white border border-blue-200 rounded px-2 py-0.5 text-xs text-blue-900"
                  >
                    {field.name} ({field.field_type})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
