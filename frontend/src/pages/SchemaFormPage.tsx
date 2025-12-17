import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SchemaForm } from '../components/schemas/SchemaForm';
import { Button } from '../components/ui/button';
import { useSchemas } from '../hooks/useSchemas';
import { TableSchemaFormData } from '../types/schema';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

export function SchemaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialData, setInitialData] = useState<TableSchemaFormData | undefined>(undefined);

  const {
    schemas,
    createSchema,
    updateSchema,
  } = useSchemas();

  // Load schema data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      const schema = schemas.find(s => s._id === id);
      if (schema) {
        setInitialData({
          name: schema.name,
          schema_handler: schema.schema_handler,
          description: schema.description,
          fields: schema.fields,
        });
        setIsLoading(false);
      } else {
        // If schema not found in the list, wait for it to load
        setIsLoading(true);
      }
    }
  }, [id, isEditMode, schemas]);

  const handleSubmit = async (data: TableSchemaFormData) => {
    try {
      if (isEditMode && id) {
        await updateSchema(id, data);
      } else {
        await createSchema(data);
      }
      navigate('/schema');
    } catch (err) {
      console.error('Failed to save schema:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save schema');
      setErrorDialogOpen(true);
    }
  };

  const handleCancel = () => {
    navigate('/schema');
  };

  if (isEditMode && isLoading && !initialData) {
    return (
      <div className="h-screen flex flex-col bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Loading schema...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Link to="/schema">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                {isEditMode ? 'Edit Schema' : 'New Schema'}
              </h1>
              <p className="text-xs text-neutral-500">
                {isEditMode ? 'Update schema configuration' : 'Define a new table schema'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <SchemaForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEdit={isEditMode}
            />
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      {errorMessage && (
        <ConfirmDialog
          open={errorDialogOpen}
          onOpenChange={setErrorDialogOpen}
          title="Error"
          description={errorMessage}
          confirmText="OK"
          variant="destructive"
          onConfirm={() => setErrorDialogOpen(false)}
        />
      )}
    </div>
  );
}
