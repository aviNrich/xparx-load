import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ConnectionForm } from '../components/connections/ConnectionForm';
import { Button } from '../components/ui/button';
import { useConnections } from '../hooks/useConnections';
import { ConnectionFormData, DatabaseType } from '../types/connection';
import { Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { SourcesPage } from './SourcesPage';

export function SourceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const typeFromQuery = searchParams.get('type') as DatabaseType | null;

  const [isLoading, setIsLoading] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialData, setInitialData] = useState<ConnectionFormData | undefined>(undefined);

  const {
    connections,
    createConnection,
    updateConnection,
  } = useConnections();

  // Load connection data if in edit mode, or set default type in create mode
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      const connection = connections.find(c => c._id === id);
      if (connection) {
        setInitialData({
          name: connection.name,
          db_type: connection.db_type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
        });
        setIsLoading(false);
      } else {
        // If connection not found in the list, wait for it to load
        setIsLoading(true);
      }
    } else if (!isEditMode && typeFromQuery && !initialData) {
      // Set default type from query parameter in create mode
      setInitialData({
        name: '',
        db_type: typeFromQuery,
      });
    }
  }, [id, isEditMode, connections, typeFromQuery, initialData]);

  const handleSubmit = async (data: ConnectionFormData) => {
    try {
      if (isEditMode && id) {
        await updateConnection(id, data);
        navigate('/sources');
      } else {
        const createdConnection = await createConnection(data);
        navigate(`/mappings/new?source=${createdConnection._id}`);
      }
    } catch (err) {
      console.error('Failed to save connection:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save connection');
      setErrorDialogOpen(true);
    }
  };

  const handleCancel = () => {
    navigate('/sources');
  };

  const handleFileUploadSuccess = (connectionId: string) => {
    navigate(`/mappings/new?source=${connectionId}`);
  };

  if (isEditMode && isLoading && !initialData) {
    return (
      <div className="h-screen flex flex-col bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Loading connection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Render the sources page in the background */}
      <SourcesPage />

      {/* Modal Dialog */}
      <Dialog open={true} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-xl bg-white p-0 gap-0 border-none max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-8 py-6 bg-neutral-50 border-b border-neutral-200">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
              {isEditMode ? 'Edit Connection' : 'Create New Source'}
            </h1>
            <p className="text-sm text-neutral-500">
              {isEditMode ? 'Update connection configuration' : 'Create a new source'}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6 bg-white">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 mb-1">
                  {isEditMode ? 'Edit connection' : 'Create new source'}
                </h2>
                <p className="text-sm text-neutral-500">
                  {isEditMode ? 'Update the details for your connection.' : 'Fill out the details for your new source.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Back to List
              </Button>
            </div>

            <ConnectionForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onFileUploadSuccess={handleFileUploadSuccess}
              isEdit={isEditMode}
            />
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}