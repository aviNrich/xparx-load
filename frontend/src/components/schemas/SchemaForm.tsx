import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { TableSchemaFormData, FieldType } from '../../types/schema';
import { Plus, Trash2 } from 'lucide-react';

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').trim(),
  field_type: z.enum(['string', 'integer', 'date', 'boolean']),
  description: z.string().optional(),
});

const schemaFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').trim(),
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
    formState: { errors, isSubmitting },
  } = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: initialData || {
      name: '',
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Table Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
          Table Name *
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          placeholder="e.g., users, products, orders"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          placeholder="Brief description of this table schema..."
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-neutral-700">
            Fields *
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ name: '', field_type: 'string', description: '' })}
            className="text-primary-600 border-primary-300 hover:bg-primary-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  {/* Field Name */}
                  <div>
                    <label
                      htmlFor={`fields.${index}.name`}
                      className="block text-xs font-medium text-neutral-600 mb-1"
                    >
                      Field Name *
                    </label>
                    <input
                      {...register(`fields.${index}.name`)}
                      type="text"
                      placeholder="e.g., user_id, email, created_at"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    {errors.fields?.[index]?.name && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.fields[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  {/* Field Type */}
                  <div>
                    <label
                      htmlFor={`fields.${index}.field_type`}
                      className="block text-xs font-medium text-neutral-600 mb-1"
                    >
                      Type *
                    </label>
                    <select
                      {...register(`fields.${index}.field_type`)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    >
                      {fieldTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field Description */}
                  <div>
                    <label
                      htmlFor={`fields.${index}.description`}
                      className="block text-xs font-medium text-neutral-600 mb-1"
                    >
                      Description (Optional)
                    </label>
                    <input
                      {...register(`fields.${index}.description`)}
                      type="text"
                      placeholder="Optional field description..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
                    className="border-red-200 text-red-600 hover:bg-red-50 mt-5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.fields && typeof errors.fields.message === 'string' && (
          <p className="mt-2 text-sm text-red-600">{errors.fields.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Schema' : 'Create Schema'}
        </Button>
      </div>
    </form>
  );
}
