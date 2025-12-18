import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { SchemaForm } from './SchemaForm';
import { TableSchemaFormData } from '../../types/schema';

interface SchemaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TableSchemaFormData;
  onSubmit: (data: TableSchemaFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export function SchemaFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: SchemaFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-0 gap-0 border-none max-h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <DialogHeader className="px-8 py-6 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-neutral-900 mb-2">
            {isEdit ? 'Edit Schema' : 'Create New Schema'}
          </DialogTitle>
          <p className="text-sm text-neutral-500">
            {isEdit ? 'Update schema configuration' : 'Define a new table schema'}
          </p>
        </DialogHeader>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">
                {isEdit ? 'Edit schema' : 'Create new schema'}
              </h2>
              <p className="text-sm text-neutral-500">
                {isEdit ? 'Update the details for your schema.' : 'Fill out the details for your new schema.'}
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

          <SchemaForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isEdit={isEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
