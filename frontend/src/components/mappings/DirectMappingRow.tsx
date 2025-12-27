import React, { useMemo, useState, useEffect } from 'react';
import { DirectMapping } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { Combobox } from '../ui/combobox';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Trash2, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { mappingAPI } from '../../services/api';

interface DirectMappingRowProps {
  mapping: DirectMapping;
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData?: any[][];
  connectionId: string;
  sqlQuery: string;
  onChange: (mapping: DirectMapping) => void;
  onDelete: () => void;
}

export function DirectMappingRow({
  mapping,
  sourceColumns,
  targetFields,
  sampleData,
  connectionId,
  sqlQuery,
  onChange,
  onDelete,
}: DirectMappingRowProps) {
  const [uniqueSourceValues, setUniqueSourceValues] = useState<string[]>([]);
  const [loadingUniqueValues, setLoadingUniqueValues] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isEnumMappingExpanded, setIsEnumMappingExpanded] = useState(true);
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

  // Get target field
  const targetField = useMemo(() => {
    if (!mapping.target_field) return null;
    return targetFields.find((f) => f.name === mapping.target_field);
  }, [mapping.target_field, targetFields]);

  // Get target field type
  const getTargetFieldType = (): string => {
    return targetField?.field_type || '-';
  };

  // Check if target field is enum
  const isEnumField = targetField?.field_type === 'enum';

  // Fetch unique values from server when source column changes and target is enum
  useEffect(() => {
    const fetchUniqueValues = async () => {
      if (!mapping.source_column || !isEnumField) {
        setUniqueSourceValues([]);
        return;
      }

      try {
        setLoadingUniqueValues(true);
        const result = await mappingAPI.getUniqueValues(
          connectionId,
          sqlQuery,
          mapping.source_column
        );
        setUniqueSourceValues(result.unique_values);
      } catch (error) {
        console.error('Failed to fetch unique values:', error);
        setUniqueSourceValues([]);
      } finally {
        setLoadingUniqueValues(false);
      }
    };

    fetchUniqueValues();
  }, [mapping.source_column, connectionId, sqlQuery, isEnumField]);

  // Get enum keys from target field
  const enumKeys = useMemo(() => {
    if (!isEnumField || !targetField?.enum_values) return [];
    return Object.keys(targetField.enum_values);
  }, [isEnumField, targetField]);

  // Filter unique source values based on search text
  const filteredSourceValues = useMemo(() => {
    if (!filterText.trim()) return uniqueSourceValues;
    const searchLower = filterText.toLowerCase();
    return uniqueSourceValues.filter(value =>
      value.toLowerCase().includes(searchLower)
    );
  }, [uniqueSourceValues, filterText]);

  // Handle enum value mapping changes
  const handleEnumMappingChange = (sourceValue: string, enumKey: string | null) => {
    const currentMappings = { ...(mapping.enum_value_mappings || {}) };

    if (enumKey === null || enumKey === '') {
      // Remove mapping if set to null/empty
      delete currentMappings[sourceValue];
    } else {
      // Set or update mapping
      currentMappings[sourceValue] = enumKey;
    }

    onChange({
      ...mapping,
      enum_value_mappings: Object.keys(currentMappings).length > 0 ? currentMappings : undefined,
    });
  };

  // Fill all unmapped values with the default enum key
  const handleFillFallback = () => {
    if (!targetField?.default_enum_key) return;

    const currentMappings = { ...(mapping.enum_value_mappings || {}) };

    // Map all unmapped source values to the default enum key
    uniqueSourceValues.forEach((sourceValue) => {
      if (!currentMappings[sourceValue]) {
        currentMappings[sourceValue] = targetField.default_enum_key!;
      }
    });

    onChange({
      ...mapping,
      enum_value_mappings: currentMappings,
    });
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

      <div className="space-y-4">
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
                onValueChange={(value) => onChange({ ...mapping, source_column: value, enum_value_mappings: undefined })}
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
                onValueChange={(value) => onChange({ ...mapping, target_field: value, enum_value_mappings: undefined })}
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

        {/* Enum Value Mappings - Only show if target field is enum */}
        {isEnumField && mapping.source_column && mapping.target_field && (
          <div className="border-t border-neutral-200 pt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              {/* Collapsible Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Label className="text-xs text-neutral-700 font-medium mb-1 block">
                    Map Source Values to Enum Values
                  </Label>
                  <p className="text-xs text-neutral-600">
                    Select an enum value for each source value. Leave empty to set as null.
                    {targetField?.default_enum_key && (
                      <span className="ml-1 text-purple-600 font-medium">
                        (Default: {targetField.default_enum_key})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Fill Fallback Button - Only show if default_enum_key is set and values are loaded */}
                  {targetField?.default_enum_key && uniqueSourceValues.length > 0 && !loadingUniqueValues && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleFillFallback}
                      className="text-purple-600 border-purple-300 hover:bg-purple-100 h-7 text-xs whitespace-nowrap px-3"
                      title={`Map all unmapped values to default: ${targetField.default_enum_key}`}
                    >
                      Fill Fallback
                    </Button>
                  )}
                  {/* Collapse/Expand Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEnumMappingExpanded(!isEnumMappingExpanded)}
                    className="h-7 w-7 p-0 hover:bg-purple-100 flex-shrink-0"
                    title={isEnumMappingExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isEnumMappingExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isEnumMappingExpanded && (
                <>
                  {loadingUniqueValues ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading unique values...</span>
                    </div>
                  ) : uniqueSourceValues.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-4">No source values available</p>
                  ) : (
                    <div className="border border-purple-200 rounded-lg overflow-hidden bg-white">
                      {/* Table Header with Filter */}
                      <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-xs font-medium text-neutral-700">Source Value</div>
                          <div className="text-xs font-medium text-neutral-700">Maps To Enum Value</div>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <input
                            type="text"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder="Filter source values..."
                            className="w-full text-sm border border-neutral-300 rounded-md pl-9 pr-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>

                      {/* Table Body - Scrollable */}
                      <div className="divide-y divide-neutral-200 max-h-[300px] overflow-y-auto">
                        {filteredSourceValues.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-neutral-500">
                            No values match your filter
                          </div>
                        ) : (
                          filteredSourceValues.map((sourceValue) => {
                          const currentMapping = mapping.enum_value_mappings?.[sourceValue];
                          return (
                            <div key={sourceValue} className="grid grid-cols-2 gap-4 px-4 py-2.5 hover:bg-neutral-50">
                              {/* Source Value - Read Only */}
                              <div className="flex items-center">
                                <code className="text-sm bg-neutral-100 px-2 py-1 rounded text-neutral-900">
                                  {sourceValue}
                                </code>
                              </div>

                              {/* Enum Value Selector */}
                              <div>
                                <select
                                  value={currentMapping || ''}
                                  onChange={(e) => handleEnumMappingChange(sourceValue, e.target.value || null)}
                                  className="w-full text-sm border border-neutral-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">-- Not mapped (null) --</option>
                                  {enumKeys.map((key) => (
                                    <option key={key} value={key}>
                                      {key} → {targetField?.enum_values?.[key]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                          })
                        )}
                      </div>

                      {/* Summary Footer */}
                      <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-200">
                        <p className="text-xs text-neutral-600">
                          {Object.keys(mapping.enum_value_mappings || {}).length} of {uniqueSourceValues.length} values mapped
                          {filterText && ` (${filteredSourceValues.length} shown)`}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
