import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TableSchemaFormData, FieldType } from '../../types/schema';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').trim(),
  field_type: z.enum(['string', 'integer', 'date', 'boolean', 'enum']),
  description: z.string().optional().nullable(),
  enum_values: z.record(z.string()).optional().nullable(),
  default_enum_key: z.string().optional().nullable(),
}).refine((data) => {
  if (data.field_type === 'enum') {
    return data.enum_values && Object.keys(data.enum_values).length > 0;
  }
  return true;
}, {
  message: 'Enum values are required for enum field type',
  path: ['enum_values'],
});

const schemaFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').trim(),
  schema_handler: z.string()
    .min(1, 'Schema handler is required')
    .trim()
    .regex(/^[a-z_][a-z0-9_]*$/, 'Schema handler must be in snake_case (lowercase letters, numbers, and underscores only)'),
  description: z.string().optional().nullable(),
  fields: z.array(fieldSchema).min(1, 'At least one field is required'),
}).refine((data) => {
  const fieldNames = data.fields.map(f => f.name.toLowerCase());
  return new Set(fieldNames).size === fieldNames.length;
}, {
  message: 'Field names must be unique',
  path: ['fields'],
});

type SchemaFormValues = z.infer<typeof schemaFormSchema>;

interface SchemaFormProps {
  initialData?: TableSchemaFormData;
  onSubmit: (data: TableSchemaFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

interface SortableFieldItemProps {
  field: any;
  index: number;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  fieldTypes: FieldType[];
  canRemove: boolean;
  onRemove: () => void;
  showFieldDescriptions: Record<string, boolean>;
  setShowFieldDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

interface EnumValueRowProps {
  enumKey: string;
  enumValue: string;
  onKeyChange: (newKey: string) => void;
  onValueChange: (newValue: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function EnumValueRow({ enumKey, enumValue, onKeyChange, onValueChange, onRemove, canRemove }: EnumValueRowProps) {
  return (
    <div className="flex gap-2">
      <Input
        value={enumKey}
        onChange={(e) => onKeyChange(e.target.value)}
        placeholder="Key (e.g., m, f)"
        className="text-sm h-8"
      />
      <Input
        value={enumValue}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Value (e.g., Male, Female)"
        className="text-sm h-8"
      />
      {canRemove && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRemove}
          className="border-red-200 text-red-600 hover:bg-red-50 h-8 w-8 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function SortableFieldItem({
  field,
  index,
  register,
  errors,
  watch,
  setValue,
  fieldTypes,
  canRemove,
  onRemove,
  showFieldDescriptions,
  setShowFieldDescriptions,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-neutral-200 rounded-lg p-3 bg-neutral-50"
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-5 text-neutral-400 hover:text-neutral-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-2">
          {/* Field Name and Type in same row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Field Name */}
            <div>
              <Label
                htmlFor={`fields.${index}.name`}
                className="text-xs text-neutral-600"
              >
                Field Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register(`fields.${index}.name`)}
                id={`fields.${index}.name`}
                placeholder="e.g., user_id"
                className="mt-1 text-sm h-8"
              />
              {errors.fields?.[index]?.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.fields[index]?.name?.message}
                </p>
              )}
            </div>

            {/* Field Type */}
            <div>
              <Label
                htmlFor={`fields.${index}.field_type`}
                className="text-xs text-neutral-600"
              >
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch(`fields.${index}.field_type`)}
                onValueChange={(value) => {
                  setValue(`fields.${index}.field_type`, value as FieldType);
                  // Initialize enum_values when switching to enum type
                  if (value === 'enum' && !watch(`fields.${index}.enum_values`)) {
                    setValue(`fields.${index}.enum_values`, { key_1: '' });
                  }
                  // Clear enum_values when switching away from enum type
                  if (value !== 'enum') {
                    setValue(`fields.${index}.enum_values`, undefined);
                  }
                }}
              >
                <SelectTrigger className="mt-1 text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enum Values - Only show if field type is enum */}
          {watch(`fields.${index}.field_type`) === 'enum' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-neutral-600 mb-2 block">
                  Enum Values <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {(() => {
                    const enumValues = watch(`fields.${index}.enum_values`) || {};
                    const entries = Object.entries(enumValues);

                    return (
                      <>
                        {entries.map(([key, value], enumIndex) => (
                          <EnumValueRow
                            key={`${field.id}-enum-${enumIndex}`}
                            enumKey={key}
                            enumValue={value as string}
                            onKeyChange={(newKey) => {
                              const currentValues = { ...enumValues };
                              delete currentValues[key];
                              currentValues[newKey] = value as string;
                              setValue(`fields.${index}.enum_values`, currentValues);
                              // Clear default if it was the old key
                              if (watch(`fields.${index}.default_enum_key`) === key) {
                                setValue(`fields.${index}.default_enum_key`, undefined);
                              }
                            }}
                            onValueChange={(newValue) => {
                              setValue(`fields.${index}.enum_values`, {
                                ...enumValues,
                                [key]: newValue,
                              });
                            }}
                            onRemove={() => {
                              const currentValues = { ...enumValues };
                              delete currentValues[key];
                              setValue(`fields.${index}.enum_values`, currentValues);
                              // Clear default if it was the removed key
                              if (watch(`fields.${index}.default_enum_key`) === key) {
                                setValue(`fields.${index}.default_enum_key`, undefined);
                              }
                            }}
                            canRemove={entries.length > 1}
                          />
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentValues = enumValues || {};
                            const newKey = `key_${Object.keys(currentValues).length + 1}`;
                            setValue(`fields.${index}.enum_values`, {
                              ...currentValues,
                              [newKey]: '',
                            });
                          }}
                          className="text-primary-600 border-primary-300 hover:bg-primary-50 h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Enum Value
                        </Button>
                      </>
                    );
                  })()}
                </div>
                {errors.fields?.[index]?.enum_values && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.fields[index]?.enum_values?.message}
                  </p>
                )}
              </div>

              {/* Default Enum Key */}
              <div>
                <Label className="text-xs text-neutral-600 mb-1 block">
                  Default Value (Fallback)
                </Label>
                <p className="text-xs text-neutral-500 mb-2">
                  Optional default value for unmapped source values
                </p>
                <Select
                  value={watch(`fields.${index}.default_enum_key`) || '__none__'}
                  onValueChange={(value) => {
                    setValue(`fields.${index}.default_enum_key`, value === '__none__' ? undefined : value);
                  }}
                >
                  <SelectTrigger className="text-sm h-8">
                    <SelectValue placeholder="No default (null)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No default (null)</SelectItem>
                    {Object.entries(watch(`fields.${index}.enum_values`) || {}).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {key} → {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Field Description */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFieldDescriptions(prev => ({
                ...prev,
                [field.id]: !prev[field.id]
              }))}
              className="h-6 px-2 text-xs text-neutral-600 hover:text-neutral-900"
            >
              {showFieldDescriptions[field.id] ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {showFieldDescriptions[field.id] ? 'Hide' : 'Add'} Description
            </Button>
            {showFieldDescriptions[field.id] && (
              <Textarea
                {...register(`fields.${index}.description`)}
                id={`fields.${index}.description`}
                rows={2}
                placeholder="Optional field description..."
                className="mt-1 text-sm"
              />
            )}
          </div>
        </div>

        {/* Remove Button */}
        {canRemove && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRemove}
            className="border-red-200 text-red-600 hover:bg-red-50 mt-5 h-7 w-7 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function SchemaForm({ initialData, onSubmit, onCancel, isEdit = false }: SchemaFormProps) {
  const [showMainDescription, setShowMainDescription] = useState(false);
  const [showFieldDescriptions, setShowFieldDescriptions] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: {
      name: '',
      schema_handler: '',
      description: '',
      fields: [{ name: '', field_type: 'string', description: '' }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      move(oldIndex, newIndex);
    }
  };

  // Reset form when initialData changes (e.g., when editing a different schema)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: '',
        schema_handler: '',
        description: '',
        fields: [{ name: '', field_type: 'string', description: '' }],
      });
    }
  }, [initialData, reset]);

  const fieldTypes: FieldType[] = ['string', 'integer', 'date', 'boolean', 'enum'];

  const handleFormSubmit = handleSubmit(
    (data) => {
      console.log('Form validation passed, submitting data:', data);
      onSubmit(data);
    },
    (errors) => {
      console.error('Form validation failed:', errors);
      console.error('Detailed field errors:', JSON.stringify(errors, null, 2));
      // Show which specific fields have errors
      if (errors.fields && Array.isArray(errors.fields)) {
        errors.fields.forEach((fieldError: any, index: number) => {
          if (fieldError) {
            console.error(`Field ${index} errors:`, fieldError);
          }
        });
      }
    }
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Table Name */}
      <div>
        <Label htmlFor="name" className="text-neutral-700 text-xs">
          Table Name <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register('name')}
          id="name"
          placeholder="e.g., users, products, orders"
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Schema Handler */}
      <div>
        <Label htmlFor="schema_handler" className="text-neutral-700 text-xs">
          Schema Handler <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register('schema_handler')}
          id="schema_handler"
          placeholder="e.g., user_handler, product_loader"
          className="mt-1"
        />
        {errors.schema_handler && (
          <p className="mt-1 text-xs text-red-600">{errors.schema_handler.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMainDescription(!showMainDescription)}
          className="h-6 px-2 text-xs text-neutral-600 hover:text-neutral-900"
        >
          {showMainDescription ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          {showMainDescription ? 'Hide' : 'Add'} Description
        </Button>
        {showMainDescription && (
          <Textarea
            {...register('description')}
            id="description"
            rows={2}
            placeholder="Brief description of this table schema..."
            className="mt-2"
          />
        )}
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-neutral-700 text-xs">
            Fields <span className="text-red-500">*</span>
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ name: '', field_type: 'string', description: '' })}
            className="text-primary-600 border-primary-300 hover:bg-primary-50 h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  index={index}
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  fieldTypes={fieldTypes}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                  showFieldDescriptions={showFieldDescriptions}
                  setShowFieldDescriptions={setShowFieldDescriptions}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {errors.fields && typeof errors.fields.message === 'string' && (
          <p className="mt-2 text-xs text-red-600">{errors.fields.message}</p>
        )}
        {errors.fields && Array.isArray(errors.fields) && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs font-semibold text-red-800 mb-2">Field validation errors:</p>
            {errors.fields.map((fieldError: any, index: number) => {
              if (!fieldError) return null;
              return (
                <div key={index} className="text-xs text-red-600 mb-1">
                  <strong>Field {index + 1}:</strong>
                  {fieldError.name && <span> Name: {fieldError.name.message}</span>}
                  {fieldError.field_type && <span> Type: {fieldError.field_type.message}</span>}
                  {fieldError.enum_values && <span> Enum Values: {fieldError.enum_values.message}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-500 hover:bg-primary-600 text-white"
          size="sm"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Schema' : 'Create Schema'}
        </Button>
      </div>
    </form>
  );
}
