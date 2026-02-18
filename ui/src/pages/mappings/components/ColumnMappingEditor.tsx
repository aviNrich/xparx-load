import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TableSchema, SchemaField } from '@/types/schema';
import { ColumnMapping, DirectMapping, SplitMapping, JoinMapping } from '@/types/mapping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ColumnMappingEditorProps {
  sourceColumns: string[];
  schema: TableSchema;
  mappings: ColumnMapping[];
  onChange: (mappings: ColumnMapping[]) => void;
}

export function ColumnMappingEditor({
  sourceColumns,
  schema,
  mappings,
  onChange,
}: ColumnMappingEditorProps) {
  // Figure out which target fields are already mapped (for direct/join)
  const mappedTargetFields = useMemo(() => {
    const fields = new Set<string>();
    mappings.forEach((m) => {
      if (m.type === 'direct') fields.add(m.target_field);
      if (m.type === 'join') fields.add(m.target_field);
      if (m.type === 'split') m.target_fields.forEach((f) => fields.add(f));
    });
    return fields;
  }, [mappings]);

  const getAvailableTargetFields = (currentMapping?: ColumnMapping): SchemaField[] => {
    return schema.fields.filter((f) => {
      if (!currentMapping) return !mappedTargetFields.has(f.name);
      // Allow the currently selected field(s) to remain available
      if (currentMapping.type === 'direct' && currentMapping.target_field === f.name) return true;
      if (currentMapping.type === 'join' && currentMapping.target_field === f.name) return true;
      if (currentMapping.type === 'split' && currentMapping.target_fields.includes(f.name)) return true;
      return !mappedTargetFields.has(f.name);
    });
  };

  const addMapping = () => {
    const newMapping: DirectMapping = {
      type: 'direct',
      source_column: '',
      target_field: '',
    };
    onChange([...mappings, newMapping]);
  };

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, updated: ColumnMapping) => {
    const next = [...mappings];
    next[index] = updated;
    onChange(next);
  };

  const changeType = (index: number, newType: 'direct' | 'split' | 'join') => {
    if (newType === 'direct') {
      updateMapping(index, { type: 'direct', source_column: '', target_field: '' });
    } else if (newType === 'split') {
      updateMapping(index, { type: 'split', source_column: '', delimiter: ',', target_fields: [''] });
    } else {
      updateMapping(index, { type: 'join', source_columns: ['', ''], separator: ' ', target_field: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700">
          Target: {schema.name}
        </h4>
        <Button variant="outline" size="sm" onClick={addMapping}>
          <Plus className="h-4 w-4 mr-1" />
          Add Mapping
        </Button>
      </div>

      {mappings.length === 0 && (
        <p className="text-sm text-neutral-500 py-4 text-center">
          No column mappings defined. Click "Add Mapping" to begin.
        </p>
      )}

      <div className="space-y-3">
        {mappings.map((mapping, index) => (
          <div key={index} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
            <div className="flex items-start gap-3">
              {/* Type selector */}
              <div className="w-32 shrink-0">
                <Label className="text-xs text-neutral-500">Type</Label>
                <Select
                  value={mapping.type}
                  onValueChange={(val) => changeType(index, val as 'direct' | 'split' | 'join')}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="join">Join</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific fields */}
              <div className="flex-1 min-w-0">
                {mapping.type === 'direct' && (
                  <DirectMappingRow
                    mapping={mapping}
                    sourceColumns={sourceColumns}
                    availableFields={getAvailableTargetFields(mapping)}
                    schemaFields={schema.fields}
                    onChange={(updated) => updateMapping(index, updated)}
                  />
                )}
                {mapping.type === 'split' && (
                  <SplitMappingRow
                    mapping={mapping}
                    sourceColumns={sourceColumns}
                    availableFields={getAvailableTargetFields(mapping)}
                    onChange={(updated) => updateMapping(index, updated)}
                  />
                )}
                {mapping.type === 'join' && (
                  <JoinMappingRow
                    mapping={mapping}
                    sourceColumns={sourceColumns}
                    availableFields={getAvailableTargetFields(mapping)}
                    onChange={(updated) => updateMapping(index, updated)}
                  />
                )}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mt-5 shrink-0 text-neutral-400 hover:text-error-600"
                onClick={() => removeMapping(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Direct Mapping Row ---
interface DirectMappingRowProps {
  mapping: DirectMapping;
  sourceColumns: string[];
  availableFields: SchemaField[];
  schemaFields: SchemaField[];
  onChange: (mapping: DirectMapping) => void;
}

function DirectMappingRow({
  mapping,
  sourceColumns,
  availableFields,
  schemaFields,
  onChange,
}: DirectMappingRowProps) {
  const targetField = schemaFields.find((f) => f.name === mapping.target_field);
  const isEnum = targetField?.field_type === 'enum';

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-xs text-neutral-500">Source Column</Label>
          <Select
            value={mapping.source_column || undefined}
            onValueChange={(val) => onChange({ ...mapping, source_column: val })}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {sourceColumns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-neutral-400 pb-2 text-sm shrink-0">-&gt;</div>
        <div className="flex-1">
          <Label className="text-xs text-neutral-500">Target Field</Label>
          <Select
            value={mapping.target_field || undefined}
            onValueChange={(val) => onChange({ ...mapping, target_field: val })}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((f) => (
                <SelectItem key={f.name} value={f.name}>
                  {f.name} ({f.field_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enum value mappings */}
      {isEnum && targetField?.enum_values && (
        <EnumMappingSection
          enumValues={targetField.enum_values}
          valueMappings={mapping.enum_value_mappings || {}}
          onChange={(enumMappings) =>
            onChange({ ...mapping, enum_value_mappings: enumMappings })
          }
        />
      )}
    </div>
  );
}

// --- Enum Mapping Section ---
interface EnumMappingSectionProps {
  enumValues: Record<string, string>;
  valueMappings: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
}

function EnumMappingSection({ enumValues, valueMappings, onChange }: EnumMappingSectionProps) {
  const enumKeys = Object.keys(enumValues);

  const updateValueMapping = (sourceValue: string, enumKey: string) => {
    const next = { ...valueMappings };
    if (enumKey) {
      next[sourceValue] = enumKey;
    } else {
      delete next[sourceValue];
    }
    onChange(next);
  };

  const addValueMapping = () => {
    onChange({ ...valueMappings, '': enumKeys[0] || '' });
  };

  const removeValueMapping = (sourceValue: string) => {
    const next = { ...valueMappings };
    delete next[sourceValue];
    onChange(next);
  };

  return (
    <div className="ml-4 border-l-2 border-primary-200 pl-4 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-500">Enum Value Mappings</Label>
        <Button variant="ghost" size="sm" onClick={addValueMapping} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      {Object.entries(valueMappings).map(([sourceVal, enumKey], i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={sourceVal}
            onChange={(e) => {
              const next = { ...valueMappings };
              delete next[sourceVal];
              next[e.target.value] = enumKey;
              onChange(next);
            }}
            placeholder="Source value"
            className="h-8 text-xs flex-1"
          />
          <span className="text-neutral-400 text-xs shrink-0">-&gt;</span>
          <Select
            value={enumKey}
            onValueChange={(val) => updateValueMapping(sourceVal, val)}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enumKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key} ({enumValues[key]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-400 hover:text-error-600"
            onClick={() => removeValueMapping(sourceVal)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// --- Split Mapping Row ---
interface SplitMappingRowProps {
  mapping: SplitMapping;
  sourceColumns: string[];
  availableFields: SchemaField[];
  onChange: (mapping: SplitMapping) => void;
}

function SplitMappingRow({
  mapping,
  sourceColumns,
  availableFields,
  onChange,
}: SplitMappingRowProps) {
  const addTargetField = () => {
    onChange({ ...mapping, target_fields: [...mapping.target_fields, ''] });
  };

  const updateTargetField = (idx: number, val: string) => {
    const next = [...mapping.target_fields];
    next[idx] = val;
    onChange({ ...mapping, target_fields: next });
  };

  const removeTargetField = (idx: number) => {
    onChange({ ...mapping, target_fields: mapping.target_fields.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-xs text-neutral-500">Source Column</Label>
          <Select
            value={mapping.source_column || undefined}
            onValueChange={(val) => onChange({ ...mapping, source_column: val })}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {sourceColumns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Label className="text-xs text-neutral-500">Delimiter</Label>
          <Input
            value={mapping.delimiter}
            onChange={(e) => onChange({ ...mapping, delimiter: e.target.value })}
            className="h-9 mt-1"
            placeholder=","
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-neutral-500">Target Fields (ordered by split position)</Label>
          <Button variant="ghost" size="sm" onClick={addTargetField} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {mapping.target_fields.map((tf, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 w-6 text-right shrink-0">{idx + 1}.</span>
            <Select
              value={tf || undefined}
              onValueChange={(val) => updateTargetField(idx, val)}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name} ({f.field_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mapping.target_fields.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-neutral-400 hover:text-error-600"
                onClick={() => removeTargetField(idx)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Join Mapping Row ---
interface JoinMappingRowProps {
  mapping: JoinMapping;
  sourceColumns: string[];
  availableFields: SchemaField[];
  onChange: (mapping: JoinMapping) => void;
}

function JoinMappingRow({
  mapping,
  sourceColumns,
  availableFields,
  onChange,
}: JoinMappingRowProps) {
  const addSourceColumn = () => {
    onChange({ ...mapping, source_columns: [...mapping.source_columns, ''] });
  };

  const updateSourceColumn = (idx: number, val: string) => {
    const next = [...mapping.source_columns];
    next[idx] = val;
    onChange({ ...mapping, source_columns: next });
  };

  const removeSourceColumn = (idx: number) => {
    onChange({ ...mapping, source_columns: mapping.source_columns.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-neutral-500">Source Columns (ordered)</Label>
          <Button variant="ghost" size="sm" onClick={addSourceColumn} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {mapping.source_columns.map((sc, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 w-6 text-right shrink-0">{idx + 1}.</span>
            <Select
              value={sc || undefined}
              onValueChange={(val) => updateSourceColumn(idx, val)}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {sourceColumns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mapping.source_columns.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-neutral-400 hover:text-error-600"
                onClick={() => removeSourceColumn(idx)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <div className="w-24">
          <Label className="text-xs text-neutral-500">Separator</Label>
          <Input
            value={mapping.separator}
            onChange={(e) => onChange({ ...mapping, separator: e.target.value })}
            className="h-9 mt-1"
            placeholder=" "
          />
        </div>
        <div className="text-neutral-400 pb-2 text-sm shrink-0">-&gt;</div>
        <div className="flex-1">
          <Label className="text-xs text-neutral-500">Target Field</Label>
          <Select
            value={mapping.target_field || undefined}
            onValueChange={(val) => onChange({ ...mapping, target_field: val })}
          >
            <SelectTrigger className="h-9 mt-1">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((f) => (
                <SelectItem key={f.name} value={f.name}>
                  {f.name} ({f.field_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
