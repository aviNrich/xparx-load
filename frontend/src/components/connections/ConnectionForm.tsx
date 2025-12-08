import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ConnectionFormData, TestConnectionResult, DatabaseType } from '../../types/connection';
import { connectionAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react';

const connectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  db_type: z.enum(['mysql', 'postgresql']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

interface ConnectionFormProps {
  initialData?: ConnectionFormData;
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function ConnectionForm({ initialData, onSubmit, onCancel, isEdit }: ConnectionFormProps) {
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: initialData || {
      name: '',
      db_type: 'mysql',
      host: '',
      port: 3306,
      database: '',
      username: '',
      password: '',
    },
  });

  const dbType = watch('db_type');

  // Update port when db_type changes
  useEffect(() => {
    if (dbType === 'mysql' && !initialData) {
      setValue('port', 3306);
    } else if (dbType === 'postgresql' && !initialData) {
      setValue('port', 5432);
    }
  }, [dbType, setValue, initialData]);

  const handleTestConnection = async () => {
    const formData = watch();
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await connectionAPI.test(formData);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFormSubmit = async (data: ConnectionFormData) => {
    if (!testResult?.success) {
      setTestResult({
        success: false,
        message: 'Please test the connection before saving',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-neutral-700">Connection Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Production Database"
          className="mt-1.5"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="db_type" className="text-neutral-700">Database Type</Label>
        <Select
          value={dbType}
          onValueChange={(value) => setValue('db_type', value as DatabaseType)}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
          </SelectContent>
        </Select>
        {errors.db_type && <p className="text-sm text-red-500 mt-1">{errors.db_type.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="host" className="text-neutral-700">Host</Label>
          <Input
            id="host"
            {...register('host')}
            placeholder="localhost"
            className="mt-1.5"
          />
          {errors.host && <p className="text-sm text-red-500 mt-1">{errors.host.message}</p>}
        </div>

        <div>
          <Label htmlFor="port" className="text-neutral-700">Port</Label>
          <Input
            id="port"
            type="number"
            {...register('port', { valueAsNumber: true })}
            className="mt-1.5"
          />
          {errors.port && <p className="text-sm text-red-500 mt-1">{errors.port.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="database" className="text-neutral-700">Database</Label>
        <Input
          id="database"
          {...register('database')}
          placeholder="my_database"
          className="mt-1.5"
        />
        {errors.database && <p className="text-sm text-red-500 mt-1">{errors.database.message}</p>}
      </div>

      <div>
        <Label htmlFor="username" className="text-neutral-700">Username</Label>
        <Input
          id="username"
          {...register('username')}
          placeholder="db_user"
          className="mt-1.5"
        />
        {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
      </div>

      <div>
        <Label htmlFor="password" className="text-neutral-700">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
          className="mt-1.5"
        />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'} className="animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertDescription className="font-medium">{testResult.message}</AlertDescription>
              {testResult.details?.version && (
                <p className="text-xs mt-1 opacity-90">{testResult.details.version}</p>
              )}
            </div>
          </div>
        </Alert>
      )}

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex-1"
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>

        <Button
          type="submit"
          disabled={!testResult?.success || isSubmitting}
          className="flex-1 bg-primary-600 hover:bg-primary-700"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update' : 'Create'} Connection
        </Button>

        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
