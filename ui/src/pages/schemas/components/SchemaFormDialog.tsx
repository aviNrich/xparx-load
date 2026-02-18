import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TableSchema } from '@/types/schema';
import { useSchemas } from '@/hooks/useSchemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const schemaFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  schema_handler: z
    .string()
    .min(1, 'Schema handler is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Must be snake_case (lowercase letters, numbers, underscores)'),
  description: z.string().optional(),
});

type SchemaFormValues = z.infer<typeof schemaFormSchema>;

interface SchemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema?: TableSchema;
  onSuccess: () => void;
}

export function SchemaFormDialog({
  open,
  onOpenChange,
  schema,
  onSuccess,
}: SchemaFormDialogProps) {
  const { createSchema, updateSchema } = useSchemas();
  const isEditing = !!schema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: schema
      ? {
          name: schema.name,
          schema_handler: schema.schema_handler,
          description: schema.description ?? '',
        }
      : {
          name: '',
          schema_handler: '',
          description: '',
        },
  });

  const onSubmit = async (data: SchemaFormValues) => {
    try {
      if (isEditing) {
        await updateSchema(schema._id, {
          name: data.name,
          schema_handler: data.schema_handler,
          description: data.description || undefined,
        });
        toast.success('Schema updated successfully');
      } else {
        await createSchema({
          name: data.name,
          schema_handler: data.schema_handler,
          description: data.description || undefined,
          fields: [],
        });
        toast.success('Schema created successfully');
      }
      onOpenChange(false);
      reset();
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save schema'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Schema' : 'Create Schema'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the schema details below.'
              : 'Define a new target table schema.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Name <span className="text-error-500">*</span>
            </Label>
            <Input
              {...register('name')}
              className="mt-1"
              placeholder="My Schema"
            />
            {errors.name && (
              <p className="text-sm text-error-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Schema Handler <span className="text-error-500">*</span>
            </Label>
            <Input
              {...register('schema_handler')}
              className="mt-1 font-mono"
              placeholder="my_schema_handler"
            />
            {errors.schema_handler && (
              <p className="text-sm text-error-500 mt-1">
                {errors.schema_handler.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Description
            </Label>
            <Textarea
              {...register('description')}
              className="mt-1"
              placeholder="Describe what this schema is for..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Schema'
                  : 'Create Schema'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
