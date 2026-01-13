import { ColumnMapping } from '../../../types/mapping';
import { SchemaField } from '../../../types/schema';
import { Button } from '../../ui/button';
import { ArrowRight, Split, Merge, Edit2, Trash2 } from 'lucide-react';

interface MappingCardProps {
  mapping: ColumnMapping;
  targetFields: SchemaField[];
  sampleData: Record<string, any>[];
  onEdit: () => void;
  onDelete: () => void;
}

export function MappingCard({
  mapping,
  targetFields,
  sampleData,
  onEdit,
  onDelete,
}: MappingCardProps) {
  // Get sample value for source column(s)
  const getSampleValue = (column: string): string => {
    if (sampleData.length > 0 && sampleData[0][column] !== undefined) {
      const value = sampleData[0][column];
      if (value === null) return 'null';
      if (typeof value === 'string' && value.length > 30) {
        return `"${value.substring(0, 30)}..."`;
      }
      return typeof value === 'string' ? `"${value}"` : String(value);
    }
    return '';
  };

  // Get target field info
  const getTargetField = (fieldName: string): SchemaField | undefined => {
    return targetFields.find(f => f.name === fieldName);
  };

  // Render mapping type badge and icon
  const renderMappingType = () => {
    if (mapping.type === 'direct') {
      return (
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Direct
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400" />
        </div>
      );
    } else if (mapping.type === 'split') {
      return (
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
            <Split className="h-3 w-3" />
            Split
          </div>
        </div>
      );
    } else if (mapping.type === 'join') {
      return (
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
            <Merge className="h-3 w-3" />
            Join
          </div>
        </div>
      );
    }
  };

  // Render mapping content based on type
  const renderMappingContent = () => {
    if (mapping.type === 'direct') {
      const targetField = getTargetField(mapping.target_field);
      const sampleValue = getSampleValue(mapping.source_column);

      return (
        <div className="flex items-center gap-4">
          {/* Source */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-500 mb-1">Source</div>
            <div className="font-medium text-neutral-900 truncate">{mapping.source_column}</div>
            {sampleValue && (
              <div className="text-xs text-neutral-500 mt-1 truncate" title={sampleValue}>
                {sampleValue}
              </div>
            )}
          </div>

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-neutral-300 flex-shrink-0" />

          {/* Target */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-500 mb-1">Target</div>
            <div className="font-medium text-neutral-900 truncate">{mapping.target_field}</div>
            {targetField && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                  {targetField.field_type}
                </span>
                {targetField.field_type === 'enum' && mapping.enum_value_mappings && (
                  <span className="text-xs text-neutral-500">
                    ({Object.keys(mapping.enum_value_mappings).length} values mapped)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else if (mapping.type === 'split') {
      const sampleValue = getSampleValue(mapping.source_column);
      const validTargetFields = mapping.target_fields.filter(f => f && f.trim() !== '');

      return (
        <div className="space-y-3">
          {/* Source */}
          <div>
            <div className="text-xs text-neutral-500 mb-1">Source Column</div>
            <div className="font-medium text-neutral-900">{mapping.source_column}</div>
            {sampleValue && (
              <div className="text-xs text-neutral-500 mt-1 truncate" title={sampleValue}>
                {sampleValue}
              </div>
            )}
          </div>

          {/* Delimiter */}
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span>Split by:</span>
            <span className="px-2 py-0.5 bg-neutral-100 rounded font-mono">
              {mapping.delimiter === ',' ? 'Comma (,)' :
               mapping.delimiter === ' ' ? 'Space' :
               mapping.delimiter === '|' ? 'Pipe (|)' :
               mapping.delimiter === ';' ? 'Semicolon (;)' :
               mapping.delimiter === '\t' ? 'Tab' :
               mapping.delimiter}
            </span>
          </div>

          {/* Target Fields */}
          <div>
            <div className="text-xs text-neutral-500 mb-1">
              Target Fields ({validTargetFields.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {validTargetFields.map((field, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                >
                  {idx + 1}. {field}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (mapping.type === 'join') {
      const validSourceColumns = mapping.source_columns.filter(c => c && c.trim() !== '');
      const targetField = getTargetField(mapping.target_field);

      return (
        <div className="space-y-3">
          {/* Source Columns */}
          <div>
            <div className="text-xs text-neutral-500 mb-1">
              Source Columns ({validSourceColumns.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {validSourceColumns.map((col, idx) => {
                const sampleValue = getSampleValue(col);
                return (
                  <div
                    key={idx}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                  >
                    <span className="font-medium">{col}</span>
                    {sampleValue && (
                      <span className="ml-1 opacity-70" title={sampleValue}>
                        {sampleValue}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span>Join with:</span>
            <span className="px-2 py-0.5 bg-neutral-100 rounded font-mono">
              {mapping.separator === ' ' ? 'Space' :
               mapping.separator === ',' ? 'Comma (,)' :
               mapping.separator === '-' ? 'Dash (-)' :
               mapping.separator === '_' ? 'Underscore (_)' :
               mapping.separator === '' ? 'None' :
               mapping.separator}
            </span>
          </div>

          {/* Target Field */}
          <div>
            <div className="text-xs text-neutral-500 mb-1">Target Field</div>
            <div className="font-medium text-neutral-900">{mapping.target_field}</div>
            {targetField && (
              <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded mt-1 inline-block">
                {targetField.field_type}
              </span>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {renderMappingType()}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4 text-neutral-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {renderMappingContent()}
    </div>
  );
}
