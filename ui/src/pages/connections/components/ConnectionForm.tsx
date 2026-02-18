import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Connection } from '@/types/connection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploadZone } from './FileUploadZone';

const dbSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  db_type: z.enum(['mysql', 'postgresql']),
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().int().positive(),
  database: z.string().min(1, 'Database is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
});

const fileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  db_type: z.literal('file'),
  file_type: z.enum(['csv', 'json', 'excel']),
  files: z.array(z.instanceof(File)).min(1, 'At least one file is required'),
});

const formSchema = z.discriminatedUnion('db_type', [
  dbSchema,
  fileSchema,
]);

type FormValues = z.infer<typeof formSchema>;

interface ConnectionFormProps {
  connection?: Connection;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
}

const defaultPortForType: Record<string, number> = {
  mysql: 3306,
  postgresql: 5432,
};

export function ConnectionForm({ connection, onSubmit, onCancel }: ConnectionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: connection
      ? {
          name: connection.name,
          db_type: connection.db_type,
          ...(connection.db_type !== 'file'
            ? {
                host: connection.host ?? '',
                port: connection.port ?? defaultPortForType[connection.db_type] ?? 3306,
                database: connection.database ?? '',
                username: connection.username ?? '',
                password: '',
              }
            : {
                file_type: connection.file_type ?? 'csv',
                files: [] as File[],
              }),
        }
      : {
          name: '',
          db_type: 'mysql' as const,
          host: '',
          port: 3306,
          database: '',
          username: '',
          password: '',
        },
  });

  const dbType = watch('db_type');

  useEffect(() => {
    if (dbType !== 'file' && !connection) {
      setValue('port' as any, defaultPortForType[dbType] ?? 3306);
    }
  }, [dbType, connection, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-neutral-700">
          Name <span className="text-error-500">*</span>
        </Label>
        <Input {...register('name')} className="mt-1" placeholder="My Connection" />
        {errors.name && (
          <p className="text-sm text-error-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-neutral-700">
          Type <span className="text-error-500">*</span>
        </Label>
        <Controller
          name="db_type"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {dbType !== 'file' ? (
        <>
          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Host <span className="text-error-500">*</span>
            </Label>
            <Input {...register('host' as any)} className="mt-1" placeholder="localhost" />
            {(errors as any).host && (
              <p className="text-sm text-error-500 mt-1">{(errors as any).host.message}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Port <span className="text-error-500">*</span>
            </Label>
            <Input
              type="number"
              {...register('port' as any, { valueAsNumber: true })}
              className="mt-1"
            />
            {(errors as any).port && (
              <p className="text-sm text-error-500 mt-1">{(errors as any).port.message}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Database <span className="text-error-500">*</span>
            </Label>
            <Input {...register('database' as any)} className="mt-1" placeholder="my_database" />
            {(errors as any).database && (
              <p className="text-sm text-error-500 mt-1">{(errors as any).database.message}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Username <span className="text-error-500">*</span>
            </Label>
            <Input {...register('username' as any)} className="mt-1" placeholder="root" />
            {(errors as any).username && (
              <p className="text-sm text-error-500 mt-1">{(errors as any).username.message}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">Password</Label>
            <Input
              type="password"
              {...register('password' as any)}
              className="mt-1"
              placeholder={connection ? '(unchanged)' : ''}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <Label className="text-sm font-medium text-neutral-700">
              File Type <span className="text-error-500">*</span>
            </Label>
            <Controller
              name={'file_type' as any}
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? 'csv'}
                  onValueChange={(val) => field.onChange(val)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Files <span className="text-error-500">*</span>
            </Label>
            <Controller
              name={'files' as any}
              control={control}
              render={({ field }) => (
                <FileUploadZone
                  files={field.value ?? []}
                  onChange={(f) => field.onChange(f)}
                  accept=".csv,.json,.xlsx,.xls"
                />
              )}
            />
            {(errors as any).files && (
              <p className="text-sm text-error-500 mt-1">{(errors as any).files.message}</p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : connection ? 'Update Connection' : 'Create Connection'}
        </Button>
      </div>
    </form>
  );
}

export type { FormValues as ConnectionFormValues };
