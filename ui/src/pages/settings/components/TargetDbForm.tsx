import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { systemSettingsAPI, TargetDatabaseConfig } from '@/services/api';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const targetDbSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().int().min(1, 'Port is required'),
  database: z.string().min(1, 'Database is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type TargetDbFormData = z.infer<typeof targetDbSchema>;

interface TargetDbFormProps {
  settings: ReturnType<typeof useSystemSettings>;
}

export function TargetDbForm({ settings }: TargetDbFormProps) {
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TargetDbFormData>({
    resolver: zodResolver(targetDbSchema),
    defaultValues: {
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (settings.settings?.target_db) {
      reset(settings.settings.target_db);
    }
  }, [settings.settings, reset]);

  const handleTest = async () => {
    const values = getValues();
    const parsed = targetDbSchema.safeParse(values);
    if (!parsed.success) return;

    setTesting(true);
    setTestResult(null);
    try {
      const result = await systemSettingsAPI.testTargetDb(parsed.data as TargetDatabaseConfig);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = async (data: TargetDbFormData) => {
    setSaving(true);
    try {
      await settings.updateTargetDb(data as TargetDatabaseConfig);
      toast.success('Target database configuration saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="host" className="text-sm font-medium text-neutral-700">
          Host <span className="text-error-500">*</span>
        </Label>
        <Input id="host" placeholder="localhost" {...register('host')} className="mt-1" />
        {errors.host && <p className="text-sm text-error-500 mt-1">{errors.host.message}</p>}
      </div>

      <div>
        <Label htmlFor="port" className="text-sm font-medium text-neutral-700">
          Port <span className="text-error-500">*</span>
        </Label>
        <Input id="port" type="number" placeholder="5432" {...register('port')} className="mt-1" />
        {errors.port && <p className="text-sm text-error-500 mt-1">{errors.port.message}</p>}
      </div>

      <div>
        <Label htmlFor="database" className="text-sm font-medium text-neutral-700">
          Database <span className="text-error-500">*</span>
        </Label>
        <Input id="database" placeholder="my_database" {...register('database')} className="mt-1" />
        {errors.database && <p className="text-sm text-error-500 mt-1">{errors.database.message}</p>}
      </div>

      <div>
        <Label htmlFor="username" className="text-sm font-medium text-neutral-700">
          Username <span className="text-error-500">*</span>
        </Label>
        <Input id="username" placeholder="postgres" {...register('username')} className="mt-1" />
        {errors.username && <p className="text-sm text-error-500 mt-1">{errors.username.message}</p>}
      </div>

      <div>
        <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
          Password <span className="text-error-500">*</span>
        </Label>
        <Input id="password" type="password" placeholder="********" {...register('password')} className="mt-1" />
        {errors.password && <p className="text-sm text-error-500 mt-1">{errors.password.message}</p>}
      </div>

      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'}>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
          Test Connection
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save
        </Button>
      </div>
    </form>
  );
}
