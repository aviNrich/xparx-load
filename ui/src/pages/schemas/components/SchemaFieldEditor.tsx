import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldRow } from './FieldRow';
import type { SchemaField, TableSchema, TableSchemaFormData } from '@/types/schema';
import { toast } from 'sonner';

interface FieldWithId extends SchemaField {
  _id: string;
}

interface SchemaFieldEditorProps {
  schema: TableSchema;
  onSave: (id: string, data: Partial<TableSchemaFormData>) => Promise<TableSchema>;
}

function addIds(fields: SchemaField[]): FieldWithId[] {
  return fields.map((f) => ({ ...f, _id: crypto.randomUUID() }));
}

function stripIds(fields: FieldWithId[]): SchemaField[] {
  return fields.map(({ _id, ...rest }) => rest);
}

export function SchemaFieldEditor({ schema, onSave }: SchemaFieldEditorProps) {
  const [fields, setFields] = useState<FieldWithId[]>(() => addIds(schema.fields));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFields(addIds(schema.fields));
  }, [schema.fields]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f._id === active.id);
        const newIndex = prev.findIndex((f) => f._id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      { _id: crypto.randomUUID(), name: '', field_type: 'string' },
    ]);
  };

  const handleFieldChange = (id: string, updated: SchemaField) => {
    setFields((prev) =>
      prev.map((f) => (f._id === id ? { ...updated, _id: id } : f))
    );
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f._id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(schema._id, { fields: stripIds(fields) });
      toast.success('Fields saved successfully');
    } catch {
      toast.error('Failed to save fields');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Fields</h3>
        <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field) => (
              <FieldRow
                key={field._id}
                id={field._id}
                field={field}
                onChange={(updated) => handleFieldChange(field._id, updated)}
                onRemove={() => handleRemoveField(field._id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {fields.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">
          No fields yet. Click "Add Field" to get started.
        </p>
      )}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
