import { useState, useEffect } from 'react';
import { ColumnMapping, MappingType } from '../../../types/mapping';
import { SchemaField } from '../../../types/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Combobox } from '../../ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Plus, X } from 'lucide-react';

interface QuickMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceColumns: string[];
  targetFields: SchemaField[];
  sampleData: Record<string, any>[];
  existingMapping?: ColumnMapping;
  onSave: (mapping: ColumnMapping) => void;
}

export function QuickMappingDialog({
  open,
  onOpenChange,
  sourceColumns,
  targetFields,
  sampleData,
  existingMapping,
  onSave,
}: QuickMappingDialogProps) {
  const [mappingType, setMappingType] = useState<MappingType>('direct');

  // Direct mapping state
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetField, setTargetField] = useState('');

  // Split mapping state
  const [splitSourceColumn, setSplitSourceColumn] = useState('');
  const [splitDelimiter, setSplitDelimiter] = useState(',');
  const [splitTargetFields, setSplitTargetFields] = useState<string[]>(['', '']);

  // Join mapping state
  const [joinSourceColumns, setJoinSourceColumns] = useState<string[]>(['', '']);
  const [joinSeparator, setJoinSeparator] = useState(' ');
  const [joinTargetField, setJoinTargetField] = useState('');

  // Initialize from existing mapping if editing
  useEffect(() => {
    if (existingMapping) {
      setMappingType(existingMapping.type);

      if (existingMapping.type === 'direct') {
        setSourceColumn(existingMapping.source_column);
        setTargetField(existingMapping.target_field);
      } else if (existingMapping.type === 'split') {
        setSplitSourceColumn(existingMapping.source_column);
        setSplitDelimiter(existingMapping.delimiter);
        setSplitTargetFields(existingMapping.target_fields.length > 0 ? existingMapping.target_fields : ['', '']);
      } else if (existingMapping.type === 'join') {
        setJoinSourceColumns(existingMapping.source_columns.length > 0 ? existingMapping.source_columns : ['', '']);
        setJoinSeparator(existingMapping.separator);
        setJoinTargetField(existingMapping.target_field);
      }
    } else {
      // Reset to defaults for new mapping
      setMappingType('direct');
      setSourceColumn('');
      setTargetField('');
      setSplitSourceColumn('');
      setSplitDelimiter(',');
      setSplitTargetFields(['', '']);
      setJoinSourceColumns(['', '']);
      setJoinSeparator(' ');
      setJoinTargetField('');
    }
  }, [existingMapping, open]);

  const handleSave = () => {
    let mapping: ColumnMapping;

    if (mappingType === 'direct') {
      mapping = {
        type: 'direct',
        source_column: sourceColumn,
        target_field: targetField,
      };
    } else if (mappingType === 'split') {
      mapping = {
        type: 'split',
        source_column: splitSourceColumn,
        delimiter: splitDelimiter,
        target_fields: splitTargetFields.filter(f => f.trim() !== ''),
      };
    } else {
      mapping = {
        type: 'join',
        source_columns: joinSourceColumns.filter(c => c.trim() !== ''),
        separator: joinSeparator,
        target_field: joinTargetField,
      };
    }

    onSave(mapping);
  };

  const getSampleValue = (column: string): string => {
    if (sampleData.length > 0 && sampleData[0][column] !== undefined) {
      const value = sampleData[0][column];
      return value === null ? 'null' : String(value);
    }
    return '';
  };

  const getPreviewResult = (): string => {
    if (mappingType === 'split' && splitSourceColumn && splitDelimiter) {
      const sampleValue = getSampleValue(splitSourceColumn);
      if (sampleValue) {
        const parts = sampleValue.split(splitDelimiter);
        return parts.join(` ${splitDelimiter} `);
      }
    } else if (mappingType === 'join' && joinSourceColumns.length >= 2) {
      const values = joinSourceColumns
        .filter(col => col.trim() !== '')
        .map(col => getSampleValue(col))
        .filter(v => v !== '');
      if (values.length > 0) {
        return values.join(joinSeparator);
      }
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingMapping ? 'Edit Mapping' : 'Add New Mapping'}</DialogTitle>
          <DialogDescription>
            Configure how source columns map to target fields
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mappingType} onValueChange={(value: string) => setMappingType(value as MappingType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct">Direct (1:1)</TabsTrigger>
            <TabsTrigger value="split">Split (1:many)</TabsTrigger>
            <TabsTrigger value="join">Join (many:1)</TabsTrigger>
          </TabsList>

          {/* Direct Mapping Tab */}
          <TabsContent value="direct" className="space-y-4 mt-4">
            <div>
              <Label>Source Column</Label>
              <Combobox
                options={sourceColumns.map(col => ({ label: col, value: col }))}
                value={sourceColumn}
                onValueChange={setSourceColumn}
                placeholder="Select source column..."
                searchPlaceholder="Search columns..."
                emptyMessage="No columns found."
              />
              {sourceColumn && getSampleValue(sourceColumn) && (
                <p className="text-xs text-neutral-500 mt-1">
                  Sample: {getSampleValue(sourceColumn)}
                </p>
              )}
            </div>

            <div>
              <Label>Target Field</Label>
              <Combobox
                options={targetFields.map(field => ({
                  label: `${field.name} (${field.field_type})`,
                  value: field.name,
                }))}
                value={targetField}
                onValueChange={setTargetField}
                placeholder="Select target field..."
                searchPlaceholder="Search fields..."
                emptyMessage="No fields found."
              />
            </div>
          </TabsContent>

          {/* Split Mapping Tab */}
          <TabsContent value="split" className="space-y-4 mt-4">
            <div>
              <Label>Source Column</Label>
              <Combobox
                options={sourceColumns.map(col => ({ label: col, value: col }))}
                value={splitSourceColumn}
                onValueChange={setSplitSourceColumn}
                placeholder="Select source column..."
                searchPlaceholder="Search columns..."
                emptyMessage="No columns found."
              />
              {splitSourceColumn && getSampleValue(splitSourceColumn) && (
                <p className="text-xs text-neutral-500 mt-1">
                  Sample: {getSampleValue(splitSourceColumn)}
                </p>
              )}
            </div>

            <div>
              <Label>Delimiter</Label>
              <Combobox
                options={[
                  { label: 'Comma (,)', value: ',' },
                  { label: 'Space', value: ' ' },
                  { label: 'Pipe (|)', value: '|' },
                  { label: 'Semicolon (;)', value: ';' },
                  { label: 'Tab', value: '\t' },
                ]}
                value={splitDelimiter}
                onValueChange={setSplitDelimiter}
                placeholder="Select delimiter..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Target Fields</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSplitTargetFields([...splitTargetFields, ''])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Position
                </Button>
              </div>
              <div className="space-y-2">
                {splitTargetFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 w-16">Pos {index + 1}:</span>
                    <Combobox
                      options={targetFields.map(f => ({
                        label: `${f.name} (${f.field_type})`,
                        value: f.name,
                      }))}
                      value={field}
                      onValueChange={(value) => {
                        const newFields = [...splitTargetFields];
                        newFields[index] = value;
                        setSplitTargetFields(newFields);
                      }}
                      placeholder="Select target field..."
                    />
                    {splitTargetFields.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSplitTargetFields(splitTargetFields.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {getPreviewResult() && (
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                <Label className="text-xs text-neutral-600">Preview Result:</Label>
                <p className="text-sm font-mono mt-1">{getPreviewResult()}</p>
              </div>
            )}
          </TabsContent>

          {/* Join Mapping Tab */}
          <TabsContent value="join" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Source Columns</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setJoinSourceColumns([...joinSourceColumns, ''])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Column
                </Button>
              </div>
              <div className="space-y-2">
                {joinSourceColumns.map((col, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Combobox
                      options={sourceColumns.map(c => ({ label: c, value: c }))}
                      value={col}
                      onValueChange={(value) => {
                        const newCols = [...joinSourceColumns];
                        newCols[index] = value;
                        setJoinSourceColumns(newCols);
                      }}
                      placeholder="Select source column..."
                    />
                    {joinSourceColumns.length > 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setJoinSourceColumns(joinSourceColumns.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Separator</Label>
              <Combobox
                options={[
                  { label: 'Space', value: ' ' },
                  { label: 'Comma (,)', value: ',' },
                  { label: 'Dash (-)', value: '-' },
                  { label: 'Underscore (_)', value: '_' },
                  { label: 'None', value: '' },
                ]}
                value={joinSeparator}
                onValueChange={setJoinSeparator}
                placeholder="Select separator..."
              />
            </div>

            <div>
              <Label>Target Field</Label>
              <Combobox
                options={targetFields.map(field => ({
                  label: `${field.name} (${field.field_type})`,
                  value: field.name,
                }))}
                value={joinTargetField}
                onValueChange={setJoinTargetField}
                placeholder="Select target field..."
                searchPlaceholder="Search fields..."
                emptyMessage="No fields found."
              />
            </div>

            {getPreviewResult() && (
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200">
                <Label className="text-xs text-neutral-600">Preview Result:</Label>
                <p className="text-sm font-mono mt-1">{getPreviewResult()}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700">
            {existingMapping ? 'Update Mapping' : 'Add Mapping'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
