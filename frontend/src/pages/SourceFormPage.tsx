import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ConnectionForm } from '../components/connections/ConnectionForm';
import { Button } from '../components/ui/button';
import { useConnections } from '../hooks/useConnections';
import { ConnectionFormData, DatabaseType } from '../types/connection';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

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
              <Link to="/sources">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                {isEditMode ? 'Edit Connection' : 'New Connection'}
              </h1>
              <p className="text-xs text-neutral-500">
                {isEditMode ? 'Update connection configuration' : 'Create a new database connection'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <ConnectionForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onFileUploadSuccess={handleFileUploadSuccess}
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