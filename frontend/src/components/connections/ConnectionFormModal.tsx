import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { ConnectionForm } from './ConnectionForm';
import { ConnectionFormData } from '../../types/connection';

interface ConnectionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ConnectionFormData;
  onSubmit: (data: ConnectionFormData) => void;
  onCancel: () => void;
  onFileUploadSuccess: (connectionId: string) => void;
  isEdit?: boolean;
}

export function ConnectionFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onCancel,
  onFileUploadSuccess,
  isEdit = false,
}: ConnectionFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-0 gap-0 border-none max-h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="px-8 py-6 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            {isEdit ? 'Edit Connection' : 'Create New Source'}
          </h1>
          <p className="text-sm text-neutral-500">
            {isEdit ? 'Update connection configuration' : 'Create a new source'}
          </p>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">
                {isEdit ? 'Edit connection' : 'Create new source'}
              </h2>
              <p className="text-sm text-neutral-500">
                {isEdit ? 'Update the details for your connection.' : 'Fill out the details for your new source.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Back to List
            </Button>
          </div>

          <ConnectionForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onFileUploadSuccess={onFileUploadSuccess}
            isEdit={isEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
