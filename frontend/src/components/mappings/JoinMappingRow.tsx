import React, { useMemo } from 'react';
import { JoinMapping } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Trash2, Plus, X } from 'lucide-react';

interface JoinMappingRowProps {
  mapping: JoinMapping;
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData?: any[][];
  onChange: (mapping: JoinMapping) => void;
  onDelete: () => void;
}

const SEPARATOR_OPTIONS = [
  { value: ' ', label: 'Space ( )' },
  { value: ',', label: 'Comma (,)' },
  { value: '-', label: 'Dash (-)' },
  { value: '_', label: 'Underscore (_)' },
  { value: 'none', label: 'No separator' },
  { value: 'custom', label: 'Custom...' },
];

export function JoinMappingRow({
  mapping,
  sourceColumns,
  targetFields,
  sampleData,
  onChange,
  onDelete,
}: JoinMappingRowProps) {
  const [customSeparator, setCustomSeparator] = React.useState('');
  const [showCustomSeparator, setShowCustomSeparator] = React.useState(false);

  // Get sample values and preview join
  const joinPreview = useMemo((): string => {
    if (!sampleData || mapping.source_columns.length === 0) return '';
    const values = mapping.source_columns.map((col) => {
      const columnIndex = sourceColumns.indexOf(col);
      if (columnIndex === -1 || !sampleData[0]) return '';
      const value = sampleData[0][columnIndex];
      if (value === null || value === undefined) return '';
      return String(value);
    });
    return values.filter(Boolean).join(mapping.separator);
  }, [sampleData, mapping.source_columns, mapping.separator, sourceColumns]);

  const handleSeparatorChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomSeparator(true);
      return;
    }
    setShowCustomSeparator(false);
    // Convert 'none' to empty string
    const actualValue = value === 'none' ? '' : value;
    onChange({ ...mapping, separator: actualValue });
  };

  const handleCustomSeparatorSubmit = () => {
    onChange({ ...mapping, separator: customSeparator });
    setShowCustomSeparator(false);
  };

  const handleAddColumn = () => {
    onChange({ ...mapping, source_columns: [...mapping.source_columns, ''] });
  };

  const handleRemoveColumn = (index: number) => {
    const newSourceColumns = mapping.source_columns.filter((_, i) => i !== index);
    onChange({ ...mapping, source_columns: newSourceColumns });
  };

  const handleSourceColumnChange = (index: number, value: string) => {
    const newSourceColumns = [...mapping.source_columns];
    newSourceColumns[index] = value;
    onChange({ ...mapping, source_columns: newSourceColumns });
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
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-neutral-900">Join Mapping (many:1)</h4>
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
        {/* Source Columns */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-neutral-600">
              Source Columns (in order) <span className="text-red-500">*</span>
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddColumn}
              className="h-6 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Column
            </Button>
          </div>

          <div className="space-y-2">
            {mapping.source_columns.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2">
                No columns added yet. Click "Add Column" to start.
              </p>
            ) : (
              mapping.source_columns.map((sourceColumn, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-500 w-12">#{index + 1}:</span>
                  <Select
                    value={sourceColumn && sourceColumn.trim() !== '' ? sourceColumn : undefined}
                    onValueChange={(value) => handleSourceColumnChange(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select source column" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceColumns.filter(col => col !== '').map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveColumn(index)}
                    className="h-6 w-6 p-0 hover:bg-red-50"
                    disabled={mapping.source_columns.length <= 2}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Separator */}
        <div>
          <Label className="text-xs text-neutral-600">
            Join with <span className="text-red-500">*</span>
          </Label>
          {showCustomSeparator ? (
            <div className="flex gap-2 mt-1">
              <Input
                value={customSeparator}
                onChange={(e) => setCustomSeparator(e.target.value)}
                placeholder="Enter separator"
                className="flex-1"
              />
              <Button size="sm" onClick={handleCustomSeparatorSubmit}>
                OK
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCustomSeparator(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Select
              value={mapping.separator === '' ? 'none' : mapping.separator}
              onValueChange={handleSeparatorChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select separator" />
              </SelectTrigger>
              <SelectContent>
                {SEPARATOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Preview */}
        {joinPreview && (
          <div className="bg-neutral-50 rounded-md p-3">
            <p className="text-xs font-medium text-neutral-600 mb-2">Join Preview:</p>
            <div className="bg-white border border-neutral-200 rounded px-3 py-2">
              <p className="text-xs font-mono text-neutral-900">
                {joinPreview.length > 100 ? `${joinPreview.substring(0, 100)}...` : joinPreview}
              </p>
            </div>
          </div>
        )}

        {/* Target Field */}
        <div>
          <Label className="text-xs text-neutral-600">
            Target Field <span className="text-red-500">*</span>
          </Label>
          <Select
            value={mapping.target_field}
            onValueChange={(value) => onChange({ ...mapping, target_field: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select target field" />
            </SelectTrigger>
            <SelectContent>
              {targetFields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  <div className="flex items-center gap-2">
                    <span>{field.name}</span>
                    <span className="text-xs text-neutral-500">({field.field_type})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mapping.target_field && (
            <p className="text-xs text-neutral-500 mt-1">Type: {getTargetFieldType()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
