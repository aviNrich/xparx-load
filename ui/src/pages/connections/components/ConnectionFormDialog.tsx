import { toast } from 'sonner';
import { Connection } from '@/types/connection';
import { ConnectionForm, ConnectionFormValues } from './ConnectionForm';
import { connectionAPI } from '@/services/api';
import { useConnections } from '@/hooks/useConnections';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ConnectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: Connection;
  onSuccess: () => void;
}

export function ConnectionFormDialog({
  open,
  onOpenChange,
  connection,
  onSuccess,
}: ConnectionFormDialogProps) {
  const { createConnection, updateConnection } = useConnections();
  const isEditing = !!connection;

  const handleSubmit = async (data: ConnectionFormValues) => {
    try {
      if (data.db_type === 'file') {
        // File type: use uploadFiles API
        await connectionAPI.uploadFiles(
          data.name,
          data.file_type,
          data.files
        );
        toast.success(
          isEditing
            ? 'File connection updated successfully'
            : 'File connection created successfully'
        );
      } else {
        // DB type: use create or update
        const formData = {
          name: data.name,
          db_type: data.db_type,
          host: data.host,
          port: data.port,
          database: data.database,
          username: data.username,
          password: data.password || undefined,
        };

        if (isEditing) {
          await updateConnection(connection._id, formData);
          toast.success('Connection updated successfully');
        } else {
          await createConnection(formData);
          toast.success('Connection created successfully');
        }
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save connection'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Connection' : 'Create Connection'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the connection details below.'
              : 'Fill in the details to create a new connection.'}
          </DialogDescription>
        </DialogHeader>
        <ConnectionForm
          connection={connection}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
