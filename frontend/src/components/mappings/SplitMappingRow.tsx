import React, { useMemo } from 'react';
import { SplitMapping } from '../../types/mapping';
import { SchemaField } from '../../types/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Trash2, Plus, X } from 'lucide-react';

interface SplitMappingRowProps {
  mapping: SplitMapping;
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData?: any[][];
  onChange: (mapping: SplitMapping) => void;
  onDelete: () => void;
}

const DELIMITER_OPTIONS = [
  { value: ',', label: 'Comma (,)' },
  { value: ' ', label: 'Space ( )' },
  { value: '|', label: 'Pipe (|)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab (\\t)' },
  { value: 'custom', label: 'Custom...' },
];

export function SplitMappingRow({
  mapping,
  sourceColumns,
  targetFields,
  sampleData,
  onChange,
  onDelete,
}: SplitMappingRowProps) {
  const [customDelimiter, setCustomDelimiter] = React.useState('');
  const [showCustomDelimiter, setShowCustomDelimiter] = React.useState(false);

  // Get sample value and preview split
  const splitPreview = useMemo((): string[] => {
    if (!sampleData || !mapping.source_column || !mapping.delimiter) return [];
    const columnIndex = sourceColumns.indexOf(mapping.source_column);
    if (columnIndex === -1 || !sampleData[0]) return [];
    const value = sampleData[0][columnIndex];
    if (value === null || value === undefined) return [];
    const strValue = String(value);
    return strValue.split(mapping.delimiter);
  }, [sampleData, mapping.source_column, mapping.delimiter, sourceColumns]);

  const handleDelimiterChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDelimiter(true);
      return;
    }
    setShowCustomDelimiter(false);
    onChange({ ...mapping, delimiter: value });
  };

  const handleCustomDelimiterSubmit = () => {
    if (customDelimiter) {
      onChange({ ...mapping, delimiter: customDelimiter });
      setShowCustomDelimiter(false);
    }
  };

  const handleAddPosition = () => {
    onChange({ ...mapping, target_fields: [...mapping.target_fields, ''] });
  };

  const handleRemovePosition = (index: number) => {
    const newTargetFields = mapping.target_fields.filter((_, i) => i !== index);
    onChange({ ...mapping, target_fields: newTargetFields });
  };

  const handleTargetFieldChange = (index: number, value: string) => {
    const newTargetFields = [...mapping.target_fields];
    newTargetFields[index] = value;
    onChange({ ...mapping, target_fields: newTargetFields });
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-neutral-900">Split Mapping (1:many)</h4>
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
        {/* Source Column */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-neutral-600">
              Source Column <span className="text-red-500">*</span>
            </Label>
            <Select
              value={mapping.source_column}
              onValueChange={(value) => onChange({ ...mapping, source_column: value })}
            >
              <SelectTrigger className="mt-1">
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
          </div>

          {/* Delimiter */}
          <div>
            <Label className="text-xs text-neutral-600">
              Split by <span className="text-red-500">*</span>
            </Label>
            {showCustomDelimiter ? (
              <div className="flex gap-2 mt-1">
                <Input
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="Enter delimiter"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleCustomDelimiterSubmit}>
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCustomDelimiter(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Select value={mapping.delimiter} onValueChange={handleDelimiterChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select delimiter" />
                </SelectTrigger>
                <SelectContent>
                  {DELIMITER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Preview */}
        {splitPreview.length > 0 && (
          <div className="bg-neutral-50 rounded-md p-3">
            <p className="text-xs font-medium text-neutral-600 mb-2">Split Preview:</p>
            <div className="flex flex-wrap gap-2">
              {splitPreview.map((part, index) => (
                <div
                  key={index}
                  className="bg-white border border-neutral-200 rounded px-2 py-1 text-xs font-mono"
                >
                  <span className="text-neutral-500">[{index + 1}]</span>{' '}
                  <span className="text-neutral-900">
                    {part.length > 30 ? `${part.substring(0, 30)}...` : part}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Fields */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-neutral-600">Target Fields (by position)</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddPosition}
              className="h-6 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Position
            </Button>
          </div>

          <div className="space-y-2">
            {mapping.target_fields.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2">
                No positions added yet. Click "Add Position" to start.
              </p>
            ) : (
              mapping.target_fields.map((targetField, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-500 w-16">
                    Position {index + 1}:
                  </span>
                  <Select
                    value={targetField && targetField.trim() !== '' ? targetField : undefined}
                    onValueChange={(value) => handleTargetFieldChange(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select target field" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetFields.filter(field => field.name !== '').map((field) => (
                        <SelectItem key={field.name} value={field.name}>
                          <div className="flex items-center gap-2">
                            <span>{field.name}</span>
                            <span className="text-xs text-neutral-500">({field.field_type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePosition(index)}
                    className="h-6 w-6 p-0 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
