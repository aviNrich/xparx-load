import React from 'react';
import { DirectMapping } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { Combobox } from '../ui/combobox';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Trash2 } from 'lucide-react';

interface DirectMappingRowProps {
  mapping: DirectMapping;
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData?: any[][];
  onChange: (mapping: DirectMapping) => void;
  onDelete: () => void;
}

export function DirectMappingRow({
  mapping,
  sourceColumns,
  targetFields,
  sampleData,
  onChange,
  onDelete,
}: DirectMappingRowProps) {
  // Get sample value for the selected source column
  const getSampleValue = (): string => {
    if (!sampleData || !mapping.source_column) return '-';
    const columnIndex = sourceColumns.indexOf(mapping.source_column);
    if (columnIndex === -1 || !sampleData[0]) return '-';
    const value = sampleData[0][columnIndex];
    if (value === null || value === undefined) return 'NULL';
    const strValue = String(value);
    return strValue.length > 50 ? `${strValue.substring(0, 50)}...` : strValue;
  };

  // Get target field type
  const getTargetFieldType = (): string => {
    if (!mapping.target_field) return '-';
    const field = targetFields.find((f) => f.name === mapping.target_field);
    return field?.field_type || '-';
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-neutral-900">Direct Mapping (1:1)</h4>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
          title="Delete mapping"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Source Column */}
        <div>
          <Label className="text-xs text-neutral-600">
            Source Column <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <Combobox
              options={sourceColumns.map((column) => ({ label: column, value: column }))}
              value={mapping.source_column}
              onValueChange={(value) => onChange({ ...mapping, source_column: value })}
              placeholder="Select source column..."
              searchPlaceholder="Search columns..."
              emptyMessage="No columns found."
            />
          </div>
          {mapping.source_column && (
            <p className="text-xs text-neutral-500 mt-1">
              Sample: <span className="font-mono">{getSampleValue()}</span>
            </p>
          )}
        </div>

        {/* Target Field */}
        <div>
          <Label className="text-xs text-neutral-600">
            Target Field <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <Combobox
              options={targetFields.map((field) => ({
                label: `${field.name} (${field.field_type})`,
                value: field.name,
              }))}
              value={mapping.target_field}
              onValueChange={(value) => onChange({ ...mapping, target_field: value })}
              placeholder="Select target field..."
              searchPlaceholder="Search fields..."
              emptyMessage="No fields found."
            />
          </div>
          {mapping.target_field && (
            <p className="text-xs text-neutral-500 mt-1">Type: {getTargetFieldType()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
