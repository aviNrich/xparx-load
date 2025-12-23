import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ConnectionFormData, TestConnectionResult, DatabaseType, FileType } from '../../types/connection';
import { connectionAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Combobox } from '../ui/combobox';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle, Wifi, Upload, X, FileText } from 'lucide-react';

const connectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  db_type: z.enum(['file', 'mysql', 'postgresql', ]),
  host: z.string().optional(),
  port: z.number().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  file_type: z.enum(['csv', 'json', 'excel']).optional(),
});

interface ConnectionFormProps {
  initialData?: ConnectionFormData;
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
  onFileUploadSuccess?: (connectionId: string) => void;
  isEdit?: boolean;
}

export function ConnectionForm({ initialData, onSubmit, onCancel, onFileUploadSuccess, isEdit }: ConnectionFormProps) {
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
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
      file_type: 'csv',
    },
  });

  const dbType = watch('db_type');
  const fileType = watch('file_type');

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

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
    // For file type, validate files are selected
    if (data.db_type === 'file') {
      if (selectedFiles.length === 0) {
        setTestResult({
          success: false,
          message: 'Please select at least one file to upload',
        });
        return;
      }

      setIsSubmitting(true);
      try {
        console.log('Uploading files:', { name: data.name, fileType: data.file_type, files: selectedFiles });
        // Upload files - this creates the connection directly
        const result = await connectionAPI.uploadFiles(
          data.name,
          data.file_type || 'csv',
          selectedFiles,
          (progress) => setUploadProgress(progress)
        );
        console.log('Upload successful:', result);
        // If callback is provided, call it with the connection ID
        if (onFileUploadSuccess) {
          onFileUploadSuccess(result._id);
        } else {
          // Fallback to onCancel if no callback provided
          onCancel();
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setTestResult({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to upload files',
        });
      } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    } else {
      // Database type - require test connection
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
    }
  };

  // File drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-neutral-900 text-sm font-medium">
          Source name<span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Type case name..."
          className="mt-2"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1.5">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="db_type" className="text-neutral-900 text-sm font-medium">
          Source Type<span className="text-red-500">*</span>
        </Label>
        <div className="mt-2">
          <Combobox
            options={[
              { label: 'File Upload', value: 'file' },
              { label: 'MySQL', value: 'mysql' },
              { label: 'PostgreSQL', value: 'postgresql' },
            ]}
            value={dbType}
            onValueChange={(value) => setValue('db_type', value as DatabaseType)}
            placeholder="Select source type..."
            searchPlaceholder="Search source types..."
            emptyMessage="No source type found."
          />
        </div>
        {errors.db_type && <p className="text-sm text-red-500 mt-1.5">{errors.db_type.message}</p>}
      </div>

      {dbType === 'file' ? (
        <>
          <div>
            <Label htmlFor="file_type" className="text-neutral-900 text-sm font-medium">
              File Type<span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <Combobox
                options={[
                  { label: 'CSV', value: 'csv' },
                  { label: 'JSON', value: 'json' },
                  { label: 'Excel', value: 'excel' },
                ]}
                value={fileType}
                onValueChange={(value) => setValue('file_type', value as FileType)}
                placeholder="Select file type..."
                searchPlaceholder="Search file types..."
                emptyMessage="No file type found."
              />
            </div>
          </div>

          <div>
            <Label className="text-neutral-900 text-sm font-medium">Upload Files</Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-neutral-300 hover:border-indigo-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
              <p className="text-sm text-neutral-600 mb-2">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                Multiple files with the same structure are supported
              </p>
              <input
                type="file"
                multiple
                accept={fileType === 'csv' ? '.csv' : fileType === 'json' ? '.json' : '.xlsx,.xls'}
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Select Files
              </Button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-neutral-700">Selected Files ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-sm text-neutral-700 truncate">{file.name}</span>
                      <span className="text-xs text-neutral-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="host" className="text-neutral-900 text-sm font-medium">
                Host<span className="text-red-500">*</span>
              </Label>
              <Input
                id="host"
                {...register('host')}
                placeholder="localhost"
                className="mt-2"
              />
              {errors.host && <p className="text-sm text-red-500 mt-1.5">{errors.host.message}</p>}
            </div>

            <div>
              <Label htmlFor="port" className="text-neutral-900 text-sm font-medium">
                Port<span className="text-red-500">*</span>
              </Label>
              <Input
                id="port"
                type="number"
                {...register('port', { valueAsNumber: true })}
                className="mt-2"
              />
              {errors.port && <p className="text-sm text-red-500 mt-1.5">{errors.port.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="database" className="text-neutral-900 text-sm font-medium">
              Database<span className="text-red-500">*</span>
            </Label>
            <Input
              id="database"
              {...register('database')}
              placeholder="my_database"
              className="mt-2"
            />
            {errors.database && <p className="text-sm text-red-500 mt-1.5">{errors.database.message}</p>}
          </div>

          <div>
            <Label htmlFor="username" className="text-neutral-900 text-sm font-medium">
              Username<span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              {...register('username')}
              placeholder="db_user"
              className="mt-2"
            />
            {errors.username && <p className="text-sm text-red-500 mt-1.5">{errors.username.message}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="text-neutral-900 text-sm font-medium">
              Password<span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="mt-2"
            />
            {errors.password && <p className="text-sm text-red-500 mt-1.5">{errors.password.message}</p>}
          </div>
        </>
      )}

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

      <div className="flex gap-3 pt-6 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </Button>

        {dbType === 'file' && (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Files
          </Button>
        )}

        {dbType !== 'file' && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex-1 h-11 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
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
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Add Items
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
