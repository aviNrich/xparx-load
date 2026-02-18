import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnumValueEditor } from './EnumValueEditor';
import type { SchemaField, FieldType } from '@/types/schema';

interface FieldRowProps {
  field: SchemaField;
  onChange: (field: SchemaField) => void;
  onRemove: () => void;
  id: string;
}

const FIELD_TYPES: FieldType[] = ['string', 'integer', 'date', 'boolean', 'enum'];

export function FieldRow({ field, onChange, onRemove, id }: FieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-3 ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab text-neutral-400 hover:text-neutral-600 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Input
          value={field.name}
          onChange={(e) => onChange({ ...field, name: e.target.value })}
          placeholder="Field name"
          className="h-9 text-sm flex-1"
        />
        <Select
          value={field.field_type}
          onValueChange={(value: FieldType) => {
            const updated: SchemaField = { ...field, field_type: value };
            if (value === 'enum' && !updated.enum_values) {
              updated.enum_values = {};
            }
            if (value !== 'enum') {
              delete updated.enum_values;
              delete updated.default_enum_key;
            }
            onChange(updated);
          }}
        >
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={field.description || ''}
          onChange={(e) => onChange({ ...field, description: e.target.value || undefined })}
          placeholder="Description (optional)"
          className="h-9 text-sm flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-neutral-400 hover:text-red-600"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {field.field_type === 'enum' && (
        <EnumValueEditor
          values={field.enum_values || {}}
          defaultKey={field.default_enum_key}
          onChange={(values, defaultKey) =>
            onChange({ ...field, enum_values: values, default_enum_key: defaultKey })
          }
        />
      )}
    </div>
  );
}
