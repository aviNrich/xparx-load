import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TableSchemaFormData, FieldType } from '../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').trim(),
  field_type: z.enum(['string', 'integer', 'date', 'boolean']),
  description: z.string().optional(),
});

const schemaFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').trim(),
  schema_handler: z.string()
    .min(1, 'Schema handler is required')
    .trim()
    .regex(/^[a-z_][a-z0-9_]*$/, 'Schema handler must be in snake_case (lowercase letters, numbers, and underscores only)'),
  description: z.string().optional(),
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

export function SchemaForm({ initialData, onSubmit, onCancel, isEdit = false }: SchemaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: initialData || {
      name: '',
      schema_handler: '',
      description: '',
      fields: [{ name: '', field_type: 'string', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const fieldTypes: FieldType[] = ['string', 'integer', 'date', 'boolean'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Label htmlFor="description" className="text-neutral-700 text-xs">
          Description <span className="text-neutral-400 text-xs">(Optional)</span>
        </Label>
        <Textarea
          {...register('description')}
          id="description"
          rows={2}
          placeholder="Brief description of this table schema..."
          className="mt-1"
        />
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

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
              <div className="flex items-start gap-2">
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
                        onValueChange={(value) => setValue(`fields.${index}.field_type`, value as FieldType)}
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

                  {/* Field Description */}
                  <div>
                    <Label
                      htmlFor={`fields.${index}.description`}
                      className="text-xs text-neutral-600"
                    >
                      Description <span className="text-neutral-400 text-xs">(Optional)</span>
                    </Label>
                    <Textarea
                      {...register(`fields.${index}.description`)}
                      id={`fields.${index}.description`}
                      rows={2}
                      placeholder="Optional field description..."
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => remove(index)}
                    className="border-red-200 text-red-600 hover:bg-red-50 mt-5 h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.fields && typeof errors.fields.message === 'string' && (
          <p className="mt-2 text-xs text-red-600">{errors.fields.message}</p>
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
